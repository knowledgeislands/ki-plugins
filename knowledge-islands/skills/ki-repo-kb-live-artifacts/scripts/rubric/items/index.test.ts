import { describe, expect, test } from 'bun:test'
import definition from './index.ts'

describe('ki-repo-kb-live-artifacts rubric catalogue', () => {
  test('exports one complete ordered definition', () => {
    expect(definition.contract).toBe(1)
    expect(definition.name).toBe('ki-repo-kb-live-artifacts')
    expect(definition.families.map((family) => family.code)).toEqual(['RUBRIC', 'LA', 'LA-F'])
    const codes = definition.families
      .filter((family) => family.code !== 'RUBRIC')
      .flatMap((family) => family.items.map((item) => item.code))
    expect(codes).toHaveLength(12)
    expect(new Set(codes).size).toBe(codes.length)
  })

  test('every criterion declares strict v1 remediation or review evidence', () => {
    const families = definition.families as unknown as readonly {
      items: readonly {
        mechanical?: { remediation: { class: string }; conform?: unknown }
        judgment?: { scope: string; outcomes: readonly string[]; guidance: string }
      }[]
    }[]
    for (const item of families.flatMap((family) => family.items)) {
      if (item.mechanical) {
        expect(item.mechanical.remediation.class).not.toBe('')
        if (item.mechanical.conform) expect(item.mechanical.remediation.class).toBe('automatic')
      }
      if (item.judgment) {
        expect(item.judgment.scope).not.toBe('')
        expect(item.judgment.outcomes.length).toBeGreaterThan(0)
        expect(item.judgment.guidance).not.toBe('')
      }
    }
  })

  test('the catalogue entrypoint exposes only the default definition', async () => {
    expect(Object.keys(await import('./index.ts'))).toEqual(['default'])
  })
})
