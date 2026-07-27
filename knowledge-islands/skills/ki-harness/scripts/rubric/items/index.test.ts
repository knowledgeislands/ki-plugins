import { afterEach, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { RubricFamily } from '../../shared/rubric.ts'
import type { HarnessConfigContext, HarnessRubricContext } from '../contexts/harness.ts'
import catalogue from './index.ts'

const temporaryDirectories: string[] = []
const familyModules = readdirSync(import.meta.dir)
  .filter((file) => file.endsWith('.ts') && file !== 'index.ts' && !file.endsWith('.test.ts'))
  .sort()

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

const fixture = (): string => {
  const repository = mkdtempSync(join(tmpdir(), 'ki-harness-'))
  temporaryDirectories.push(repository)
  for (const part of ['skills', 'subagents', 'mcp', 'evals', 'hooks']) {
    mkdirSync(join(repository, part))
    writeFileSync(join(repository, part, 'README.md'), `# ${part}\n`)
  }
  writeFileSync(join(repository, 'CLAUDE.md'), '# Harness\n')
  writeFileSync(join(repository, 'ROADMAP.md'), '# Roadmap\n')
  writeFileSync(join(repository, '.ki-config.toml'), '[ki-repo]\n')
  mkdirSync(join(repository, 'skills', 'group', 'example'), { recursive: true })
  writeFileSync(join(repository, 'skills', 'group', 'example', 'SKILL.md'), '---\nname: example\n---\n\n# Example\n')
  return repository
}

const configItem = () => {
  const family = catalogue.families.find((candidate) => candidate.code === 'CONFIG') as
    | RubricFamily<HarnessRubricContext, HarnessConfigContext>
    | undefined
  const item = family?.items.find((candidate) => candidate.code === 'CONFIG-1')
  if (!family || !item) throw new Error('CONFIG-1 is missing')
  return { family, item }
}

test('the catalogue preserves the current compatible-harness criteria', () => {
  expect(catalogue.contract).toBe(1)
  expect(catalogue.name).toBe('ki-harness')
  expect(catalogue.createSession).toBeFunction()
  expect(catalogue.families.map((family) => family.code)).toEqual(['CAP', 'LAY', 'CLAUDE', 'CONFIG', 'SKILLS', 'LONG', 'COLL'])
  const codes = catalogue.families.flatMap((family) => family.items.map((item) => item.code))
  expect(codes).toEqual([
    'CAP-1',
    'LAY-1',
    'LAY-2',
    'LAY-3',
    'LAY-4',
    'LAY-5',
    'CLAUDE-1',
    'CLAUDE-2',
    'CLAUDE-3',
    'CLAUDE-4',
    'CLAUDE-5',
    'CONFIG-1',
    'CONFIG-2',
    'CONFIG-3',
    'SKILLS-1',
    'SKILLS-2',
    'LONG-1',
    'COLL-1'
  ])
  expect(new Set(codes).size).toBe(codes.length)
})

test('each family module exports one complete family', async () => {
  for (const file of familyModules) {
    const module = (await import(`./${file}`)) as Record<string, unknown>
    expect(Object.keys(module)).toHaveLength(1)
    const family = Object.values(module)[0] as { code?: unknown; items?: unknown }
    expect(typeof family.code).toBe('string')
    expect(Array.isArray(family.items)).toBe(true)
  }
})

test('the session discovers grouped skills once and coalesces marker requests', () => {
  const repository = fixture()
  const session = catalogue.createSession({ mode: 'conform', repository, userHome: tmpdir(), configuration: {} })
  const context = session.subjects[0]?.context() as HarnessRubricContext
  expect(session.subjects[0]?.context()).toBe(context)
  expect(context.skills.skills).toEqual([{ path: 'skills/group/example', directory: 'example', declaredName: 'example' }])
  const { family, item } = configItem()
  const config = family.selectContext(context) as HarnessConfigContext
  expect(item.mechanical?.audit.run(config)[0]?.status).toBe('VIOLATION')
  item.mechanical?.conform?.run(config)
  item.mechanical?.conform?.run(config)
  expect(session.proposal().writes).toEqual([
    {
      path: '.ki-config.toml',
      content: '[ki-repo]\n\n[ki-harness]\n'
    }
  ])
})

test('audit is read-only and an existing marker produces no proposal', () => {
  const repository = fixture()
  writeFileSync(join(repository, '.ki-config.toml'), '[ki-repo]\n\n[ki-harness]\n')
  const session = catalogue.createSession({ mode: 'audit', repository, userHome: tmpdir(), configuration: {} })
  const context = session.subjects[0]?.context() as HarnessRubricContext
  expect(context.config.hasHarnessTable).toBe(true)
  expect(context.config.requestHarnessMarker).toBeUndefined()
  expect(session.proposal().writes).toEqual([])
})

test('conform refuses a symlinked or dangling configuration path', () => {
  for (const dangling of [false, true]) {
    const repository = fixture()
    rmSync(join(repository, '.ki-config.toml'))
    const target = join(repository, dangling ? 'missing-config' : 'config-source')
    if (!dangling) writeFileSync(target, '[ki-repo]\n')
    symlinkSync(target, join(repository, '.ki-config.toml'))
    const session = catalogue.createSession({ mode: 'conform', repository, userHome: tmpdir(), configuration: {} })
    const context = session.subjects[0]?.context() as HarnessRubricContext
    expect(context.config.state).toBe('unsafe')
    expect(context.config.requestHarnessMarker).toBeUndefined()
    expect(session.proposal().writes).toEqual([])
  }
})

test('layout inspection does not traverse a symlinked shelf', () => {
  const repository = fixture()
  const external = mkdtempSync(join(tmpdir(), 'ki-harness-external-'))
  temporaryDirectories.push(external)
  writeFileSync(join(external, 'README.md'), '# External\n')
  rmSync(join(repository, 'hooks'), { recursive: true })
  symlinkSync(external, join(repository, 'hooks'))

  const session = catalogue.createSession({ mode: 'audit', repository, userHome: tmpdir(), configuration: {} })
  const context = session.subjects[0]?.context() as HarnessRubricContext
  expect(context.layout.parts.find((part) => part.name === 'hooks')).toEqual({
    name: 'hooks',
    state: 'unsafe',
    readmeState: 'missing'
  })
})
