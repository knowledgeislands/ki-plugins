import type {
  AuditOutcome,
  RubricContextOptions,
  RubricPublicationContext,
  RubricSession
} from '../../shared/rubric.ts'

const outcome = (status: AuditOutcome['status'], message: string, level?: 'FAIL' | 'WARN'): AuditOutcome =>
  status === 'VIOLATION' ? { status, message, ...(level ? { level } : {}) } : { status, message }

const one = (value: AuditOutcome): readonly AuditOutcome[] => [value]
const object = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined

const MODEL_TYPES = new Set(['frontier', 'reasoning', 'standard', 'fast'])
const BUDGETS = new Set(['instructions', 'memory_index', 'skills_surface', 'mcp_servers', 'total'])

export type TokenomicsConfigContext = {
  readonly validates: readonly AuditOutcome[]
  readonly budgetPolicy: readonly AuditOutcome[]
  readonly modelPurpose: readonly AuditOutcome[]
  readonly routing: readonly AuditOutcome[]
}

export type TokenomicsRubricContext = {
  readonly rubric: RubricPublicationContext
  readonly config: TokenomicsConfigContext
}

export const createTokenomicsSession = ({
  configuration,
  publication
}: RubricContextOptions): RubricSession<TokenomicsRubricContext> => {
  const table = object(configuration)
  const unknown = Object.keys(table ?? {}).filter(
    (key) =>
      !['headroom', 'context_window_tokens', 'preferred_model_type', 'budgets', 'model_tier_bindings'].includes(key)
  )
  const invalid: string[] = []
  if (table?.headroom !== undefined && !['required', 'recommended', 'off'].includes(String(table.headroom)))
    invalid.push('headroom')
  if (
    table?.context_window_tokens !== undefined &&
    (!Number.isInteger(table.context_window_tokens) || Number(table.context_window_tokens) <= 0)
  )
    invalid.push('context_window_tokens')
  if (table?.preferred_model_type !== undefined && !MODEL_TYPES.has(String(table.preferred_model_type)))
    invalid.push('preferred_model_type')
  for (const [key, value] of Object.entries(object(table?.budgets) ?? {}))
    if (!BUDGETS.has(key) || typeof value !== 'number' || value <= 0) invalid.push(`budgets.${key}`)
  for (const [key, value] of Object.entries(object(table?.model_tier_bindings) ?? {}))
    if (!MODEL_TYPES.has(key) || typeof value !== 'string' || !value.trim()) invalid.push(`model_tier_bindings.${key}`)
  const context: TokenomicsRubricContext = {
    rubric: { publication },
    config: {
      validates: invalid.length
        ? one(outcome('VIOLATION', `Malformed [skills.ki-tokenomics] value(s): ${invalid.join(', ')}`, 'FAIL'))
        : unknown.length
          ? one(outcome('VIOLATION', `Unknown [skills.ki-tokenomics] key(s): ${unknown.join(', ')}`, 'WARN'))
          : one(outcome('PASS', 'Selected repository [skills.ki-tokenomics] configuration validates down.')),
      budgetPolicy: one(outcome('PASS', 'Budget overages are guide-rail WARNs; they never become FAIL findings.')),
      modelPurpose: one(outcome('PASS', 'Portable model purposes are frontier, reasoning, standard, and fast.')),
      routing: one(
        outcome('PASS', 'Standing-surface findings route to their artifact owner and selected runtime adapter.')
      )
    }
  }
  return {
    subjects: [
      {
        families: ['CFG', 'POL'],
        subject: '[skills.ki-tokenomics]',
        context: () => context
      },
      { families: ['RUBRIC'], subject: '[skills.ki-tokenomics]', context: () => context }
    ],
    proposal: () => ({ writes: [] })
  }
}
