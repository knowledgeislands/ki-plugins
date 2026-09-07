import { describe, expect, test } from 'bun:test'
import { usesCanonicalCoverageReportsDirectory } from './audit-evidence.ts'

describe('generated report output', () => {
  test('accepts only the flat reports/coverage namespace', () => {
    expect(usesCanonicalCoverageReportsDirectory([], 'reports/coverage')).toBe(true)
    expect(usesCanonicalCoverageReportsDirectory([], './reports/coverage')).toBe(true)
    expect(usesCanonicalCoverageReportsDirectory([], undefined)).toBe(false)
    expect(usesCanonicalCoverageReportsDirectory([], 'coverage')).toBe(false)
  })

  test('accepts only a declared workspace reports/coverage namespace', () => {
    expect(usesCanonicalCoverageReportsDirectory(['site', 'ingress'], 'site/reports/coverage')).toBe(true)
    expect(usesCanonicalCoverageReportsDirectory(['site', 'ingress'], './ingress/reports/coverage')).toBe(true)
    expect(usesCanonicalCoverageReportsDirectory(['site'], 'site/coverage')).toBe(false)
    expect(usesCanonicalCoverageReportsDirectory(['site'], 'reports/coverage')).toBe(false)
  })
})
