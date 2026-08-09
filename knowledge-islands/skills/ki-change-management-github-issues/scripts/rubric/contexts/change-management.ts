import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { AuditOutcome, RubricContextOptions, RubricSession } from '../../shared/rubric.ts'
import type { GitHubIssuesRubricContext } from '../types.ts'

const TABLE = 'ki-change-management-github-issues'
const REPOSITORY = /^[^/\s]+\/[^/\s]+$/
const TOML = (globalThis as unknown as { Bun: { TOML: { parse(text: string): unknown } } }).Bun.TOML

export const createGitHubIssuesSession = ({
  repository
}: RubricContextOptions): RubricSession<GitHubIssuesRubricContext> => {
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
      const unknown = values ? Object.keys(values).filter((key) => key !== 'repository') : []
      outcomes = [
        ...(selected?.adapter === 'github-issues'
          ? []
          : [
              {
                status: 'VIOLATION' as const,
                message: 'The shared selector must choose adapter = "github-issues".',
                subject: '.ki-config.toml'
              }
            ]),
        ...(typeof values?.repository === 'string' && REPOSITORY.test(values.repository)
          ? [
              {
                status: 'PASS' as const,
                message: `GitHub Issues repository is ${values.repository}.`,
                subject: '.ki-config.toml'
              }
            ]
          : [
              {
                status: 'VIOLATION' as const,
                message: '[skills.ki-change-management-github-issues].repository must be owner/repository.',
                subject: '.ki-config.toml'
              }
            ]),
        ...(unknown.length
          ? [
              {
                status: 'VIOLATION' as const,
                message: `Unrecognised GitHub Issues configuration key: ${unknown.join(', ')}.`,
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
