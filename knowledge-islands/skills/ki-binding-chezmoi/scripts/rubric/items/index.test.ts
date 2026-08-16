import { afterEach, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { RubricFamily } from '../../shared/rubric.ts'
import { type BindingChezMoiContext, createBindingChezMoiSession } from '../contexts/binding-chezmoi.ts'
import catalogue from './index.ts'

const temporaryDirectories: string[] = []
const familyModules = readdirSync(import.meta.dir)
  .filter((file) => file.endsWith('.ts') && file !== 'index.ts' && !file.endsWith('.test.ts'))
  .sort()

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

const fixture = (): string => {
  const repository = mkdtempSync(join(tmpdir(), 'ki-binding-chezmoi-'))
  temporaryDirectories.push(repository)
  mkdirSync(join(repository, '.chezmoidata'), { recursive: true })
  mkdirSync(join(repository, '.chezmoitemplates'), { recursive: true })
  mkdirSync(join(repository, 'dot_config'), { recursive: true })
  writeFileSync(join(repository, '.chezmoidata', 'mcps.yaml'), 'mcpServers: []\n')
  writeFileSync(join(repository, '.chezmoitemplates', 'mcp-servers-json.tmpl'), '{{/* render partial */}}\n')
  writeFileSync(join(repository, 'dot_config', 'surface.json.tmpl'), '{{ template "mcp-servers-json.tmpl" . }}\n')
  return repository
}

test('the catalogue preserves the complete chezmoi binding rubric', () => {
  expect(catalogue.contract).toBe(1)
  expect(catalogue.name).toBe('ki-binding-chezmoi')
  expect(catalogue.createSession).toBeFunction()
  expect(catalogue.families.map((family) => family.code)).toEqual(['BINDCHEZ', 'RUBRIC'])
  expect(catalogue.families[0]?.items.map((item) => item.code)).toEqual([
    'BINDCHEZ-1',
    'BINDCHEZ-2',
    'BINDCHEZ-3',
    'BINDCHEZ-4',
    'BINDCHEZ-5',
    'BINDCHEZ-6',
    'BINDCHEZ-7'
  ])
  expect(catalogue.families[1]?.items.map((item) => item.code)).toEqual(['RUBRIC-1'])
  const families = catalogue.families as unknown as readonly {
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

test('each family module exports one complete family', async () => {
  for (const file of familyModules) {
    const module = (await import(`./${file}`)) as Record<string, unknown>
    expect(Object.keys(module)).toHaveLength(1)
    const family = Object.values(module)[0] as { code?: unknown; items?: unknown }
    expect(typeof family.code).toBe('string')
    expect(Array.isArray(family.items)).toBe(true)
  }
})

test('the session prepares stable render evidence once and remains report-only', () => {
  const repository = fixture()
  const session = createBindingChezMoiSession({ mode: 'conform', repository, userHome: tmpdir(), configuration: {} })
  const context = session.subjects[0]?.context() as BindingChezMoiContext
  expect(session.subjects[0]?.context()).toBe(context)
  expect(context.repositoryState).toBe('physical')
  expect(context.data).toMatchObject([
    { path: '.chezmoidata/mcps.yaml', pattern: 'data-merge', source: { kind: 'valid' } }
  ])
  expect(context.templates).toEqual(['.chezmoitemplates/mcp-servers-json.tmpl'])
  expect(context.wiredTargets).toEqual(['dot_config/surface.json.tmpl'])
  expect(session.proposal()).toEqual({ writes: [] })

  const family = catalogue.families[0] as RubricFamily<BindingChezMoiContext, BindingChezMoiContext>
  for (const code of ['BINDCHEZ-1', 'BINDCHEZ-3', 'BINDCHEZ-4', 'BINDCHEZ-5']) {
    const item = family.items.find((candidate) => candidate.code === code)
    expect(item?.mechanical?.audit.run(context)[0]?.status).toBe('PASS')
  }
})

test('the session reports symlinked evidence without traversing it', () => {
  const repository = fixture()
  const outside = mkdtempSync(join(tmpdir(), 'ki-binding-chezmoi-outside-'))
  temporaryDirectories.push(outside)
  writeFileSync(join(outside, 'mcp-servers.yaml'), 'mcpServers: []\n')
  symlinkSync(outside, join(repository, 'linked-mcp-source'))

  const session = createBindingChezMoiSession({ mode: 'audit', repository, userHome: tmpdir(), configuration: {} })
  const context = session.subjects[0]?.context() as BindingChezMoiContext
  expect(context.unsafePaths).toEqual(['linked-mcp-source'])
  expect(context.data.some(({ path }) => path.startsWith('linked-mcp-source/'))).toBe(false)
  const family = catalogue.families[0] as RubricFamily<BindingChezMoiContext, BindingChezMoiContext>
  const outcome = family.items.find((item) => item.code === 'BINDCHEZ-1')?.mechanical?.audit.run(context)[0]
  expect(outcome?.status).toBe('VIOLATION')
})

test('comment-only or ambiguous template references do not count as wiring', () => {
  const repository = fixture()
  writeFileSync(join(repository, 'dot_config', 'surface.json.tmpl'), '{{/* template "mcp-servers-json.tmpl" . */}}\n')
  const context = createBindingChezMoiSession({
    mode: 'audit',
    repository,
    userHome: tmpdir(),
    configuration: {}
  }).subjects[0]?.context() as BindingChezMoiContext
  const family = catalogue.families[0] as RubricFamily<BindingChezMoiContext, BindingChezMoiContext>
  expect(context.wiredTargets).toEqual([])
  expect(family.items.find((item) => item.code === 'BINDCHEZ-5')?.mechanical?.audit.run(context)[0]?.status).toBe(
    'VIOLATION'
  )
})

test('malformed renderer data cannot pass as source structure', () => {
  const repository = fixture()
  writeFileSync(
    join(repository, '.chezmoidata', 'mcps.yaml'),
    'mcpServers:\n  - name: missing-clients\n    command: node\n'
  )
  const context = createBindingChezMoiSession({
    mode: 'audit',
    repository,
    userHome: tmpdir(),
    configuration: {}
  }).subjects[0]?.context() as BindingChezMoiContext
  const family = catalogue.families[0] as RubricFamily<BindingChezMoiContext, BindingChezMoiContext>
  expect(family.items.find((item) => item.code === 'BINDCHEZ-3')?.mechanical?.audit.run(context)[0]?.status).toBe(
    'VIOLATION'
  )
})
