#!/usr/bin/env bun
/**
 * ki-bootstrap — BOOT-9: audit a target repo's vendored `.ki-meta/skills/` set
 * against what it *should* be. BOOT-11 additionally checks direct source copies
 * when the target carries matching canonical skills. Also emits BOOT-10, the always-on reminder that
 * AUDIT's judgmental sweep — ADR-KI-HARNESS-SKILLS-001's AUDIT contract, applied
 * transitively across every governed skill — still needs applying by the agent
 * running this; no mechanical check can decide judgment for it.
 *
 * The mechanical `.ki-meta/bin/ki-audit` self-check runs standalone (no harness, no
 * skills installed) — but it has no way to re-derive the expected set, since the
 * `implies:` graph lives in the harness's SKILL.md frontmatter, not anywhere copied
 * into the target. So this check runs from the harness side, the same way
 * re-bootstrapping already does: it resolves the expected set the same way
 * `bootstrap.ts` does (baseline ∪ declared `[ki-*]` tables ∪ the transitive
 * `implies:` closure, restricted to skills that actually carry a checker) and diffs
 * it against the target's `.ki-meta/skills/*` directories. Any drift — stale config,
 * an upstream skill add/remove, a partial re-vendor — surfaces as a WARN rather than
 * silently going unnoticed; `bun skills/keystone/ki-bootstrap/scripts/bootstrap.ts <target>`
 * fixes it by re-vendoring. In a source-bearing harness, a direct source-copy mismatch is
 * a ship-blocking FAIL rather than set drift.
 *
 * Usage: bun audit.ts [target-repo] [--json]   (read-only)
 *   --json   emit the shared CHK-004 finding wrapper instead of prose, so the
 *            aggregate renders BOOT-9/BOOT-10/BOOT-11 structured alongside every other checker.
 * Every repo — the harness included — vendors its own DECLARED coverage (the `.ki-config.toml`
 * `[ki-*]` tables + baseline + implies closure), so `ki:audit` fans out over exactly the
 * skills that govern it. Vendoring is always coverage-scoped; `--all` is a linking concept
 * only (the harness authoring hub links every skill), never a vendoring one (ADR-KI-HARNESS-007).
 */

import { existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { checkerScript, resolveSet, SkillResolutionError, vendorUnit } from './resolve.ts'

// Unified severity ladder — shared by every KI checker (enforcement-framework §2).
type Level = 'FAIL' | 'WARN' | 'POLISH' | 'ADVISORY' | 'INFO' | 'NA' | 'PASS'
// area is the rubric code (references/audit-rubric.md); ref is its reference-doc
// pointer; file names the path a file-scoped finding concerns. ref/file are optional
// and ride into --json for the aggregate to render (CHK-004/009/010).
type Finding = { level: Level; area: string; msg: string; ref?: string; file?: string }
const ORDER: Level[] = ['FAIL', 'WARN', 'POLISH', 'ADVISORY', 'INFO', 'NA', 'PASS']
const ICON: Record<Level, string> = { FAIL: '❌', WARN: '⚠️', POLISH: '✨', ADVISORY: '🧭', INFO: 'ℹ️', NA: '🚫', PASS: '✅' }
const findings: Finding[] = []
const add = (level: Level, area: string, msg: string, ref?: string, file?: string) => findings.push({ level, area, msg, ref, file })

const RUBRIC = 'references/audit-rubric.md'

const argv = process.argv.slice(2)
const target = resolve(argv.find((a) => !a.startsWith('--')) ?? '.')
const vendoredRoot = join(target, '.ki-meta', 'skills')

// ── report ────────────────────────────────────────────────────────────────────
// Shared emit harness — copy verbatim across KI checkers (enforcement-framework §2/§5).
function emit(items: Finding[], tgt: string, concern: string, title: string, footer: string): never {
  const a = process.argv.slice(2)
  const json = a.includes('--json')
  const ri = a.indexOf('--report')
  const report = ri !== -1
  const reportDir = report && a[ri + 1] && !a[ri + 1].startsWith('-') ? a[ri + 1] : join(tgt, '.ki-meta', 'audits')

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
      return rows.length
        ? [
            '',
            `## ${ICON[l]} ${l} (${rows.length})`,
            ...rows.map((r) => `- [${r.area}]${r.file ? ` ${r.file}` : ''} ${r.msg}${r.ref ? ` (${r.ref})` : ''}`)
          ]
        : []
    })
    writeFileSync(join(reportDir, `${concern}.md`), [`# ${concern} audit — ${tgt}`, '', `_${stamp}_`, '', tally, ...body, ''].join('\n'))
    writeFileSync(
      join(reportDir, `${concern}.json`),
      `${JSON.stringify({ concern, target: tgt, generatedAt: stamp, summary, findings: items }, null, 2)}\n`
    )
  }

  if (json) {
    process.stdout.write(`${JSON.stringify({ concern, target: tgt, generatedAt: stamp, summary, findings: items }, null, 2)}\n`)
  } else {
    console.log(`\n${title}\n${'─'.repeat(60)}`)
    for (const l of ORDER) {
      const rows = items.filter((f) => f.level === l)
      if (!rows.length) continue
      console.log(`\n${ICON[l]} ${l} (${rows.length})`)
      for (const r of rows) console.log(`   [${r.area}]${r.file ? ` ${r.file}` : ''} ${r.msg}${r.ref ? ` (${r.ref})` : ''}`)
    }
    console.log(`\n${'─'.repeat(60)}\n${tally}`)
    if (footer) console.log(footer)
    if (summary.fail > 0 || summary.warn > 0)
      console.log('→ to address: run /ki-bootstrap CONFORM   (re-vendor: bun skills/keystone/ki-bootstrap/scripts/bootstrap.ts <target>)')
    if (report) console.log(`report → ${join(reportDir, `${concern}.{md,json}`)}`)
    console.log('')
  }
  process.exit(summary.fail ? 1 : 0)
}

