#!/usr/bin/env bun
/**
 * Mechanical CONFORM for the ki-website (Eleventy + Tailwind site-build) standard.
 *
 * This is an honest normalize-only conform: almost everything audit.ts flags is
 * template/layout/config authoring, which is judgment and can never be safely
 * guessed. Only two findings are unambiguous, reversible, canonical-value fixes,
 * so those are the whole of what this script writes. Everything else is surfaced
 * as an ADVISORY manual TODO — never mutated.
 *
 *   bun scripts/conform.ts [path]   # default: cwd
 *   --dry-run                       # print the plan, mutate nothing
 *   --json                          # emit the finding wrapper instead of prose
 *
 * Fixes (unambiguous + reversible only):
 *   - `.ki-config.toml` [ki-website] opt-in table (WEB-41): when the marker table
 *     is absent, APPENDS the canonical bare table — the exact block `audit.ts
 *     --educate` emits. This table takes no per-repo keys, so the value is fully
 *     determined; no judgment is involved.
 *   - `.gitignore` dist entry (WEB-33): ensures the build output is ignored. In the
 *     site/ workspace layout, a misplaced root `/dist` entry is rewritten to
 *     `/site/dist`; a missing entry is appended (`site/dist` for the site/ layout,
 *     `dist` for a flat layout). The correct value is derived from the detected
 *     layout, so it is not a guess.
 *
 * Deliberately NEVER touches (judgment → ADVISORY manual TODOs, mirroring audit.ts's
 * categories): layout (WEB-6/WEB-9), stack (WEB-1/2/3), tailwind (WEB-18/19/20),
 * config (WEB-12/13/14/15/16), seo (WEB-26), scripts (WEB-30/31/32), wrangler
 * assets.directory (WEB-36, owned by ki-website-cloudflare), and any stray key under
 * [ki-website] (WEB-42 validate-down) — removal is the operator's call.
 *
 * `--json` reports the same finding wrapper audit.ts emits, so the aggregate renders
 * conform and audit identically: each action becomes a finding on the shared ladder
 * (file written/overwritten/fixed → POLISH, already-canonical → PASS, judgment /
 * manual TODO → ADVISORY). `--json` governs *reporting*; `--dry-run` governs
 * *writing* — the two compose (`--json` still writes unless `--dry-run` is also set).
 *
 * Kept in lockstep with audit.ts (copied, not imported, per the composition-only
 * rule so the script stays valid standalone): CONFIG_NAMES, the site-root
 * detection, KI_SECTION / the canonical [ki-website] block, the rubric codes, and
 * the .gitignore dist regexes.
 *
 * Zero npm dependencies (bun + node stdlib only). Exit code is non-zero only on an
 * unrecoverable error (target path missing); findings/fixes never fail the run.
 */

import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

// ── kept in lockstep with audit.ts ──
const CONFIG_NAMES = ['eleventy.config.ts', 'eleventy.config.js', 'eleventy.config.mjs', 'eleventy.config.cjs']
const KI_SECTION = 'ki-website'
const KI_DEFAULT = `# ${KI_SECTION} — opt-in marker: presence of this table opts the repo into the
# Eleventy + Tailwind site-build standard. It takes no per-repo keys today.
[${KI_SECTION}]
`
const STD = 'references/eleventy-site-standard.md'
const RUBRIC = 'references/audit-rubric.md'

