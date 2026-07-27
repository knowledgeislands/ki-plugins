import { expect, test } from 'bun:test'
import definition from './index.ts'

const expectedFamilies = ['INDEX', 'AREA', 'ID', 'REQ', 'VERIFY', 'BEHAVIOUR', 'AS-BUILT', 'SPLIT', 'DR-LINK', 'AREA-FIT']
const expectedItems = [
  'INDEX-1',
  'INDEX-2',
  'AREA-1',
  'AREA-2',
  'ID-1',
  'ID-2',
  'ID-3',
  'REQ-1',
  'VERIFY-1',
  'VERIFY-2',
  'BEHAVIOUR-1',
  'AS-BUILT-1',
  'SPLIT-1',
  'DR-LINK-1',
  'AREA-FIT-1'
]

test('the catalogue exposes every ordered Feature Definitions family and criterion', () => {
  expect(definition.contract).toBe(1)
  expect(definition.name).toBe('ki-feature-definitions')
  expect(definition.createSession).toBeFunction()
  expect(definition.families.map((family) => family.code)).toEqual(expectedFamilies)
  expect(definition.families.flatMap((family) => family.items.map((item) => item.code))).toEqual(expectedItems)
})

test('the catalogue and family modules keep their public surfaces narrow', async () => {
  expect(Object.keys(await import('./index.ts'))).toEqual(['default'])
  for (const file of [
    'area-fit',
    'area',
    'as-built',
    'behaviour',
    'decision-link',
    'identity',
    'index-family',
    'requirement',
    'split',
    'verification'
  ]) {
    const module = (await import(`./${file}.ts`)) as Record<string, unknown>
    expect(Object.keys(module)).toHaveLength(1)
    const family = Object.values(module)[0] as { code?: unknown; items?: unknown }
    expect(typeof family.code).toBe('string')
    expect(Array.isArray(family.items)).toBe(true)
  }
})
