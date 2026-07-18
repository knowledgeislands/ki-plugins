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
 * references/rubric.md). Emits canonical checker-reporter JSONL and exits non-zero
 * if any mechanical FAIL finding exists.
 *
 * No dependencies — Node/Bun builtins only.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  type CheckerFinding,
  checkerReporterExitCode,
  emitCheckerReporter,
  judgmentFindingsFromRubric
} from './vendored/ki-skills/checker-reporter.ts'

type Level = 'FAIL' | 'WARN' | 'POLISH' | 'ADVISORY' | 'INFO' | 'NA' | 'PASS'
const findings: CheckerFinding[] = []
const add = (level: Level, code: string, message: string, ref?: string, file?: string) => {
  const basename = file?.split('/').filter(Boolean).at(-1)
  const leadingPath = file && message.toLowerCase().startsWith(file.toLowerCase()) ? file : basename
  const conciseMessage = leadingPath ? message.slice(leadingPath.length).trimStart() : message
  findings.push({ type: 'M', level, code, message: conciseMessage, ...(ref ? { ref } : {}), ...(file ? { file } : {}) })
}

// Reference-doc pointers, minted per-criterion in references/rubric.md (PLUG-N codes).
const STD = 'references/standards.md'
const RUB = 'references/rubric.md'
const LOCAL_RUBRIC = join(dirname(fileURLToPath(import.meta.url)), '..', 'references', 'rubric.md')

const rawRepo = process.argv[2]
if (!rawRepo || !existsSync(rawRepo) || !statSync(rawRepo).isDirectory()) {
  const target = rawRepo ? resolve(rawRepo) : resolve('.')
  const invalidInput: CheckerFinding[] = [
    { type: 'M', level: 'FAIL', code: 'PLUG-1', message: 'Audit target must be an existing directory.', ref: STD }
  ]
  invalidInput.push(...judgmentFindingsFromRubric(LOCAL_RUBRIC, RUB))
  emitCheckerReporter({ mode: 'audit', concern: 'plugins', target, findings: invalidInput })
  process.exit(checkerReporterExitCode(invalidInput))
}
const repo = resolve(rawRepo)
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
const TOML = (globalThis as unknown as { Bun: { TOML: { parse(text: string): unknown } } }).Bun.TOML
const parseToml = (text: string): { document: Record<string, unknown> | null; malformed: boolean } => {
  try {
    return { document: TOML.parse(text) as Record<string, unknown>, malformed: false }
  } catch {
    return { document: null, malformed: true }
  }
}
const asTable = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null

// Applicability is declaration OR the marketplace entry-point manifest. Neither
// means this repository is unrelated, so stop before projection-shape failures.
const kiPluginsText = read('.ki-config.toml')
const parsedKiPlugins = parseToml(kiPluginsText)
const kiPluginsTable = asTable(parsedKiPlugins.document?.['ki-plugins'])
const declaresPlugins = kiPluginsTable !== null
const hasPluginStructure = has('.claude-plugin', 'marketplace.json')
if (!declaresPlugins && !parsedKiPlugins.malformed && !hasPluginStructure) {
  add('NA', 'PLUG-15', 'ki-plugins not applicable: no [ki-plugins] declaration or marketplace.json structural marker', STD)
  findings.push(...judgmentFindingsFromRubric(LOCAL_RUBRIC, RUB))
  emitCheckerReporter({ mode: 'audit', concern: 'plugins', target: repo, findings })
  process.exit(checkerReporterExitCode(findings))
}

