#!/usr/bin/env bun
/**
 * Mechanical CONFORM for the ki-feature-definitions standard.
 *
 * This is an HONEST NORMALIZE-ONLY conform. Feature Definitions are a
 * behaviour-level specification: almost every audit.ts finding needs a human to
 * author prose (a requirement statement, a `_Verify:_` hook, an index/areas
 * table) or to make a judgment call (which prefix owns a requirement, whether a
 * duplicate ID is renumbered). None of that can be synthesised safely. So the
 * single fix this script applies is the one unambiguous, reversible
 * normalization the standard admits, and EVERYTHING else audit.ts flags is
 * surfaced as a printed manual TODO — never guessed.
 *
 * Scope: a single target (default cwd), matching the house conform shape
 * (`bun conform.ts .` / `ki:feature-definitions:conform`). The features-dir
 * resolution, the `## Gaps …` exemption, the requirement-heading regex
 * (REQ_HEADING_RE) and the any-H3 regex (H3_RE) are kept in lockstep with
 * audit.ts (same source of truth, copied rather than imported so each script
 * stays valid standalone per the composition-only rule).
 *
 *   bun scripts/conform.ts [path]   # default: cwd (repo root or the features dir)
 *   --dry-run                       # print the plan, mutate nothing
 *   --json                          # emit the CHK-004 finding wrapper instead of prose
 *
 * `--json` reports the same finding wrapper audit.ts emits (CHK-004/010): each action
 * becomes a finding on the shared ladder — a separator fix → POLISH, nothing-to-fix → PASS,
 * a manual authoring/judgment TODO → always-on ADVISORY. Each finding pins the SAME
 * (area, ref) audit.ts uses for that criterion, so the aggregate renders both identically.
 * `--json` governs *reporting*; `--dry-run` governs *writing* — the two compose.
 *
 * Fixes (unambiguous + reversible only):
 *   - Requirement-heading separator (ID-1): a heading of the form
 *     `### <PREFIX>-NNN <sep> <title>` whose separator is an en dash, a spaced
 *     or doubled hyphen, or an em dash missing its surrounding spaces is
 *     normalized to the canonical `### <PREFIX>-NNN — <title>`. Only headings
 *     OUTSIDE a `## Gaps …` section are touched, and only when the ID + title
 *     are otherwise well-formed (so nothing but the glyph changes).
 *
 * Deliberately NEVER touches (judgment / authoring → manual TODOs):
 *   - INDEX-1 (no index.md), INDEX-2 (no areas table) — authoring a registry.
 *   - AREA-1 (table lists a missing file), AREA-2 (area file unregistered) —
 *     creating a file, or filling an areas-table row (Area name, prefix choice,
 *     any description columns) is a judgment call, never a mechanical fill-in.
 *   - ID-1 where the heading is not a recognisable requirement at all (no ID, no
 *     title) — cannot be repaired without authoring.
 *   - ID-2 (prefix unregistered / registered to another file), ID-3 (duplicate
 *     ID — append-only, renumber by hand), REQ-1 (no RFC-2119 keyword),
 *     VERIFY-1 (no `_Verify:_` line) — all prose/authoring or judgment.
 *
 * Zero npm dependencies (bun + node stdlib only). Exit code is non-zero only on
 * an unrecoverable error (features dir not found); findings/fixes never fail the run.
 */

