import { expect, test } from 'bun:test'
import { readdirSync } from 'node:fs'
import type { RubricItem } from '../../shared/rubric.ts'
import catalogue from './index.ts'

const items = catalogue.families.flatMap((family) => family.items as readonly RubricItem<unknown>[])
const familyModules = readdirSync(import.meta.dir)
  .filter((file) => file.endsWith('.ts') && file !== 'index.ts' && !file.endsWith('.test.ts'))
  .sort()

test('the catalogue preserves every ordered ki-tools criterion', () => {
  expect(catalogue.contract).toBe(1)
  expect(catalogue.name).toBe('ki-tools')
  expect(catalogue.createSession).toBeFunction()
  expect(catalogue.families.map((family) => family.code)).toEqual(['TOOL', 'SHELL', 'LANG', 'CONFIG'])
  expect(items.map((item) => item.code)).toEqual([
    'TOOL-BIN',
    'TOOL-EXEC',
    'TOOL-SCOPE',
    'TOOL-XDG',
    'TOOL-INSTALL',
    'TOOL-INSTALL-QUALITY',
    'TOOL-VERSION',
    'TOOL-VERSION-SOURCE',
    'TOOL-CHANGELOG',
    'TOOL-CHANGELOG-FORMAT',
    'TOOL-CI',
    'TOOL-TAP',
    'TOOL-TESTS',
    'TOOL-ENGINEERING',
    'TOOL-LANGUAGE',
    'TOOL-RELEASE-CHECK',
    'SHELL-LINT',
    'SHELL-TEST',
    'LANG-DEFER',
    'CONFIG-1'
  ])
  expect(new Set(items.map((item) => item.code)).size).toBe(items.length)
  expect(Object.fromEntries(items.filter((item) => item.mechanical).map((item) => [item.code, item.mechanical?.level]))).toEqual({
    'TOOL-BIN': 'FAIL',
    'TOOL-EXEC': 'FAIL',
    'TOOL-INSTALL': 'WARN',
    'TOOL-VERSION': 'WARN',
    'TOOL-CHANGELOG': 'WARN',
    'TOOL-CI': 'WARN',
    'TOOL-TESTS': 'WARN',
    'SHELL-LINT': 'WARN',
    'SHELL-TEST': 'WARN',
    'LANG-DEFER': 'WARN',
    'CONFIG-1': 'WARN'
  })
  expect(items.filter((item) => item.judgment)).toHaveLength(9)
})

test('the catalogue and family modules expose only the final public surfaces', async () => {
  const entrypoint = (await import('./index.ts')) as Record<string, unknown>
  expect(Object.keys(entrypoint)).toEqual(['default'])
  expect(familyModules).toHaveLength(4)
  for (const file of familyModules) {
    const module = (await import(`./${file}`)) as Record<string, unknown>
    expect(Object.keys(module)).toHaveLength(1)
    const family = Object.values(module)[0] as { code?: unknown; items?: unknown }
    expect(typeof family.code).toBe('string')
    expect(Array.isArray(family.items)).toBe(true)
  }
})
