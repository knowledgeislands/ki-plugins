import { expect, test } from 'bun:test'
import definition from './index.ts'

const expectedFamilies = ['TAP', 'CONFIG']
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
  expect(definition.name).toBe('ki-homebrew-tap')
  expect(definition.createSession).toBeFunction()
  expect(definition.families.map((family) => family.code)).toEqual(expectedFamilies)
  expect(definition.families.flatMap((family) => family.items.map((item) => item.code))).toEqual(expectedItems)
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
