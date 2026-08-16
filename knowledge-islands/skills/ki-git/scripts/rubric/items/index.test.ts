import { expect, test } from 'bun:test'
import { readdirSync } from 'node:fs'
import catalogue from './index.ts'

test('the Git catalogue exposes the complete judgment-only session contract', () => {
  expect(catalogue.contract).toBe(1)
  expect(catalogue.name).toBe('ki-git')
  expect(catalogue.createSession).toBeFunction()
  expect(catalogue.families.map((family) => family.code)).toEqual(['RUBRIC', 'COMMIT', 'BRANCH', 'HYGIENE', 'LOCK'])
  expect(
    catalogue.families
      .filter((family) => family.code !== 'RUBRIC')
      .flatMap((family) => family.items.map((item) => item.code))
  ).toEqual(['COMMIT-1', 'BRANCH-1', 'HYGIENE-1', 'LOCK-1'])
  const semanticItems = (
    catalogue.families.filter((family) => family.code !== 'RUBRIC') as unknown as readonly {
      items: readonly { mechanical?: unknown }[]
    }[]
  ).flatMap((family) => family.items)
  expect(semanticItems.every((item) => item.mechanical === undefined)).toBeTrue()
})

test('judgment criteria expose complete v1 review metadata', () => {
  const judgmentItems = (
    catalogue.families.filter((family) => family.code !== 'RUBRIC') as unknown as readonly {
      items: readonly {
        judgment?: { scope: string; prompt: string; outcomes: readonly string[]; guidance: string }
      }[]
    }[]
  ).flatMap((family) => family.items.map((item) => item.judgment))

  expect(judgmentItems).toHaveLength(4)
  for (const judgment of judgmentItems) {
    expect(judgment?.scope).not.toBeEmpty()
    expect(judgment?.prompt).not.toBeEmpty()
    expect(judgment?.outcomes.length).toBeGreaterThan(0)
    expect(judgment?.guidance).not.toBeEmpty()
  }
})

test('judgment prompts name focused evidence without inventing a Git executor', () => {
  const items = (
    catalogue.families.filter((family) => family.code !== 'RUBRIC') as unknown as readonly {
      items: readonly { mechanical?: unknown; judgment?: { scope: string; prompt: string } }[]
    }[]
  ).flatMap((family) => family.items)
  const metadata = items.map((item) => `${item.judgment?.scope}\n${item.judgment?.prompt}`).join('\n')

  expect(metadata).toContain('git diff --cached')
  expect(metadata).toContain('git branch --show-current')
  expect(metadata).toContain('git status --short')
  expect(items.every((item) => item.mechanical === undefined)).toBeTrue()
})

test('family modules expose only one complete family', async () => {
  const files = readdirSync(import.meta.dir)
    .filter((file) => file.endsWith('.ts') && file !== 'index.ts' && !file.endsWith('.test.ts'))
    .sort()

  for (const file of files) {
    const module = (await import(`./${file}`)) as Record<string, unknown>
    expect(Object.keys(module)).toHaveLength(1)
    const family = Object.values(module)[0] as { code?: unknown; items?: unknown }
    expect(typeof family.code).toBe('string')
    expect(Array.isArray(family.items)).toBeTrue()
  }
})
