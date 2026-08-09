import { expect, test } from 'bun:test'
import definition from './index.ts'

const expectedFamilies = ['RUBRIC', 'TAP', 'CONFIG']
const expectedItems = [
  'TAP-1',
  'TAP-2',
  'TAP-3',
  'TAP-4',
  'TAP-5',
  'TAP-6',
  'TAP-7',
  'TAP-J1',
  'TAP-J2',
  'TAP-J3',
  'TAP-J4',
  'TAP-J5',
  'TAP-J6',
  'CONFIG-1'
]

test('the catalogue exposes every ordered Homebrew-tap family and criterion', () => {
  expect(definition.contract).toBe(1)
  expect(definition.name).toBe('ki-repo-homebrew-tap')
  expect(definition.createSession).toBeFunction()
  expect(definition.families.map((family) => family.code)).toEqual(expectedFamilies)
  expect(
    definition.families
      .filter((family) => family.code !== 'RUBRIC')
      .flatMap((family) => family.items.map((item) => item.code))
  ).toEqual(expectedItems)
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

test('the catalogue and family modules keep their public surfaces narrow', async () => {
  expect(Object.keys(await import('./index.ts'))).toEqual(['default'])
  for (const file of ['tap', 'config']) {
    const module = (await import(`./${file}.ts`)) as Record<string, unknown>
    expect(Object.keys(module)).toHaveLength(1)
    const family = Object.values(module)[0] as { code?: unknown; items?: unknown }
    expect(typeof family.code).toBe('string')
    expect(Array.isArray(family.items)).toBe(true)
  }
})
