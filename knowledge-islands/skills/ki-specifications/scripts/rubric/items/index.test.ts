import { afterEach, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { RubricItem } from '../../shared/rubric.ts'
import catalogue from './index.ts'

const temporaryDirectories: string[] = []
const items = catalogue.families.flatMap((family) => family.items as readonly RubricItem<unknown>[])
const familyModules = readdirSync(import.meta.dir)
  .filter((file) => file.endsWith('.ts') && file !== 'index.ts' && !file.endsWith('.test.ts'))
  .sort()

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

test('the structured catalogue preserves the specifications structural floor', () => {
  expect(catalogue.contract).toBe(1)
  expect(catalogue.name).toBe('ki-specifications')
  expect(catalogue.createSession).toBeFunction()
  expect(catalogue.families.map((family) => family.code)).toEqual(['SPEC', 'SYNC'])
  expect(items.map((item) => item.code)).toEqual(['SPEC-1', 'SPEC-2', 'SPEC-3', 'SPEC-J1', 'SPEC-J2', 'SYNC-1'])
  expect(items.every((item) => item.sources.includes('standards-specifications.md'))).toBe(true)
})

test('each family module exports one complete family', async () => {
  expect(familyModules).toEqual(['specifications.ts', 'sync.ts'])
  for (const file of familyModules) {
    const module = (await import(`./${file}`)) as Record<string, unknown>
    expect(Object.keys(module)).toHaveLength(1)
    const family = Object.values(module)[0] as { code?: unknown; items?: unknown }
    expect(typeof family.code).toBe('string')
    expect(Array.isArray(family.items)).toBe(true)
  }
})

test('the session keeps one configuration draft and proposes the marker once', () => {
  const repository = mkdtempSync(join(tmpdir(), 'ki-specifications-'))
  temporaryDirectories.push(repository)
  writeFileSync(join(repository, '.ki-config.toml'), '[ki-repo]\n')
  for (const directory of ['proposals', 'specifications', 'schemas']) mkdirSync(join(repository, directory))

  const session = catalogue.createSession({ mode: 'conform', repository, userHome: tmpdir(), configuration: {} })
  const subject = session.subjects[0]
  const context = subject?.context()
  const marker = items.find((item) => item.code === 'SPEC-1')

  expect(subject?.families).toEqual(['SPEC', 'SYNC'])
  expect(subject?.context()).toBe(context)
  expect(marker?.mechanical?.audit.run(context as never)[0]?.status).toBe('VIOLATION')
  expect(session.proposal()).toEqual({ writes: [] })

  marker?.mechanical?.conform?.run(context as never)
  marker?.mechanical?.conform?.run(context as never)

  expect(session.proposal().writes).toEqual([
    {
      path: '.ki-config.toml',
      content: expect.stringContaining('[ki-specifications]')
    }
  ])
  expect(session.proposal().writes[0]?.content.match(/\[ki-specifications]/g)).toHaveLength(1)
})
