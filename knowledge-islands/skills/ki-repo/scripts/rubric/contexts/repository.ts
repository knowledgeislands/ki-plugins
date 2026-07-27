import { existsSync, lstatSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import type { AuditOutcome, ConformWrite, RubricContextOptions, RubricSession, ViolationLevel } from '../../shared/rubric.ts'
import { collectAuditFindings, declaresRootTable, type RepoAuditCollection, type RepoEvidenceFinding } from './audit.ts'

const KI_REPO_DEFAULT = `[ki-repo]
visibility = "private"   # "public" | "private" — must match the repo's actual GitHub visibility
license = "MIT"          # SPDX id the LICENSE, package.json, and GitHub must match; default MIT. Use "UNLICENSED" for proprietary. Pick one at https://choosealicense.com/
supported_runtimes = ["claude-code", "codex"] # required agent-runtime support surface

# Per-repo check overrides — true = enforce, false = don't. Omit any check to take
# the org default; a repo that fully conforms needs nothing here.
# [ki-repo.checks]
# branch-protection = true   # default off — protect \`main\` on this repo
# wiki = false               # default on  — allow this repo's Wiki
`

const KI_AUTHORING_DEFAULT = `# The authoring standard (Markdown/TOML house style) is baseline — every KI repo is
# governed by it. Declared explicitly, not assumed; its presence is the compliance marker.
[ki-authoring]
`

const GITIGNORE_DEFAULT = 'node_modules/\n.DS_Store\n'

const GITHUB_CODES = new Set([
  'FILES-1',
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
  files3: readonly RepoEvidenceFinding[]
  ensureGitignore?: () => void
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
}

export type RepoRubricContext = {
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
  runtimes: RuntimesRubricContext
  descriptionFit: Record<string, never>
  overrides: Record<string, never>
  synchronisation: Record<string, never>
  workingAreas: Record<string, never>
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

const appendBlocks = (source: string, blocks: readonly string[]): string => {
  if (blocks.length === 0) return source
  const separator = source.length === 0 ? '' : source.endsWith('\n\n') ? '' : source.endsWith('\n') ? '\n' : '\n\n'
  return `${source}${separator}${blocks.join('\n')}`
}

const findingsByCode = (findings: readonly RepoEvidenceFinding[]) => {
  const grouped = new Map<string, RepoEvidenceFinding[]>()
  for (const finding of findings) grouped.set(finding.code, [...(grouped.get(finding.code) ?? []), finding])
  const githubUnavailable = findings.some((finding) => finding.code === 'ACCESS-1' && finding.level === 'NOT_APPLICABLE')
  return (code: string): readonly RepoEvidenceFinding[] => {
    const matched = grouped.get(code)
    if (matched?.length) return matched
    if (githubUnavailable && GITHUB_CODES.has(code))
      return [{ level: 'NOT_APPLICABLE', code, message: 'GitHub evidence was unavailable for this run' }]
    return [{ level: 'PASS', code, message: 'criterion satisfied' }]
  }
}

export type RepoEvidenceInspector = (repository: string) => RepoAuditCollection

export const createRepoSession = (
  { mode, repository }: RubricContextOptions,
  inspect: RepoEvidenceInspector = (target) => collectAuditFindings([target])
): RubricSession<RepoRubricContext> => {
  const target = resolve(repository)
  const evidence = findingsByCode(inspect(target).findings)
  const mutable = mode === 'conform'
  const configPath = join(target, '.ki-config.toml')
  const configExists = existsSync(configPath)
  const configSource = !configExists ? '' : isSafeRegularFile(configPath) ? readFileSync(configPath, 'utf8') : undefined
  const gitignorePath = join(target, '.gitignore')
  const gitignoreExists = existsSync(gitignorePath)
  const gitignoreSafe = !gitignoreExists || isSafeRegularFile(gitignorePath)
  let repoConfigurationRequested = false
  let authoringConfigurationRequested = false
  let gitignoreRequested = false

  const context: RepoRubricContext = {
    files: {
      files1: evidence('FILES-1'),
      files3: evidence('FILES-3'),
      ...(mutable && gitignoreSafe && !gitignoreExists
        ? {
            ensureGitignore: () => {
              gitignoreRequested = true
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
    runtimes: { runtimes1: evidence('RUNTIMES-1') },
    descriptionFit: {},
    overrides: {},
    synchronisation: {},
    workingAreas: {}
  }

  return {
    subjects: [
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
          repoConfigurationRequested && !declaresRootTable(configSource, 'ki-repo') ? KI_REPO_DEFAULT : '',
          authoringConfigurationRequested && !declaresRootTable(configSource, 'ki-authoring') ? KI_AUTHORING_DEFAULT : ''
        ].filter(Boolean)
        const content = appendBlocks(configSource, blocks)
        if (content !== configSource) writes.push({ path: '.ki-config.toml', content, ...(!configExists ? { create: true } : {}) })
      }
      if (gitignoreRequested) writes.push({ path: '.gitignore', content: GITIGNORE_DEFAULT, create: true })
      return { writes }
    }
  }
}
