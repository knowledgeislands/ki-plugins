#!/usr/bin/env bun
/**
 * Mechanical CONFORM for the ki-plugins standard — fixes the subset of
 * audit.ts's findings that are unambiguous and reversible, leaving
 * everything that needs a human/regenerate call as an advisory finding.
 *
 * Scope: a single target plugin-marketplace repo (default cwd), matching the
 * house conform shape (ki-authoring's conform.ts) —
 * `bun scripts/conform.ts .` / `ki:plugins:conform`. The marketplace
 * manifest path, the org constant, and the plugin-entry shape are kept in
 * lockstep with audit.ts (same source of truth, copied rather than
 * imported so each script stays valid standalone per the composition-only rule).
 *
 *   bun scripts/conform.ts [path]   # default: cwd
 *   --dry-run                                 # print the plan, mutate nothing
 *   --json                                    # emit the shared finding wrapper instead of prose
 *
 * Each action becomes a finding on the shared ladder, tagged with the same
 * rubric code (PLUG-N) and reference-doc pointer audit.ts uses: a fix written →
 * POLISH, an already-canonical value → PASS, an unrecoverable manifest error →
 * FAIL, a judgment/regenerate handoff → ADVISORY. `--json` governs *reporting*;
 * `--dry-run` governs *writing* — the two compose (a `--json` run still writes
 * unless `--dry-run` is also passed).
 *
 * Fixes:
 *   - marketplace.json `owner.name` → the known-good org string audit.ts
 *     checks against ("Knowledge Islands"), when missing or wrong. (PLUG-2)
 *   - plugin.json `version` → the harness's own package.json version (this
 *     script runs from the harness, so it is the source of truth for "the
 *     harness package.json version at generation time" the audit rubric cites),
 *     when missing or not semver. (PLUG-7)
 *   - plugin.json `description` → the marketplace entry's plugin description,
 *     when it differs (the marketplace entry is the in-repo source of truth
 *     plugin.json must agree with). (PLUG-7)
 *   - JSON formatting: both manifests are rewritten 2-space-indented with a
 *     trailing newline whenever they parse but aren't already in that form. (PLUG-4)
 *
 * Deliberately NEVER touches (judgment → advisory findings):
 *   - marketplace.json missing entirely (FAIL "not a plugin-marketplace repo")
 *     — scaffolding a whole marketplace repo is `ki-plugins` EDUCATE, not a
 *     mechanical fill-in.
 *   - marketplace.json "plugins" missing/not-an-array, or not exactly one
 *     entry — deciding which plugin(s) belong is judgment.
 *   - plugin name / source-dir / plugin.json name mismatches — renaming or
 *     relocating the plugin directory is a structural decision.
 *   - skills/ and agents/ projection content (missing SKILL.md, nested agent
 *     dirs, staleness vs the harness, .mcp.json leaks) — that's ki-binding's
 *     build-plugin.ts, not this conform script.
 *   - repo scaffold files (LICENSE, README.md, .gitignore, CLAUDE.md) and the
 *     [ki-plugins] .ki-config.toml marker — authoring prose/config is judgment.
 *
 * Zero npm dependencies (bun + node stdlib only). Exit code is non-zero only on
 * an unrecoverable error (marketplace.json missing/unparseable, or the target
 * plugin source dir absent); findings/fixes never fail the run.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// ── kept in lockstep with audit.ts ──
const ORG = 'Knowledge Islands'
const STD = 'references/plugins-standard.md'
const RUB = 'references/audit-rubric.md'

const C = { reset: '\x1b[0m', dim: '\x1b[2m', green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m', cyan: '\x1b[36m' }
const paint = (c: string, s: string): string => `${c}${s}${C.reset}`

const argv = process.argv.slice(2)
const dryRun = argv.includes('--dry-run')
const json = argv.includes('--json')
const target = resolve(argv.find((a) => !a.startsWith('-')) ?? '.')

// Collect-then-emit harness (mirrors audit.ts). Each action records a finding; `say`
// prints the human line only when not in --json mode, so a direct run streams prose
// while the aggregate consumes the wrapper. area is the rubric code, ref its
// reference-doc pointer, file the path an action concerns.
type Level = 'FAIL' | 'WARN' | 'POLISH' | 'ADVISORY' | 'INFO' | 'NA' | 'PASS'
type Finding = { level: Level; area: string; msg: string; ref?: string; file?: string }
const findings: Finding[] = []
const rec = (level: Level, area: string, msg: string, ref?: string, file?: string) => findings.push({ level, area, msg, ref, file })
const say = (line: string): void => {
  if (!json) console.log(line)
}

function emitJson(): void {
  if (!json) return
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
  process.stdout.write(JSON.stringify({ concern: 'plugins', target, generatedAt: new Date().toISOString(), summary, findings }))
}

function harnessPackageVersion(): string | null {
  // This script lives at <harness>/skills/repo-structure/ki-plugins/scripts/conform.ts —
  // walk up to the harness root's package.json regardless of cwd.
  try {
    const here = dirname(fileURLToPath(import.meta.url))
    const pkgPath = join(here, '..', '..', '..', 'package.json')
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as Record<string, unknown>
    return typeof pkg.version === 'string' ? pkg.version : null
  } catch {
    return null
  }
}

// 2-space JSON + trailing newline — the generator's canonical form.
function canonicalize(obj: unknown): string {
  return `${JSON.stringify(obj, null, 2)}\n`
}

const MKT_FILE = '.claude-plugin/marketplace.json'
const at = (...p: string[]) => join(target, ...p)

say(paint(C.dim, `target: ${target}${dryRun ? '   (dry run)' : ''}\n`))

// ── marketplace.json ──
say(paint(C.cyan, 'marketplace.json'))
const mktPath = at('.claude-plugin', 'marketplace.json')
if (!existsSync(mktPath)) {
  rec('FAIL', 'PLUG-1', 'marketplace.json missing — not a plugin-marketplace repo; run ki-plugins EDUCATE to scaffold one', STD, MKT_FILE)
  say(paint(C.red, '.claude-plugin/marketplace.json missing — not a plugin-marketplace repo'))
  say(paint(C.dim, 'run `ki-plugins` EDUCATE to scaffold one; nothing to conform here.'))
  emitJson()
  process.exit(1)
}

const mktRaw = readFileSync(mktPath, 'utf8')
let mkt: Record<string, unknown>
try {
  mkt = JSON.parse(mktRaw)
} catch {
  rec('FAIL', 'PLUG-1', 'marketplace.json is unparseable JSON — cannot conform, fix by hand', STD, MKT_FILE)
  say(paint(C.red, '.claude-plugin/marketplace.json is unparseable JSON — cannot conform, fix by hand'))
  emitJson()
  process.exit(1)
}

let mktChanged = false
const owner = (mkt.owner ?? {}) as Record<string, unknown>
if (owner.name !== ORG) {
  rec('POLISH', 'PLUG-2', `owner.name '${String(owner.name)}' → ${JSON.stringify(ORG)}`, STD, MKT_FILE)
  say(`  ${paint(C.green, 'fix')}   owner.name '${String(owner.name)}' → ${JSON.stringify(ORG)}`)
  mkt.owner = { ...owner, name: ORG }
  mktChanged = true
} else {
  rec('PASS', 'PLUG-2', `owner.name already ${JSON.stringify(ORG)}`, STD, MKT_FILE)
  say(`  ${paint(C.dim, 'ok')}     owner.name already ${JSON.stringify(ORG)}`)
}

const plugins = Array.isArray(mkt.plugins) ? (mkt.plugins as Record<string, unknown>[]) : null
if (!plugins) {
  rec('ADVISORY', 'PLUG-2', 'marketplace.json "plugins" is missing or not an array — author it by hand', STD, MKT_FILE)
} else if (plugins.length !== 1) {
  rec(
    'ADVISORY',
    'PLUG-2',
    `marketplace.json must list exactly one plugin, found ${plugins.length} — decide which entry is correct by hand`,
    STD,
    MKT_FILE
  )
}

let pluginName = ''
let mktDescription = ''
if (plugins?.length === 1) {
  const p = plugins[0] as Record<string, unknown>
  if (typeof p.name === 'string') pluginName = p.name
  if (typeof p.description === 'string') mktDescription = p.description
  if (!pluginName) rec('ADVISORY', 'PLUG-3', 'marketplace.json: the plugin entry has no "name" — author it by hand', STD, MKT_FILE)
  if (!mktDescription)
    rec('ADVISORY', 'PLUG-3', 'marketplace.json: the plugin entry has no "description" — author it by hand', STD, MKT_FILE)
}

const mktCanonical = canonicalize(mkt)
const mktNeedsFormat = mktRaw !== mktCanonical && !mktChanged // already rewriting below if mktChanged
if (mktChanged || mktNeedsFormat) {
  rec('POLISH', 'PLUG-4', 'normalize to 2-space JSON + trailing newline', STD, MKT_FILE)
  say(`  ${paint(C.green, 'fix')}   normalize to 2-space JSON + trailing newline`)
  if (!dryRun) writeFileSync(mktPath, mktCanonical)
} else {
  rec('PASS', 'PLUG-4', 'already 2-space JSON with a trailing newline', STD, MKT_FILE)
  say(`  ${paint(C.dim, 'ok')}     already 2-space JSON with a trailing newline`)
}

// ── plugin.json ──
say(`\n${paint(C.cyan, 'plugin.json')}`)
const pjFile = pluginName ? `${pluginName}/.claude-plugin/plugin.json` : 'plugin.json'
if (!pluginName) {
  say(`  ${paint(C.dim, 'skipped — no resolvable plugin name (see advisory findings)')}`)
} else if (!existsSync(at(pluginName))) {
  rec('ADVISORY', 'PLUG-3', `${pluginName}/: plugin source dir does not exist — cannot conform its plugin.json`, STD, pluginName)
  say(`  ${paint(C.dim, `skipped — ${pluginName}/ does not exist`)}`)
} else {
  const pjPath = at(pluginName, '.claude-plugin', 'plugin.json')
  if (!existsSync(pjPath)) {
    rec('ADVISORY', 'PLUG-5', `${pjFile} missing — author it by hand (or regenerate via ki-binding)`, STD, pjFile)
    say(`  ${paint(C.dim, 'skipped — plugin.json missing')}`)
  } else {
    const pjRaw = readFileSync(pjPath, 'utf8')
    let pj: Record<string, unknown> | null
    try {
      pj = JSON.parse(pjRaw)
    } catch {
      rec('ADVISORY', 'PLUG-5', `${pjFile} is unparseable JSON — fix by hand`, STD, pjFile)
      say(`  ${paint(C.red, 'unparseable — cannot fix, see advisory findings')}`)
      pj = null
    }

    if (pj) {
      let pjChanged = false

      const version = typeof pj.version === 'string' ? pj.version : ''
      const validSemver = /^\d+\.\d+\.\d+/.test(version)
      if (!validSemver) {
        const harnessVersion = harnessPackageVersion()
        if (harnessVersion) {
          rec('POLISH', 'PLUG-7', `version '${version}' → ${JSON.stringify(harnessVersion)} (harness package.json)`, STD, pjFile)
          say(`  ${paint(C.green, 'fix')}   version '${version}' → ${JSON.stringify(harnessVersion)} (harness package.json)`)
          pj.version = harnessVersion
          pjChanged = true
        } else {
          rec('ADVISORY', 'PLUG-7', `${pjFile}: version missing/invalid and harness package.json version unavailable`, STD, pjFile)
        }
      } else {
        rec('PASS', 'PLUG-7', `version ${JSON.stringify(version)} is semver`, STD, pjFile)
        say(`  ${paint(C.dim, 'ok')}     version ${JSON.stringify(version)} is semver`)
      }

      if (mktDescription && pj.description !== mktDescription) {
        rec('POLISH', 'PLUG-7', 'description → matches the marketplace entry', STD, pjFile)
        say(`  ${paint(C.green, 'fix')}   description → matches the marketplace entry`)
        pj.description = mktDescription
        pjChanged = true
      } else if (mktDescription) {
        rec('PASS', 'PLUG-7', 'description already matches the marketplace entry', STD, pjFile)
        say(`  ${paint(C.dim, 'ok')}     description already matches the marketplace entry`)
      }

      const author = (pj.author ?? {}) as Record<string, unknown>
      if (author.name !== ORG) {
        rec(
          'ADVISORY',
          'PLUG-6',
          `${pjFile}: author.name should be ${JSON.stringify(ORG)}, got ${JSON.stringify(author.name)} — regenerate via ki-binding (projected content, not hand-fixed here)`,
          STD,
          pjFile
        )
      }

      const pjCanonical = canonicalize(pj)
      const pjNeedsFormat = pjRaw !== pjCanonical && !pjChanged
      if (pjChanged || pjNeedsFormat) {
        rec('POLISH', 'PLUG-4', 'normalize to 2-space JSON + trailing newline', STD, pjFile)
        say(`  ${paint(C.green, 'fix')}   normalize to 2-space JSON + trailing newline`)
        if (!dryRun) writeFileSync(pjPath, pjCanonical)
      } else {
        rec('PASS', 'PLUG-4', 'already 2-space JSON with a trailing newline', STD, pjFile)
        say(`  ${paint(C.dim, 'ok')}     already 2-space JSON with a trailing newline`)
      }
    }
  }
}

// ── judgment items — never guessed, always surfaced as advisory findings ──
say(`\n${paint(C.cyan, 'manual TODOs (judgment — not scripted)')}`)
const advisories = findings.filter((f) => f.level === 'ADVISORY')
if (advisories.length === 0) {
  say(`  ${paint(C.dim, 'none')}`)
} else {
  for (const a of advisories) say(`  - ${a.msg}`)
}
rec(
  'ADVISORY',
  'PLUG-11',
  "a missing marketplace.json entirely, a missing/incorrect plugin count, and the skills/ and agents/ projection content are owned by ki-binding's build-plugin.ts — regenerate, never hand-fix here",
  RUB
)
rec(
  'ADVISORY',
  'PLUG-16',
  'everything else audit.ts flags (repo scaffold files, [ki-plugins] .ki-config.toml marker, plugin name/source-dir agreement, stale projection) is authoring/regeneration judgment',
  RUB
)
say(
  "  - A missing marketplace.json entirely, a missing/incorrect plugin count, and the skills/ and agents/ projection content are owned by ki-binding's build-plugin.ts — regenerate, never hand-fix here."
)
say(
  '  - Everything else audit.ts flags (repo scaffold files, [ki-plugins] .ki-config.toml marker, plugin name/source-dir agreement, stale projection) is authoring/regeneration judgment.'
)
say(
  `\n${paint(C.dim, 'mechanical layer applied — re-run `bun skills/repo-structure/ki-plugins/scripts/audit.ts` (or `ki:plugins:audit`) to confirm findings clear.')}`
)

emitJson()
