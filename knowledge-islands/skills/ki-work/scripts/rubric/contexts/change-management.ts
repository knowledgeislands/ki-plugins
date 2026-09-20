import { existsSync, lstatSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import type { AuditOutcome, ConformWrite, RubricContextOptions, RubricSession } from '../../shared/rubric.ts'
import type { ChangeManagementRubricContext } from '../types.ts'

const TABLE = 'ki-work'
type AdapterDefinition = { readonly skill: string; readonly repositoryKind?: 'repository' | 'kb' }
type Adapter = 'roadmap' | 'kb-streams' | 'github-issues' | 'linear'
const ADAPTERS: Readonly<Record<Adapter, AdapterDefinition>> = {
  roadmap: { skill: 'ki-work-roadmap', repositoryKind: 'repository' },
  'kb-streams': { skill: 'ki-repo-kb-streams', repositoryKind: 'kb' },
  'github-issues': { skill: 'ki-work-github-issues' },
  linear: { skill: 'ki-work-linear' }
}
export const batchReadme = {
  path: '+/_BATCHES/README.md',
  content:
    '# Batches\n\nThis directory holds temporary batch inputs for repository work while `ki-work` is declared. `ki-batch` owns record shape, authority, run ledger, and retention.\n\nKeep active records. Regular `ki-next` and `ki-recap` maintenance removes inactive records as soon as useful outcomes or follow-up are dispositioned, and treats unresolved records as overdue at seven days. This README remains as the capability boundary.\n'
} as const

const TOML = (globalThis as unknown as { Bun: { TOML: { parse(text: string): unknown } } }).Bun.TOML

const tableAt = (skills: Record<string, unknown> | undefined, name: string): Record<string, unknown> | undefined => {
  const table = skills?.[name]
  return typeof table === 'object' && table !== null && !Array.isArray(table)
    ? (table as Record<string, unknown>)
    : undefined
}
const isAdapter = (value: unknown): value is Adapter => typeof value === 'string' && value in ADAPTERS
const physicalDirectory = (path: string): boolean =>
  existsSync(path) && !lstatSync(path).isSymbolicLink() && lstatSync(path).isDirectory()
const physicalFile = (path: string): boolean =>
  existsSync(path) && !lstatSync(path).isSymbolicLink() && lstatSync(path).isFile()

export const createChangeManagementSession = ({
  mode,
  repository,
  configuration
}: RubricContextOptions): RubricSession<ChangeManagementRubricContext> => {
  const root = resolve(repository)
  const config = join(root, '.ki.toml')
  const skills = tableAt(configuration as Record<string, unknown>, 'skills')
  const declared = tableAt(skills, TABLE)
  let outcomes: AuditOutcome[]

  if (!existsSync(config)) {
    outcomes = [
      { status: 'NOT_APPLICABLE', message: 'No KI repository configuration is present.', subject: '.ki.toml' }
    ]
  } else {
    try {
      const parsed = TOML.parse(readFileSync(config, 'utf8')) as Record<string, unknown>
      const parsedSkills = tableAt(parsed, 'skills')
      const table = tableAt(parsedSkills, TABLE)
      if (!table) {
        outcomes = [{ status: 'VIOLATION', message: '[skills.ki-work] must declare an adapter.', subject: '.ki.toml' }]
      } else {
        const adapter = table.adapter
        const unknown = Object.keys(table).filter((key) => key !== 'adapter')
        const definition = isAdapter(adapter) ? ADAPTERS[adapter] : undefined
        const repoType = tableAt(parsedSkills, 'ki-repo')?.repo_type ?? 'repository'
        const violations: AuditOutcome[] = [
          ...(unknown.length
            ? [
                {
                  status: 'VIOLATION' as const,
                  message: `Unrecognised change-management configuration key: ${unknown.join(', ')}.`,
                  subject: '.ki.toml'
                }
              ]
            : []),
          ...(!definition
            ? [
                {
                  status: 'VIOLATION' as const,
                  message: 'adapter must be one of: roadmap, kb-streams, github-issues, linear.',
                  subject: '.ki.toml'
                }
              ]
            : []),
          ...(definition && !tableAt(parsedSkills, definition.skill)
            ? [
                {
                  status: 'VIOLATION' as const,
                  message: `Selected ${adapter} adapter requires a declared [skills.${definition.skill}] table.`,
                  subject: '.ki.toml'
                }
              ]
            : []),
          ...(definition?.repositoryKind && repoType !== definition.repositoryKind
            ? [
                {
                  status: 'VIOLATION' as const,
                  message: `Selected ${adapter} adapter applies only to a ${definition.repositoryKind} repository, not ${repoType}.`,
                  subject: '.ki.toml'
                }
              ]
            : [])
        ]
        outcomes =
          violations.length > 0
            ? violations
            : [
                {
                  status: 'PASS',
                  message: `Change management selects ${adapter}, resolved to ${definition?.skill}.`,
                  subject: '.ki.toml'
                }
              ]
      }
    } catch {
      outcomes = [{ status: 'VIOLATION', message: 'Cannot parse .ki.toml.', subject: '.ki.toml' }]
    }
  }

  const readmePath = join(root, batchReadme.path)
  const batchDirectory = join(root, '+', '_BATCHES')
  const scaffoldOutcomes: AuditOutcome[] = []
  if (!declared) {
    scaffoldOutcomes.push({
      status: 'NOT_APPLICABLE',
      message: 'No ki-work declaration activates the batch scaffold.'
    })
  } else if (!physicalDirectory(batchDirectory)) {
    scaffoldOutcomes.push({
      status: 'VIOLATION',
      message: '+/_BATCHES/ is absent or unsafe.',
      subject: batchReadme.path
    })
  } else if (!physicalFile(readmePath)) {
    scaffoldOutcomes.push({
      status: 'VIOLATION',
      message: '+/_BATCHES/README.md is absent or unsafe.',
      subject: batchReadme.path
    })
  } else if (readFileSync(readmePath, 'utf8') !== batchReadme.content) {
    scaffoldOutcomes.push({
      status: 'VIOLATION',
      message: '+/_BATCHES/README.md differs from canonical ki-work orientation.',
      subject: batchReadme.path
    })
  } else {
    scaffoldOutcomes.push({
      status: 'PASS',
      message: 'The retained batch scaffold is canonical.',
      subject: batchReadme.path
    })
  }

  const canConformScaffold =
    Boolean(declared) &&
    physicalDirectory(join(root, '+')) &&
    (!existsSync(batchDirectory) || physicalDirectory(batchDirectory)) &&
    (!existsSync(readmePath) || physicalFile(readmePath))
  let scaffoldRequested = false
  const context: ChangeManagementRubricContext = {
    selection: { outcomes },
    scaffold: {
      outcomes: scaffoldOutcomes,
      ...(mode === 'conform' && canConformScaffold ? { ensureScaffold: () => (scaffoldRequested = true) } : {})
    }
  }
  return {
    subjects: [{ families: ['SELECT', 'SCAFFOLD'], context: () => context }],
    proposal: () => {
      const writes: ConformWrite[] = []
      if (scaffoldRequested && (!physicalFile(readmePath) || readFileSync(readmePath, 'utf8') !== batchReadme.content))
        writes.push({
          path: batchReadme.path,
          content: batchReadme.content,
          ...(!existsSync(readmePath) ? { create: true } : {})
        })
      return { writes }
    }
  }
}
