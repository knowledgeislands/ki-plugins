#!/usr/bin/env bun
/**
 * Mechanical checker for Knowledge Islands activity notes.
 *
 *   bun scripts/audit-activities.ts [base-path] [--harness <harness-path>]
 *
 * Checks:
 *   1. Activities.md index exists when activity notes are found.
 *   2. Each activity note with frontmatter has `status` and `realization`.
 *   3. slash-command activities declare a `skill` that exists in the harness.
 *   4. scheduled-task activities declare a `schedule_name` and get an advisory
 *      to verify registration in the external scheduling environment.
 *
 * READ-ONLY. Exit code non-zero on any FAIL.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

const KNOWN_REALIZATIONS = ['slash-command', 'scheduled-task', 'conversational', 'manual', 'workflow'] as const
const ACTIVITIES_INDEX = 'Activities.md'
const DEFAULT_ACTIVITIES_DIR = 'Admin/Operations/Activities'

const C = { reset: '\x1b[0m', dim: '\x1b[2m', green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m', cyan: '\x1b[36m' }
const paint = (c: string, s: string) => `${c}${s}${C.reset}`

type Level = 'FAIL' | 'WARN' | 'ADVISORY' | 'INFO' | 'PASS'
type Finding = { level: Level; area: string; msg: string }
const ORDER: Level[] = ['FAIL', 'WARN', 'ADVISORY', 'INFO', 'PASS']
const ICON: Record<Level, string> = { FAIL: '❌', WARN: '⚠️ ', ADVISORY: '🧭', INFO: 'ℹ️ ', PASS: '✅' }

const mk = () => {
  const f: Finding[] = []
  const push = (level: Level) => (area: string, msg: string) => void f.push({ level, area, msg })
  return { f, fail: push('FAIL'), warn: push('WARN'), advisory: push('ADVISORY'), note: push('INFO') }
}

const isDir = (p: string) => existsSync(p) && statSync(p).isDirectory()
const isFile = (p: string) => existsSync(p) && statSync(p).isFile()

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

function walkMd(dir: string): string[] {
  const results: string[] = []
  if (!isDir(dir)) return results
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) results.push(...walkMd(p))
    else if (e.name.endsWith('.md')) results.push(p)
  }
  return results
}

function auditActivities(base: string, harnessPath: string | null) {
  const { f, warn, advisory, note } = mk()

  const activitiesDir = join(base, DEFAULT_ACTIVITIES_DIR)
  if (!isDir(activitiesDir)) {
    note('structure', `${DEFAULT_ACTIVITIES_DIR}/ not found — no activities to audit`)
    return { f }
  }

  const allMd = walkMd(activitiesDir)
  const activityNotes = allMd.filter((p) => !p.endsWith(`/${ACTIVITIES_INDEX}`))
  const indexPath = join(activitiesDir, ACTIVITIES_INDEX)

  if (activityNotes.length > 0 && !isFile(indexPath)) {
    warn('structure', `${DEFAULT_ACTIVITIES_DIR}/${ACTIVITIES_INDEX} is absent — create an index listing all activities`)
  } else if (activityNotes.length > 0) {
    note('structure', `${ACTIVITIES_INDEX} index present (${activityNotes.length} activity note(s) found)`)
  }

  for (const notePath of activityNotes) {
    const rel = notePath.replace(`${base}/`, '')
    const text = readFileSync(notePath, 'utf8')
    const fm = parseFrontmatter(text)
    if (!fm) {
      note('frontmatter', `${rel}: no frontmatter block — judgment check only`)
      continue
    }

    // ACT-F-1: status
    const status = fm.status
    if (!status) {
      warn('frontmatter', `${rel}: missing required field 'status' (active | paused | retired)`)
    } else if (!['active', 'paused', 'retired'].includes(status)) {
      warn('frontmatter', `${rel}: status '${status}' is not one of active / paused / retired`)
    }

    // ACT-F-2: realization
    const realization = fm.realization
    if (!realization) {
      warn('frontmatter', `${rel}: missing required field 'realization'`)
      continue
    }

    // ACT-F-3: unknown realization is advisory (open enumeration)
    if (!(KNOWN_REALIZATIONS as readonly string[]).includes(realization)) {
      advisory(
        'realization',
        `${rel}: realization '${realization}' is not in the known list — ensure the agentic environment is documented`
      )
    }

    // ACT-R-1/2: slash-command → skill must exist in harness
    if (realization === 'slash-command') {
      const skillName = fm.skill
      if (!skillName) {
        warn('realization', `${rel}: realization 'slash-command' requires a 'skill' field naming the SKILL.md`)
      } else if (harnessPath) {
        const skillFile = join(harnessPath, 'skills', skillName, 'SKILL.md')
        if (!isFile(skillFile)) {
          warn('realization', `${rel}: skill '${skillName}' declared but ${skillFile} not found — create the skill or correct the name`)
        }
      } else {
        advisory('realization', `${rel}: skill '${skillName}' declared but no harness path provided — pass --harness <path> to verify`)
      }
    }

    // ACT-R-3/4: scheduled-task → schedule_name + advisory to verify registration
    if (realization === 'scheduled-task') {
      const scheduleName = fm.schedule_name
      if (!scheduleName) {
        warn('realization', `${rel}: realization 'scheduled-task' requires a 'schedule_name' field`)
      } else {
        const env = fm.schedule_env ?? 'the external scheduling system'
        advisory('realization', `${rel}: verify '${scheduleName}' is registered and active in ${env}`)
      }
    }
  }

  return { f }
}

// ── CLI ──────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
let basePath = '.'
let harnessPath: string | null = null

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--harness' && args[i + 1]) {
    harnessPath = resolve(args[++i] as string)
  } else if (!args[i]?.startsWith('--')) {
    basePath = args[i] as string
  }
}

const base = resolve(basePath)
if (!isDir(base)) {
  console.error(`error: not a directory: ${base}`)
  process.exit(2)
}

console.log(`\nKnowledge Islands activities audit — ${base}`)
console.log(`${'─'.repeat(60)}\n`)

const { f } = auditActivities(base, harnessPath)

if (f.length === 0) {
  console.log(paint(C.green, `✅  PASS — no issues found`))
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

const counts = { fail: byLevel.FAIL?.length ?? 0, warn: byLevel.WARN?.length ?? 0, advisory: byLevel.ADVISORY?.length ?? 0 }
const summary = `${counts.fail} fail · ${counts.warn} warn · ${counts.advisory} advisory`
console.log('─'.repeat(60))
console.log(paint(C.dim, summary))
console.log(paint(C.dim, 'mechanical checks only — judgment criteria in references/audit-rubric.md'))

process.exit(counts.fail > 0 ? 1 : 0)
