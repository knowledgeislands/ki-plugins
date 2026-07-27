import { afterEach, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { RubricFamily } from '../../shared/rubric.ts'
import { type BindingRubricContext, createBindingSession } from '../contexts/binding.ts'
import catalogue from './index.ts'

const temporaryDirectories: string[] = []
const familyModules = readdirSync(import.meta.dir)
  .filter((file) => file.endsWith('.ts') && file !== 'index.ts' && !file.endsWith('.test.ts'))
  .sort()

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

const fixture = (): { repository: string; userHome: string; cowork: string } => {
  const repository = mkdtempSync(join(tmpdir(), 'ki-binding-repository-'))
  const userHome = mkdtempSync(join(tmpdir(), 'ki-binding-home-'))
  temporaryDirectories.push(repository, userHome)
  mkdirSync(join(repository, '.ki'), { recursive: true })
  writeFileSync(
    join(repository, '.ki', 'mcps.yaml'),
    `mcpServers:
  - name: ki-example
    clients: [chatgpt-codex]
    command: node
`
  )
  writeFileSync(
    join(repository, '.ki-config.toml'),
    `[ki-repo]
supported_runtimes = ["codex"]

[ki-binding]
`
  )
  mkdirSync(join(repository, '.agents', 'skills', 'ki-binding'), { recursive: true })
  mkdirSync(join(repository, '.agents', 'skills', 'ki-repo'), { recursive: true })
  mkdirSync(join(userHome, '.codex'), { recursive: true })
  writeFileSync(join(userHome, '.codex', 'config.toml'), '[mcp_servers.ki-example]\ncommand = "node"\n')
  const cowork = join(
    userHome,
    'Library',
    'Application Support',
    'Claude',
    'local-agent-mode-sessions',
    'account',
    'workspace',
    'cowork_settings.json'
  )
  mkdirSync(join(cowork, '..'), { recursive: true })
  writeFileSync(cowork, '{"enabledPlugins":{},"extraKnownMarketplaces":{}}\n')
  return { repository, userHome, cowork }
}

test('the catalogue preserves the complete binding rubric', () => {
  expect(catalogue.contract).toBe(1)
  expect(catalogue.name).toBe('ki-binding')
  expect(catalogue.createSession).toBeFunction()
  expect(catalogue.families.map((family) => family.code)).toEqual(['BIND'])
  expect(catalogue.families[0]?.items.map((item) => item.code)).toEqual(['BIND-1', 'BIND-2', 'BIND-3', 'BIND-4', 'BIND-5'])
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

test('the session keeps mixed evidence stable and coalesces Cowork drafts', () => {
  const { repository, userHome } = fixture()
  const session = createBindingSession({ mode: 'conform', repository, userHome, configuration: {} })
  const root = session.subjects[0]?.context() as BindingRubricContext
  expect(session.subjects[0]?.context()).toBe(root)
  expect(root.source).toBe(join(repository, '.ki', 'mcps.yaml'))
  expect(root.surfaces.find(({ surface }) => surface.token === 'chatgpt-codex')?.serverKeys).toEqual(new Set(['ki-example']))
  expect(root.repository.missingSkills).toEqual([])

  const family = catalogue.families[0] as RubricFamily<BindingRubricContext, BindingRubricContext>
  const bind4 = family.items.find((item) => item.code === 'BIND-4')
  expect(bind4?.mechanical?.audit.run(root)[0]?.status).toBe('VIOLATION')
  bind4?.mechanical?.conform?.run(root)
  bind4?.mechanical?.conform?.run(root)

  const writes = session.proposal().writes
  expect(writes).toHaveLength(1)
  expect(writes[0]?.path).toStartWith('Library/Application Support/Claude/local-agent-mode-sessions/')
  const proposed = JSON.parse(writes[0]?.content ?? '{}') as {
    enabledPlugins?: Record<string, boolean>
    extraKnownMarketplaces?: Record<string, unknown>
  }
  expect(proposed.enabledPlugins?.['knowledge-islands@ki-plugins']).toBe(true)
  expect(proposed.extraKnownMarketplaces?.['ki-plugins']).toBeDefined()
})

test('conform refuses a symlinked Cowork settings file', () => {
  const { repository, userHome, cowork } = fixture()
  const target = join(userHome, 'cowork-source.json')
  writeFileSync(target, '{}\n')
  rmSync(cowork)
  symlinkSync(target, cowork)

  const session = createBindingSession({ mode: 'conform', repository, userHome, configuration: {} })
  const root = session.subjects[0]?.context() as BindingRubricContext
  expect(root.cowork.files[0]?.status).toBe('unsafe')
  root.cowork.files[0]?.enable?.()
  expect(session.proposal().writes).toEqual([])
})

test('malformed source entries produce findings instead of crashing the session', () => {
  const { repository, userHome } = fixture()
  writeFileSync(join(repository, '.ki', 'mcps.yaml'), 'mcpServers: [null, {clients: wrong-shape}]\n')
  const session = createBindingSession({ mode: 'audit', repository, userHome, configuration: {} })
  const root = session.subjects[0]?.context() as BindingRubricContext
  const family = catalogue.families[0] as RubricFamily<BindingRubricContext, BindingRubricContext>
  const bind2 = family.items.find((item) => item.code === 'BIND-2')
  const outcomes = bind2?.mechanical?.audit.run(root) ?? []
  expect(outcomes.some((outcome) => outcome.status === 'VIOLATION')).toBe(true)
})
