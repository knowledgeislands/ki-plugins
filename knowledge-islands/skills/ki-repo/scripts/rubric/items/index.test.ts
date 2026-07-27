import { describe, expect, test } from 'bun:test'
import definition from './index.ts'

describe('ki-repo rubric catalogue', () => {
  test('exports one complete ordered definition', () => {
    expect(definition.contract).toBe(1)
    expect(definition.name).toBe('ki-repo')
    expect(definition.families.map((family) => family.code)).toEqual([
      'FILES',
      'GH',
      'PKG',
      'MERGE',
      'TOGGLE',
      'VIS',
      'TOPICS',
      'BP',
      'DEP',
      'SEC',
      'ACT',
      'CHECKS',
      'COV',
      'STRUCT',
      'ACCESS',
      'RUNTIMES',
      'DESCFIT',
      'OVR',
      'SYNC',
      'WORK'
    ])
    const codes = definition.families.flatMap((family) => family.items.map((item) => item.code))
    expect(new Set(codes).size).toBe(codes.length)
  })

  test('the catalogue entrypoint exposes only the default definition', async () => {
    expect(Object.keys(await import('./index.ts'))).toEqual(['default'])
  })
})
