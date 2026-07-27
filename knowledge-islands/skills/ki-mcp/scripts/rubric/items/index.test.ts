import { expect, test } from 'bun:test'
import definition from './index.ts'

const expectedFamilies = ['KI', 'LAY', 'DOC', 'CFG', 'UTIL', 'TEST', 'TOOL', 'PKG', 'SCR', 'CI']
const expectedItems = ['KI-CONFIG', 'LAY-1', 'DOC-1', 'CFG-1', 'UTIL-1', 'TEST-1', 'TOOL-1', 'PKG-1', 'SCR-1', 'CI-1', 'CI-2']

test('the catalogue exposes every ordered MCP family and criterion', () => {
  expect(definition.contract).toBe(1)
  expect(definition.name).toBe('ki-mcp')
  expect(definition.createSession).toBeFunction()
  expect(definition.families.map((family) => family.code)).toEqual(expectedFamilies)
  expect(definition.families.flatMap((family) => family.items.map((item) => item.code))).toEqual(expectedItems)
})

test('the catalogue and family modules keep their public surfaces narrow', async () => {
  expect(Object.keys(await import('./index.ts'))).toEqual(['default'])
  for (const file of [
    'applicability',
    'ci',
    'configuration',
    'documentation',
    'layout',
    'package',
    'scripts',
    'testing',
    'tools',
    'utilities'
  ]) {
    const module = (await import(`./${file}.ts`)) as Record<string, unknown>
    expect(Object.keys(module)).toHaveLength(1)
    const family = Object.values(module)[0] as { code?: unknown; items?: unknown }
    expect(typeof family.code).toBe('string')
    expect(Array.isArray(family.items)).toBe(true)
  }
})
