#!/usr/bin/env bun
/**
 * Mechanical checker for Knowledge Islands live artifact pairs.
 *
 *   bun scripts/audit.ts [base-path] [--threshold-hours <n>] [--json]
 *
 * Checks (rubric codes in references/audit-rubric.md):
 *   LA-S-1  Index note (Live Artifacts.md) exists when artifact files are found.
 *   LA-S-2  Each .md artifact has a same-stem .html in the same directory.
 *   LA-S-3  Each .html has a matching .md (no orphaned renders).
 *   LA-S-4  Paired .html is not older than .md beyond the sync threshold.
 *   LA-F-1  .md frontmatter carries `status` (active | archived).
 *   LA-F-2  .md frontmatter carries `renders`.
 *
 * Cited-finding shape (mirrors ki-authoring/scripts/audit.ts): each finding
 * carries `area` = the rubric code, `ref` = its reference-doc pointer, and
 * `file` = the path a file-scoped finding concerns. `--json` serialises the
 * findings verbatim for the aggregate to render.
 *
 * READ-ONLY. Exit code non-zero on any FAIL.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { basename, extname, join, resolve } from 'node:path'

const INDEX_NOTE = 'Live Artifacts.md'
const DEFAULT_ARTIFACTS_DIR = 'Admin/Operations/Live Artifacts'
const DEFAULT_THRESHOLD_HOURS = 24
const RUBRIC = 'references/audit-rubric.md'

const C = { reset: '\x1b[0m', dim: '\x1b[2m', green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m' }
const paint = (c: string, s: string) => `${c}${s}${C.reset}`

// area is the rubric code (references/audit-rubric.md); ref is its reference-doc
// pointer; file names the path a file-scoped finding concerns. ref/file are optional
// and ride into --json for the aggregate to render.
type Level = 'FAIL' | 'WARN' | 'ADVISORY' | 'INFO' | 'PASS'
type Finding = { level: Level; area: string; msg: string; ref?: string; file?: string }
const ORDER: Level[] = ['FAIL', 'WARN', 'ADVISORY', 'INFO', 'PASS']
const ICON: Record<Level, string> = { FAIL: '❌', WARN: '⚠️', ADVISORY: '🧭', INFO: 'ℹ️', PASS: '✅' }

const findings: Finding[] = []
const add = (level: Level, area: string, msg: string, ref?: string, file?: string) => findings.push({ level, area, msg, ref, file })

const isDir = (p: string) => existsSync(p) && statSync(p).isDirectory()
const isFile = (p: string) => existsSync(p) && statSync(p).isFile()
const mtimeMs = (p: string) => statSync(p).mtimeMs

function parseFrontmatter(text: string): Record<string, string> | null {
  if (!text.startsWith('---')) return null
  const end = text.indexOf('\n---', 3)
  if (end === -1) return null
  const block = text.slice(3, end)
  const out: Record<string, string> = {}
  for (const line of block.split('\n')) {
    const colon = line.indexOf(':')
    if (colon === -1) continue
    const key = line.slice(0, colon).trim()
    const val = line.slice(colon + 1).trim()
    if (key && val) out[key] = val
  }
  return out
}

function listDir(dir: string): string[] {
  if (!isDir(dir)) return []
  return readdirSync(dir).map((n) => join(dir, n))
}

function auditLiveArtifacts(base: string, thresholdHours: number): void {
  const artifactsDir = join(base, DEFAULT_ARTIFACTS_DIR)
  if (!isDir(artifactsDir)) {
    add('INFO', 'structure', `${DEFAULT_ARTIFACTS_DIR}/ not found — no live artifacts to audit`)
    return
  }

  const entries = listDir(artifactsDir)
  const mdFiles = entries.filter((p) => extname(p) === '.md' && !p.endsWith(`/${INDEX_NOTE}`))
  const htmlFiles = new Set(entries.filter((p) => extname(p) === '.html'))

  // LA-S-1: index note
  const indexPath = join(artifactsDir, INDEX_NOTE)
  if (mdFiles.length > 0 && !isFile(indexPath)) {
    add('WARN', 'LA-S-1', 'index note is absent — create an index listing all artifacts', RUBRIC, `${DEFAULT_ARTIFACTS_DIR}/${INDEX_NOTE}`)
  } else if (mdFiles.length > 0) {
    add(
      'INFO',
      'LA-S-1',
      `index note present (${mdFiles.length} artifact source(s) found)`,
      RUBRIC,
      `${DEFAULT_ARTIFACTS_DIR}/${INDEX_NOTE}`
    )
  }

  // LA-S-2: each .md should have a same-stem .html
  const expectedHtmls = new Set<string>()
  for (const mdPath of mdFiles) {
    const stem = basename(mdPath, '.md')
    const htmlPath = join(artifactsDir, `${stem}.html`)
    expectedHtmls.add(htmlPath)
    const rel = mdPath.replace(`${base}/`, '')

    if (!isFile(htmlPath)) {
      add('WARN', 'LA-S-2', 'no matching .html found — artifact is unpublished', RUBRIC, rel)
      continue
    }

    // LA-S-4: sync check
    const diffHours = (mtimeMs(mdPath) - mtimeMs(htmlPath)) / (1000 * 60 * 60)
    if (diffHours > thresholdHours) {
      add(
        'WARN',
        'LA-S-4',
        `.html is ${Math.round(diffHours)}h behind .md (threshold: ${thresholdHours}h) — regenerate the HTML`,
        RUBRIC,
        rel
      )
    }

    // LA-F-1/2: frontmatter on the .md
    const fm = parseFrontmatter(readFileSync(mdPath, 'utf8'))
    if (fm) {
      if (!fm.status) add('WARN', 'LA-F-1', "missing required field 'status' (active | archived)", RUBRIC, rel)
      else if (!['active', 'archived'].includes(fm.status))
        add('WARN', 'LA-F-1', `status '${fm.status}' is not one of active / archived`, RUBRIC, rel)
      if (!fm.renders) add('WARN', 'LA-F-2', "missing required field 'renders'", RUBRIC, rel)
    }
  }

  // LA-S-3: orphaned .html files
  for (const htmlPath of htmlFiles) {
    if (!expectedHtmls.has(htmlPath)) {
      const rel = htmlPath.replace(`${base}/`, '')
      add('WARN', 'LA-S-3', '.html has no matching .md — orphaned render (delete or create the source)', RUBRIC, rel)
    }
  }
}

// ── CLI ──────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const json = args.includes('--json')
let basePath = '.'
let thresholdHours = DEFAULT_THRESHOLD_HOURS

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--threshold-hours' && args[i + 1]) {
    thresholdHours = Number(args[++i])
  } else if (!args[i]?.startsWith('--')) {
    basePath = args[i] as string
  }
}

const base = resolve(basePath)
if (!isDir(base)) {
  console.error(`error: not a directory: ${base}`)
  process.exit(2)
}

auditLiveArtifacts(base, thresholdHours)

// Judgment handoff — the [J] criteria (LA-J-1..4) a reader assesses during AUDIT.
add(
  'ADVISORY',
  'judgment',
  'index accuracy, source authority, archive rationale, and name stability are judgment ([J]) — assess by reading',
  RUBRIC
)

const n = (l: Level): number => findings.filter((fnd) => fnd.level === l).length
const summary = { fail: n('FAIL'), warn: n('WARN'), advisory: n('ADVISORY'), info: n('INFO'), pass: n('PASS') }
const stamp = new Date().toISOString()

if (json) {
  process.stdout.write(JSON.stringify({ concern: 'kb-live-artifacts', target: base, generatedAt: stamp, summary, findings }))
} else {
  console.log(`\nKnowledge Islands live artifacts audit — ${base}`)
  console.log(`${'─'.repeat(60)}`)
  const real = findings.filter((fnd) => fnd.level !== 'PASS' || summary.fail + summary.warn === 0)
  if (real.length === 0) {
    console.log(paint(C.green, '\n✅  PASS — no issues found'))
  } else {
    for (const l of ORDER) {
      const rows = findings.filter((fnd) => fnd.level === l)
      if (!rows.length) continue
      console.log(`\n${ICON[l]} ${l} (${rows.length})`)
      for (const r of rows) console.log(`   [${r.area}]${r.file ? ` ${r.file}` : ''} ${r.msg}${r.ref ? ` (${r.ref})` : ''}`)
    }
  }
  console.log(`\n${'─'.repeat(60)}`)
  console.log(paint(C.dim, `FAIL=${summary.fail} WARN=${summary.warn}`))
  if (summary.fail + summary.warn > 0)
    console.log('→ to address: run /ki-kb-live-artifacts CONFORM   (judgment criteria: references/audit-rubric.md)')
  console.log(paint(C.dim, 'mechanical checks only — judgment criteria in references/audit-rubric.md'))
}

process.exit(summary.fail > 0 ? 1 : 0)
