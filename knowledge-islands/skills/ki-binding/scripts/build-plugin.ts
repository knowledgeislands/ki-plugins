#!/usr/bin/env bun
/**
 * ki-binding — generate the KI Cowork plugin marketplace repo from this harness.
 *
 * The harness (skills/ + agents/) is the single source; a Claude plugin/marketplace is a
 * lossy per-surface projection of it (ADR-KI-HARNESS-005). This generator mirrors the
 * harness's skills + governance agents into a marketplace-repo tree so the plugin content
 * is never hand-maintained — re-running reproduces it byte-for-byte.
 *
 * Scope (v1): skills + agents only. MCP servers are host-local and do not port into
 * Cowork's gVisor sandbox (see references/cross-surface-enablement.md), so no `.mcp.json`.
 *
 * It OWNS only the generated parts of the output dir — `.claude-plugin/` and the plugin
 * directory. Repo-scaffold files (.git/, LICENSE, README.md, .ki-config.toml, .gitignore)
 * are left untouched, so re-running after the repo exists just refreshes plugin content.
 *
 * Usage:
 *   bun build-plugin.ts [outDir]              default: ~/kis/knowledgeislands/ki-plugins
 *   --marketplace <name>                      marketplace name (default: ki-plugins)
 *   --plugin <name>                           plugin name/dir (default: knowledge-islands)
 *   --json                                    emit a summary as JSON
 */

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// ── Self-location: resolve the harness root from this script's path ──
const SELF = fileURLToPath(import.meta.url)
// .../skills/ki-binding/scripts/build-plugin.ts → up to the harness root
const HARNESS_ROOT = resolve(dirname(SELF), '..', '..', '..')
const SKILLS_DIR = join(HARNESS_ROOT, 'skills')
const AGENTS_DIR = join(HARNESS_ROOT, 'agents', 'governance')

// ── Args ──
const argv = process.argv.slice(2)
const opt = (name: string): string | undefined => {
  const i = argv.indexOf(name)
  return i >= 0 ? argv[i + 1] : undefined
}
const JSON_OUT = argv.includes('--json')
const MARKETPLACE = opt('--marketplace') ?? 'ki-plugins'
const PLUGIN = opt('--plugin') ?? 'knowledge-islands'
const positional = argv.find((a, i) => !a.startsWith('--') && argv[i - 1] !== '--marketplace' && argv[i - 1] !== '--plugin')
const OUT_DIR = resolve(positional ?? join(homedir(), 'kis', 'knowledgeislands', 'ki-plugins'))

// ── Read harness metadata for the plugin manifest ──
const pkg = JSON.parse(readFileSync(join(HARNESS_ROOT, 'package.json'), 'utf8')) as { version?: string }
const VERSION = pkg.version ?? '0.0.0'
const OWNER = 'Knowledge Islands'

const PLUGIN_DESCRIPTION =
  'Knowledge Islands governance skills and agents — the ki-* house standards (AUDIT / CONFORM / REFRESH) and the governance agents, generated from the ki-agentic-harness. Skills and agents only; host-local MCP servers are deferred (they do not run in Cowork’s sandbox).'

// ── Discover source content ──
const skillDirs = readdirSync(SKILLS_DIR)
  .filter((name) => {
    const p = join(SKILLS_DIR, name)
    return statSync(p).isDirectory() && existsSync(join(p, 'SKILL.md'))
  })
  .sort()

const agentFiles = existsSync(AGENTS_DIR)
  ? readdirSync(AGENTS_DIR)
      .filter((f) => f.endsWith('.md'))
      .sort()
  : []

// ── Reset only the generated parts (idempotent; leaves repo scaffold alone) ──
const pluginRoot = join(OUT_DIR, PLUGIN)
rmSync(join(OUT_DIR, '.claude-plugin'), { recursive: true, force: true })
rmSync(pluginRoot, { recursive: true, force: true })

mkdirSync(join(OUT_DIR, '.claude-plugin'), { recursive: true })
mkdirSync(join(pluginRoot, '.claude-plugin'), { recursive: true })
mkdirSync(join(pluginRoot, 'skills'), { recursive: true })
mkdirSync(join(pluginRoot, 'agents'), { recursive: true })

// ── marketplace.json ──
const marketplace = {
  name: MARKETPLACE,
  owner: { name: OWNER },
  plugins: [{ name: PLUGIN, source: `./${PLUGIN}`, description: PLUGIN_DESCRIPTION }]
}
writeFileSync(join(OUT_DIR, '.claude-plugin', 'marketplace.json'), `${JSON.stringify(marketplace, null, 2)}\n`)

// ── plugin.json ──
const plugin = { name: PLUGIN, version: VERSION, description: PLUGIN_DESCRIPTION, author: { name: OWNER } }
writeFileSync(join(pluginRoot, '.claude-plugin', 'plugin.json'), `${JSON.stringify(plugin, null, 2)}\n`)

// ── Copy skills verbatim (whole dir incl. references/ and scripts/) ──
for (const name of skillDirs) cpSync(join(SKILLS_DIR, name), join(pluginRoot, 'skills', name), { recursive: true })

// ── Copy governance agents (flatten agents/governance/*.md → agents/*.md) ──
for (const f of agentFiles) cpSync(join(AGENTS_DIR, f), join(pluginRoot, 'agents', f))

// ── Report ──
const summary = {
  outDir: OUT_DIR,
  marketplace: MARKETPLACE,
  plugin: PLUGIN,
  version: VERSION,
  skills: skillDirs.length,
  agents: agentFiles.length
}
if (JSON_OUT) {
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`)
} else {
  process.stdout.write(
    `\x1b[2mki-binding — build-plugin\x1b[0m\n` +
      `  out:         ${OUT_DIR}\n` +
      `  marketplace: ${MARKETPLACE}\n` +
      `  plugin:      ${PLUGIN}@${MARKETPLACE} (v${VERSION})\n` +
      `  skills:      ${skillDirs.length}\n` +
      `  agents:      ${agentFiles.length}\n` +
      `  \x1b[32mgenerated\x1b[0m — repo scaffold (LICENSE, README, .ki-config.toml, .git) left untouched\n`
  )
}
