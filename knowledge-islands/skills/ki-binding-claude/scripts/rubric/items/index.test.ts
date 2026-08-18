import { afterEach, expect, test } from 'bun:test'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { RubricFamily } from '../../shared/rubric.ts'
import { type ClaudeBindingContext, createClaudeBindingSession } from '../contexts/claude.ts'
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
