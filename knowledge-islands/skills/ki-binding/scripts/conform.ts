#!/usr/bin/env bun
/**
 * ki-binding — conform the Cowork surface: register + toggle the KI plugin.
 *
 * Cowork is the one surface this skill writes directly (the file-editable surfaces —
 * Code / Desktop / mcporter — are conformed via chezmoi, never here). The external-edit
 * gate passed 2026-07-06: Cowork honours an external edit to cowork_settings.json on next
 * launch. This script merges two keys into every workspace's cowork_settings.json:
 *
 *   extraKnownMarketplaces["ki-plugins"] = { source: { source: "github", repo: "<repo>" } }
 *   enabledPlugins["knowledge-islands@ki-plugins"] = true
 *
 * It MERGES — every other plugin toggle and marketplace is preserved. A full Cowork
 * relaunch is required for the change to take effect.
 *
 * Usage:
 *   bun conform.ts            write the two keys into every cowork_settings.json
 *   --check / --dry-run              report only; exit non-zero if any workspace is unconformed
 *   --repo <org/repo>               marketplace github repo (default: knowledgeislands/ki-plugins)
 *   --marketplace <name>            marketplace name  (default: ki-plugins)
 *   --plugin <name>                 plugin name       (default: knowledge-islands)
 *   --json                          emit the cited-finding wrapper ({ concern, target, summary, findings })
 *
 * The bespoke human status table (status ∈ already/conformed/would-conform/unreadable) is
 * preserved for a direct run; --json swaps it for the shared wrapper so the aggregate consumes
 * each result as a finding on the unified ladder (already → PASS, conformed / would-conform →
 * POLISH, unreadable → FAIL). Every finding cites BIND-4 and the binding standard, file-scoped
 * to its cowork_settings.json — matching audit.ts's (area, ref) for the same criterion.
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'

const argv = process.argv.slice(2)
const flag = (n: string): boolean => argv.includes(n)
const opt = (n: string): string | undefined => {
  const i = argv.indexOf(n)
  return i >= 0 ? argv[i + 1] : undefined
}
// `--check` and `--dry-run` are equivalent: report only, write nothing (`--dry-run` is the
// name the cited-finding standard uses; `--check` is kept for back-compat with callers).
const CHECK = flag('--check') || flag('--dry-run')
const JSON_OUT = flag('--json')
const REPO = opt('--repo') ?? 'knowledgeislands/ki-plugins'
const MARKETPLACE = opt('--marketplace') ?? 'ki-plugins'
const PLUGIN = opt('--plugin') ?? 'knowledge-islands'
const PLUGIN_KEY = `${PLUGIN}@${MARKETPLACE}`
// This conform writes the Cowork surface only — the criterion it discharges is BIND-4, and it
// cites the same standard audit.ts does so the shared criterion carries the same (area, ref).
const BIND_AREA = 'BIND-4'
const BIND_REF = 'references/binding-standard.md'

// Collect-then-emit findings on the unified ladder, threaded for --json. The bespoke human
// status table below is preserved (gated on !JSON_OUT); the wrapper mirrors audit.ts's shape.
type Level = 'FAIL' | 'WARN' | 'POLISH' | 'ADVISORY' | 'INFO' | 'NA' | 'PASS'
interface Finding {
  level: Level
  area: string
  msg: string
  ref?: string
  file?: string
}
const findings: Finding[] = []
const rec = (level: Level, area: string, msg: string, ref?: string, file?: string): void =>
  void findings.push({ level, area, msg, ref, file })

const RED = '\x1b[31m'
const YELLOW = '\x1b[33m'
const GREEN = '\x1b[32m'
const DIM = '\x1b[2m'
const RESET = '\x1b[0m'

const BASE = join(homedir(), 'Library', 'Application Support', 'Claude', 'local-agent-mode-sessions')

// A positional path (e.g. the aggregate passes the repo `.`) scopes the wrapper's `target`;
// conform still discovers cowork settings under BASE regardless. Skip option-value tokens.
const VALUE_OPTS = new Set(['--repo', '--marketplace', '--plugin'])
const positional = argv.find((a, i) => !a.startsWith('-') && !VALUE_OPTS.has(argv[i - 1] ?? ''))
const target = positional ? resolve(positional) : BASE

// ── Discover every cowork_settings.json (one per account/workspace) ──
function findSettings(dir: string, depth = 0): string[] {
  if (!existsSync(dir) || depth > 4) return []
  const out: string[] = []
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'cowork_settings.json' && e.isFile()) out.push(join(dir, e.name))
    else if (e.isDirectory() && e.name !== 'cowork_plugins') out.push(...findSettings(join(dir, e.name), depth + 1))
  }
  return out
}

const files = findSettings(BASE)

interface Result {
  path: string
  status: 'already' | 'conformed' | 'would-conform' | 'unreadable'
}
const results: Result[] = []

for (const path of files) {
  let cfg: Record<string, unknown>
  try {
    cfg = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>
  } catch {
    results.push({ path, status: 'unreadable' })
    continue
  }
  if (cfg.enabledPlugins == null) cfg.enabledPlugins = {}
  if (cfg.extraKnownMarketplaces == null) cfg.extraKnownMarketplaces = {}
  const enabled = cfg.enabledPlugins as Record<string, unknown>
  const markets = cfg.extraKnownMarketplaces as Record<string, unknown>

  const pluginOn = enabled[PLUGIN_KEY] === true
  const marketOk = JSON.stringify((markets[MARKETPLACE] as { source?: { repo?: string } })?.source?.repo) === JSON.stringify(REPO)

  if (pluginOn && marketOk) {
    results.push({ path, status: 'already' })
    continue
  }
  if (CHECK) {
    results.push({ path, status: 'would-conform' })
    continue
  }
  enabled[PLUGIN_KEY] = true
  markets[MARKETPLACE] = { source: { source: 'github', repo: REPO } }
  writeFileSync(path, `${JSON.stringify(cfg, null, 2)}\n`)
  results.push({ path, status: 'conformed' })
}

// ── Thread findings on the unified ladder (one per workspace result) ──
// conformed → POLISH (a write applied), already → PASS, would-conform → POLISH (dry-run: a
// write is pending), unreadable → FAIL. Each is file-scoped to its cowork_settings.json path.
const STATUS_LEVEL: Record<Result['status'], Level> = {
  conformed: 'POLISH',
  already: 'PASS',
  'would-conform': 'POLISH',
  unreadable: 'FAIL'
}
const STATUS_MSG: Record<Result['status'], string> = {
  conformed: `${PLUGIN_KEY} registered + enabled (written — relaunch Cowork)`,
  already: `${PLUGIN_KEY} already registered + enabled`,
  'would-conform': `${PLUGIN_KEY} not yet registered/enabled — would conform`,
  unreadable: 'cowork_settings.json unreadable (invalid JSON)'
}
if (files.length === 0) rec('INFO', BIND_AREA, 'no cowork_settings.json found — Cowork surface not present on this machine', BIND_REF, BASE)
for (const r of results) rec(STATUS_LEVEL[r.status], BIND_AREA, STATUS_MSG[r.status], BIND_REF, r.path)

// ── Report ──
if (!JSON_OUT) {
  process.stdout.write(`\n${DIM}ki-binding — conform Cowork (${PLUGIN_KEY} → ${REPO})${RESET}\n${'─'.repeat(60)}\n`)
  if (files.length === 0) process.stdout.write(`  ${YELLOW}no cowork_settings.json found${RESET} under ${BASE}\n`)
  const colour: Record<Result['status'], string> = {
    already: GREEN,
    conformed: GREEN,
    'would-conform': YELLOW,
    unreadable: RED
  }
  for (const r of results) process.stdout.write(`  ${colour[r.status]}${r.status.padEnd(13)}${RESET} ${DIM}${r.path}${RESET}\n`)
  process.stdout.write(`${'─'.repeat(60)}\n`)
  if (results.some((r) => r.status === 'conformed'))
    process.stdout.write(`  ${YELLOW}⟳ quit Cowork fully and relaunch${RESET} for the change to take effect.\n`)
} else {
  const n = (l: Level): number => findings.filter((f) => f.level === l).length
  const summary = {
    fail: n('FAIL'),
    warn: n('WARN'),
    polish: n('POLISH'),
    advisory: n('ADVISORY'),
    info: n('INFO'),
    na: n('NA'),
    pass: n('PASS')
  }
  process.stdout.write(JSON.stringify({ concern: 'binding', target, generatedAt: new Date().toISOString(), summary, findings }))
}

// --check/--dry-run fails if any workspace is not yet conformed.
process.exit(CHECK && results.some((r) => r.status === 'would-conform' || r.status === 'unreadable') ? 1 : 0)
