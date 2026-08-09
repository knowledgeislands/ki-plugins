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
})
