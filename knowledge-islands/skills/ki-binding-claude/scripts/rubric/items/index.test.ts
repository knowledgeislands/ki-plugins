import { afterEach, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { ServerEntry } from '../../shared/binding.ts'
import type { RubricFamily } from '../../shared/rubric.ts'
import { type ClaudeBindingContext, createClaudeBindingSession, targetMatches } from '../contexts/claude.ts'
import catalogue from './index.ts'

const temporaryDirectories: string[] = []
const originalMcpSource = process.env.KI_MCP_SOURCE
afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true })
  if (originalMcpSource === undefined) delete process.env.KI_MCP_SOURCE
  else process.env.KI_MCP_SOURCE = originalMcpSource
})

test('the Claude catalogue is independently complete', () => {
  expect(catalogue.contract).toBe(1)
  expect(catalogue.name).toBe('ki-binding-claude')
  expect(catalogue.packageScripts).toEqual(['ki:binding:claude:build-plugin'])
  expect(catalogue.families[0]?.items.map((item) => item.code)).toEqual([
    'CLAUDEBIND-1',
    'CLAUDEBIND-2',
    'CLAUDEBIND-J1'
  ])
})

test('Cowork changes remain diagnostic without Cowork-specific external-edit authority', () => {
  const items = catalogue.families.flatMap((family) => family.items as readonly unknown[]) as readonly {
    code: string
    mechanical?: { remediation: { class: string } }
    judgment?: { scope: string; prompt: string; outcomes: readonly string[]; guidance: string }
  }[]
  expect(items.filter((item) => item.mechanical?.remediation.class === 'automatic').map((item) => item.code)).toEqual([
    'RUBRIC-1'
  ])
  expect(items.find((item) => item.code === 'CLAUDEBIND-1')?.mechanical?.remediation.class).toBe('diagnostic')
  expect(items.find((item) => item.code === 'CLAUDEBIND-J1')?.judgment).toMatchObject({
    scope: expect.any(String),
    outcomes: expect.any(Array),
    guidance: expect.any(String)
  })
})

test('the Claude target needs explicit URL transport and full definition equality', () => {
  const repository = mkdtempSync(join(tmpdir(), 'ki-binding-claude-repository-'))
  const home = mkdtempSync(join(tmpdir(), 'ki-binding-claude-home-'))
  temporaryDirectories.push(repository, home)
  const source = join(home, 'mcp-servers.yaml')
  process.env.KI_MCP_SOURCE = source
  writeFileSync(
    source,
    'mcpServers:\n  - name: ki-url\n    clients: [claude-code]\n    url: https://example.invalid/mcp\n    transports: { claude-code: http }\n'
  )
  writeFileSync(
    join(home, '.claude.json'),
    '{"mcpServers":{"ki-url":{"type":"sse","url":"https://example.invalid/mcp"}}}\n'
  )
  const context = createClaudeBindingSession({
    mode: 'audit',
    repository,
    userHome: home,
    configuration: {}
  }).subjects[0]?.context() as ClaudeBindingContext
  const family = catalogue.families[0] as RubricFamily<ClaudeBindingContext, ClaudeBindingContext>
  expect(family.items[0]?.mechanical?.audit.run(context)[0]?.status).toBe('VIOLATION')
})

