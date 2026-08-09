import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { AuditOutcome, RubricContextOptions, RubricSession } from '../../shared/rubric.ts'
import type { ChangeManagementRubricContext } from '../types.ts'

const TABLE = 'ki-change-management'
const ADAPTERS = new Set(['roadmap', 'kb-streams', 'github-issues', 'linear'])
const TOML = (globalThis as unknown as { Bun: { TOML: { parse(text: string): unknown } } }).Bun.TOML

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
      const table = parsed.skills?.[TABLE]
      if (!table || typeof table !== 'object' || Array.isArray(table))
        outcomes = [
          {
            status: 'VIOLATION',
            message: '[skills.ki-change-management] must select one adapter.',
            subject: '.ki-config.toml'
          }
        ]
      else {
        const values = table as Record<string, unknown>
        const unknown = Object.keys(values).filter((key) => key !== 'adapter')
        const adapter = values.adapter
        outcomes = [
          ...(unknown.length
            ? [
                {
                  status: 'VIOLATION' as const,
                  message: `Unrecognised change-management configuration key: ${unknown.join(', ')}.`,
                  subject: '.ki-config.toml'
                }
              ]
            : []),
          ...(typeof adapter === 'string' && ADAPTERS.has(adapter)
            ? [
                {
                  status: 'PASS' as const,
                  message: `Change management selects the ${adapter} adapter.`,
                  subject: '.ki-config.toml'
                }
              ]
            : [
                {
                  status: 'VIOLATION' as const,
                  message: 'adapter must be one of: roadmap, kb-streams, github-issues, linear.',
                  subject: '.ki-config.toml'
                }
              ])
        ]
      }
    } catch {
      outcomes = [{ status: 'VIOLATION', message: 'Cannot parse .ki-config.toml.', subject: '.ki-config.toml' }]
    }
  }
  const context: ChangeManagementRubricContext = { selection: { outcomes } }
  return { subjects: [{ families: ['SELECT'], context: () => context }], proposal: () => ({ writes: [] }) }
}
