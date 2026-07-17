#!/usr/bin/env bun
/**
 * ki-binding render — Codex CLI surface.
 *
 * Codex is the one file-editable surface ki-binding renders directly, because `~/.codex/config.toml`
 * is a LIVE user file (it already carries the ChatGPT desktop app's own `[mcp_servers.*]` — e.g.
 * `node_repl`, `computer-use` — plus `[marketplaces.*]`/`[plugins.*]`/`[desktop]` tables), so a
 * whole-file rewrite would clobber them. Codex ships native merge-safe writers — `codex mcp
 * add|remove|get|list` edit only the `[mcp_servers.*]` region in place — so this renderer shells
 * those (idempotent per name) rather than hand-serialising TOML into the user's file. The Claude
 * Code/Desktop/mcporter surfaces stay chezmoi-rendered (see ki-binding-chezmoi); Codex is rendered
 * here. Binary-verified against codex-cli 0.144.4.
 *
 * Only KI-governed servers (those named in the source `mcpServers` list) are ever touched — the
 * ChatGPT-app servers are left alone. Secret env values (`op://` refs) are resolved via `op read`,
 * matching what the other surfaces already store (resolved values, not op:// literals).
 *
 * Flags:
 *   --check / --dry-run   report the `codex mcp add|remove` commands that would run; do not run
 *                         them. Exit non-zero when the surface is unconformed (drift to apply).
 *   --source <path>       source override ($KI_MCP_SOURCE also honoured; canonical default otherwise)
 *   --json                emit cited findings as JSON
 *
 * Default (no --check): applies the plan, printing each command as it runs.
 */

import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'

declare const Bun: { YAML: { parse(input: string): unknown }; TOML: { parse(input: string): unknown } }

// ── Args ──
const argv = process.argv.slice(2)
const flag = (name: string): boolean => argv.includes(name)
const opt = (name: string): string | undefined => {
  const i = argv.indexOf(name)
  return i >= 0 ? argv[i + 1] : undefined
}
const CHECK = flag('--check') || flag('--dry-run')
const JSON_OUT = flag('--json')

const HOME = homedir()
const CANONICAL_SOURCE = join(process.env.XDG_CONFIG_HOME ?? join(HOME, '.config'), 'ki', 'mcp-servers.yaml')
const LEGACY_CHEZMOI_SOURCE = join(process.env.XDG_DATA_HOME ?? join(HOME, '.local', 'share'), 'chezmoi', '.chezmoidata', 'mcps.yaml')
const PROJECT_LOCAL_SOURCE = join(process.cwd(), '.ki', 'mcps.yaml')
const sourceOverride = opt('--source') ?? process.env.KI_MCP_SOURCE
const SOURCE = sourceOverride
  ? resolve(sourceOverride)
  : ([CANONICAL_SOURCE, LEGACY_CHEZMOI_SOURCE, PROJECT_LOCAL_SOURCE].find((p) => existsSync(p)) ?? CANONICAL_SOURCE)
const CODEX_CONFIG = join(HOME, '.codex', 'config.toml')
const REF = 'references/binding-standard.md'

// ── ANSI ──
const RED = '\x1b[31m'
const YELLOW = '\x1b[33m'
const GREEN = '\x1b[32m'
const DIM = '\x1b[2m'
const RESET = '\x1b[0m'

type Level = 'FAIL' | 'WARN' | 'PASS' | 'INFO'
interface Finding {
  level: Level
  msg: string
  ref?: string
  file?: string
}
const findings: Finding[] = []
const add = (level: Level, msg: string, file?: string): void => {
  findings.push({ level, msg, ref: REF, file })
}

// ── Source model ──
interface SourceEntry {
  name: string
  clients?: string[]
  command?: string
  args?: string[]
  env?: Record<string, unknown>
}

function parseSource(): SourceEntry[] {
  const raw = Bun.YAML.parse(readFileSync(SOURCE, 'utf8')) as { mcpServers?: unknown }
  const m = raw?.mcpServers
  if (!m || typeof m !== 'object') return []
  return Object.values(m as Record<string, SourceEntry>)
}

function codexServerKeys(): Set<string> {
  if (!existsSync(CODEX_CONFIG)) return new Set()
  const cfg = Bun.TOML.parse(readFileSync(CODEX_CONFIG, 'utf8')) as { mcp_servers?: unknown }
  const m = cfg?.mcp_servers
  return m && typeof m === 'object' ? new Set(Object.keys(m as Record<string, unknown>)) : new Set()
}

// Resolve a `op://…` secret reference to its value; plain values pass through. Matches the resolved
// (not op:// literal) values the other rendered surfaces already store.
function resolveEnvValue(v: unknown): string {
  if (v && typeof v === 'object' && typeof (v as { op?: unknown }).op === 'string') {
    const ref = (v as { op: string }).op
    return execFileSync('op', ['read', ref], { encoding: 'utf8' }).trim()
  }
  return String(v)
}

function addArgs(e: SourceEntry): string[] {
  const args = ['mcp', 'add', e.name]
  for (const [k, v] of Object.entries(e.env ?? {})) args.push('--env', `${k}=${resolveEnvValue(v)}`)
  args.push('--', e.command ?? '', ...(e.args ?? []))
  return args
}

function runCodex(args: string[]): void {
  execFileSync('codex', args, { stdio: 'inherit' })
}

// ── Plan ──
const entries = parseSource()
const universe = new Set(entries.map((e) => e.name)) // KI-governed names — the only ones we touch
const desired = entries.filter((e) => (e.clients ?? []).includes('chatgpt-codex'))
const present = codexServerKeys()
const toRemove = [...present].filter((n) => universe.has(n) && !desired.some((e) => e.name === n))

let planned = 0
for (const e of desired) {
  planned++
  const args = addArgs(e)
  const shown = `codex ${args.map((a) => (a.includes('=') ? `${a.split('=')[0]}=***` : a)).join(' ')}`
  if (CHECK) {
    add('WARN', `would render \`${e.name}\` → ${shown}`, CODEX_CONFIG)
  } else {
    // Idempotent: remove-then-add so the block exactly matches the source (add alone errors if present).
    try {
      runCodex(['mcp', 'remove', e.name])
    } catch {
      /* not present yet — fine */
    }
    runCodex(args)
    add('PASS', `rendered \`${e.name}\` to Codex`, CODEX_CONFIG)
  }
}
for (const name of toRemove) {
  planned++
  if (CHECK) {
    add('WARN', `would remove \`${name}\` (KI-governed, no longer targets codex) → codex mcp remove ${name}`, CODEX_CONFIG)
  } else {
    runCodex(['mcp', 'remove', name])
    add('PASS', `removed \`${name}\` from Codex`, CODEX_CONFIG)
  }
}
if (planned === 0) add('PASS', `Codex surface already agrees with the source (${desired.length} servers target codex)`, CODEX_CONFIG)

// ── Emit ──
if (JSON_OUT) {
  console.log(JSON.stringify({ concern: 'ki-binding render-codex', target: CODEX_CONFIG, source: SOURCE, findings }, null, 2))
} else {
  const colour: Record<Level, string> = { FAIL: RED, WARN: YELLOW, PASS: GREEN, INFO: DIM }
  for (const f of findings) {
    console.log(`  ${colour[f.level]}${f.level}${RESET} ${f.file ? `${DIM}${f.file}${RESET}  ` : ''}${f.msg} ${DIM}(${f.ref})${RESET}`)
  }
}

// In --check, unconformed (drift to apply) is a non-zero exit, matching conform.ts's convention.
const unconformed = CHECK && planned > 0
process.exit(unconformed ? 1 : 0)
