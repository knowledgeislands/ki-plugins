#!/usr/bin/env bun
/**
 * Mechanical CONFORM for the ki-kb-activities standard — an honest, normalize-only
 * conform: activity notes carry almost nothing a script may safely author, so the
 * one thing it mutates is the `Activities.md` index (append a missing entry, or
 * create the stub when absent — sanctioned by the CONFORM mode). Everything else
 * audit.ts flags needs a human call and is printed as a manual TODO — never guessed.
 *
 * Scope: a single target base (default cwd), matching the house conform shape
 * (`bun conform.ts .` / `ki:kb-activities:conform`). The activities-dir path, the
 * index filename, the frontmatter parse, the realization enumeration, and the
 * realization-specific field rules are kept in lockstep with audit.ts (same source
 * of truth, copied rather than imported so each script stays valid standalone, per
 * the composition-only rule).
 *
 *   bun scripts/conform.ts [path]        # default: cwd
 *   --dry-run                            # print the plan, mutate nothing
 *   --json                               # emit the cited-finding wrapper instead of prose
 *   --harness <path>                     # harness root, for slash-command skill TODOs
 *
 * `--json` reports the same finding wrapper audit.ts emits (cited-finding shape): each
 * action becomes a finding on the shared ladder (index entry appended/created → POLISH,
 * already-listed → PASS, judgment/manual-TODO → ADVISORY). `--json` governs *reporting*,
 * `--dry-run` governs *writing* — the two compose (a --json run still writes).
 *
 * Fixes (unambiguous, reversible):
 *   - `Activities.md` index (ACT-S-1): an activity note present on disk with no
 *     entry in the index gets one APPENDED to the end — existing entries and their
 *     order are never touched. When the index file is absent entirely, a minimal
 *     stub (`# Activities` header) is created first, then entries are appended (the
 *     CONFORM mode's step 2). A manual TODO is printed for every appended entry so
 *     the operator can move it to its correct reading-order position and enrich it.
 *
 * Deliberately NEVER touches (judgment → manual TODOs):
 *   - ACT-F-1 (`status` missing/invalid), ACT-F-2 (`realization` missing),
 *     ACT-F-3 (unknown `realization`) — status and realization are never guessed.
 *   - No frontmatter block at all — authoring one is judgment, not a fill-in.
 *   - ACT-R-1/2 (`slash-command` skill missing/absent) — scaffolding a SKILL.md is
 *     confirm-gated (invoke ki-skills NEW), never done here.
 *   - ACT-R-3 (`scheduled-task` missing `schedule_name`) — the operator supplies it
 *     and registers it in the external system; the script cannot.
 *   - Where within the index an appended entry belongs — printed as a TODO, never guessed.
 *
 * Zero npm dependencies (bun + node stdlib only). Exit code is non-zero only on an
 * unrecoverable error (target not a directory); findings/fixes never fail the run.
 */

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

// ── kept in lockstep with audit.ts ──
const KNOWN_REALIZATIONS = ['slash-command', 'scheduled-task', 'conversational', 'manual', 'workflow'] as const
const ACTIVITIES_INDEX = 'Activities.md'
const DEFAULT_ACTIVITIES_DIR = 'Admin/Operations/Activities'

