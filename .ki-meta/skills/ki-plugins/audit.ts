#!/usr/bin/env bun
/**
 * Mechanical auditor for a Knowledge Islands plugin-marketplace repo.
 *
 *   bun scripts/audit.ts <repo-path>        # or: node after a build
 *
 * Checks the ON-DISK PROJECTION SHAPE the `ki-plugins` skill codifies — the
 * .claude-plugin/marketplace.json manifest, the single plugin and its plugin.json,
 * the verbatim skills/ copy and flattened agents/, the MCP-deferred rule (no .mcp.json),
 * the repo scaffold, and the [ki-plugins] opt-in marker. GENERATION of the projection and
 * its CROSS-SURFACE ENABLEMENT are the `ki-binding` layer (build-plugin.ts + BIND-4) — not
 * re-checked here. This script also does NOT judge whether the projected set is up to date
 * against the harness (a stale projection needs a human/agent read + regenerate — see
 * references/audit-rubric.md). Output is grouped pass/warn/fail; exit non-zero if any FAIL.
 *
 * No dependencies — Node/Bun builtins only.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { basename, join } from 'node:path'

// Unified severity ladder — shared by every KI checker (enforcement-framework §2).
type Level = 'FAIL' | 'WARN' | 'POLISH' | 'ADVISORY' | 'INFO' | 'NA' | 'PASS'
type Finding = { level: Level; area: string; msg: string }
const ORDER: Level[] = ['FAIL', 'WARN', 'POLISH', 'ADVISORY', 'INFO', 'NA', 'PASS']
const ICON: Record<Level, string> = { FAIL: '❌', WARN: '⚠️ ', POLISH: '✨', ADVISORY: '🧭', INFO: 'ℹ️ ', NA: '⊘', PASS: '✅' }
const findings: Finding[] = []
const add = (level: Level, area: string, msg: string) => findings.push({ level, area, msg })

const repo = process.argv[2]
if (!repo || !existsSync(repo)) {
  console.error('usage: audit.ts <repo-path>   (path must exist)')
  process.exit(2)
}
const at = (...p: string[]) => join(repo, ...p)
const has = (...p: string[]) => existsSync(at(...p))
const read = (...p: string[]): string => {
  try {
    return readFileSync(at(...p), 'utf8')
  } catch {
    return ''
  }
}
const isDir = (...p: string[]) => has(...p) && statSync(at(...p)).isDirectory()
const ORG = 'Knowledge Islands'

// ── marketplace manifest ──────────────────────────────────────────────────────
// The marketplace is the entry point: one manifest, exactly one plugin, owned by the org.
let plugin = '' // the plugin's source dir, learned from the marketplace entry
let mktDescription = '' // the plugin entry's description, for plugin.json agreement below
const marketplaceRaw = read('.claude-plugin', 'marketplace.json')
if (!marketplaceRaw) {
  add('FAIL', 'marketplace', '.claude-plugin/marketplace.json missing — this is not a plugin-marketplace repo')
} else {
  let mkt: Record<string, unknown> = {}
  let parsed = true
  try {
    mkt = JSON.parse(marketplaceRaw)
  } catch {
    parsed = false
    add('FAIL', 'marketplace', '.claude-plugin/marketplace.json is unparseable JSON')
  }
  if (parsed) {
    typeof mkt.name === 'string' && mkt.name
      ? add('PASS', 'marketplace', `marketplace name = ${JSON.stringify(mkt.name)}`)
      : add('FAIL', 'marketplace', 'marketplace.json has no "name"')
    const owner = (mkt.owner ?? {}) as Record<string, unknown>
    owner.name === ORG
      ? add('PASS', 'marketplace', `owner.name = ${JSON.stringify(ORG)}`)
      : add('FAIL', 'marketplace', `owner.name should be ${JSON.stringify(ORG)}, got ${JSON.stringify(owner.name)}`)
    const plugins = Array.isArray(mkt.plugins) ? (mkt.plugins as Record<string, unknown>[]) : null
    if (!plugins) add('FAIL', 'marketplace', 'marketplace.json "plugins" is not an array')
    else if (plugins.length !== 1) add('FAIL', 'marketplace', `marketplace must list exactly one plugin, found ${plugins.length}`)
    else {
      const p = plugins[0]
      typeof p.name === 'string' && p.name
        ? add('PASS', 'marketplace', `plugin name = ${JSON.stringify(p.name)}`)
        : add('FAIL', 'marketplace', 'the plugin entry has no "name"')
      if (typeof p.name === 'string') plugin = p.name
      const src = typeof p.source === 'string' ? p.source : ''
      const wantSrc = `./${plugin}`
      src === wantSrc
        ? add('PASS', 'marketplace', `plugin source = ${JSON.stringify(wantSrc)}`)
        : add('FAIL', 'marketplace', `plugin source should be ${JSON.stringify(wantSrc)}, got ${JSON.stringify(p.source)}`)
      typeof p.description === 'string' && p.description
        ? add('PASS', 'marketplace', 'plugin entry has a description')
        : add('FAIL', 'marketplace', 'the plugin entry has no "description"')
      if (typeof p.description === 'string') mktDescription = p.description
      // The source dir must exist on disk and match the plugin name.
      plugin && isDir(plugin)
        ? add('PASS', 'marketplace', `plugin source dir ${plugin}/ exists`)
        : add('FAIL', 'marketplace', `plugin source dir ${plugin || '(unknown)'}/ does not exist`)
    }
  }
  // Formatting: 2-space JSON + trailing newline (the generator's contract).
  jsonFormat('marketplace', '.claude-plugin/marketplace.json', marketplaceRaw)
}

// ── plugin manifest ───────────────────────────────────────────────────────────
if (plugin) {
  const pjRaw = read(plugin, '.claude-plugin', 'plugin.json')
  if (!pjRaw) add('FAIL', 'plugin', `${plugin}/.claude-plugin/plugin.json missing`)
  else {
    let pj: Record<string, unknown> = {}
    let ok = true
    try {
      pj = JSON.parse(pjRaw)
    } catch {
      ok = false
      add('FAIL', 'plugin', `${plugin}/.claude-plugin/plugin.json is unparseable JSON`)
    }
    if (ok) {
      pj.name === plugin
        ? add('PASS', 'plugin', `plugin.json name = ${JSON.stringify(plugin)} (matches source dir)`)
        : add('FAIL', 'plugin', `plugin.json name should be ${JSON.stringify(plugin)}, got ${JSON.stringify(pj.name)}`)
      typeof pj.version === 'string' && /^\d+\.\d+\.\d+/.test(pj.version)
        ? add('PASS', 'plugin', `plugin.json version = ${JSON.stringify(pj.version)}`)
        : add(
            'WARN',
            'plugin',
            `plugin.json version missing or not semver (tracks the harness package.json): ${JSON.stringify(pj.version)}`
          )
      const author = (pj.author ?? {}) as Record<string, unknown>
      author.name === ORG
        ? add('PASS', 'plugin', `author.name = ${JSON.stringify(ORG)}`)
        : add('FAIL', 'plugin', `plugin.json author.name should be ${JSON.stringify(ORG)}, got ${JSON.stringify(author.name)}`)
      if (mktDescription)
        pj.description === mktDescription
          ? add('PASS', 'plugin', 'plugin.json description matches the marketplace entry')
          : add('WARN', 'plugin', 'plugin.json description differs from the marketplace entry — regenerate to keep them in sync')
    }
    jsonFormat('plugin', `${plugin}/.claude-plugin/plugin.json`, pjRaw)
  }

  // ── projected skills — copied verbatim, each carries a SKILL.md ──────────────
  if (!isDir(plugin, 'skills')) add('FAIL', 'skills', `${plugin}/skills/ missing`)
  else {
    const skillDirs = readdirSync(at(plugin, 'skills'), { withFileTypes: true }).filter((e) => e.isDirectory() && !e.name.startsWith('.'))
    if (!skillDirs.length) add('WARN', 'skills', `${plugin}/skills/ is empty`)
    else {
      const noManifest = skillDirs.filter((e) => !has(plugin, 'skills', e.name, 'SKILL.md')).map((e) => e.name)
      noManifest.length
        ? add('FAIL', 'skills', `projected skill dirs without a SKILL.md: ${noManifest.join(', ')}`)
        : add('PASS', 'skills', `${skillDirs.length} projected skills, each with a SKILL.md`)
    }
  }

  // ── projected agents — flattened .md files, no nesting ───────────────────────
  if (!isDir(plugin, 'agents')) add('WARN', 'agents', `${plugin}/agents/ missing (the projection carries the governance agents)`)
  else {
    const entries = readdirSync(at(plugin, 'agents'), { withFileTypes: true }).filter((e) => !e.name.startsWith('.'))
    const nested = entries.filter((e) => e.isDirectory()).map((e) => e.name)
    const mdFiles = entries.filter((e) => e.isFile() && e.name.endsWith('.md'))
    nested.length
      ? add('FAIL', 'agents', `agents/ must be flat .md files (from agents/governance/) — found subdirs: ${nested.join(', ')}`)
      : add('PASS', 'agents', `${mdFiles.length} agents, flattened to .md files`)
  }

  // ── MCP deferred — no .mcp.json anywhere in the plugin ───────────────────────
  const mcpHits: string[] = []
  const walk = (dir: string) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.name === 'node_modules' || e.name.startsWith('.git')) continue
      const full = join(dir, e.name)
      if (e.isDirectory()) walk(full)
      else if (e.name === '.mcp.json') mcpHits.push(full.replace(`${repo}/`, ''))
    }
  }
  walk(at(plugin))
  mcpHits.length
    ? add('WARN', 'mcp', `MCP servers are deferred (host-local, not Cowork's sandbox) — unexpected .mcp.json: ${mcpHits.join(', ')}`)
    : add('PASS', 'mcp', 'no .mcp.json in the plugin (MCP servers correctly deferred)')
}

// ── repo scaffold (owned by the repo, untouched by regeneration) ───────────────
for (const f of ['LICENSE', 'README.md', '.gitignore', 'CLAUDE.md']) {
  has(f) ? add('PASS', 'scaffold', `${f} present`) : add('FAIL', 'scaffold', `${f} missing`)
}
// The generated-not-hand-edited invariant must be stated so no one edits the projection.
const claude = read('CLAUDE.md')
if (claude)
  /generated/i.test(claude) && /hand-?edit|hand-?maintain/i.test(claude)
    ? add('PASS', 'scaffold', 'CLAUDE.md states the generated-not-hand-edited invariant')
    : add('WARN', 'scaffold', 'CLAUDE.md should state that the projection is generated and must not be hand-edited')

// ── .ki-config.toml [ki-plugins] opt-in marker ─────────────────────────────────
// The shared file is ki-repo's contract, but this skill reads its OWN table: a
// marketplace repo opts into the plugins standard by declaring [ki-plugins]
// (ki-repo's coverage cascade enforces the same presence from the marketplace.json
// signal). Validate-down — no per-repo keys defined yet.
const kiText = read('.ki-config.toml')
if (!kiText) add('WARN', 'ki-config', '.ki-config.toml missing (ki-repo owns the contract)')
else if (!/^\[ki-plugins\]/m.test(kiText))
  add('WARN', 'ki-config', 'no [ki-plugins] table — add it to mark this repo as governed by the plugins standard')
else {
  add('PASS', 'ki-config', '[ki-plugins] table present')
  const body = kiText.split(/^\[ki-plugins\]/m)[1]?.split(/^\[/m)[0] ?? ''
  const KNOWN = new Set<string>([]) // no top-level options yet
  for (const m of body.matchAll(/^\s*([A-Za-z0-9_-]+)\s*=/gm)) {
    KNOWN.has(m[1] as string)
      ? add('PASS', 'ki-config', `known key ${m[1]}`)
      : add('WARN', 'ki-config', `unknown key under [ki-plugins]: ${m[1]} (validate-down)`)
  }
}

// 2-space JSON + trailing newline — the generator writes both manifests this way.
function jsonFormat(area: string, rel: string, raw: string): void {
  let obj: unknown
  try {
    obj = JSON.parse(raw)
  } catch {
    return // parse errors are reported by the caller
  }
  const want = `${JSON.stringify(obj, null, 2)}\n`
  raw === want
    ? add('PASS', area, `${rel} is 2-space JSON with a trailing newline`)
    : add('POLISH', area, `${rel} not in canonical 2-space-JSON + trailing-newline form — regenerate`)
}

// ── report ────────────────────────────────────────────────────────────────────
function emit(items: Finding[], target: string, concern: string, title: string, footer: string): never {
  const argv = process.argv.slice(2)
  const json = argv.includes('--json')
  const ri = argv.indexOf('--report')
  const report = ri !== -1
  const reportDir = report && argv[ri + 1] && !argv[ri + 1].startsWith('-') ? argv[ri + 1] : join(target, '.ki-meta', 'audits')

  const n = (l: Level): number => items.filter((f) => f.level === l).length
  const summary = {
    fail: n('FAIL'),
    warn: n('WARN'),
    polish: n('POLISH'),
    advisory: n('ADVISORY'),
    info: n('INFO'),
    na: n('NA'),
    pass: n('PASS')
  }
  const tally = `FAIL=${summary.fail} WARN=${summary.warn} POLISH=${summary.polish} PASS=${summary.pass} ADVISORY=${summary.advisory} NA=${summary.na}`
  const stamp = new Date().toISOString()

  if (report) {
    mkdirSync(reportDir, { recursive: true })
    const body = ORDER.flatMap((l) => {
      const rows = items.filter((f) => f.level === l)
      return rows.length ? ['', `## ${ICON[l]} ${l} (${rows.length})`, ...rows.map((r) => `- [${r.area}] ${r.msg}`)] : []
    })
    writeFileSync(join(reportDir, `${concern}.md`), [`# ${concern} audit — ${target}`, '', `_${stamp}_`, '', tally, ...body, ''].join('\n'))
    writeFileSync(
      join(reportDir, `${concern}.json`),
      `${JSON.stringify({ concern, target, generatedAt: stamp, summary, findings: items }, null, 2)}\n`
    )
  }

  if (json) {
    process.stdout.write(`${JSON.stringify({ concern, target, generatedAt: stamp, summary, findings: items }, null, 2)}\n`)
  } else {
    console.log(`\n${title}\n${'─'.repeat(60)}`)
    for (const l of ORDER) {
      const rows = items.filter((f) => f.level === l)
      if (!rows.length) continue
      console.log(`\n${ICON[l]} ${l} (${rows.length})`)
      for (const r of rows) console.log(`   [${r.area}] ${r.msg}`)
    }
    console.log(`\n${'─'.repeat(60)}\n${tally}`)
    if (footer) console.log(footer)
    if (summary.fail + summary.warn + summary.polish > 0)
      console.log('→ to address: run /ki-plugins CONFORM   (judgment criteria: references/audit-rubric.md)')
    if (report) console.log(`report → ${join(reportDir, `${concern}.{md,json}`)}`)
    console.log('')
  }
  process.exit(summary.fail ? 1 : 0)
}

add('INFO', 'scope', 'projection shape only — generation + Cowork enablement are the ki-binding layer (BIND-4)')
add(
  'ADVISORY',
  'judgment',
  'mechanical layer only — apply the [J] criteria in references/audit-rubric.md by reading (esp. stale-projection)'
)
emit(
  findings,
  repo,
  'plugins',
  `Plugin-marketplace audit — ${basename(repo)}  (${repo})`,
  'Projection shape only — also confirm the projected set is not stale vs the harness (references/audit-rubric.md).'
)
