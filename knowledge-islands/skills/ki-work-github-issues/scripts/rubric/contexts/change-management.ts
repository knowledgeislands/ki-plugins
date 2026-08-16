import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { AuditOutcome, RubricContextOptions, RubricSession } from '../../shared/rubric.ts'
import type { GitHubIssuesRubricContext } from '../types.ts'

const TABLE = 'ki-work-github-issues'
const REPOSITORY = /^[^/\s]+\/[^/\s]+$/
const TOML = (globalThis as unknown as { Bun: { TOML: { parse(text: string): unknown } } }).Bun.TOML

export const createGitHubIssuesSession = ({
  repository
}: RubricContextOptions): RubricSession<GitHubIssuesRubricContext> => {
  const config = join(repository, '.ki-config.toml')
  let outcomes: AuditOutcome[]
  let mapping: AuditOutcome[]
  if (!existsSync(config))
    outcomes = [
      { status: 'NOT_APPLICABLE', message: 'No KI repository configuration is present.', subject: '.ki-config.toml' }
    ]
  if (!existsSync(config))
    mapping = [
      { status: 'NOT_APPLICABLE', message: 'No KI repository configuration is present.', subject: '.ki-config.toml' }
    ]
  else {
    try {
      const parsed = TOML.parse(readFileSync(config, 'utf8')) as { skills?: Record<string, unknown> }
      const table = parsed.skills?.[TABLE]
      const selected = parsed.skills?.['ki-work'] as Record<string, unknown> | undefined
      const values =
        table && typeof table === 'object' && !Array.isArray(table) ? (table as Record<string, unknown>) : undefined
      const unknown = values
        ? Object.keys(values).filter(
            (key) => !['repository', 'metadata_owner', 'dependencies', 'hierarchy', 'lifecycle'].includes(key)
          )
        : []
      const lifecycle = values?.lifecycle
      const lifecycleValues =
        lifecycle && typeof lifecycle === 'object' && !Array.isArray(lifecycle)
          ? (lifecycle as Record<string, unknown>)
          : undefined
      const requiredLifecycle = ['queue', 'ready', 'review', 'done']
      const missingLifecycle = requiredLifecycle.filter(
        (key) => typeof lifecycleValues?.[key] !== 'string' || !String(lifecycleValues?.[key]).trim()
      )
      const directUnknown = unknown
      const lifecycleUnknown = lifecycleValues
        ? Object.keys(lifecycleValues).filter((key) => !requiredLifecycle.includes(key))
        : []
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
                message: '[skills.ki-work-github-issues].repository must be owner/repository.',
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
      mapping = [
        ...(typeof values?.metadata_owner === 'string' && values.metadata_owner.trim()
          ? [
              {
                status: 'PASS' as const,
                message: `GitHub lifecycle conflict owner is ${values.metadata_owner}.`,
                subject: '.ki-config.toml'
              }
            ]
          : [
              {
                status: 'VIOLATION' as const,
                message: 'GitHub configuration requires a non-empty metadata_owner.',
                subject: '.ki-config.toml'
              }
            ]),
        ...(typeof values?.dependencies === 'string' &&
        values.dependencies.trim() &&
        typeof values?.hierarchy === 'string' &&
        values.hierarchy.trim() &&
        values.dependencies !== values.hierarchy
          ? [
              {
                status: 'PASS' as const,
                message: 'GitHub dependency and hierarchy mappings are distinct.',
                subject: '.ki-config.toml'
              }
            ]
          : [
              {
                status: 'VIOLATION' as const,
                message: 'GitHub configuration requires distinct non-empty dependencies and hierarchy mappings.',
                subject: '.ki-config.toml'
              }
            ]),
        ...(missingLifecycle.length
          ? [
              {
                status: 'VIOLATION' as const,
                message: `GitHub lifecycle mapping requires non-empty values for: ${missingLifecycle.join(', ')}.`,
                subject: '.ki-config.toml'
              }
            ]
          : [
              {
                status: 'PASS' as const,
                message: 'GitHub lifecycle mapping declares queue, ready, review, and done.',
                subject: '.ki-config.toml'
              }
            ]),
        ...(directUnknown.length || lifecycleUnknown.length
          ? [
              {
                status: 'VIOLATION' as const,
                message: `Unrecognised GitHub lifecycle configuration key: ${[...directUnknown, ...lifecycleUnknown].join(', ')}.`,
                subject: '.ki-config.toml'
              }
            ]
          : [])
      ]
    } catch {
      outcomes = [{ status: 'VIOLATION', message: 'Cannot parse .ki-config.toml.', subject: '.ki-config.toml' }]
      mapping = [{ status: 'VIOLATION', message: 'Cannot parse .ki-config.toml.', subject: '.ki-config.toml' }]
    }
  }
  return {
    subjects: [
      { families: ['SELECT', 'MAP'], context: () => ({ selection: { outcomes }, mapping: { outcomes: mapping } }) }
    ],
    proposal: () => ({ writes: [] })
  }
}
