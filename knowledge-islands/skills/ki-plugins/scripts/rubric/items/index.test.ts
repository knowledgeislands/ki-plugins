import { describe, expect, test } from 'bun:test'
import definition from './index.ts'

describe('ki-plugins rubric catalogue', () => {
  test('exports the complete plugin projection family', () => {
    expect(definition.contract).toBe(1)
    expect(definition.name).toBe('ki-plugins')
    expect(definition.families.map((family) => family.code)).toEqual(['PLUG'])
    const codes = definition.families.flatMap((family) => family.items.map((item) => item.code))
    expect(codes).toHaveLength(16)
    expect(new Set(codes).size).toBe(codes.length)
  })

  test('the catalogue and family modules expose narrow public surfaces', async () => {
    expect(Object.keys(await import('./index.ts'))).toEqual(['default'])
    expect(Object.keys(await import('./plugins.ts'))).toEqual(['PLUG'])
  })
})
