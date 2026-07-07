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
 *   bun conform-cowork.ts            write the two keys into every cowork_settings.json
 *   --check                          report only; exit non-zero if any workspace is unconformed
 *   --repo <org/repo>               marketplace github repo (default: knowledgeislands/ki-plugins)
 *   --marketplace <name>            marketplace name  (default: ki-plugins)
 *   --plugin <name>                 plugin name       (default: knowledge-islands)
 *   --json                          emit a summary as JSON
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const argv = process.argv.slice(2)
const flag = (n: string): boolean => argv.includes(n)
const opt = (n: string): string | undefined => {
  const i = argv.indexOf(n)
  return i >= 0 ? argv[i + 1] : undefined
}
const CHECK = flag('--check')
const JSON_OUT = flag('--json')
const REPO = opt('--repo') ?? 'knowledgeislands/ki-plugins'
const MARKETPLACE = opt('--marketplace') ?? 'ki-plugins'
const PLUGIN = opt('--plugin') ?? 'knowledge-islands'
const PLUGIN_KEY = `${PLUGIN}@${MARKETPLACE}`

const RED = '\x1b[31m'
const YELLOW = '\x1b[33m'
const GREEN = '\x1b[32m'
const DIM = '\x1b[2m'
const RESET = '\x1b[0m'

const BASE = join(homedir(), 'Library', 'Application Support', 'Claude', 'local-agent-mode-sessions')

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

// ── Report ──
if (JSON_OUT) {
  process.stdout.write(`${JSON.stringify({ pluginKey: PLUGIN_KEY, repo: REPO, results }, null, 2)}\n`)
} else {
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
}

// --check fails if any workspace is not yet conformed.
process.exit(CHECK && results.some((r) => r.status === 'would-conform' || r.status === 'unreadable') ? 1 : 0)
