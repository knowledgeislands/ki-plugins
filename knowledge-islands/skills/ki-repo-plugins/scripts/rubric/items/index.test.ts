import { describe, expect, test } from 'bun:test'
import definition from './index.ts'

describe('ki-repo-plugins rubric catalogue', () => {
  test('exports the complete plugin projection family', () => {
    expect(definition.contract).toBe(1)
    expect(definition.name).toBe('ki-repo-plugins')
    expect(definition.families.map((family) => family.code)).toEqual(['PLUG', 'RUBRIC'])
    const codes = definition.families.flatMap((family) => family.items.map((item) => item.code))
    expect(codes).toHaveLength(17)
    expect(new Set(codes).size).toBe(codes.length)
  })

  test('every criterion declares strict v1 remediation or review evidence', () => {
    const families = definition.families as unknown as readonly {
      items: readonly {
        mechanical?: { remediation: { class: string }; conform?: unknown }
        judgment?: { scope: string; outcomes: readonly string[]; guidance: string }
      }[]
    }[]
    const items = families.flatMap((family) => family.items)
    for (const item of items) {
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

  test('the catalogue and family modules expose narrow public surfaces', async () => {
    expect(Object.keys(await import('./index.ts'))).toEqual(['default'])
    expect(Object.keys(await import('./plugins.ts'))).toEqual(['PLUG'])
    expect(Object.keys(await import('./publication.ts'))).toEqual(['RUBRIC'])
  })
})
