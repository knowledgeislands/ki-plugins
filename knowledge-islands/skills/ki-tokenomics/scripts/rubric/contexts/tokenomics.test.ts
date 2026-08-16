import { describe, expect, test } from 'bun:test'
import type { RubricContextOptions } from '../../shared/rubric.ts'
import { createTokenomicsSession } from './tokenomics.ts'

const options = (configuration: Record<string, unknown>): RubricContextOptions => ({
  mode: 'audit',
  repository: '/selected',
  userHome: '/home',
  configuration
})
const context = (configuration: Record<string, unknown>) =>
  createTokenomicsSession(options(configuration)).subjects[0]?.context().config

describe('portable tokenomics session', () => {
  test('validates known configuration without reading a runtime surface', () => {
    expect(context({ preferred_model_type: 'standard', budgets: { total: 30000 } })?.validates[0]?.status).toBe('PASS')
  })
  test('fails malformed values and warns on unknown keys', () => {
    expect(context({ preferred_model_type: 'vendor-model' })?.validates[0]?.level).toBe('FAIL')
    expect(context({ extension: true })?.validates[0]?.level).toBe('WARN')
  })
  test('fails closed for malformed nested tables and does not claim observations', () => {
    const value = context({ budgets: ['not-a-table'], model_tier_bindings: 'not-a-table' })
    expect(value?.validates[0]?.status).toBe('VIOLATION')
    expect(value?.validates[0]?.message).toContain('budgets')
    expect(value?.budgetPolicy[0]?.status).toBe('INFO')
    expect(value?.modelPurpose[0]?.message).toContain('no effective model was observed')
  })
})