// ── marketplace manifest ──────────────────────────────────────────────────────
// The marketplace is the entry point: one manifest, exactly one plugin, owned by the org.
let plugin = '' // the plugin's source dir, learned from the marketplace entry
let mktDescription = '' // the plugin entry's description, for plugin.json agreement below
const MKT_FILE = '.claude-plugin/marketplace.json'
const marketplaceRaw = read('.claude-plugin', 'marketplace.json')
if (!marketplaceRaw) {
  add('FAIL', 'PLUG-1', 'marketplace.json missing — this is not a plugin-marketplace repo', STD, MKT_FILE)
} else {
  let mkt: Record<string, unknown> = {}
  let parsed = true
  try {
    mkt = JSON.parse(marketplaceRaw)
  } catch {
    parsed = false
    add('FAIL', 'PLUG-1', 'marketplace.json is unparseable JSON', STD, MKT_FILE)
  }
  if (parsed) {
    typeof mkt.name === 'string' && mkt.name
      ? add('PASS', 'PLUG-1', `marketplace name = ${JSON.stringify(mkt.name)}`, STD, MKT_FILE)
      : add('FAIL', 'PLUG-1', 'marketplace.json has no "name"', STD, MKT_FILE)
    const owner = (mkt.owner ?? {}) as Record<string, unknown>
    owner.name === ORG
      ? add('PASS', 'PLUG-2', `owner.name = ${JSON.stringify(ORG)}`, STD, MKT_FILE)
      : add('FAIL', 'PLUG-2', `owner.name should be ${JSON.stringify(ORG)}, got ${JSON.stringify(owner.name)}`, STD, MKT_FILE)
    const plugins = Array.isArray(mkt.plugins) ? (mkt.plugins as Record<string, unknown>[]) : null
    if (!plugins) add('FAIL', 'PLUG-2', 'marketplace.json "plugins" is not an array', STD, MKT_FILE)
    else if (plugins.length !== 1) add('FAIL', 'PLUG-2', `marketplace must list exactly one plugin, found ${plugins.length}`, STD, MKT_FILE)
    else {
      const p = plugins[0]
      typeof p.name === 'string' && p.name
        ? add('PASS', 'PLUG-3', `plugin name = ${JSON.stringify(p.name)}`, STD, MKT_FILE)
        : add('FAIL', 'PLUG-3', 'the plugin entry has no "name"', STD, MKT_FILE)
      if (typeof p.name === 'string') plugin = p.name
      const src = typeof p.source === 'string' ? p.source : ''
      const wantSrc = `./${plugin}`
      src === wantSrc
        ? add('PASS', 'PLUG-3', `plugin source = ${JSON.stringify(wantSrc)}`, STD, MKT_FILE)
        : add('FAIL', 'PLUG-3', `plugin source should be ${JSON.stringify(wantSrc)}, got ${JSON.stringify(p.source)}`, STD, MKT_FILE)
      typeof p.description === 'string' && p.description
        ? add('PASS', 'PLUG-3', 'plugin entry has a description', STD, MKT_FILE)
        : add('FAIL', 'PLUG-3', 'the plugin entry has no "description"', STD, MKT_FILE)
      if (typeof p.description === 'string') mktDescription = p.description
      // The source dir must exist on disk and match the plugin name.
      plugin && isDir(plugin)
        ? add('PASS', 'PLUG-3', `plugin source dir ${plugin}/ exists`, STD, MKT_FILE)
        : add('FAIL', 'PLUG-3', `plugin source dir ${plugin || '(unknown)'}/ does not exist`, STD, MKT_FILE)
    }
  }
  // Formatting: 2-space JSON + trailing newline (the generator's contract).
  jsonFormat('PLUG-4', MKT_FILE, marketplaceRaw)
}

