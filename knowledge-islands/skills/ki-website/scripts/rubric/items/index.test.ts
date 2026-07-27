import { expect, test } from 'bun:test'
import { readdirSync } from 'node:fs'
import type { RubricItem } from '../../shared/rubric.ts'
import catalogue from './index.ts'

const items = catalogue.families.flatMap((family) => family.items as readonly RubricItem<unknown>[])
const familyModules = readdirSync(import.meta.dir)
  .filter((file) => file.endsWith('.ts') && file !== 'index.ts' && !file.endsWith('.test.ts'))
  .sort()

test('the structured catalogue preserves the complete website rule surface', () => {
  expect(catalogue.contract).toBe(1)
  expect(catalogue.name).toBe('ki-website')
  expect(catalogue.createSession).toBeFunction()
  expect(catalogue.families.map((family) => family.code)).toEqual(['WEB'])
  expect(items.map((item) => item.code)).toEqual(Array.from({ length: 42 }, (_, index) => `WEB-${index + 1}`))
  expect(new Set(items.map((item) => item.code)).size).toBe(items.length)
  expect(items.filter((item) => item.judgment).every((item) => Boolean(item.judgment?.prompt.trim()))).toBe(true)
  expect(items.every((item) => item.sources?.includes('standards-eleventy-site.md'))).toBe(true)
})

test('the sole semantic family module exports one complete family', async () => {
  expect(familyModules).toEqual(['web.ts'])
  const module = (await import('./web.ts')) as Record<string, unknown>
  expect(Object.keys(module)).toEqual(['WEB'])
  const family = module.WEB as { code?: unknown; items?: unknown }
  expect(family.code).toBe('WEB')
  expect(Array.isArray(family.items)).toBe(true)
})

test('the session exposes one stable repository subject for the WEB family', () => {
  const session = catalogue.createSession({
    mode: 'audit',
    repository: import.meta.dir,
    userHome: import.meta.dir,
    configuration: {}
  })
  expect(session.subjects).toHaveLength(1)
  expect(session.subjects[0]?.families).toEqual(['WEB'])
  expect(session.subjects[0]?.context()).toBe(session.subjects[0]?.context())
  expect(session.proposal()).toEqual({ writes: [] })
})
