import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { AuditOutcome, RubricContextOptions, RubricSession } from '../../shared/rubric.ts'
import type { LinearRubricContext } from '../types.ts'

const TABLE = 'ki-change-management-linear'
const TEAM = /^[A-Z][A-Z0-9_]{1,15}$/
const TOML = (globalThis as unknown as { Bun: { TOML: { parse(text: string): unknown } } }).Bun.TOML

export const createLinearSession = ({ repository }: RubricContextOptions): RubricSession<LinearRubricContext> => {
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
      const selected = parsed.skills?.['ki-change-management'] as Record<string, unknown> | undefined
      const values =
        table && typeof table === 'object' && !Array.isArray(table) ? (table as Record<string, unknown>) : undefined
      const unknown = values ? Object.keys(values).filter((key) => key !== 'team') : []
      outcomes = [
        ...(selected?.adapter === 'linear'
          ? []
          : [
              {
                status: 'VIOLATION' as const,
                message: 'The shared selector must choose adapter = "linear".',
                subject: '.ki-config.toml'
              }
            ]),
        ...(typeof values?.team === 'string' && TEAM.test(values.team)
          ? [{ status: 'PASS' as const, message: `Linear team is ${values.team}.`, subject: '.ki-config.toml' }]
          : [
              {
                status: 'VIOLATION' as const,
                message: '[skills.ki-change-management-linear].team must be an uppercase team key.',
                subject: '.ki-config.toml'
              }
            ]),
        ...(unknown.length
          ? [
              {
                status: 'VIOLATION' as const,
                message: `Unrecognised Linear configuration key: ${unknown.join(', ')}.`,
                subject: '.ki-config.toml'
              }
            ]
          : [])
      ]
    } catch {
      outcomes = [{ status: 'VIOLATION', message: 'Cannot parse .ki-config.toml.', subject: '.ki-config.toml' }]
    }
  }
  return {
    subjects: [{ families: ['SELECT'], context: () => ({ selection: { outcomes } }) }],
    proposal: () => ({ writes: [] })
  }
}
