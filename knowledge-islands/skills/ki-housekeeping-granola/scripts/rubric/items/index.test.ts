import { describe, expect, test } from 'bun:test'
import definition from './index.ts'

describe('Granola housekeeping catalogue', () => {
  test('owns acquisition routing retirement and publication judgments', () => {
    expect(definition.families.flatMap((family) => family.items.map((item) => item.code))).toEqual([
      'ACQUIRE-1',
      'ACQUIRE-2',
      'ACQUIRE-3',
      'ROUTING-1',
      'ROUTING-2',
      'RETIRE-1',
      'RUBRIC-1'
    ])
  })

  test('keeps provider and retirement policy judgments non-mechanical', () => {
    const policyFamilies = definition.families.filter(({ code }) => code !== 'RUBRIC')
    expect(
      policyFamilies.every((family) => family.items.every((item) => !('mechanical' in item) && 'judgment' in item))
    ).toBe(true)
  })
})
