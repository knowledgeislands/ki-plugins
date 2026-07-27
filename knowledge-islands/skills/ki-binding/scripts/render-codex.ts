#!/usr/bin/env bun
/**
 * Merge KI-governed MCP servers into Codex CLI configuration.
 *
 * This remains a public command because Codex's native writer is the safe merge boundary
 * for a live config that also contains non-KI servers; it is not a rubric-host file draft.
 */

import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'

declare const Bun: { YAML: { parse(input: string): unknown }; TOML: { parse(input: string): unknown } }

const HELP = `Usage: bun scripts/render-codex.ts [options]

Render KI-governed MCP servers into the Codex CLI surface.

Options:
  --check, --dry-run  Report planned Codex changes without writing them.
  --source <path>     Use an explicit mcp-servers.yaml source.
  --json              Emit findings as JSON.
  -h, --help          Show this help and exit.
`
const REF = 'references/standards-cross-surface-binding.md'

type Options = { check: boolean; json: boolean; source?: string; help: boolean; home?: string }
type Level = 'FAIL' | 'WARN' | 'PASS'
type Finding = { level: Level; msg: string; ref: string; file?: string }
type SourceEntry = {
  name: string
  clients?: string[]
  command?: string
  args?: string[]
  env?: Record<string, unknown>
  url?: string
}
type CodexServer = {
  command?: unknown
  args?: unknown
  env?: unknown
  url?: unknown
}

const valueAfter = (argv: readonly string[], index: number, option: string): string => {
  const value = argv[index + 1]
  if (!value || value.startsWith('-')) throw new Error(`${option} requires a value`)
  return value
}

export const parseRenderCodexArgs = (argv: readonly string[]): Options => {
  let check = false
  let json = false
  let source: string | undefined
  let help = false
  for (let index = 0; index < argv.length; index++) {
    const argument = argv[index] as string
    if (argument === '-h' || argument === '--help') help = true
    else if (argument === '--check' || argument === '--dry-run') check = true
    else if (argument === '--json') json = true
    else if (argument === '--source') source = valueAfter(argv, index++, argument)
    else throw new Error(`unknown option: ${argument}`)
  }
  return { check, json, source, help }
}

const sourceEntries = (path: string): SourceEntry[] => {
  if (!existsSync(path)) throw new Error(`source does not exist: ${path}`)
  const parsed = Bun.YAML.parse(readFileSync(path, 'utf8')) as { mcpServers?: unknown }
  if (!parsed || !Array.isArray(parsed.mcpServers)) throw new Error(`source mcpServers must be a list: ${path}`)
  return parsed.mcpServers.map((entry, index) => {
    if (!entry || typeof entry !== 'object' || typeof (entry as SourceEntry).name !== 'string')
      throw new Error(`source entry ${index + 1} has no name`)
    return entry as SourceEntry
  })
}

const codexServers = (path: string): Record<string, CodexServer> => {
  if (!existsSync(path)) return {}
  const parsed = Bun.TOML.parse(readFileSync(path, 'utf8')) as { mcp_servers?: unknown }
  return parsed.mcp_servers && typeof parsed.mcp_servers === 'object' ? (parsed.mcp_servers as Record<string, CodexServer>) : {}
}

const plainEnv = (env: Record<string, unknown> | undefined): Record<string, string> | null => {
  const values: Record<string, string> = {}
  for (const [key, value] of Object.entries(env ?? {})) {
    if (value && typeof value === 'object' && typeof (value as { op?: unknown }).op === 'string') return null
    values[key] = String(value)
  }
  return values
}

const orderedRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object'
    ? Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right)))
    : {}

const sameServer = (entry: SourceEntry, actual: CodexServer | undefined): boolean => {
  if (!actual) return false
  if (entry.url) return actual.url === entry.url
  const expectedEnv = plainEnv(entry.env)
  return (
    actual.command === entry.command &&
    JSON.stringify(actual.args ?? []) === JSON.stringify(entry.args ?? []) &&
    expectedEnv !== null &&
    JSON.stringify(orderedRecord(actual.env)) === JSON.stringify(orderedRecord(expectedEnv))
  )
}