import { readdir, readFile, stat, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

// ── kept in lockstep with audit.ts ──
const INDEX_FILE = 'index.md'
const DEFAULT_SUBDIR = 'docs/features'
// A requirement heading: `### <PREFIX>-NNN — <title>` (canonical, em dash + spaces).
const REQ_HEADING_RE = /^###\s+([A-Z][A-Z0-9]*(?:-[A-Z][A-Z0-9]*)*)-(\d{3,})\s+—\s+(.+?)\s*$/
// Any level-3 heading.
const H3_RE = /^###\s+(.+?)\s*$/

// ── conform-only: the fixable near-miss of REQ_HEADING_RE ──
// A well-formed `### <PREFIX>-NNN` and a non-empty title, separated by a variant
// glyph — en dash (–), one/two hyphens (- / --), or an em dash with the wrong
// spacing. The ID (…-\d{3,}) and title are preserved verbatim; only the
// separator is rewritten to the canonical ` — `.
const NEAR_MISS_HEADING_RE = /^###\s+([A-Z][A-Z0-9]*(?:-[A-Z][A-Z0-9]*)*-\d{3,})\s*(?:[–—-]{1,2})\s*(\S.*?)\s*$/

// Reference pointer shared by every finding — the audit rubric is the canonical home of every
// criterion code. Kept identical to audit.ts's RUBRIC for cross-script consistency.
const RUBRIC = 'references/audit-rubric.md'

const C = { reset: '\x1b[0m', dim: '\x1b[2m', green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m', cyan: '\x1b[36m' }
const paint = (c: string, s: string): string => `${c}${s}${C.reset}`

// Prefer <target>/docs/features; fall back to the target itself when it already
// is the features dir. Mirrors audit.ts's docs/features default while accepting
// either a repo root (`conform.ts .`) or the features dir directly.
async function resolveFeaturesDir(target: string): Promise<string> {
  const nested = join(target, DEFAULT_SUBDIR)
  try {
    await stat(nested)
    return nested
  } catch {
    return target
  }
}

// ── entry ──
async function main() {
  const argv = process.argv.slice(2)
  const dryRun = argv.includes('--dry-run')
  const json = argv.includes('--json')
  const target = resolve(argv.find((a) => !a.startsWith('-')) ?? '.')

  const resolvedDir = await resolveFeaturesDir(target)

  // Collect-then-emit harness (mirrors audit.ts / ki-authoring's conform). Each action
  // records a finding; `say` prints the human line only when not in --json mode, so a direct
  // run streams prose while the aggregate consumes the single-line wrapper. area is the rubric
  // code, ref its reference pointer, file the feature-doc an action concerns (CHK-004/010).
  type Level = 'FAIL' | 'WARN' | 'POLISH' | 'ADVISORY' | 'INFO' | 'NA' | 'PASS'
  type Finding = { level: Level; area: string; msg: string; ref?: string; file?: string }
  const findings: Finding[] = []
  const rec = (level: Level, area: string, msg: string, ref?: string, file?: string) => findings.push({ level, area, msg, ref, file })
  const say = (line: string): void => {
    if (!json) console.log(line)
  }

  try {
    await stat(resolvedDir)
  } catch {
    console.error(paint(C.red, `features directory not found: ${resolvedDir}`))
    process.exit(1)
    return
  }

  say(paint(C.dim, `target: ${resolvedDir}${dryRun ? '   (dry run)' : ''}\n`))

  const entries = await readdir(resolvedDir)
  const areaFiles = entries.filter((f) => f.endsWith('.md') && f !== INDEX_FILE).sort()

  // ── requirement-heading separator normalization (ID-1, the fixable subset) ──
  say(paint(C.cyan, 'requirement-heading separator (→ canonical “ — ”)'))
  let headingFixes = 0
  for (const file of areaFiles) {
    const filePath = join(resolvedDir, file)
    const content = await readFile(filePath, 'utf8')
    const lines = content.split('\n')
    let changed = false
    let inGaps = false

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] as string
      const h2 = line.match(/^##\s+(.+?)\s*$/)
      if (h2) {
        // `## Gaps …` turns exemption on until the next `## ` heading.
        inGaps = /^gaps\b/i.test((h2[1] as string).trim())
        continue
      }
      if (inGaps) continue
      if (!H3_RE.test(line)) continue
      if (REQ_HEADING_RE.test(line)) continue // already canonical — leave it
      const near = line.match(NEAR_MISS_HEADING_RE)
      if (!near) continue // not a recognisable requirement heading → ID-1 manual TODO below
      const id = near[1] as string
      const title = near[2] as string
      const canonical = `### ${id} — ${title}`
      if (canonical === line) continue
      rec('POLISH', 'ID-1', `${id}: separator normalized to “ — ”${dryRun ? ' (dry run — not written)' : ''}`, RUBRIC, file)
      say(`  ${paint(C.green, 'fix')}   ${file} — ${id}: normalize separator to “ — ”`)
      lines[i] = canonical
      changed = true
      headingFixes++
    }

    if (changed && !dryRun) await writeFile(filePath, lines.join('\n'))
  }
  if (headingFixes === 0) {
    rec('PASS', 'ID-1', 'requirement-heading separators already canonical (nothing to fix)', RUBRIC)
    say(`  ${paint(C.dim, 'nothing to fix')}`)
  }

  // ── judgment / authoring items — never guessed, always surfaced as ADVISORY ──
  say(`\n${paint(C.cyan, 'manual TODOs (authoring / judgment — not scripted)')}`)
  const manualTodos: Array<[string, string]> = [
    ['INDEX-1', 'if docs/features/index.md is missing, author it by hand (the registry).'],
    ['INDEX-2', 'if index.md has no areas table (Prefix + File columns), author one.'],
    ['AREA-1', 'a file named in an areas table but absent on disk: create it, or drop the row.'],
    ['AREA-2', 'an area file not registered in the areas table: add its row (Area/prefix/file) by hand.'],
    ['ID-1', 'a level-3 heading that is not a recognisable `### <PREFIX>-NNN — title`: author the ID.'],
    ['ID-2', 'a requirement whose prefix is unregistered or registered to another file: reconcile the areas table.'],
    ['ID-3', 'a duplicate ID (append-only): renumber the newcomer with the next free serial.'],
    ['REQ-1', 'a requirement with no RFC-2119 keyword (MUST / SHOULD / MAY …): write the normative statement.'],
    ['VERIFY-1', 'a requirement with no `_Verify:_` line: add a concrete, checkable test hook.']
  ]
  for (const [code, todo] of manualTodos) {
    rec('ADVISORY', code, todo, RUBRIC)
    say(`  - ${code} — ${todo}`)
  }
  say(`  ${paint(C.dim, 'Run the audit for the exact files/lines each applies to.')}`)

  say(
    `\n${paint(C.dim, 'normalize layer applied — re-run `bun scripts/audit.ts` (or `ki:feature-definitions:audit`) to confirm findings clear.')}`
  )

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
    process.stdout.write(
      JSON.stringify({ concern: 'feature-definitions', target: resolvedDir, generatedAt: new Date().toISOString(), summary, findings })
    )
  }
}

main().catch((err) => {
  console.error(`ERROR: ${String(err)}`)
  process.exit(1)
})
