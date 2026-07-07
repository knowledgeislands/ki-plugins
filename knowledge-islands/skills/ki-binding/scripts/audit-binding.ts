#!/usr/bin/env bun
/**
 * ki-binding — audit that every run surface agrees with the single source.
 *
 * The single source is chezmoi's `.chezmoidata/mcps.yaml`: one `mcpServers:` list where
 * each entry declares a `clients:` set naming the surfaces it targets. chezmoi renders that
 * into Claude Code, Claude Desktop, and the mcporter proxy. This checker compares each
 * rendered surface against the source and reports drift on the unified severity ladder.
 *
 * It is READ-ONLY: it never writes a surface config (that is CONFORM's job — edit the
 * source and `chezmoi apply`). See references/binding-standard.md for the model.
 *
 * Usage:
 *   bun audit-binding.ts [project]            audit surfaces; [project] scopes the skill half
 *   --check                                   audit only; exit non-zero on FAIL (WARN never fails)
 *   --source <path>                           override the mcps.yaml source
 *   --json                                    emit findings as JSON
 */

import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, realpathSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// This script runs under Bun (shebang); tsc types are node-only, so declare the one Bun global used.
declare const Bun: { YAML: { parse(input: string): unknown } }

// ── Self-location: find the harness skills/ root through the (possibly symlinked) script path ──
const SELF = realpathSync(fileURLToPath(import.meta.url))
// .../skills/ki-binding/scripts/audit-binding.ts → up to .../skills
const SKILLS_ROOT = resolve(dirname(SELF), '..', '..')

const HOME = homedir()
const DEFAULT_SOURCE = join(HOME, '.local', 'share', 'chezmoi', '.chezmoidata', 'mcps.yaml')
const RECOGNISED = new Set(['code', 'desktop', 'mcporter', 'cowork'])

// The file-editable, chezmoi-rendered surfaces this checker compares against the source.
const SURFACES: Array<{ token: string; label: string; path: string }> = [
  { token: 'code', label: 'Claude Code', path: join(HOME, '.claude.json') },
  { token: 'desktop', label: 'Claude Desktop', path: join(HOME, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json') },
  { token: 'mcporter', label: 'mcporter', path: join(HOME, '.mcporter', 'mcporter.json') }
]

// ── ANSI ──
const RED = '\x1b[31m'
const YELLOW = '\x1b[33m'
const GREEN = '\x1b[32m'
const DIM = '\x1b[2m'
const RESET = '\x1b[0m'

type Severity = 'FAIL' | 'WARN' | 'PASS' | 'INFO'
interface Finding {
  severity: Severity
  criterion: string
  message: string
}

interface ServerEntry {
  name: string
  clients?: string[]
  url?: string
  command?: string
}

// ── Args ──
const argv = process.argv.slice(2)
const flag = (name: string): boolean => argv.includes(name)
const opt = (name: string): string | undefined => {
  const i = argv.indexOf(name)
  return i >= 0 ? argv[i + 1] : undefined
}
const CHECK = flag('--check')
const JSON_OUT = flag('--json')
const SOURCE = resolve(opt('--source') ?? DEFAULT_SOURCE)
const project = argv.find((a, i) => !a.startsWith('--') && argv[i - 1] !== '--source')

// ── Helpers ──
function readJson(path: string): Record<string, unknown> | null {
  if (!existsSync(path)) return null
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>
  } catch {
    return null
  }
}

function mcpServerKeys(cfg: Record<string, unknown> | null): Set<string> {
  const m = cfg?.mcpServers
  return m && typeof m === 'object' ? new Set(Object.keys(m as Record<string, unknown>)) : new Set()
}

// ── Load & validate the single source (BIND-2) ──
if (!existsSync(SOURCE)) {
  process.stderr.write(`${RED}error${RESET} single source not found: ${SOURCE}\n  pass --source <path> or check the chezmoi install.\n`)
  process.exit(2)
}

let entries: ServerEntry[]
try {
  const parsed = Bun.YAML.parse(readFileSync(SOURCE, 'utf8')) as { mcpServers?: ServerEntry[] }
  if (!parsed || !Array.isArray(parsed.mcpServers)) throw new Error('no mcpServers list')
  entries = parsed.mcpServers
} catch (e) {
  process.stderr.write(`${RED}error${RESET} could not parse source ${SOURCE}: ${(e as Error).message}\n`)
  process.exit(2)
}

const findings: Finding[] = []
const add = (severity: Severity, criterion: string, message: string): void => void findings.push({ severity, criterion, message })

// BIND-2 — structural validity of the source.
const universe = new Set<string>()
for (const [i, e] of entries.entries()) {
  const where = e.name ? `"${e.name}"` : `entry #${i}`
  if (!e.name) add('WARN', 'BIND-2', `${where} has no \`name\``)
  else universe.add(e.name)
  const clients = e.clients ?? []
  if (clients.length === 0) add('WARN', 'BIND-2', `${where} has an empty \`clients\` — targets no surface`)
  for (const c of clients) if (!RECOGNISED.has(c)) add('WARN', 'BIND-2', `${where} names unrecognised surface \`${c}\``)
}
if (!findings.some((f) => f.criterion === 'BIND-2'))
  add('PASS', 'BIND-2', `source valid — ${entries.length} servers, all with a name and recognised clients`)

// BIND-1 — each file-editable surface renders exactly the servers whose clients names it.
for (const s of SURFACES) {
  const expected = new Set([...universe].filter((n) => entries.find((e) => e.name === n)?.clients?.includes(s.token)))
  const cfg = readJson(s.path)
  if (cfg === null) {
    add('INFO', 'BIND-1', `${s.label} config not present or unreadable (${s.path}) — surface not audited`)
    continue
  }
  const presentAll = mcpServerKeys(cfg)
  const present = new Set([...presentAll].filter((n) => universe.has(n))) // KI-governed only
  const missing = [...expected].filter((n) => !present.has(n)).sort()
  const stray = [...present].filter((n) => !expected.has(n)).sort()
  if (missing.length === 0 && stray.length === 0) {
    add('PASS', 'BIND-1', `${s.label} agrees with the source (${expected.size} servers)`)
  } else {
    if (missing.length)
      add(
        'WARN',
        'BIND-1',
        `${s.label} missing ${missing.length}: ${missing.join(', ')} — source targets \`${s.token}\` but surface lacks them`
      )
    if (stray.length)
      add('WARN', 'BIND-1', `${s.label} stray ${stray.length}: ${stray.join(', ')} — present but source does not target \`${s.token}\``)
  }
}

// BIND-4 — Cowork agreement: the KI plugin is registered + toggled in every workspace.
// v1 ships a skills+agents plugin (no servers port into the sandbox), so this checks the
// plugin enablement in cowork_settings.json rather than server rendering. Any server that
// nonetheless declares `cowork` is surfaced separately, since servers are deferred.
const COWORK_MARKETPLACE = 'ki-plugins'
const COWORK_PLUGIN_KEY = `knowledge-islands@${COWORK_MARKETPLACE}`
const COWORK_REPO = 'knowledgeislands/ki-plugins'
const coworkBase = join(HOME, 'Library', 'Application Support', 'Claude', 'local-agent-mode-sessions')

function findCoworkSettings(dir: string, depth = 0): string[] {
  if (!existsSync(dir) || depth > 4) return []
  const out: string[] = []
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'cowork_settings.json' && e.isFile()) out.push(join(dir, e.name))
    else if (e.isDirectory() && e.name !== 'cowork_plugins') out.push(...findCoworkSettings(join(dir, e.name), depth + 1))
  }
  return out
}

