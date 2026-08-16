import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { AuditOutcome, RubricContextOptions, RubricSession } from '../../shared/rubric.ts'
import type { LinearRubricContext } from '../types.ts'

const TABLE = 'ki-work-linear'
const TEAM = /^[A-Z][A-Z0-9_]{1,15}$/
const TOML = (globalThis as unknown as { Bun: { TOML: { parse(text: string): unknown } } }).Bun.TOML

export const createLinearSession = ({ repository }: RubricContextOptions): RubricSession<LinearRubricContext> => {
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
            (key) => !['team', 'metadata_owner', 'dependencies', 'hierarchy', 'lifecycle'].includes(key)
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
                message: '[skills.ki-work-linear].team must be an uppercase team key.',
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
      mapping = [
        ...(typeof values?.metadata_owner === 'string' && values.metadata_owner.trim()
          ? [
              {
                status: 'PASS' as const,
                message: `Linear lifecycle conflict owner is ${values.metadata_owner}.`,
                subject: '.ki-config.toml'
              }
            ]
          : [
              {
                status: 'VIOLATION' as const,
                message: 'Linear configuration requires a non-empty metadata_owner.',
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
                message: 'Linear dependency and hierarchy mappings are distinct.',
                subject: '.ki-config.toml'
              }
            ]
          : [
              {
                status: 'VIOLATION' as const,
                message: 'Linear configuration requires distinct non-empty dependencies and hierarchy mappings.',
                subject: '.ki-config.toml'
              }
            ]),
        ...(missingLifecycle.length
          ? [
              {
                status: 'VIOLATION' as const,
                message: `Linear lifecycle mapping requires non-empty values for: ${missingLifecycle.join(', ')}.`,
                subject: '.ki-config.toml'
              }
            ]
          : [
              {
                status: 'PASS' as const,
                message: 'Linear lifecycle mapping declares queue, ready, review, and done.',
                subject: '.ki-config.toml'
              }
            ]),
        ...(directUnknown.length || lifecycleUnknown.length
          ? [
              {
                status: 'VIOLATION' as const,
                message: `Unrecognised Linear lifecycle configuration key: ${[...directUnknown, ...lifecycleUnknown].join(', ')}.`,
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
