import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { AuditOutcome, RubricContextOptions, RubricSession } from '../../shared/rubric.ts'
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
const TOML = (globalThis as unknown as { Bun: { TOML: { parse(text: string): unknown } } }).Bun.TOML

const tableAt = (skills: Record<string, unknown> | undefined, name: string): Record<string, unknown> | undefined => {
  const table = skills?.[name]
  return typeof table === 'object' && table !== null && !Array.isArray(table)
    ? (table as Record<string, unknown>)
    : undefined
}

const isAdapter = (value: unknown): value is Adapter => typeof value === 'string' && value in ADAPTERS

export const createChangeManagementSession = ({
  repository
}: RubricContextOptions): RubricSession<ChangeManagementRubricContext> => {
  const config = join(repository, '.ki-config.toml')
  let outcomes: AuditOutcome[]
  if (!existsSync(config))
    outcomes = [
      { status: 'NOT_APPLICABLE', message: 'No KI repository configuration is present.', subject: '.ki-config.toml' }
    ]
  else {
    try {
      const parsed = TOML.parse(readFileSync(config, 'utf8')) as { skills?: Record<string, unknown> }
      const skills = parsed.skills
      const table = tableAt(skills, TABLE)
      if (!table)
        outcomes = [
          {
            status: 'VIOLATION',
            message: '[skills.ki-work] must select one adapter.',
            subject: '.ki-config.toml'
          }
        ]
      else {
        const unknown = Object.keys(table).filter((key) => key !== 'adapter')
        const adapter = table.adapter
        const definition = isAdapter(adapter) ? ADAPTERS[adapter] : undefined
        const repo = tableAt(skills, 'ki-repo')
        const repoType = repo?.repo_type === 'kb' ? 'kb' : 'repository'
        const violations: AuditOutcome[] = [
          ...(unknown.length
            ? [
                {
                  status: 'VIOLATION' as const,
                  message: `Unrecognised change-management configuration key: ${unknown.join(', ')}.`,
                  subject: '.ki-config.toml'
                }
              ]
            : []),
          ...(definition
            ? []
            : [
                {
                  status: 'VIOLATION' as const,
                  message: 'adapter must be one of: roadmap, kb-streams, github-issues, linear.',
                  subject: '.ki-config.toml'
                }
              ]),
          ...(definition && !tableAt(skills, definition.skill)
            ? [
                {
                  status: 'VIOLATION' as const,
                  message: `Selected ${adapter} adapter requires a declared [skills.${definition.skill}] table.`,
                  subject: '.ki-config.toml'
                }
              ]
            : []),
          ...(definition?.repositoryKind && repoType !== definition.repositoryKind
            ? [
                {
                  status: 'VIOLATION' as const,
                  message: `Selected ${adapter} adapter applies only to a ${definition.repositoryKind} repository, not ${repoType}.`,
                  subject: '.ki-config.toml'
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
                  subject: '.ki-config.toml'
                }
              ]
      }
    } catch {
      outcomes = [{ status: 'VIOLATION', message: 'Cannot parse .ki-config.toml.', subject: '.ki-config.toml' }]
    }
  }
  const context: ChangeManagementRubricContext = { selection: { outcomes } }
  return { subjects: [{ families: ['SELECT'], context: () => context }], proposal: () => ({ writes: [] }) }
}