test('the Claude target compares literals exactly without reading rendered secret values', () => {
  const repository = mkdtempSync(join(tmpdir(), 'ki-binding-claude-repository-'))
  const home = mkdtempSync(join(tmpdir(), 'ki-binding-claude-home-'))
  temporaryDirectories.push(repository, home)
  const source = join(home, 'mcp-servers.yaml')
  process.env.KI_MCP_SOURCE = source
  mkdirSync(join(home, 'Library', 'Application Support', 'Claude'), { recursive: true })
  writeFileSync(
    source,
    'mcpServers:\n  - name: ki-stdio\n    clients: [claude-desktop]\n    command: /usr/bin/node\n    args: [~/server.mjs]\n    env:\n      ACCESS_LEVEL: read\n      TOKEN: { op: op://vault/item/field }\n'
  )
  writeFileSync(
    join(home, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json'),
    `{"mcpServers":{"ki-stdio":{"command":"/usr/bin/node","args":["${home}/server.mjs"],"env":{"ACCESS_LEVEL":"read","TOKEN":"resolved-secret"}}}}\n`
  )
  const context = createClaudeBindingSession({
    mode: 'audit',
    repository,
    userHome: home,
    configuration: {}
  }).subjects[0]?.context() as ClaudeBindingContext
  const family = catalogue.families[0] as RubricFamily<ClaudeBindingContext, ClaudeBindingContext>
  expect(family.items[0]?.mechanical?.audit.run(context)[1]?.status).toBe('PASS')
})

const claudeMismatches = (
  entry: ServerEntry,
  server: Record<string, unknown>,
  home = '/Users/example',
  extras: Record<string, Record<string, unknown>> = {}
) =>
  targetMatches(
    { kind: 'valid', entries: [entry] },
    'claude-code',
    { kind: 'valid', path: join(home, '.claude.json'), servers: { [entry.name]: server, ...extras } },
    home
  )

const claudeStdio = (command = 'node'): ServerEntry => ({
  name: 'ki-stdio',
  clients: ['claude-code'],
  command,
  args: ['~/server.mjs'],
  env: { ACCESS_LEVEL: 'read', TOKEN: { op: 'op://vault/item/field' } }
})

test('the Claude target accepts only the safe rendered stdio projections', () => {
  const home = '/Users/example'
  const entry = claudeStdio()
  const commands = new Set(['node', Bun.which('node'), join(home, '.local', 'share', 'mise', 'shims', 'node')])

  for (const command of commands) {
    if (!command) continue
    for (const argument of ['~/server.mjs', join(home, 'server.mjs')]) {
      expect(
        claudeMismatches(
          entry,
          {
            type: 'stdio',
            command,
            args: [argument],
            env: { ACCESS_LEVEL: 'read', TOKEN: 'resolved-secret' }
          },
          home,
          { unrelated: { command: 'other' } }
        )
      ).toEqual([])
    }
  }
})

test('the Claude target rejects unsafe command, argument, and environment equivalence', () => {
  const home = '/Users/example'
  const entry = claudeStdio()
  const command = join(home, '.local', 'share', 'mise', 'shims', 'node')
  const valid = {
    type: 'stdio',
    command,
    args: [join(home, 'server.mjs')],
    env: { ACCESS_LEVEL: 'read', TOKEN: 'resolved-secret' }
  }
  const invalid = [
    { ...valid, command: '/wrong/node' },
    { ...valid, args: ['/wrong/server.mjs'] },
    { ...valid, env: { ACCESS_LEVEL: 'write', TOKEN: 'resolved-secret' } },
    { ...valid, env: { ACCESS_LEVEL: 'read' } },
    { ...valid, env: { ACCESS_LEVEL: 'read', TOKEN: 'resolved-secret', EXTRA: 'value' } },
    { ...valid, env: { ACCESS_LEVEL: 'read', TOKEN: '' } }
  ]

  for (const server of invalid) expect(claudeMismatches(entry, server, home)).toEqual([entry])
  expect(claudeMismatches(claudeStdio('./node'), { ...valid, command }, home)).toEqual([claudeStdio('./node')])
  expect(
    claudeMismatches(
      claudeStdio('python'),
      { ...valid, command: join(home, '.local', 'share', 'mise', 'shims', 'python') },
      home
    )
  ).toEqual([claudeStdio('python')])
})

test('the Claude target keeps URL comparison exact and ignores unrelated native servers', () => {
  const entry = {
    name: 'ki-url',
    clients: ['claude-code'],
    url: 'https://example.invalid/mcp',
    transports: { 'claude-code': 'http' }
  } as unknown as Extract<ServerEntry, { url: string }>
  const exact = { type: 'url', url: entry.url }

  expect(claudeMismatches(entry, exact, '/Users/example', { unrelated: { url: 'https://other.invalid' } })).toEqual([])
  expect(claudeMismatches(entry, { ...exact, url: 'https://wrong.invalid/mcp' })).toEqual([entry])
  expect(
    targetMatches(
      { kind: 'valid', entries: [entry] },
      'claude-code',
      { kind: 'valid', path: '/Users/example/.claude.json', servers: { unrelated: exact } },
      '/Users/example'
    )
  ).toEqual([entry])
})