const resolveEnvValue = (value: unknown): string => {
  if (value && typeof value === 'object' && typeof (value as { op?: unknown }).op === 'string')
    return execFileSync('op', ['read', (value as { op: string }).op], { encoding: 'utf8' }).trim()
  return String(value)
}

const addArgs = (entry: SourceEntry): string[] => {
  if (entry.url) return ['mcp', 'add', entry.name, '--url', entry.url]
  if (!entry.command) throw new Error(`Codex-targeted server ${entry.name} needs command or url`)
  const args = ['mcp', 'add', entry.name]
  for (const [key, value] of Object.entries(entry.env ?? {})) args.push('--env', `${key}=${resolveEnvValue(value)}`)
  args.push('--', entry.command, ...(entry.args ?? []))
  return args
}

const shownCommand = (entry: SourceEntry): string => {
  if (entry.url) return `codex mcp add ${entry.name} --url ${entry.url}`
  const env = Object.keys(entry.env ?? {}).flatMap((key) => ['--env', `${key}=***`])
  return ['codex', 'mcp', 'add', entry.name, ...env, '--', entry.command ?? '', ...(entry.args ?? [])].join(' ')
}

export const runRenderCodex = (options: Options): number => {
  const home = options.home ?? homedir()
  const canonical = join(process.env.XDG_CONFIG_HOME ?? join(home, '.config'), 'ki', 'mcp-servers.yaml')
  const projectLocal = join(process.cwd(), '.ki', 'mcps.yaml')
  const override = options.source ?? process.env.KI_MCP_SOURCE
  const source = override ? resolve(override) : ([canonical, projectLocal].find(existsSync) ?? canonical)
  const configPath = join(home, '.codex', 'config.toml')
  const entries = sourceEntries(source)
  const universe = new Set(entries.map((entry) => entry.name))
  const desired = entries.filter((entry) => entry.clients?.includes('chatgpt-codex'))
  const actual = codexServers(configPath)
  const toAdd = desired.filter((entry) => !sameServer(entry, actual[entry.name]))
  const desiredNames = new Set(desired.map((entry) => entry.name))
  const toRemove = Object.keys(actual).filter((name) => universe.has(name) && !desiredNames.has(name))
  const findings: Finding[] = []
  const add = (level: Level, msg: string): void => {
    findings.push({ level, msg, ref: REF, file: configPath })
  }
  for (const entry of toAdd) {
    if (options.check) add('WARN', `would render \`${entry.name}\` → ${shownCommand(entry)}`)
    else {
      try {
        execFileSync('codex', ['mcp', 'remove', entry.name], { stdio: 'ignore' })
      } catch {
        // The server may not exist yet.
      }
      execFileSync('codex', addArgs(entry), { stdio: 'inherit' })
      add('PASS', `rendered \`${entry.name}\` to Codex`)
    }
  }
  for (const name of toRemove) {
    if (options.check) add('WARN', `would remove \`${name}\` → codex mcp remove ${name}`)
    else {
      execFileSync('codex', ['mcp', 'remove', name], { stdio: 'inherit' })
      add('PASS', `removed \`${name}\` from Codex`)
    }
  }
  const planned = toAdd.length + toRemove.length
  if (planned === 0) add('PASS', `Codex agrees with the source (${desired.length} server(s) target Codex)`)
  if (options.json)
    process.stdout.write(`${JSON.stringify({ concern: 'ki-binding render-codex', target: configPath, source, findings }, null, 2)}\n`)
  else for (const finding of findings) process.stdout.write(`${finding.level} ${finding.file}  ${finding.msg} (${finding.ref})\n`)
  return options.check && planned > 0 ? 1 : 0
}

export const main = (argv = process.argv.slice(2)): number => {
  try {
    const options = parseRenderCodexArgs(argv)
    if (options.help) {
      process.stdout.write(HELP)
      return 0
    }
    return runRenderCodex(options)
  } catch (error) {
    process.stderr.write(`render-codex: ${error instanceof Error ? error.message : String(error)}\n`)
    return 1
  }
}

if (import.meta.main) process.exitCode = main()