// ── plugin manifest ───────────────────────────────────────────────────────────
if (plugin) {
  const pjFile = `${plugin}/.claude-plugin/plugin.json`
  const pjRaw = read(plugin, '.claude-plugin', 'plugin.json')
  if (!pjRaw) add('FAIL', 'PLUG-5', `${pjFile} missing`, STD, pjFile)
  else {
    let pj: Record<string, unknown> = {}
    let ok = true
    try {
      pj = JSON.parse(pjRaw)
    } catch {
      ok = false
      add('FAIL', 'PLUG-5', `${pjFile} is unparseable JSON`, STD, pjFile)
    }
    if (ok) {
      pj.name === plugin
        ? add('PASS', 'PLUG-5', `plugin.json name = ${JSON.stringify(plugin)} (matches source dir)`, STD, pjFile)
        : add('FAIL', 'PLUG-5', `plugin.json name should be ${JSON.stringify(plugin)}, got ${JSON.stringify(pj.name)}`, STD, pjFile)
      typeof pj.version === 'string' && /^\d+\.\d+\.\d+/.test(pj.version)
        ? add('PASS', 'PLUG-7', `plugin.json version = ${JSON.stringify(pj.version)}`, STD, pjFile)
        : add(
            'WARN',
            'PLUG-7',
            `plugin.json version missing or not semver (tracks the harness package.json): ${JSON.stringify(pj.version)}`,
            STD,
            pjFile
          )
      const author = (pj.author ?? {}) as Record<string, unknown>
      author.name === ORG
        ? add('PASS', 'PLUG-6', `author.name = ${JSON.stringify(ORG)}`, STD, pjFile)
        : add('FAIL', 'PLUG-6', `plugin.json author.name should be ${JSON.stringify(ORG)}, got ${JSON.stringify(author.name)}`, STD, pjFile)
      if (mktDescription)
        pj.description === mktDescription
          ? add('PASS', 'PLUG-7', 'plugin.json description matches the marketplace entry', STD, pjFile)
          : add(
              'WARN',
              'PLUG-7',
              'plugin.json description differs from the marketplace entry — regenerate to keep them in sync',
              STD,
              pjFile
            )
    }
    jsonFormat('PLUG-4', pjFile, pjRaw)
  }

  // ── projected skills — copied verbatim, each carries a SKILL.md ──────────────
  if (!isDir(plugin, 'skills')) add('FAIL', 'PLUG-8', `${plugin}/skills/ missing`, STD, `${plugin}/skills`)
  else {
    const skillDirs = readdirSync(at(plugin, 'skills'), { withFileTypes: true }).filter((e) => e.isDirectory() && !e.name.startsWith('.'))
    if (!skillDirs.length) add('WARN', 'PLUG-8', `${plugin}/skills/ is empty`, STD, `${plugin}/skills`)
    else {
      const noManifest = skillDirs.filter((e) => !has(plugin, 'skills', e.name, 'SKILL.md')).map((e) => e.name)
      noManifest.length
        ? add('FAIL', 'PLUG-8', `projected skill dirs without a SKILL.md: ${noManifest.join(', ')}`, STD, `${plugin}/skills`)
        : add('PASS', 'PLUG-8', `${skillDirs.length} projected skills, each with a SKILL.md`, STD, `${plugin}/skills`)
    }
  }

  // ── projected agents — flattened .md files, no nesting ───────────────────────
  if (!isDir(plugin, 'agents'))
    add('WARN', 'PLUG-9', `${plugin}/agents/ missing (the projection carries the governance agents)`, STD, `${plugin}/agents`)
  else {
    const entries = readdirSync(at(plugin, 'agents'), { withFileTypes: true }).filter((e) => !e.name.startsWith('.'))
    const nested = entries.filter((e) => e.isDirectory()).map((e) => e.name)
    const mdFiles = entries.filter((e) => e.isFile() && e.name.endsWith('.md'))
    nested.length
      ? add(
          'FAIL',
          'PLUG-9',
          `agents/ must be flat .md files (from agents/governance/) — found subdirs: ${nested.join(', ')}`,
          STD,
          `${plugin}/agents`
        )
      : add('PASS', 'PLUG-9', `${mdFiles.length} agents, flattened to .md files`, STD, `${plugin}/agents`)
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
    ? add(
        'WARN',
        'PLUG-10',
        `MCP servers are deferred (host-local, not Cowork's sandbox) — unexpected .mcp.json: ${mcpHits.join(', ')}`,
        STD
      )
    : add('PASS', 'PLUG-10', 'no .mcp.json in the plugin (MCP servers correctly deferred)', STD)
}

// ── repo scaffold (owned by the repo, untouched by regeneration) ───────────────
for (const f of ['LICENSE', 'README.md', '.gitignore', 'CLAUDE.md']) {
  has(f) ? add('PASS', 'PLUG-13', `${f} present`, STD, f) : add('FAIL', 'PLUG-13', `${f} missing`, STD, f)
}
// The generated-not-hand-edited invariant must be stated so no one edits the projection.
const claude = read('CLAUDE.md')
if (claude)
  /generated/i.test(claude) && /hand-?edit|hand-?maintain/i.test(claude)
    ? add('PASS', 'PLUG-14', 'CLAUDE.md states the generated-not-hand-edited invariant', STD, 'CLAUDE.md')
    : add('WARN', 'PLUG-14', 'CLAUDE.md should state that the projection is generated and must not be hand-edited', STD, 'CLAUDE.md')

// ── .ki-config.toml [ki-plugins] opt-in marker ─────────────────────────────────
// The shared file is ki-repo's contract, but this skill reads its OWN table: a
// marketplace repo opts into the plugins standard by declaring [ki-plugins]
// (ki-repo's coverage cascade enforces the same presence from the marketplace.json
// signal). Validate-down — no per-repo keys defined yet.
const kiText = kiPluginsText
if (!kiText) add('WARN', 'PLUG-15', '.ki-config.toml missing (ki-repo owns the contract)', STD, '.ki-config.toml')
else if (!kiPluginsTable)
  add('WARN', 'PLUG-15', 'no [ki-plugins] table — add it to mark this repo as governed by the plugins standard', STD, '.ki-config.toml')
else {
  add('PASS', 'PLUG-15', '[ki-plugins] table present', STD, '.ki-config.toml')
  const KNOWN = new Set<string>([]) // no top-level options yet
  for (const key of Object.keys(kiPluginsTable)) {
    KNOWN.has(key)
      ? add('PASS', 'PLUG-15', `known key ${key}`, STD, '.ki-config.toml')
      : add('WARN', 'PLUG-15', `unknown key under [ki-plugins]: ${key} (validate-down)`, STD, '.ki-config.toml')
  }
}

// 2-space JSON + trailing newline — the generator writes both manifests this way.
function jsonFormat(code: string, rel: string, raw: string): void {
  let obj: unknown
  try {
    obj = JSON.parse(raw)
  } catch {
    return // parse errors are reported by the caller
  }
  const want = `${JSON.stringify(obj, null, 2)}\n`
  raw === want
    ? add('PASS', code, `${rel} is 2-space JSON with a trailing newline`, STD, rel)
    : add('POLISH', code, `${rel} not in canonical 2-space-JSON + trailing-newline form — regenerate`, STD, rel)
}

findings.push(...judgmentFindingsFromRubric(LOCAL_RUBRIC, RUB))
emitCheckerReporter({ mode: 'audit', concern: 'plugins', target: repo, findings })
process.exit(checkerReporterExitCode(findings))