const coworkFiles = findCoworkSettings(coworkBase)
if (coworkFiles.length === 0) {
  add('INFO', 'BIND-4', `no cowork_settings.json found under ${coworkBase} — Cowork surface not present on this machine`)
} else {
  const unconformed: string[] = []
  for (const path of coworkFiles) {
    const cfg = readJson(path)
    const enabled = (cfg?.enabledPlugins ?? {}) as Record<string, unknown>
    const markets = (cfg?.extraKnownMarketplaces ?? {}) as Record<string, unknown>
    const on = enabled[COWORK_PLUGIN_KEY] === true
    const registered = (markets[COWORK_MARKETPLACE] as { source?: { repo?: string } })?.source?.repo === COWORK_REPO
    if (!(on && registered)) unconformed.push(path)
  }
  if (unconformed.length === 0)
    add('PASS', 'BIND-4', `Cowork agrees — ${COWORK_PLUGIN_KEY} registered + enabled in all ${coworkFiles.length} workspace(s)`)
  else
    add(
      'WARN',
      'BIND-4',
      `Cowork: ${COWORK_PLUGIN_KEY} not registered/enabled in ${unconformed.length}/${coworkFiles.length} workspace(s) — run conform-cowork.ts (then relaunch Cowork)`
    )
}

const coworkServers = [...universe].filter((n) => entries.find((e) => e.name === n)?.clients?.includes('cowork')).sort()
if (coworkServers.length > 0)
  add(
    'WARN',
    'BIND-4',
    `${coworkServers.length} server(s) declare \`cowork\` but MCP servers are deferred (host-local, not sandbox-portable): ${coworkServers.join(', ')} — skills+agents port, servers need separate work`
  )

// BIND-3 — compose ki-bootstrap --check for the project's skill half.
const bootstrap = join(SKILLS_ROOT, 'ki-bootstrap', 'scripts', 'link-skills.ts')
if (!project) {
  add('INFO', 'BIND-3', 'no [project] given — skill half (ki-bootstrap) not audited; pass a repo path to include it')
} else if (!existsSync(bootstrap)) {
  add('INFO', 'BIND-3', `ki-bootstrap checker not found at ${bootstrap} — skill half not audited`)
} else {
  const r = spawnSync('bun', [bootstrap, resolve(project), '--check'], { encoding: 'utf8' })
  const ok = r.status === 0
  add(
    ok ? 'PASS' : 'WARN',
    'BIND-3',
    `ki-bootstrap --check on ${project} ${ok ? 'clean' : `reported findings (exit ${r.status}) — run ki:skills:link:project`}`
  )
}

// ── Report ──
if (JSON_OUT) {
  process.stdout.write(`${JSON.stringify({ source: SOURCE, project: project ?? null, findings }, null, 2)}\n`)
} else {
  const colour: Record<Severity, string> = { FAIL: RED, WARN: YELLOW, PASS: GREEN, INFO: DIM }
  process.stdout.write(`\n${DIM}ki-binding — cross-surface audit${RESET}\n${DIM}source: ${SOURCE}${RESET}\n${'─'.repeat(60)}\n`)
  for (const f of findings)
    process.stdout.write(`  ${colour[f.severity]}${f.severity.padEnd(4)}${RESET} ${DIM}${f.criterion}${RESET}  ${f.message}\n`)
  const n = (s: Severity): number => findings.filter((f) => f.severity === s).length
  process.stdout.write(`${'─'.repeat(60)}\n  ${n('FAIL')} fail · ${n('WARN')} warn · ${n('PASS')} pass · ${n('INFO')} info\n`)
}

// WARN never fails the run; only a hard FAIL does (rubric: all BIND criteria are WARN).
process.exit(CHECK && findings.some((f) => f.severity === 'FAIL') ? 1 : 0)
