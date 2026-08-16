import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import type {
  ConformCommand,
  ConformWrite,
  RubricContextOptions,
  RubricPublicationContext,
  RubricSession
} from '../../shared/rubric.ts'

export const RUMDL_DEFAULT = `# rumdl owns Markdown wholly: formatting and linting in one tool. Biome owns
# TypeScript, JavaScript, and JSON; the two file domains are disjoint.

[global]
exclude = [
  "node_modules",
  "dist",
  "src/generated",
  ".claude/commands",
  ".claude/skills",
  ".claude/agents",
  ".agents/skills"
]

# MD033 inline HTML: <br> in table cells, angle-bracket placeholders in skills.
# MD036 bold-as-heading: bold labels are used deliberately in skill bodies.
# MD057 relative-link existence: real signal, but it fires on links that are
# correct in this repository and dangle in a published copy of it, so switching
# it on is a content decision rather than a formatting one. Tracked separately.
# MD060 table alignment stays off (it is opt-in). No style reproduces the former
# behaviour, where a table was padded only if the padded form fit the print
# width and left compact otherwise; "aligned" would rewrite every wide table
# into one very long row, and the permissive "any" enforces nothing while still
# misfiring on a placeholder table whose only body row holds "-" cells. Table
# width is therefore a judgment convention, not a mechanical check.
# MD056 table column count: rumdl 0.2.54 correctly treats [[Target|Label]] as
# one cell under the Obsidian flavor. This repository intentionally uses the
# standard flavor and forbids wikilinks, where the pipe remains a real column
# separator. Keep MD056 enabled so AUDIT catches that invalid shape, but make
# it unfixable so CONFORM cannot truncate the row while reporting it.
disable = ["MD033", "MD036", "MD057"]
unfixable = ["MD056"]

# MD013 owns line length and prose wrapping together, replacing the former
# split where Prettier held printWidth and MD013 was disabled to avoid a clash.
# normalize with an unbounded width is what yields one line per paragraph.
[MD013]
line-length = 100000
reflow = true
reflow-mode = "normalize"

[MD024]
siblings-only = true

[MD025]
front-matter-title = ""

[MD004]
style = "dash"

[MD049]
style = "underscore"

[MD050]
style = "asterisk"
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

// Trade records are formatted like any other Markdown. Their integrity is proven by the
// ki-trades AUTH-1 comparison against the sender's copy, which is insensitive to formatting
// and sensitive to meaning — an exclusion list only avoided touching them and never checked
// them, and it never covered Biome at all.

// The Markdown scope lives in .rumdl.toml's own exclude list rather than in a glob list
// passed by the caller, so a bare `rumdl check` at the repository root means the same thing
// as the gate does.
const MARKDOWN_AUDIT_COMMANDS: readonly ConformCommand[] = [{ program: 'bunx', arguments: ['rumdl', 'check', '.'] }]

// `check --fix` rather than `fmt`: fmt exits 0 even when unfixable violations remain, which
// would let CONFORM report success over a file it could not settle.
const MARKDOWN_CONFORM_COMMANDS: readonly ConformCommand[] = [
  { program: 'bunx', arguments: ['rumdl', 'check', '--fix', '.'] }
]

// Retired with the move to rumdl. CONFORM removes them, because a repository that keeps a
// stale Prettier or markdownlint configuration invites an editor extension to reformat
// Markdown against a standard this repository no longer holds.
export const RETIRED_FILES = ['.prettierrc.json', '.prettierignore', '.markdownlint-cli2.jsonc'] as const

export type OwnedFile = '.editorconfig' | '.rumdl.toml'
export type OwnedFileState = 'missing' | 'canonical' | 'drifted' | 'unsafe'
export type OwnedFileException = {
  name: string
  reason?: string
  issue?: string
}
export type MarkdownAudit = { clean: boolean; detail?: string }
export type FrontmatterFileEvidence = {
  path: string
  count: number
  normalise?: () => void
}
export type FrontmatterRubricContext = {
  files: readonly FrontmatterFileEvidence[]
}
export type MarkdownRubricContext = {
  target: string
  exists: boolean
  audit: MarkdownAudit
  frontmatter: FrontmatterRubricContext
  normalise?: () => void
}
export type OwnedFileEvidence = {
  name: OwnedFile
  state: OwnedFileState
  exception?: string
  synchronise?: () => void
}
export type RetiredFileEvidence = {
  name: string
  present: boolean
  remove?: () => void
}
export type OwnedRubricContext = {
  targetExists: boolean
  files: readonly OwnedFileEvidence[]
  exceptions: readonly OwnedFileException[]
  retired: readonly RetiredFileEvidence[]
}
export type TomlRubricContext = Record<string, never>
export type SynchronisationRubricContext = Record<string, never>
export type AuthoringRubricContext = {
  rubric: RubricPublicationContext
  markdown: MarkdownRubricContext
  owned: OwnedRubricContext
  toml: TomlRubricContext
  synchronisation: SynchronisationRubricContext
}

type OwnedFileDraft = {
  evidence: OwnedFileEvidence
  proposal: () => ConformWrite | undefined
}

type FrontmatterFileDraft = {
  evidence: FrontmatterFileEvidence
  proposal: () => ConformWrite | undefined
}

const canonical: Record<OwnedFile, string> = {
  '.editorconfig': EDITORCONFIG_DEFAULT,
  '.rumdl.toml': RUMDL_DEFAULT
}

const sha256 = (content: string): string => createHash('sha256').update(content).digest('hex')

const FRONTMATTER_IGNORED_DIRECTORIES = new Set(['.git', 'dist', 'node_modules'])
const FRONTMATTER_IGNORED_PATHS = [
  'src/generated',
  '.claude/commands',
  '.claude/skills',
  '.claude/agents',
  '.agents/skills'
]
const YAML_SIGNIFICANT_SCALARS = /^(?:true|false|null|y|n|yes|no|on|off|\.nan|\.inf)$/i
const BARE_SAFE_SCALAR = /^[A-Za-z_][A-Za-z0-9_-]*$/

const frontmatterPathIsIgnored = (path: string): boolean =>
  FRONTMATTER_IGNORED_PATHS.some((ignored) => path === ignored || path.startsWith(`${ignored}/`))

const markdownFiles = (repository: string, directory = '', files: string[] = []): readonly string[] => {
  for (const entry of readdirSync(join(repository, directory), { withFileTypes: true })) {
    const path = directory ? `${directory}/${entry.name}` : entry.name
    if (entry.isDirectory()) {
      if (!FRONTMATTER_IGNORED_DIRECTORIES.has(entry.name) && !frontmatterPathIsIgnored(path))
        markdownFiles(repository, path, files)
      continue
    }
    if (entry.isFile() && !entry.isSymbolicLink() && path.endsWith('.md') && !frontmatterPathIsIgnored(path))
      files.push(path)
  }
  return files.sort()
}

const normaliseFrontmatter = (content: string): { content: string; count: number } => {
  const frontmatter = /^(---\n)([\s\S]*?)(\n---(?:\n|$))/.exec(content)
  if (!frontmatter) return { content, count: 0 }
  let count = 0
  const fields = frontmatter[2].replace(
    /^([a-z][a-z0-9-]*: )(['"])([A-Za-z_][A-Za-z0-9_-]*)\2$/gm,
    (line, prefix, _quote, value) => {
      if (!BARE_SAFE_SCALAR.test(value) || YAML_SIGNIFICANT_SCALARS.test(value)) return line
      count += 1
      return `${prefix}${value}`
    }
  )
  return count === 0
    ? { content, count }
    : { content: `${frontmatter[1]}${fields}${frontmatter[3]}${content.slice(frontmatter[0].length)}`, count }
}

const createFrontmatterDrafts = (repository: string, mutable: boolean): readonly FrontmatterFileDraft[] =>
  markdownFiles(repository).flatMap((path) => {
    const original = readFileSync(join(repository, path), 'utf8')
    const normalised = normaliseFrontmatter(original)
    if (normalised.count === 0) return []
    let requested = false
    return [
      {
        evidence: {
          path,
          count: normalised.count,
          ...(mutable
            ? {
                normalise: () => {
                  requested = true
                }
              }
            : {})
        },
        proposal: () => (requested ? { path, content: normalised.content } : undefined)
      }
    ]
  })

const inspectOwnedFile = (repository: string, name: OwnedFile): OwnedFileState => {
  const path = join(repository, name)
  if (!existsSync(path)) return 'missing'
  const metadata = lstatSync(path)
  if (!metadata.isFile() || metadata.isSymbolicLink()) return 'unsafe'
  const original = readFileSync(path, 'utf8')
  return sha256(original) === sha256(canonical[name]) ? 'canonical' : 'drifted'
}

const ownedFileExceptions = (configuration: Readonly<Record<string, unknown>>): readonly OwnedFileException[] => {
  const declared = configuration.owned_file_exceptions
  if (declared === undefined) return []
  if (!declared || typeof declared !== 'object' || Array.isArray(declared))
    return [{ name: 'owned_file_exceptions', issue: 'must be a table mapping owned filenames to non-empty reasons' }]
  return Object.entries(declared).map(([name, value]) => {
    if (!(name in canonical)) return { name, issue: 'is not a currently owned file' }
    if (typeof value !== 'string' || !value.trim()) return { name, issue: 'must have a non-empty reason' }
    return { name, reason: value.trim() }
  })
}

const createOwnedFileDraft = (
  repository: string,
  name: OwnedFile,
  mutable: boolean,
  exception?: string
): OwnedFileDraft => {
  const state = inspectOwnedFile(repository, name)
  let requested = false
  const protectedDrift = state === 'drifted' && Boolean(exception)
  return {
    evidence: {
      name,
      state,
      ...(exception ? { exception } : {}),
      ...(mutable && state !== 'unsafe'
        ? {
            synchronise: () => {
              if (!protectedDrift) requested = true
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
  { mode, repository, configuration, publication }: RubricContextOptions,
  markdownInspector: MarkdownInspector = inspectMarkdown
): RubricSession<AuthoringRubricContext> => {
  const target = resolve(repository)
  const targetExists = existsSync(target) && lstatSync(target).isDirectory()
  const mutable = mode === 'conform' && targetExists
  let normaliseMarkdown = false
  const exceptions = ownedFileExceptions(configuration)
  const ownedDrafts = (Object.keys(canonical) as OwnedFile[]).map((name) =>
    createOwnedFileDraft(target, name, mutable, exceptions.find((exception) => exception.name === name)?.reason)
  )
  const frontmatterDrafts = targetExists ? createFrontmatterDrafts(target, mutable) : []
  const removals = new Set<string>()
  const retired: readonly RetiredFileEvidence[] = RETIRED_FILES.map((name) => {
    const present = targetExists && existsSync(join(target, name))
    return {
      name,
      present,
      ...(mutable && present
        ? {
            remove: () => {
              removals.add(name)
            }
          }
        : {})
    }
  })
  const context: AuthoringRubricContext = {
    rubric: { publication },
    markdown: {
      target,
      exists: targetExists,
      audit: targetExists ? markdownInspector(target) : { clean: false },
      frontmatter: { files: frontmatterDrafts.map((draft) => draft.evidence) },
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
      files: ownedDrafts.map((draft) => draft.evidence),
      exceptions,
      retired
    },
    toml: {},
    synchronisation: {}
  }

  return {
    subjects: [
      { families: ['RUBRIC'], context: () => context },
      { families: ['MD', 'OWN', 'TOML', 'SYNC'], context: () => context }
    ],
    proposal: () => ({
      writes: ownedDrafts
        .flatMap((draft) => {
          const write = draft.proposal()
          return write ? [write] : []
        })
        .concat(
          frontmatterDrafts.flatMap((draft) => {
            const write = draft.proposal()
            return write ? [write] : []
          })
        ),
      ...(removals.size > 0 || normaliseMarkdown
        ? {
            commands: [
              // Removal precedes normalisation so the gate never runs against a repository
              // still carrying a competing configuration.
              ...(removals.size > 0
                ? [{ program: 'rm', arguments: ['-f', '--', ...[...removals].sort()] } satisfies ConformCommand]
                : []),
              ...(normaliseMarkdown ? MARKDOWN_CONFORM_COMMANDS : [])
            ]
          }
        : {})
    })
  }
}
