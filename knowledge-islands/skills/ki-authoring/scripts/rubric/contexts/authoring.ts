import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, lstatSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import type { ConformCommand, ConformWrite, RubricContextOptions, RubricSession } from '../../shared/rubric.ts'

export const PRETTIER_DEFAULT = `{
  "printWidth": 160,
  "tabWidth": 2,
  "useTabs": false,
  "semi": false,
  "singleQuote": true,
  "proseWrap": "never",
  "trailingComma": "none",
  "overrides": [
    {
      "files": "*.md",
      "options": {
        "parser": "markdown"
      }
    }
  ]
}
`

export const EDITORCONFIG_DEFAULT = `root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[*.md]
trim_trailing_whitespace = false
`

export const MARKDOWNLINT_DEFAULT = `{
  // Base: enable all rules, then selectively adjust below.
  "config": {
    "default": true,

    // MD013 - line length: disabled. Prettier owns line length via printWidth / proseWrap.
    "MD013": false,

    // MD024 - duplicate headings: allow in sibling sections only.
    "MD024": { "siblings_only": true },

    // MD025 - single H1: ignore the frontmatter title field.
    "MD025": { "front_matter_title": "" },

    // MD033 - inline HTML: disabled. <br> is used in table cells and skills use angle-bracket placeholders.
    "MD033": false,

    // MD036 - bold as heading: disabled. Bold labels are used intentionally in skill bodies.
    "MD036": false
  },

  // Skill bodies, references, and repo docs are all markdown content.
  "globs": ["**/*.md"],

  // Never lint generated output, dependencies, or runtime projections. Generated
  // source and runtime payloads are machine-produced (ADR-KI-HARNESS-TOOLCHAIN-005)
  // and excluded like dist/, so their formatting is never a finding. Command files are frontmatter-first runtime definitions,
  // while authored \`.claude/\` siblings such as workflows remain in scope.
  "ignores": ["dist/**", "**/node_modules/**", "src/generated/**", ".claude/commands/**", ".claude/skills/**", ".claude/agents/**", ".agents/skills/**"]
}
`

const MARKDOWN_PATHS = [
  '**/*.md',
  '!src/generated/**',
  '!.claude/commands/**',
  '!.claude/skills/**',
  '!.claude/agents/**',
  '!.agents/skills/**'
] as const

const MARKDOWN_AUDIT_COMMANDS: readonly ConformCommand[] = [
  { program: 'bunx', arguments: ['prettier', '--check', ...MARKDOWN_PATHS, '--ignore-path', '.gitignore'] },
  { program: 'bunx', arguments: ['markdownlint-cli2', '**/*.md'] }
]

const MARKDOWN_CONFORM_COMMANDS: readonly ConformCommand[] = [
  { program: 'bunx', arguments: ['prettier', '--write', ...MARKDOWN_PATHS, '--ignore-path', '.gitignore'] },
  { program: 'bunx', arguments: ['markdownlint-cli2', '--fix'] }
]

export type OwnedFile = '.prettierrc.json' | '.editorconfig' | '.markdownlint-cli2.jsonc'
export type OwnedFileState = 'missing' | 'canonical' | 'drifted' | 'unsafe'
export type MarkdownAudit = { clean: boolean; detail?: string }
export type MarkdownRubricContext = {
  target: string
  exists: boolean
  audit: MarkdownAudit
  normalise?: () => void
}
export type OwnedFileEvidence = {
  name: OwnedFile
  state: OwnedFileState
  synchronise?: () => void
}
export type OwnedRubricContext = {
  targetExists: boolean
  files: readonly OwnedFileEvidence[]
}
export type TomlRubricContext = Record<string, never>
export type SynchronisationRubricContext = Record<string, never>
export type AuthoringRubricContext = {
  markdown: MarkdownRubricContext
  owned: OwnedRubricContext
  toml: TomlRubricContext
  synchronisation: SynchronisationRubricContext
}

type OwnedFileDraft = {
  evidence: OwnedFileEvidence
  proposal: () => ConformWrite | undefined
}

const canonical: Record<OwnedFile, string> = {
  '.prettierrc.json': PRETTIER_DEFAULT,
  '.editorconfig': EDITORCONFIG_DEFAULT,
  '.markdownlint-cli2.jsonc': MARKDOWNLINT_DEFAULT
}

const sha256 = (content: string): string => createHash('sha256').update(content).digest('hex')

const inspectOwnedFile = (repository: string, name: OwnedFile): OwnedFileState => {
  const path = join(repository, name)
  if (!existsSync(path)) return 'missing'
  const metadata = lstatSync(path)
  if (!metadata.isFile() || metadata.isSymbolicLink()) return 'unsafe'
  const original = readFileSync(path, 'utf8')
  return sha256(original) === sha256(canonical[name]) ? 'canonical' : 'drifted'
}

const createOwnedFileDraft = (repository: string, name: OwnedFile, mutable: boolean): OwnedFileDraft => {
  const state = inspectOwnedFile(repository, name)
  let requested = false
  return {
    evidence: {
      name,
      state,
      ...(mutable && state !== 'unsafe'
        ? {
            synchronise: () => {
              requested = true
            }
          }
        : {})
    },
    proposal: () =>
      requested && state !== 'canonical'
        ? {
            path: name,
            content: canonical[name],
            ...(state === 'missing' ? { create: true } : {})
          }
        : undefined
  }
}

const commandDetail = (stdout: string | null, stderr: string | null, fallback?: string): string | undefined => {
  const detail = [stdout, stderr, fallback]
    .filter((value): value is string => Boolean(value?.trim()))
    .join('\n')
    .trim()
  return detail ? detail.split('\n').slice(0, 8).join('\n    ') : undefined
}

const inspectMarkdown = (repository: string): MarkdownAudit => {
  for (const command of MARKDOWN_AUDIT_COMMANDS) {
    const result = spawnSync(command.program, command.arguments, {
      cwd: repository,
      encoding: 'utf8',
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe']
    })
    if (!result.error && result.status === 0) continue
    const detail = commandDetail(result.stdout, result.stderr, result.error?.message)
    return { clean: false, ...(detail ? { detail } : {}) }
  }
  return { clean: true }
}

export type MarkdownInspector = (repository: string) => MarkdownAudit

export const createAuthoringSession = (
  { mode, repository }: RubricContextOptions,
  markdownInspector: MarkdownInspector = inspectMarkdown
): RubricSession<AuthoringRubricContext> => {
  const target = resolve(repository)
  const targetExists = existsSync(target) && lstatSync(target).isDirectory()
  const mutable = mode === 'conform' && targetExists
  let normaliseMarkdown = false
  const ownedDrafts = (Object.keys(canonical) as OwnedFile[]).map((name) => createOwnedFileDraft(target, name, mutable))
  const context: AuthoringRubricContext = {
    markdown: {
      target,
      exists: targetExists,
      audit: targetExists ? markdownInspector(target) : { clean: false },
      ...(mutable
        ? {
            normalise: () => {
              normaliseMarkdown = true
            }
          }
        : {})
    },
    owned: {
      targetExists,
      files: ownedDrafts.map((draft) => draft.evidence)
    },
    toml: {},
    synchronisation: {}
  }

  return {
    subjects: [{ families: ['MD', 'OWN', 'TOML', 'SYNC'], context: () => context }],
    proposal: () => ({
      writes: ownedDrafts.flatMap((draft) => {
        const write = draft.proposal()
        return write ? [write] : []
      }),
      ...(normaliseMarkdown ? { commands: MARKDOWN_CONFORM_COMMANDS } : {})
    })
  }
}