const emitBootstrap = (): never => emit(findings, target, 'bootstrap', `Bootstrap vendored-set audit  (${target})`, '')

function expectedResolvedSet(): string[] {
  try {
    return resolveSet(target, false, [])
  } catch (error) {
    if (!(error instanceof SkillResolutionError)) throw error
    add(
      'FAIL',
      'BOOT-9',
      `${error.message} — reconcile the declared .ki-config.toml table before auditing or re-vendoring`,
      RUBRIC,
      '.ki-config.toml'
    )
    return emitBootstrap()
  }
}
const resolved = expectedResolvedSet()

if (!existsSync(vendoredRoot)) {
  add('NA', 'BOOT-9', 'no .ki-meta/skills/ — nothing to check (not yet bootstrapped)', RUBRIC, '.ki-meta/skills/')
  emitBootstrap()
}

// Only skills with a discoverable checker are ever vendored (vendorSkill() in
// bootstrap.ts is a no-op for skills without one), so restrict the expectation to those.
const expected = resolved.filter((s) => checkerScript(s) !== null)
const actual = readdirSync(vendoredRoot, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name)
  .sort()

const missing = expected.filter((s) => !actual.includes(s))
const extra = actual.filter((s) => !expected.includes(s))

if (missing.length === 0 && extra.length === 0) {
  add(
    'PASS',
    'BOOT-9',
    `.ki-meta/skills/ matches the expected resolved set (${expected.length} skill${expected.length === 1 ? '' : 's'})`,
    RUBRIC,
    '.ki-meta/skills/'
  )
}

function targetSkillDir(skill: string): string | null {
  const root = join(target, 'skills')
  if (!existsSync(root)) return null
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const direct = join(root, entry.name)
    if (entry.name === skill && existsSync(join(direct, 'SKILL.md'))) return direct
    const nested = join(direct, skill)
    if (existsSync(join(nested, 'SKILL.md'))) return nested
  }
  return null
}

const drifted: string[] = []
let checked = 0
for (const skill of expected) {
  const localSkill = targetSkillDir(skill)
  if (!localSkill) continue
  for (const mode of ['audit', 'conform'] as const) {
    const unit = vendorUnit(skill, mode)
    if (unit?.kind !== 'file') continue
    const source = join(localSkill, unit.path)
    checked += 1
    const vendored = join(vendoredRoot, skill, `${mode}.ts`)
    if (!existsSync(source) || !lstatSync(source).isFile()) {
      drifted.push(`${skill}/${mode}.ts (canonical source missing or not a regular file)`)
      continue
    }
    if (!existsSync(vendored) || !lstatSync(vendored).isFile()) {
      drifted.push(`${skill}/${mode}.ts (vendored copy missing or not a regular file)`)
      continue
    }
    if (!readFileSync(source).equals(readFileSync(vendored))) drifted.push(`${skill}/${mode}.ts`)
  }
}
if (checked === 0) {
  add(
    'NA',
    'BOOT-11',
    'canonical skill sources are not inside the target repo; source-copy integrity is not applicable',
    RUBRIC,
    '.ki-meta/skills/'
  )
} else if (drifted.length) {
  add(
    'FAIL',
    'BOOT-11',
    `canonical source/vendor integrity mismatch: ${drifted.join(', ')} — restore or format sources, then re-bootstrap before committing`,
    RUBRIC,
    '.ki-meta/skills/'
  )
} else {
  add(
    'PASS',
    'BOOT-11',
    `${checked} direct file-kind vendor unit${checked === 1 ? '' : 's'} match canonical source byte-for-byte`,
    RUBRIC,
    '.ki-meta/skills/'
  )
}

// BOOT-10 is always-on and never mechanically decidable — a reminder handed off
// to the agent running AUDIT, per ADR-KI-HARNESS-SKILLS-001's AUDIT contract.
add(
  'ADVISORY',
  'BOOT-10',
  `apply each governed skill's own [J] judgment across the ${actual.length} vendored skill${actual.length === 1 ? '' : 's'} (lead agent where one exists, its audit-rubric.md otherwise) — the mechanical aggregate alone is not sufficient`,
  RUBRIC
)

if (missing.length)
  add(
    'WARN',
    'BOOT-9',
    `missing from .ki-meta/skills/: ${missing.join(', ')} — re-run \`bun skills/keystone/ki-bootstrap/scripts/bootstrap.ts ${target}\``,
    RUBRIC,
    '.ki-meta/skills/'
  )
if (extra.length)
  add(
    'WARN',
    'BOOT-9',
    `vendored but no longer expected: ${extra.join(', ')} — a dropped table or upstream implies change; re-bootstrap to prune`,
    RUBRIC,
    '.ki-meta/skills/'
  )

// Drift here is always conformable by re-vendoring (WARN, never FAIL) — mirrors BOOT-1.
emitBootstrap()