const C = { reset: '\x1b[0m', dim: '\x1b[2m', green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m', cyan: '\x1b[36m' }
const paint = (c: string, s: string): string => `${c}${s}${C.reset}`

// Cited-finding shape, shared with audit.ts: `area` is the rubric CODE, `ref` its
// reference-doc pointer, `file` the path an action concerns (mirrors ki-authoring conform).
type Level = 'FAIL' | 'WARN' | 'POLISH' | 'ADVISORY' | 'INFO' | 'NA' | 'PASS'
type Finding = { level: Level; area: string; msg: string; ref?: string; file?: string }
const RUBRIC = 'references/audit-rubric.md'

const isDir = (p: string): boolean => existsSync(p) && statSync(p).isDirectory()
const isFile = (p: string): boolean => existsSync(p) && statSync(p).isFile()

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

// ── entry ──
function main(): void {
  const argv = process.argv.slice(2)
  const dryRun = argv.includes('--dry-run')
  const json = argv.includes('--json')
  let harnessPath: string | null = null
  let basePath = '.'
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--harness' && argv[i + 1]) {
      harnessPath = resolve(argv[++i] as string)
    } else if (!argv[i]?.startsWith('-')) {
      basePath = argv[i] as string
    }
  }

  // Collect-then-emit harness (mirrors ki-authoring conform): each action records a finding;
  // `say` prints the human line only when not in --json mode, so a direct run streams prose
  // while the aggregate consumes the wrapper. `--json` still writes — only --dry-run gates writes.
  const findings: Finding[] = []
  const rec = (level: Level, area: string, msg: string, ref?: string, file?: string): number =>
    findings.push({ level, area, msg, ref, file })
  const say = (line: string): void => {
    if (!json) console.log(line)
  }
  const emitJson = (): void => {
    if (!json) return
    const n = (l: Level): number => findings.filter((x) => x.level === l).length
    const summary = {
      fail: n('FAIL'),
      warn: n('WARN'),
      polish: n('POLISH'),
      advisory: n('ADVISORY'),
      info: n('INFO'),
      na: n('NA'),
      pass: n('PASS')
    }
    process.stdout.write(JSON.stringify({ concern: 'kb-activities', target, generatedAt: new Date().toISOString(), summary, findings }))
  }

  const base = resolve(basePath)
  const target = base
  if (!isDir(base)) {
    console.error(paint(C.red, `not a directory: ${base}`))
    process.exit(1)
  }

  const activitiesDir = join(base, DEFAULT_ACTIVITIES_DIR)
  const indexRel = `${DEFAULT_ACTIVITIES_DIR}/${ACTIVITIES_INDEX}`
  say(paint(C.dim, `target: ${activitiesDir}${dryRun ? '   (dry run)' : ''}\n`))

  if (!isDir(activitiesDir)) {
    rec('NA', 'ACT-S-2', 'no activities directory — nothing to conform', RUBRIC, `${DEFAULT_ACTIVITIES_DIR}/`)
    say(paint(C.dim, `${DEFAULT_ACTIVITIES_DIR}/ not found — no activities to conform`))
    emitJson()
    return
  }

  const notePaths = walkMd(activitiesDir).filter((p) => !p.endsWith(`/${ACTIVITIES_INDEX}`))
  const indexPath = join(activitiesDir, ACTIVITIES_INDEX)
  const hasIndex = isFile(indexPath)
  let indexContent = hasIndex ? readFileSync(indexPath, 'utf8') : ''

  const manualTodos: string[] = []
  // Records an ADVISORY finding (judgment — never guessed) and keeps the human-readable TODO list.
  const todo = (area: string, msg: string, file?: string): void => {
    rec('ADVISORY', area, msg, RUBRIC, file)
    manualTodos.push(file ? `${file}: ${msg}` : msg)
  }

  // ── a) append missing index entries (create the stub when absent) — ACT-S-1 ──
  say(paint(C.cyan, `index entries (${ACTIVITIES_INDEX})`))
  if (notePaths.length === 0) {
    rec('PASS', 'ACT-S-1', 'no activity notes found — nothing to index', RUBRIC, indexRel)
    say(`  ${paint(C.dim, 'no activity notes found — nothing to index')}`)
  } else {
    let appended = 0
    const appendLines: string[] = []
    for (const notePath of notePaths) {
      const rel = notePath.slice(activitiesDir.length + 1) // link target, relative to the index
      if (indexContent.includes(rel)) continue // already listed (link-target match)

      const text = readFileSync(notePath, 'utf8')
      const body = text.replace(/^---\n[\s\S]*?\n---\n/, '')
      const headingMatch = body.match(/^#\s+(.+)$/m)
      const title = headingMatch ? (headingMatch[1] as string).trim() : rel.replace(/\.md$/, '')

      appendLines.push(`- [${title}](${rel})`)
      rec('POLISH', 'ACT-S-1', `index entry appended for '${title}' → ${rel}`, RUBRIC, indexRel)
      todo('ACT-J-2', `move the appended entry for '${title}' to its correct position and enrich its description`, indexRel)
      say(`  ${paint(C.green, 'append')} ${title} → ${rel}`)
      appended++
    }

    if (appended === 0) {
      rec('PASS', 'ACT-S-1', 'every note is listed in the index', RUBRIC, indexRel)
      say(`  ${paint(C.dim, 'nothing to append — every note is listed')}`)
    } else if (!dryRun) {
      if (!hasIndex) indexContent = '# Activities\n\n'
      indexContent = `${indexContent.replace(/\n*$/, '\n')}${appendLines.join('\n')}\n`
      writeFileSync(indexPath, indexContent)
      if (!hasIndex) {
        rec('POLISH', 'ACT-S-1', 'Activities.md index stub created', RUBRIC, indexRel)
        say(`  ${paint(C.green, 'create')} ${ACTIVITIES_INDEX} (stub) — review the header and ordering`)
      }
    } else if (!hasIndex) {
      rec('POLISH', 'ACT-S-1', 'Activities.md index stub would be created (dry run)', RUBRIC, indexRel)
      say(`  ${paint(C.green, 'create')} ${ACTIVITIES_INDEX} (stub) — would be authored with the appended entries`)
    }
  }

  // ── b) frontmatter + realization findings → manual TODOs (never guessed) ──
  for (const notePath of notePaths) {
    const rel = notePath.slice(base.length + 1)
    const fm = parseFrontmatter(readFileSync(notePath, 'utf8'))
    if (!fm) {
      todo('ACT-F-1', 'no frontmatter block — author one by hand (status + realization at minimum)', rel)
      continue
    }

    // ACT-F-1
    const status = fm.status
    if (!status) {
      todo('ACT-F-1', "missing 'status' (active | paused | retired) — set it by hand, do not guess", rel)
    } else if (!['active', 'paused', 'retired'].includes(status)) {
      todo('ACT-F-1', `status '${status}' is not active / paused / retired — correct it by hand`, rel)
    }

    // ACT-F-2 / ACT-F-3
    const realization = fm.realization
    if (!realization) {
      todo('ACT-F-2', "missing 'realization' — set it by hand, do not guess", rel)
      continue
    }
    if (!(KNOWN_REALIZATIONS as readonly string[]).includes(realization)) {
      todo('ACT-F-3', `realization '${realization}' is not in the known list — confirm the agentic environment is documented`, rel)
    }

    // ACT-R-1/2
    if (realization === 'slash-command') {
      const skillName = fm.skill
      if (!skillName) {
        todo('ACT-R-1', "'slash-command' needs a 'skill' field naming the SKILL.md — add it by hand", rel)
      } else if (harnessPath) {
        if (!isFile(join(harnessPath, 'skills', skillName, 'SKILL.md'))) {
          todo('ACT-R-2', `skill '${skillName}' not found in the harness — scaffold it via ki-skills NEW (confirm-gated), not here`, rel)
        }
      } else {
        todo('ACT-R-2', `skill '${skillName}' declared — pass --harness <path> to verify it exists`, rel)
      }
    }

    // ACT-R-3
    if (realization === 'scheduled-task' && !fm.schedule_name) {
      todo('ACT-R-3', "'scheduled-task' needs a 'schedule_name' — supply it and register the task in the external system", rel)
    }
  }

  // ── judgment items — never guessed, always surfaced ──
  say(`\n${paint(C.cyan, 'manual TODOs (judgment — not scripted)')}`)
  if (manualTodos.length === 0) {
    say(`  ${paint(C.dim, 'none')}`)
  } else {
    for (const t of manualTodos) say(`  - ${t}`)
  }
  rec(
    'ADVISORY',
    'judgment',
    "everything else the rubric's [J] criteria flag (ACT-J-1..5: note clarity, index currency, retirement rationale) is judgment",
    RUBRIC
  )
  say(`  - Everything else the rubric's [J] criteria flag (ACT-J-1..5: note clarity, index currency, retirement rationale) is judgment.`)
  say(
    `\n${paint(C.dim, 'mechanical layer applied — re-run `bun scripts/audit.ts` (or `ki:kb-activities:audit`) to confirm findings clear.')}`
  )

  emitJson()
}

main()
