import { afterEach, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { RubricFamily } from '../../shared/rubric.ts'
import { type BindingRubricContext, createBindingSession } from '../contexts/binding.ts'
import catalogue from './index.ts'

const temporaryDirectories: string[] = []
const originalMcpSource = process.env.KI_MCP_SOURCE
const originalMcporterConfig = process.env.MCPORTER_CONFIG
const originalXdgConfigHome = process.env.XDG_CONFIG_HOME

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true })
  if (originalMcpSource === undefined) delete process.env.KI_MCP_SOURCE
  else process.env.KI_MCP_SOURCE = originalMcpSource
  if (originalMcporterConfig === undefined) delete process.env.MCPORTER_CONFIG
  else process.env.MCPORTER_CONFIG = originalMcporterConfig
  if (originalXdgConfigHome === undefined) delete process.env.XDG_CONFIG_HOME
  else process.env.XDG_CONFIG_HOME = originalXdgConfigHome
})
test('the portable catalogue publishes the host-owned rubric criterion', () => {
  expect(catalogue.name).toBe('ki-binding')
  expect(catalogue.families.map((family) => family.code)).toEqual(['BIND', 'RUBRIC'])
  expect(catalogue.families[0]?.items.map((item) => item.code)).toEqual(['BIND-1', 'BIND-2', 'BIND-J1'])
  expect(catalogue.families[1]?.items.map((item) => item.code)).toEqual(['RUBRIC-1'])
})

test('criteria declare complete v1 remediation and review metadata', () => {
  const bind = catalogue.families[0]
  const publication = catalogue.families[1]
  const mechanicalItems = [...(bind?.items ?? []), ...(publication?.items ?? [])].filter((item) => item.mechanical)
  const judgment = bind?.items.find((item) => item.code === 'BIND-J1')?.judgment

  expect(mechanicalItems).toHaveLength(3)
  expect(mechanicalItems.every((item) => item.mechanical?.remediation)).toBe(true)
  expect(judgment?.scope).not.toBeEmpty()
  expect(judgment?.outcomes.length).toBeGreaterThan(0)
  expect(judgment?.guidance).not.toBeEmpty()
})
test('the session compares a selected mcporter target against canonical definitions', () => {
  const repository = mkdtempSync(join(tmpdir(), 'ki-binding-repository-'))
  const userHome = mkdtempSync(join(tmpdir(), 'ki-binding-home-'))
  temporaryDirectories.push(repository, userHome)
  mkdirSync(join(userHome, '.config', 'ki'), { recursive: true })
  writeFileSync(
    join(userHome, '.config', 'ki', 'mcp-servers.yaml'),
    'mcpServers:\n  - name: ki-example\n    clients: [mcporter]\n    command: node\n'
  )
  const target = join(userHome, 'mcporter.json')
  writeFileSync(target, '{"mcpServers":{"ki-example":{"command":"node","args":[]}}}\n')
  delete process.env.KI_MCP_SOURCE
  process.env.MCPORTER_CONFIG = target
  process.env.XDG_CONFIG_HOME = join(userHome, '.config')
  const context = createBindingSession({
    mode: 'audit',
    repository,
    userHome,
    configuration: {}
  }).subjects[0]?.context() as BindingRubricContext
  expect(context.mcporter).toMatchObject({ kind: 'valid', path: target })
  const family = catalogue.families[0] as RubricFamily<BindingRubricContext, BindingRubricContext>
  expect(family.items[0]?.mechanical?.audit.run(context)[0]?.status).toBe('PASS')
})

test('the session honours an explicit MCP source override', () => {
  const repository = mkdtempSync(join(tmpdir(), 'ki-binding-repository-'))
  const userHome = mkdtempSync(join(tmpdir(), 'ki-binding-home-'))
  temporaryDirectories.push(repository, userHome)
  const source = join(userHome, 'mcp-servers.yaml')
  writeFileSync(source, 'mcpServers:\n  - name: ki-example\n    clients: [mcporter]\n    command: node\n')
  process.env.KI_MCP_SOURCE = source

  const context = createBindingSession({
    mode: 'audit',
    repository,
    userHome,
    configuration: {}
  }).subjects[0]?.context() as BindingRubricContext

  expect(context.source).toBe(source)
  expect(context.sourceState).toMatchObject({ kind: 'valid' })
})
test('the closed schema rejects unsupported fields and missing URL client transport', () => {
  const repository = mkdtempSync(join(tmpdir(), 'ki-binding-repository-'))
  const userHome = mkdtempSync(join(tmpdir(), 'ki-binding-home-'))
  temporaryDirectories.push(repository, userHome)
  const source = join(userHome, 'mcp-servers.yaml')
  process.env.KI_MCP_SOURCE = source
  writeFileSync(
    source,
    'mcpServers:\n  - name: ki-url\n    clients: [chatgpt-codex]\n    url: https://example.invalid/mcp\n'
  )
  let context = createBindingSession({
    mode: 'audit',
    repository,
    userHome,
    configuration: {}
  }).subjects[0]?.context() as BindingRubricContext
  expect(context.sourceState).toMatchObject({ kind: 'invalid', message: expect.stringContaining('transport') })
  writeFileSync(
    source,
    'mcpServers:\n  - name: ki-stdio\n    clients: [mcporter]\n    command: node\n    headers: {}\n'
  )
  context = createBindingSession({
    mode: 'audit',
    repository,
    userHome,
    configuration: {}
  }).subjects[0]?.context() as BindingRubricContext
  expect(context.sourceState).toMatchObject({ kind: 'invalid', message: expect.stringContaining('unsupported field') })
})
test('missing selected targets stay unavailable and wrong definitions violate', () => {
  const repository = mkdtempSync(join(tmpdir(), 'ki-binding-repository-'))
  const userHome = mkdtempSync(join(tmpdir(), 'ki-binding-home-'))
  temporaryDirectories.push(repository, userHome)
  const source = join(userHome, 'mcp-servers.yaml')
  process.env.KI_MCP_SOURCE = source
  writeFileSync(source, 'mcpServers:\n  - name: ki-example\n    clients: [mcporter]\n    command: node\n')
  delete process.env.MCPORTER_CONFIG
  const family = catalogue.families[0] as RubricFamily<BindingRubricContext, BindingRubricContext>
  let context = createBindingSession({
    mode: 'audit',
    repository,
    userHome,
    configuration: {}
  }).subjects[0]?.context() as BindingRubricContext
  expect(family.items[0]?.mechanical?.audit.run(context)[0]?.status).toBe('INFO')
  const target = join(userHome, 'mcporter.json')
  writeFileSync(target, '{"mcpServers":{"ki-example":{"command":"bun"}}}\n')
  process.env.MCPORTER_CONFIG = target
  context = createBindingSession({
    mode: 'audit',
    repository,
    userHome,
    configuration: {}
  }).subjects[0]?.context() as BindingRubricContext
  expect(family.items[0]?.mechanical?.audit.run(context)[0]?.status).toBe('VIOLATION')
})
test('family modules export only one complete family', async () => {
  for (const file of readdirSync(import.meta.dir).filter(
    (file) => file.endsWith('.ts') && file !== 'index.ts' && !file.endsWith('.test.ts')
  )) {
    const module = (await import(`./${file}`)) as Record<string, unknown>
    expect(Object.keys(module)).toHaveLength(1)
  }
})
