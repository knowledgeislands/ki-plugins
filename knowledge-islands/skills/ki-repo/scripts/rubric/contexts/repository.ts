import { existsSync, lstatSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import type {
  AuditOutcome,
  ConformWrite,
  RubricContextOptions,
  RubricEmitter,
  RubricPublicationContext,
  RubricSession,
  ViolationLevel
} from '../../shared/rubric.ts'
import {
  collectAuditFindings,
  declaresRootTable,
  KNOWN_RUNTIMES,
  parseSupportedRuntimes,
  type RepoAuditCollection,
  type RepoEvidenceFinding,
  runtimeSkillIgnoreRules
} from './audit.ts'

const KI_REPO_TABLE = 'ki-repo'
const KI_AUTHORING_TABLE = 'ki-authoring'
const KI_REPO_DEFAULT = `[skills.${KI_REPO_TABLE}]
title = ""              # required — exact README.md H1
description = ""        # required — exact GitHub and package.json description where present
visibility = "private"   # "public" | "private" — must match the repo's actual GitHub visibility
license = "MIT"          # SPDX id the LICENSE, package.json, and GitHub must match; default MIT. Use "UNLICENSED" for proprietary. Pick one at https://choosealicense.com/
supported_runtimes = ["claude-code", "chatgpt-codex"] # required agent-runtime support surface

# Per-repo check overrides — true = enforce, false = don't. Omit any check to take
# the org default; a repo that fully conforms needs nothing here.
# [skills.${KI_REPO_TABLE}.checks]
# branch-protection = true   # default off — protect \`main\` on this repo
# wiki = false               # default on  — allow this repo's Wiki
`

const KI_AUTHORING_DEFAULT = `# The authoring standard (Markdown/TOML house style) is baseline — every KI repo is
# governed by it. Declared explicitly, not assumed; its presence is the compliance marker.
[skills.${KI_AUTHORING_TABLE}]
`

const RUNTIME_SKILL_GITIGNORE = (
  rules: readonly string[]
): string => `# Generated project-local runtime payloads (ki-bootstrap) — never committed
${rules.join('\n')}
`
const GITIGNORE_DEFAULT = (rules: readonly string[]): string => `node_modules/
.DS_Store

${RUNTIME_SKILL_GITIGNORE(rules)}`
const ALL_RUNTIME_SKILL_RULES = new Set([
  '.claude/skills/',
  '.claude/skills/*',
  '.agents/skills/',
  '.agents/skills/*',
  '!.agents/skills/ki-self/',
  '!.agents/skills/ki-self/**'
])

const hasRuntimeSkillIgnoreRules = (content: string, expected: readonly string[]): boolean => {
  const lines = content.split(/\r?\n/).map((line) => line.trim())
  const actual = lines.filter((line) => ALL_RUNTIME_SKILL_RULES.has(line))
  return actual.length === expected.length && actual.every((line, index) => line === expected[index])
}

const conformRuntimeSkillIgnore = (content: string, rules: readonly string[]): string => {
  if (hasRuntimeSkillIgnoreRules(content, rules)) return content
  const lines = content.split(/\r?\n/)
  const retained = lines
    .filter((line) => !ALL_RUNTIME_SKILL_RULES.has(line.trim()))
    .join('\n')
    .replace(/\n*$/, '')
  return `${retained}\n\n${RUNTIME_SKILL_GITIGNORE(rules)}`
}

const runtimeRules = (config: string): string[] | undefined => {
  const parsed = parseSupportedRuntimes(config)
  if (parsed.issue || parsed.runtimes.some((runtime) => !KNOWN_RUNTIMES.includes(runtime))) return undefined
  return runtimeSkillIgnoreRules(parsed.runtimes)
}

const GITHUB_CODES = new Set([
  'FILES-1',
  'FILES-2',
  'FILES-3',
  'GH-1',
  'GH-2',
  'GH-3',
  'PKG-1',
  'MERGE-1',
  'TOGGLE-1',
  'VIS-1',
  'TOPICS-1',
  'BP-1',
  'DEP-1',
  'SEC-1',
  'ACT-1',
  'CHECKS-1',
  'COV-1',
  'STRUCT-1',
  'STRUCT-2'
])

export type EvidenceRubricContext = {
  evidence: readonly RepoEvidenceFinding[]
}

export type FilesRubricContext = {
  files1: readonly RepoEvidenceFinding[]
  files2: readonly RepoEvidenceFinding[]
  files3: readonly RepoEvidenceFinding[]
  files4: readonly RepoEvidenceFinding[]
  ensureGitignore?: () => void
  ensureRuntimeSkillIgnore?: () => void
  ensureRepoConfiguration?: () => void
  ensureAuthoringConfiguration?: () => void
}

export type GhRubricContext = {
  gh1: readonly RepoEvidenceFinding[]
  gh2: readonly RepoEvidenceFinding[]
  gh3: readonly RepoEvidenceFinding[]
}

export type StructureRubricContext = {
  structure1: readonly RepoEvidenceFinding[]
  structure2: readonly RepoEvidenceFinding[]
}

export type RuntimesRubricContext = {
  runtimes1: readonly RepoEvidenceFinding[]
  runtimes2: readonly RepoEvidenceFinding[]
  runtimes3: readonly RepoEvidenceFinding[]
}

export type KindRubricContext = {
  kind1: readonly RepoEvidenceFinding[]
  kind2: readonly RepoEvidenceFinding[]
}

const WORKING_AREA_READMES = [
  {
    path: '+/README.md',
    content: `# Incoming working area

\`+\` is this repository's top-level working area for temporary material received from another repository or external source that needs local triage.

For material prepared here to send elsewhere, use [the matching outbound working area](../-/README.md).

It is not a canonical roadmap, plan, decision record, or knowledge-base destination. Triage each item into its durable home, or remove it when it has no value to retain.
`
  },
  {
    path: '-/README.md',
    content: `# Outgoing working area

\`-\` is this repository's top-level working area for temporary material prepared here for another repository or external recipient.

For material received here to triage, use [the matching inbound working area](../+/README.md).

It is not a canonical roadmap, plan, decision record, or knowledge-base destination. Remove each item after delivery or when it no longer has value to retain.
`
  }
] as const

const WORKING_AREA_DIRECTORIES = ['+', '-'] as const

export type WorkingAreasRubricContext = {
  workingAreas1: readonly AuditOutcome[]
  ensureWorkingAreaScaffold?: () => void
}

export type RepoRubricContext = {
  rubric: RubricPublicationContext
  files: FilesRubricContext
  gh: GhRubricContext
  pkg: EvidenceRubricContext
  merge: EvidenceRubricContext
  toggle: EvidenceRubricContext
  visibility: EvidenceRubricContext
  topics: EvidenceRubricContext
  branchProtection: EvidenceRubricContext
  dependencies: EvidenceRubricContext
  secrets: EvidenceRubricContext
  actions: EvidenceRubricContext
  checks: EvidenceRubricContext
  coverage: EvidenceRubricContext
  structure: StructureRubricContext
  access: EvidenceRubricContext
  kind: KindRubricContext
  runtimes: RuntimesRubricContext
  descriptionFit: Record<string, never>
  overrides: Record<string, never>
  synchronisation: Record<string, never>
  workingAreas: WorkingAreasRubricContext
}

export const auditEvidence = (
  evidence: readonly RepoEvidenceFinding[],
  defaultLevel: ViolationLevel,
  overrideLevels?: readonly ViolationLevel[]
): readonly AuditOutcome[] =>
  evidence.map((finding): AuditOutcome => {
    if (finding.level === 'FAIL' || finding.level === 'WARN') {
      const level = finding.level
      return {
        status: 'VIOLATION',
        message: finding.message,
        ...(finding.subject ? { subject: finding.subject } : {}),
        ...(level !== defaultLevel && overrideLevels?.includes(level) ? { level } : {})
      }
    }
    return {
      status: finding.level,
      message: finding.message,
      ...(finding.subject ? { subject: finding.subject } : {})
    }
  })

const isSafeRegularFile = (path: string): boolean => {
  if (!existsSync(path)) return false
  const metadata = lstatSync(path)
  return metadata.isFile() && !metadata.isSymbolicLink()
}

const isSafeDirectory = (path: string): boolean => {
  if (!existsSync(path)) return false
  const metadata = lstatSync(path)
  return metadata.isDirectory() && !metadata.isSymbolicLink()
}

const pathState = (path: string): ReturnType<typeof lstatSync> | undefined => {
  try {
    return lstatSync(path)
  } catch {
    return undefined
  }
}

const workingAreaOutcomes = (target: string): readonly AuditOutcome[] => {
  const outcomes: AuditOutcome[] = []
  for (const directory of WORKING_AREA_DIRECTORIES) {
    const path = join(target, directory)
    if (!isSafeDirectory(path)) {
      outcomes.push({
        status: 'VIOLATION',
        message: `required working-area directory ${directory}/ is absent or unsafe`,
        subject: directory
      })
    }
  }
  for (const readme of WORKING_AREA_READMES) {
    const path = join(target, readme.path)
    if (!isSafeRegularFile(path)) {
      outcomes.push({
        status: 'VIOLATION',
        message: `required working-area README ${readme.path} is absent or unsafe`,
        subject: readme.path
      })
    } else if (readFileSync(path, 'utf8') !== readme.content) {
      outcomes.push({
        status: 'VIOLATION',
        message: `working-area README ${readme.path} differs from the canonical ki-repo orientation`,
        subject: readme.path
      })
    }
  }
  return outcomes.length > 0
    ? outcomes
    : [{ status: 'PASS', message: 'working-area scaffold is present and conformed' }]
}

const canConformWorkingAreaScaffold = (target: string): boolean =>
  [...WORKING_AREA_DIRECTORIES].every((directory) => {
    const state = pathState(join(target, directory))
    return !state || (state.isDirectory() && !state.isSymbolicLink())
  }) &&
  WORKING_AREA_READMES.every((readme) => {
    const state = pathState(join(target, readme.path))
    return !state || (state.isFile() && !state.isSymbolicLink())
  })

const appendBlocks = (source: string, blocks: readonly string[]): string => {
  if (blocks.length === 0) return source
  const separator = source.length === 0 ? '' : source.endsWith('\n\n') ? '' : source.endsWith('\n') ? '\n' : '\n\n'
  return `${source}${separator}${blocks.join('\n')}`
}

const findingsByCode = (findings: readonly RepoEvidenceFinding[]) => {
  const grouped = new Map<string, RepoEvidenceFinding[]>()
  for (const finding of findings) grouped.set(finding.code, [...(grouped.get(finding.code) ?? []), finding])
  const githubUnavailable = findings.some(
    (finding) => finding.code === 'ACCESS-1' && finding.level === 'NOT_APPLICABLE'
  )
  return (code: string): readonly RepoEvidenceFinding[] => {
    const matched = grouped.get(code)
    if (matched?.length) return matched
    if (githubUnavailable && GITHUB_CODES.has(code))
      return [{ level: 'NOT_APPLICABLE', code, message: 'GitHub evidence was unavailable for this run' }]
    return [{ level: 'PASS', code, message: 'criterion satisfied' }]
  }
}

export type RepoEvidenceInspector = (
  repository: string,
  emit?: RubricEmitter
) => RepoAuditCollection | Promise<RepoAuditCollection>

export const createRepoSession = async (
  { mode, repository, publication, emit }: RubricContextOptions,
  inspect: RepoEvidenceInspector = (target, report) => collectAuditFindings([target], report)
): Promise<RubricSession<RepoRubricContext>> => {
  const target = resolve(repository)
  emit?.({ kind: 'stage', edge: 'start', label: 'repository evidence' })
  const evidence = findingsByCode((await inspect(target, emit)).findings)
  emit?.({ kind: 'stage', edge: 'end', label: 'repository evidence' })
  const mutable = mode === 'conform'
  const configPath = join(target, '.ki-config.toml')
  const configExists = existsSync(configPath)
  const configSource = !configExists ? '' : isSafeRegularFile(configPath) ? readFileSync(configPath, 'utf8') : undefined
  const gitignorePath = join(target, '.gitignore')
  const gitignoreExists = existsSync(gitignorePath)
  const gitignoreSource = !gitignoreExists
    ? ''
    : isSafeRegularFile(gitignorePath)
      ? readFileSync(gitignorePath, 'utf8')
      : undefined
  const declaredRuntimeRules = configSource === undefined ? undefined : runtimeRules(configSource || KI_REPO_DEFAULT)
  let repoConfigurationRequested = false
  let authoringConfigurationRequested = false
  let gitignoreRequested = false
  let runtimeSkillIgnoreRequested = false
  let workingAreaScaffoldRequested = false

  const context: RepoRubricContext = {
    rubric: { publication },
    files: {
      files1: evidence('FILES-1'),
      files2: evidence('FILES-2'),
      files3: evidence('FILES-3'),
      files4: evidence('FILES-4'),
      ...(mutable && !gitignoreExists
        ? {
            ensureGitignore: () => {
              gitignoreRequested = true
            }
          }
        : {}),
      ...(mutable &&
      gitignoreExists &&
      gitignoreSource !== undefined &&
      declaredRuntimeRules &&
      !hasRuntimeSkillIgnoreRules(gitignoreSource, declaredRuntimeRules)
        ? {
            ensureRuntimeSkillIgnore: () => {
              runtimeSkillIgnoreRequested = true
            }
          }
        : {}),
      ...(mutable && configSource !== undefined
        ? {
            ensureRepoConfiguration: () => {
              repoConfigurationRequested = true
            },
            ensureAuthoringConfiguration: () => {
              authoringConfigurationRequested = true
            }
          }
        : {})
    },
    gh: { gh1: evidence('GH-1'), gh2: evidence('GH-2'), gh3: evidence('GH-3') },
    pkg: { evidence: evidence('PKG-1') },
    merge: { evidence: evidence('MERGE-1') },
    toggle: { evidence: evidence('TOGGLE-1') },
    visibility: { evidence: evidence('VIS-1') },
    topics: { evidence: evidence('TOPICS-1') },
    branchProtection: { evidence: evidence('BP-1') },
    dependencies: { evidence: evidence('DEP-1') },
    secrets: { evidence: evidence('SEC-1') },
    actions: { evidence: evidence('ACT-1') },
    checks: { evidence: evidence('CHECKS-1') },
    coverage: { evidence: evidence('COV-1') },
    structure: { structure1: evidence('STRUCT-1'), structure2: evidence('STRUCT-2') },
    access: { evidence: evidence('ACCESS-1') },
    kind: { kind1: evidence('KIND-1'), kind2: evidence('KIND-2') },
    runtimes: {
      runtimes1: evidence('RUNTIMES-1'),
      runtimes2: evidence('RUNTIMES-2'),
      runtimes3: evidence('RUNTIMES-3')
    },
    descriptionFit: {},
    overrides: {},
    synchronisation: {},
    workingAreas: {
      workingAreas1: workingAreaOutcomes(target),
      ...(mutable && canConformWorkingAreaScaffold(target)
        ? {
            ensureWorkingAreaScaffold: () => {
              workingAreaScaffoldRequested = true
            }
          }
        : {})
    }
  }

  return {
    subjects: [
      { families: ['RUBRIC'], context: () => context },
      {
        families: [
          'FILES',
          'GH',
          'PKG',
          'MERGE',
          'TOGGLE',
          'VIS',
          'TOPICS',
          'BP',
          'DEP',
          'SEC',
          'ACT',
          'CHECKS',
          'COV',
          'STRUCT',
          'ACCESS',
          'KIND',
          'RUNTIMES',
          'DESCFIT',
          'OVR',
          'SYNC',
          'WORK'
        ],
        context: () => context
      }
    ],
    proposal: () => {
      const writes: ConformWrite[] = []
      if (configSource !== undefined) {
        const blocks = [
          repoConfigurationRequested && !declaresRootTable(configSource, KI_REPO_TABLE) ? KI_REPO_DEFAULT : '',
          authoringConfigurationRequested && !declaresRootTable(configSource, KI_AUTHORING_TABLE)
            ? KI_AUTHORING_DEFAULT
            : ''
        ].filter(Boolean)
        const content = appendBlocks(configSource, blocks)
        if (content !== configSource)
          writes.push({ path: '.ki-config.toml', content, ...(!configExists ? { create: true } : {}) })
      }
      if (gitignoreRequested && declaredRuntimeRules)
        writes.push({ path: '.gitignore', content: GITIGNORE_DEFAULT(declaredRuntimeRules), create: true })
      if (runtimeSkillIgnoreRequested && gitignoreSource !== undefined && declaredRuntimeRules) {
        const content = conformRuntimeSkillIgnore(gitignoreSource, declaredRuntimeRules)
        if (content !== gitignoreSource) writes.push({ path: '.gitignore', content })
      }
      if (workingAreaScaffoldRequested) {
        for (const readme of WORKING_AREA_READMES) {
          const path = join(target, readme.path)
          if (isSafeRegularFile(path) && readFileSync(path, 'utf8') === readme.content) continue
          writes.push({ path: readme.path, content: readme.content, ...(!pathState(path) ? { create: true } : {}) })
        }
      }
      return { writes }
    }
  }
}
