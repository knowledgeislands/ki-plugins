import { afterEach, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { parseRenderCodexArgs, runRenderCodex } from './render-codex.ts'

const temporaryDirectories: string[] = []
afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

const fixture = (config: string): { home: string; source: string } => {
  const home = mkdtempSync(join(tmpdir(), 'ki-binding-codex-'))
  temporaryDirectories.push(home)
  mkdirSync(join(home, '.codex'), { recursive: true })
  writeFileSync(join(home, '.codex', 'config.toml'), config)
  const source = join(home, 'mcp-servers.yaml')
  writeFileSync(
    source,
    `mcpServers:
  - name: ki-example
    clients: [chatgpt-codex]
    command: node
    args: [server.js]
`
  )
  return { home, source }
}

test('the Codex renderer has strict help and argument handling', () => {
  expect(parseRenderCodexArgs(['--help']).help).toBe(true)
  expect(parseRenderCodexArgs(['--dry-run']).check).toBe(true)
  expect(() => parseRenderCodexArgs(['--source'])).toThrow('requires a value')
  expect(() => parseRenderCodexArgs(['extra'])).toThrow('unknown option')
})

test('check mode is clean when the Codex surface agrees', () => {
  const { home, source } = fixture(`[mcp_servers.ki-example]
command = "node"
args = ["server.js"]
`)
  expect(runRenderCodex({ check: true, json: true, source, help: false, home })).toBe(0)
})

test('check mode reports drift without invoking Codex', () => {
  const { home, source } = fixture('')
  expect(runRenderCodex({ check: true, json: true, source, help: false, home })).toBe(1)
})
