import { describe, expect, test } from 'bun:test'
import definition from './index.ts'

describe('ki-kb-live-artifacts rubric catalogue', () => {
  test('exports one complete ordered definition', () => {
    expect(definition.contract).toBe(1)
    expect(definition.name).toBe('ki-kb-live-artifacts')
    expect(definition.families.map((family) => family.code)).toEqual(['LA', 'LA-F'])
    const codes = definition.families.flatMap((family) => family.items.map((item) => item.code))
    expect(codes).toHaveLength(11)
    expect(new Set(codes).size).toBe(codes.length)
  })

  test('the catalogue entrypoint exposes only the default definition', async () => {
    expect(Object.keys(await import('./index.ts'))).toEqual(['default'])
  })
})
