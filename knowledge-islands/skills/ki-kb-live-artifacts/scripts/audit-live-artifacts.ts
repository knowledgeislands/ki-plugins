#!/usr/bin/env bun
/**
 * Mechanical checker for Knowledge Islands live artifact pairs.
 *
 *   bun scripts/audit-live-artifacts.ts [base-path] [--threshold-hours <n>]
 *
 * Checks:
 *   1. Index note (Live Artifacts.md) exists when artifact files are found.
 *   2. Each .md artifact has a same-stem .html in the same directory.
 *   3. Each .html has a matching .md (no orphaned renders).
 *   4. Paired .html is not older than .md beyond the sync threshold.
 *   5. .md files with frontmatter have required fields (status, renders).
 *
 * READ-ONLY. Exit code non-zero on any FAIL.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { basename, extname, join, resolve } from 'node:path'

const INDEX_NOTE = 'Live Artifacts.md'
const DEFAULT_ARTIFACTS_DIR = 'Admin/Operations/Live Artifacts'
const DEFAULT_THRESHOLD_HOURS = 24

const C = { reset: '\x1b[0m', dim: '\x1b[2m', green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m' }
const paint = (c: string, s: string) => `${c}${s}${C.reset}`

type Level = 'FAIL' | 'WARN' | 'INFO' | 'PASS'
type Finding = { level: Level; area: string; msg: string }
const ORDER: Level[] = ['FAIL', 'WARN', 'INFO', 'PASS']
const ICON: Record<Level, string> = { FAIL: '❌', WARN: '⚠️ ', INFO: 'ℹ️ ', PASS: '✅' }

const mk = () => {
  const f: Finding[] = []
  const push = (level: Level) => (area: string, msg: string) => void f.push({ level, area, msg })
  return { f, warn: push('WARN'), note: push('INFO') }
}

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

function auditLiveArtifacts(base: string, thresholdHours: number) {
  const { f, warn, note } = mk()

  const artifactsDir = join(base, DEFAULT_ARTIFACTS_DIR)
  if (!isDir(artifactsDir)) {
    note('structure', `${DEFAULT_ARTIFACTS_DIR}/ not found — no live artifacts to audit`)
    return { f }
  }

  const entries = listDir(artifactsDir)
  const mdFiles = entries.filter((p) => extname(p) === '.md' && !p.endsWith(`/${INDEX_NOTE}`))
  const htmlFiles = new Set(entries.filter((p) => extname(p) === '.html'))

  // LA-S-1: index note
  const indexPath = join(artifactsDir, INDEX_NOTE)
  if (mdFiles.length > 0 && !isFile(indexPath)) {
    warn('structure', `${DEFAULT_ARTIFACTS_DIR}/${INDEX_NOTE} is absent — create an index listing all artifacts`)
  } else if (mdFiles.length > 0) {
    note('structure', `${INDEX_NOTE} present (${mdFiles.length} artifact source(s) found)`)
  }

  // LA-S-2: each .md should have a same-stem .html
  const expectedHtmls = new Set<string>()
  for (const mdPath of mdFiles) {
    const stem = basename(mdPath, '.md')
    const htmlPath = join(artifactsDir, `${stem}.html`)
    expectedHtmls.add(htmlPath)
    const rel = mdPath.replace(`${base}/`, '')

    if (!isFile(htmlPath)) {
      warn('pairing', `${rel}: no matching .html found — artifact is unpublished`)
      continue
    }

    // LA-S-4: sync check
    const mdMtime = mtimeMs(mdPath)
    const htmlMtime = mtimeMs(htmlPath)
    const diffHours = (mdMtime - htmlMtime) / (1000 * 60 * 60)
    if (diffHours > thresholdHours) {
      warn('sync', `${rel}: .html is ${Math.round(diffHours)}h behind .md (threshold: ${thresholdHours}h) — regenerate the HTML`)
    }

    // LA-F-1/2: frontmatter on the .md
    const text = readFileSync(mdPath, 'utf8')
    const fm = parseFrontmatter(text)
    if (fm) {
      if (!fm.status) warn('frontmatter', `${rel}: missing required field 'status' (active | archived)`)
      else if (!['active', 'archived'].includes(fm.status))
        warn('frontmatter', `${rel}: status '${fm.status}' is not one of active / archived`)
      if (!fm.renders) warn('frontmatter', `${rel}: missing required field 'renders'`)
    }
  }

  // LA-S-3: orphaned .html files
  for (const htmlPath of htmlFiles) {
    if (!expectedHtmls.has(htmlPath)) {
      const rel = htmlPath.replace(`${base}/`, '')
      warn('pairing', `${rel}: .html has no matching .md — orphaned render (delete or create the source)`)
    }
  }

  return { f }
}

// ── CLI ──────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
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

console.log(`\nKnowledge Islands live artifacts audit — ${base}`)
console.log(`${'─'.repeat(60)}\n`)

const { f } = auditLiveArtifacts(base, thresholdHours)

if (f.length === 0) {
  console.log(paint(C.green, '✅  PASS — no issues found'))
  process.exit(0)
}

const byLevel: Partial<Record<Level, Finding[]>> = {}
for (const finding of f) {
  if (!byLevel[finding.level]) byLevel[finding.level] = []
  byLevel[finding.level]?.push(finding)
}

for (const level of ORDER) {
  const group = byLevel[level]
  if (!group?.length) continue
  console.log(paint(C.dim, `${ICON[level]}  ${level} (${group.length})\n`))
  for (const { area, msg } of group) {
    console.log(`   [${area}] ${msg}`)
  }
  console.log()
}

const counts = { fail: byLevel.FAIL?.length ?? 0, warn: byLevel.WARN?.length ?? 0 }
const summary = `${counts.fail} fail · ${counts.warn} warn`
console.log('─'.repeat(60))
console.log(paint(C.dim, summary))
console.log(paint(C.dim, 'mechanical checks only — judgment criteria in references/audit-rubric.md'))

process.exit(counts.fail > 0 ? 1 : 0)
