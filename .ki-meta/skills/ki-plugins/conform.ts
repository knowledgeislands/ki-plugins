#!/usr/bin/env bun
/**
 * Mechanical CONFORM for the ki-plugins standard — fixes the subset of
 * audit.ts's findings that are unambiguous and reversible, leaving
 * everything that needs a human/regenerate call as a printed manual TODO.
 *
 * Scope: a single target plugin-marketplace repo (default cwd), matching the
 * house conform shape (conform.ts, conform.ts) —
 * `bun scripts/conform.ts .` / `ki:plugins:conform`. The marketplace
 * manifest path, the org constant, and the plugin-entry shape are kept in
 * lockstep with audit.ts (same source of truth, copied rather than
 * imported so each script stays valid standalone per the composition-only rule).
 *
 *   bun scripts/conform.ts [path]   # default: cwd
 *   --dry-run                                 # print the plan, mutate nothing
 *
 * Fixes:
 *   - marketplace.json `owner.name` → the known-good org string audit.ts
 *     checks against ("Knowledge Islands"), when missing or wrong.
 *   - plugin.json `version` → the harness's own package.json version (this
 *     script runs from the harness, so it is the source of truth for "the
 *     harness package.json version at generation time" the audit rubric cites),
 *     when missing or not semver.
 *   - plugin.json `description` → the marketplace entry's plugin description,
 *     when it differs (the marketplace entry is the in-repo source of truth
 *     plugin.json must agree with).
 *   - JSON formatting: both manifests are rewritten 2-space-indented with a
 *     trailing newline whenever they parse but aren't already in that form.
 *
 * Deliberately NEVER touches (judgment → manual TODOs):
 *   - marketplace.json missing entirely (FAIL "not a plugin-marketplace repo")
 *     — scaffolding a whole marketplace repo is `ki-plugins` INIT, not a
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

const C = { reset: '\x1b[0m', dim: '\x1b[2m', green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m', cyan: '\x1b[36m' }
const paint = (c: string, s: string): string => `${c}${s}${C.reset}`

function harnessPackageVersion(): string | null {
  // This script lives at <harness>/skills/ki-plugins/scripts/conform.ts —
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

async function main() {
  const argv = process.argv.slice(2)
  const dryRun = argv.includes('--dry-run')
  const target = resolve(argv.find((a) => !a.startsWith('-')) ?? '.')

  console.log(paint(C.dim, `target: ${target}${dryRun ? '   (dry run)' : ''}\n`))

  const manualTodos: string[] = []
  const at = (...p: string[]) => join(target, ...p)

  // ── marketplace.json ──
  console.log(paint(C.cyan, 'marketplace.json'))
  const mktPath = at('.claude-plugin', 'marketplace.json')
  if (!existsSync(mktPath)) {
    console.error(paint(C.red, '.claude-plugin/marketplace.json missing — not a plugin-marketplace repo'))
    console.error(paint(C.dim, 'run `ki-plugins` INIT to scaffold one; nothing to conform here.'))
    process.exit(1)
    return
  }

  const mktRaw = readFileSync(mktPath, 'utf8')
  let mkt: Record<string, unknown>
  try {
    mkt = JSON.parse(mktRaw)
  } catch {
    console.error(paint(C.red, '.claude-plugin/marketplace.json is unparseable JSON — cannot conform, fix by hand'))
    process.exit(1)
    return
  }

  let mktChanged = false
  const owner = (mkt.owner ?? {}) as Record<string, unknown>
  if (owner.name !== ORG) {
    console.log(`  ${paint(C.green, 'fix')}   owner.name '${String(owner.name)}' → ${JSON.stringify(ORG)}`)
    mkt.owner = { ...owner, name: ORG }
    mktChanged = true
  } else {
    console.log(`  ${paint(C.dim, 'ok')}     owner.name already ${JSON.stringify(ORG)}`)
  }

  const plugins = Array.isArray(mkt.plugins) ? (mkt.plugins as Record<string, unknown>[]) : null
  if (!plugins) {
    manualTodos.push('marketplace.json: "plugins" is missing or not an array — author it by hand')
  } else if (plugins.length !== 1) {
    manualTodos.push(`marketplace.json: must list exactly one plugin, found ${plugins.length} — decide which entry is correct by hand`)
  }

  let pluginName = ''
  let mktDescription = ''
  if (plugins?.length === 1) {
    const p = plugins[0] as Record<string, unknown>
    if (typeof p.name === 'string') pluginName = p.name
    if (typeof p.description === 'string') mktDescription = p.description
    if (!pluginName) manualTodos.push('marketplace.json: the plugin entry has no "name" — author it by hand')
    if (!mktDescription) manualTodos.push('marketplace.json: the plugin entry has no "description" — author it by hand')
  }

  const mktCanonical = canonicalize(mkt)
  const mktNeedsFormat = mktRaw !== mktCanonical && !mktChanged // already rewriting below if mktChanged
  if (mktChanged || mktNeedsFormat) {
    console.log(`  ${paint(C.green, 'fix')}   normalize to 2-space JSON + trailing newline`)
    if (!dryRun) writeFileSync(mktPath, mktCanonical)
  } else {
    console.log(`  ${paint(C.dim, 'ok')}     already 2-space JSON with a trailing newline`)
  }

  // ── plugin.json ──
  console.log(`\n${paint(C.cyan, 'plugin.json')}`)
  if (!pluginName) {
    console.log(`  ${paint(C.dim, 'skipped — no resolvable plugin name (see manual TODOs)')}`)
  } else if (!existsSync(at(pluginName))) {
    manualTodos.push(`${pluginName}/: plugin source dir does not exist — cannot conform its plugin.json`)
    console.log(`  ${paint(C.dim, `skipped — ${pluginName}/ does not exist`)}`)
  } else {
    const pjPath = at(pluginName, '.claude-plugin', 'plugin.json')
    if (!existsSync(pjPath)) {
      manualTodos.push(`${pluginName}/.claude-plugin/plugin.json missing — author it by hand (or regenerate via ki-binding)`)
      console.log(`  ${paint(C.dim, 'skipped — plugin.json missing')}`)
    } else {
      const pjRaw = readFileSync(pjPath, 'utf8')
      let pj: Record<string, unknown>
      try {
        pj = JSON.parse(pjRaw)
      } catch {
        manualTodos.push(`${pluginName}/.claude-plugin/plugin.json is unparseable JSON — fix by hand`)
        pj = {}
        console.log(`  ${paint(C.red, 'unparseable — cannot fix, see manual TODOs')}`)
        pj = null as unknown as Record<string, unknown>
      }

      if (pj) {
        let pjChanged = false

        const version = typeof pj.version === 'string' ? pj.version : ''
        const validSemver = /^\d+\.\d+\.\d+/.test(version)
        if (!validSemver) {
          const harnessVersion = harnessPackageVersion()
          if (harnessVersion) {
            console.log(`  ${paint(C.green, 'fix')}   version '${version}' → ${JSON.stringify(harnessVersion)} (harness package.json)`)
            pj.version = harnessVersion
            pjChanged = true
          } else {
            manualTodos.push(`${pluginName}/plugin.json: version missing/invalid and harness package.json version unavailable`)
          }
        } else {
          console.log(`  ${paint(C.dim, 'ok')}     version ${JSON.stringify(version)} is semver`)
        }

        if (mktDescription && pj.description !== mktDescription) {
          console.log(`  ${paint(C.green, 'fix')}   description → matches the marketplace entry`)
          pj.description = mktDescription
          pjChanged = true
        } else if (mktDescription) {
          console.log(`  ${paint(C.dim, 'ok')}     description already matches the marketplace entry`)
        }

        const author = (pj.author ?? {}) as Record<string, unknown>
        if (author.name !== ORG) {
          manualTodos.push(
            `${pluginName}/plugin.json: author.name should be ${JSON.stringify(ORG)}, got ${JSON.stringify(author.name)} — regenerate via ki-binding (projected content, not hand-fixed here)`
          )
        }

        const pjCanonical = canonicalize(pj)
        const pjNeedsFormat = pjRaw !== pjCanonical && !pjChanged
        if (pjChanged || pjNeedsFormat) {
          console.log(`  ${paint(C.green, 'fix')}   normalize to 2-space JSON + trailing newline`)
          if (!dryRun) writeFileSync(pjPath, pjCanonical)
        } else {
          console.log(`  ${paint(C.dim, 'ok')}     already 2-space JSON with a trailing newline`)
        }
      }
    }
  }

  // ── judgment items — never guessed, always surfaced ──
  console.log(`\n${paint(C.cyan, 'manual TODOs (judgment — not scripted)')}`)
  if (manualTodos.length === 0) {
    console.log(`  ${paint(C.dim, 'none')}`)
  } else {
    for (const todo of manualTodos) console.log(`  - ${todo}`)
  }
  console.log(
    "  - A missing marketplace.json entirely, a missing/incorrect plugin count, and the skills/ and agents/ projection content are owned by ki-binding's build-plugin.ts — regenerate, never hand-fix here."
  )
  console.log(
    '  - Everything else audit.ts flags (repo scaffold files, [ki-plugins] .ki-config.toml marker, plugin name/source-dir agreement, stale projection) is authoring/regeneration judgment.'
  )
  console.log(
    `\n${paint(C.dim, 'mechanical layer applied — re-run `bun skills/ki-plugins/scripts/audit.ts` (or `ki:plugins:audit`) to confirm findings clear.')}`
  )
}

main().catch((err) => {
  console.error(`ERROR: ${String(err)}`)
  process.exit(1)
})