const C = { reset: '\x1b[0m', dim: '\x1b[2m', green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m', cyan: '\x1b[36m' }
const paint = (c: string, s: string): string => `${c}${s}${C.reset}`

// Collect-then-emit harness (mirrors audit.ts). Each action records a finding; `say`
// prints the human line only when not in --json mode, so a direct run streams prose
// while the aggregate consumes the wrapper. area is the rubric code, ref its
// reference-doc pointer, file the path an action concerns.
type Level = 'FAIL' | 'WARN' | 'POLISH' | 'ADVISORY' | 'INFO' | 'NA' | 'PASS'
type Finding = { level: Level; area: string; msg: string; ref?: string; file?: string }
const findings: Finding[] = []
const rec = (level: Level, area: string, msg: string, ref?: string, file?: string) => findings.push({ level, area, msg, ref, file })

const argv = process.argv.slice(2)
const dryRun = argv.includes('--dry-run')
const json = argv.includes('--json')
const say = (line: string): void => {
  if (!json) console.log(line)
}

// ── entry ──
function main() {
  const target = resolve(argv.find((a) => !a.startsWith('-')) ?? '.')

  if (!existsSync(target) || !statSync(target).isDirectory()) {
    console.error(paint(C.red, `target path not found (or not a directory): ${target}`))
    process.exit(1)
    return
  }

  const at = (...p: string[]) => join(target, ...p)
  const has = (...p: string[]) => existsSync(at(...p))
  const read = (...p: string[]): string => {
    try {
      return readFileSync(at(...p), 'utf8')
    } catch {
      return ''
    }
  }

  // ── locate the site root: flat (repo root) or site/ subfolder ──
  const flatCfg = CONFIG_NAMES.find((f) => has(f))
  const siteCfg = CONFIG_NAMES.find((f) => has('site', f))
  const siteRoot = flatCfg ? '' : siteCfg ? 'site' : ''
  const layoutKnown = Boolean(flatCfg || siteCfg)

  say(
    paint(
      C.dim,
      `target: ${target}   ${layoutKnown ? (siteRoot ? 'site/ subfolder layout' : 'flat layout') : 'layout undetermined'}${dryRun ? '   (dry run)' : ''}\n`
    )
  )

  // ── a) .ki-config.toml [ki-website] opt-in table (WEB-41) ──
  say(paint(C.cyan, '.ki-config.toml [ki-website] table'))
  const kiPath = at('.ki-config.toml')
  const ki = read('.ki-config.toml')
  const kiTable = new RegExp(`^\\[${KI_SECTION}\\]`, 'm').test(ki)
  if (kiTable) {
    rec('PASS', 'WEB-41', `[${KI_SECTION}] table already present`, `${STD} §2`, '.ki-config.toml')
    say(`  ${paint(C.dim, 'already present')}`)
    // validate-down (WEB-42): unknown keys are the operator's call, not auto-removed.
    const body = ki.split(new RegExp(`^\\[${KI_SECTION}\\]`, 'm'))[1]?.split(/^\[/m)[0] ?? ''
    for (const m of body.matchAll(/^\s*([A-Za-z0-9_-]+)\s*=/gm)) {
      rec(
        'ADVISORY',
        'WEB-42',
        `unknown key under [${KI_SECTION}]: ${m[1]} — this table takes no keys today; remove by hand`,
        `${STD} §2`,
        '.ki-config.toml'
      )
      say(`  ${paint(C.yellow, 'todo')}  unknown key under [${KI_SECTION}]: ${m[1]} — remove by hand`)
    }
  } else {
    const newKi = ki ? `${ki.replace(/\n*$/, '\n')}\n${KI_DEFAULT}` : KI_DEFAULT
    rec('POLISH', 'WEB-41', `appended the canonical [${KI_SECTION}] opt-in table`, `${STD} §2`, '.ki-config.toml')
    say(`  ${paint(C.green, 'fix')}   append the canonical [${KI_SECTION}] opt-in table`)
    if (!dryRun) writeFileSync(kiPath, newKi)
  }

  // ── b) .gitignore dist entry (WEB-33) ──
  say(`\n${paint(C.cyan, '.gitignore dist entry')}`)
  const gitignorePath = at('.gitignore')
  const gitignore = read('.gitignore')
  // In the site/ layout the correct entry ignores site/dist; a flat layout ignores dist.
  const distCorrect = siteRoot ? /^\s*\/?site\/dist\/?\s*$/m.test(gitignore) : /^\s*\/?dist\/?\s*$/m.test(gitignore)
  const distRootMisplaced = siteRoot !== '' && /^\s*\/dist\/?\s*$/m.test(gitignore)
  if (distCorrect) {
    rec('PASS', 'WEB-33', `${siteRoot ? 'site/dist/' : 'dist/'} already correctly gitignored`, `${STD} §9`, '.gitignore')
    say(`  ${paint(C.dim, 'already correct')}`)
  } else if (!layoutKnown) {
    // No eleventy.config.* — the layout is undetermined, so the correct entry is
    // not derivable. Defer rather than guess.
    rec(
      'ADVISORY',
      'WEB-33',
      'no eleventy.config.* found — cannot derive the correct dist ignore; add it once the site layout exists',
      `${STD} §9`,
      '.gitignore'
    )
    say(`  ${paint(C.dim, 'layout undetermined — deferred')}`)
  } else if (distRootMisplaced) {
    // site/ layout but the ignore points at root /dist — rewrite to /site/dist.
    const newGi = gitignore.replace(/^(\s*)\/dist(\/?)(\s*)$/m, '$1/site/dist$2$3')
    rec('POLISH', 'WEB-33', 'rewrote misplaced /dist → /site/dist (site/ layout)', `${STD} §9`, '.gitignore')
    say(`  ${paint(C.green, 'fix')}   rewrite misplaced /dist → /site/dist (site/ layout)`)
    if (!dryRun) writeFileSync(gitignorePath, newGi)
  } else {
    const entry = siteRoot ? 'site/dist' : 'dist'
    const newGi = gitignore ? `${gitignore.replace(/\n*$/, '\n')}${entry}\n` : `${entry}\n`
    rec('POLISH', 'WEB-33', `appended '${entry}' (build output should not be committed)`, `${STD} §9`, '.gitignore')
    say(`  ${paint(C.green, 'fix')}   append '${entry}' (build output should not be committed)`)
    if (!dryRun) writeFileSync(gitignorePath, newGi)
  }

  // ── judgment items — never guessed, always surfaced (ADVISORY) ──
  say(`\n${paint(C.cyan, 'manual TODOs (judgment — not scripted)')}`)
  rec(
    'ADVISORY',
    'judgment',
    'everything else audit.ts flags is authoring/config judgment and is never auto-fixed: layout (WEB-6/9), stack (WEB-1/2/3), tailwind (WEB-18/19/20), config (WEB-12/13/14/15/16), seo (WEB-26), scripts (WEB-30/31/32), and wrangler assets.directory (WEB-36, ki-website-cloudflare) — apply by reading',
    RUBRIC
  )
  say(
    `  - Everything else audit.ts flags is authoring/config judgment and is never auto-fixed: layout (move flat eleventy.config.* under site/, create missing src/ subtrees), stack (@11ty/eleventy, drop astro/next/tsx), tailwind (remove stray tailwind.config.*, author main.css/tokens.css), config (portable-dist transform, addDataExtension, eleventy.before Tailwind hook, addWatchTarget), seo (seo-meta partial), scripts (ki:site:* family), and wrangler assets.directory (ki-website-cloudflare).`
  )
  say(`\n${paint(C.dim, 'mechanical layer applied — re-run `bun scripts/audit.ts .` (or `ki:website:audit`) to confirm findings clear.')}`)

  if (json) {
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
    process.stdout.write(JSON.stringify({ concern: 'website', target, generatedAt: new Date().toISOString(), summary, findings }))
  }
}

main()
