#!/usr/bin/env bun
/**
 * Mechanical auditor for the Knowledge Islands handoffs standard.
 *
 *   bun scripts/audit.ts <dir>      (default: .)
 *
 * Handoffs ride on a host artifact — a thematic plan file (ki-project-roadmap)
 * in a non-KB repository, or a stream proposal's Checklist (ki-kb-streams) in a
 * KB. This checker adds only the delegation-readiness delta: it scans the target
 * for artifacts that opt in with
 * `handoff: true` frontmatter and checks the opt-in marker contract. Run the host
 * artifact's audit (ki-project-roadmap / ki-kb-streams) separately for structure.
 *
 * Mechanical half (opt-in contract): a valid `tier`, a decisions-locked-vs-escalate
 * section, and a readiness marker. Judgment half (doctrine): surfaced as ADVISORY.
 *
 * Output is grouped by severity; exit code is non-zero iff any FAIL.
 * No dependencies — Node/Bun builtins only; no cross-skill imports.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

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

const rawTarget = process.argv[2] ?? '.'
const target = resolve(rawTarget)
if (!existsSync(target)) {
  console.error(`usage: audit.ts <dir>   (path must exist; got ${rawTarget})`)
  process.exit(2)
}

const VALID_TIERS = new Set(['haiku', 'sonnet', 'opus'])
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', '.ki-meta', '.attic', '.claude'])

// ── discover markdown files under the target ────────────────────────────────────
function walk(dir: string, out: string[]): void {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name)) walk(join(dir, e.name), out)
    } else if (e.isFile() && e.name.endsWith('.md')) {
      out.push(join(dir, e.name))
    }
  }
}

const files: string[] = []
if (statSync(target).isDirectory()) walk(target, files)
else files.push(target)

// ── check each opted-in artifact against the marker contract ────────────────────
let optedIn = 0
for (const path of files) {
  const content = readFileSync(path, 'utf8')
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/)
  if (!fmMatch) continue
  const fm: Record<string, string> = {}
  for (const line of fmMatch[1].split('\n')) {
    const m = line.match(/^([a-zA-Z-]+):\s*(.*)$/)
    if (m)
      fm[m[1]] = m[2]
        .trim()
        .replace(/\s+#.*$/, '')
        .replace(/^['"]|['"]$/g, '')
  }
  if (fm.handoff !== 'true') continue
  optedIn++
  const rel = relative(target, path) || path
  const body = content.slice(fmMatch[0].length)

  // HAND-1: valid tier
  if (!fm.tier)
    add('FAIL', 'HAND-1', `handoff artifact missing 'tier' (one of haiku | sonnet | opus)`, 'references/handoffs-standard.md', rel)
  else if (!VALID_TIERS.has(fm.tier))
    add('FAIL', 'HAND-1', `tier '${fm.tier}' not one of haiku | sonnet | opus`, 'references/handoffs-standard.md', rel)

  // HAND-2: decisions section naming both locked and escalate
  const hasDecisionsHeading = /^#{2,}\s+.*decisions/im.test(body)
  const namesLocked = /locked/i.test(body)
  const namesEscalate = /escalate/i.test(body)
  if (!hasDecisionsHeading) add('FAIL', 'HAND-2', `no decisions section (a '## Decisions' heading)`, 'references/handoffs-standard.md', rel)
  else if (!(namesLocked && namesEscalate))
    add(
      'FAIL',
      'HAND-2',
      `decisions section must distinguish 'locked' from 'escalate' (both labels present)`,
      'references/handoffs-standard.md',
      rel
    )

  // HAND-3: readiness marker
  const hasReadiness = 'readiness' in fm || /^#{2,}\s+readiness/im.test(body) || /\[[ xX]\]\s*readiness test/i.test(body)
  if (!hasReadiness)
    add(
      'WARN',
      'HAND-3',
      `no readiness marker (readiness: frontmatter, a '## Readiness' heading, or a 'Readiness test' checkbox)`,
      'references/handoffs-standard.md',
      rel
    )
}

// ── judgment surface (ADVISORY) ─────────────────────────────────────────────────
if (optedIn > 0) {
  add(
    'ADVISORY',
    'HAND-4',
    'locked decisions: confirm they are genuinely closed — no residual reasoning or open questions parked under "locked".',
    'references/handoffs-standard.md'
  )
  add(
    'ADVISORY',
    'HAND-6',
    'tier fit: confirm the assigned tier matches how concrete the steps are; a unit that needs the planning tier is under-decomposed.',
    'references/handoffs-standard.md'
  )
  add(
    'ADVISORY',
    'HAND-7',
    'readiness: confirm a cold agent at the assigned tier could execute phase 1 from the spec alone.',
    'references/handoffs-standard.md'
  )
} else {
  add('INFO', 'scope', `no handoff-opted-in artifacts (handoff: true) under ${rawTarget} — nothing to check.`)
}

if (findings.every((f) => f.level === 'INFO' || f.level === 'NA')) {
  add('PASS', 'handoffs', `${optedIn} handoff artifact(s) checked, ${rawTarget}`)
}

// ── report ──────────────────────────────────────────────────────────────────────
// Shared emit harness — copy verbatim across KI checkers (enforcement-framework §2/§5).
function emit(items: Finding[], tgt: string, concern: string, title: string, footer: string): never {
  const argv = process.argv.slice(2)
  const json = argv.includes('--json')
  const ri = argv.indexOf('--report')
  const report = ri !== -1
  const reportDir = report && argv[ri + 1] && !argv[ri + 1].startsWith('-') ? argv[ri + 1] : join(tgt, '.ki-meta', 'audits')

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
    if (summary.fail + summary.warn + summary.polish > 0)
      console.log('→ to address: run /ki-handoffs CONFORM   (judgment criteria: references/audit-rubric.md)')
    if (report) console.log(`report → ${join(reportDir, `${concern}.{md,json}`)}`)
    console.log('')
  }
  process.exit(summary.fail ? 1 : 0)
}

emit(
  findings,
  target,
  'handoffs',
  `Handoffs audit — ${rawTarget}`,
  'Judgment criteria ([J]) are surfaced as ADVISORY — a reviewer must assess them by reading the artifacts.'
)
