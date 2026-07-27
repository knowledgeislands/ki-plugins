import { describe, expect, test } from 'bun:test'
import { readdirSync } from 'node:fs'
import catalogue from './index.ts'

const familyModules = readdirSync(import.meta.dir)
  .filter((file) => file.endsWith('.ts') && file !== 'index.ts' && !file.endsWith('.test.ts'))
  .sort()

describe('ki-skills rubric catalogue', () => {
  test('default-exports the complete session contract with unique ordered criteria', () => {
    expect(catalogue.contract).toBe(1)
    expect(catalogue.name).toBe('ki-skills')
    expect(catalogue.createSession).toBeFunction()

    const familyCodes = catalogue.families.map(({ code }) => code)
    const itemCodes = catalogue.families.flatMap(({ items }) => items.map(({ code }) => code))
    expect(new Set(familyCodes).size).toBe(familyCodes.length)
    expect(new Set(itemCodes).size).toBe(itemCodes.length)

    for (const family of catalogue.families) {
      expect(family.items.length).toBeGreaterThan(0)
      for (const item of family.items) {
        expect(item.code.startsWith(`${family.code}-`)).toBeTrue()
        expect(item.sources.length).toBeGreaterThan(0)
        expect(Boolean(item.mechanical || item.judgment)).toBeTrue()
      }
    }
  })

  test('keeps every family module public surface to one complete family', async () => {
    for (const file of familyModules) {
      const module = (await import(`./${file}`)) as Record<string, unknown>
      expect(Object.keys(module)).toHaveLength(1)
      const family = Object.values(module)[0] as { code?: unknown; items?: unknown }
      expect(typeof family.code).toBe('string')
      expect(Array.isArray(family.items)).toBeTrue()
    }
  })
})
