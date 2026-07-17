#!/usr/bin/env bun
/**
 * Mechanical CONFORM for the ki-decision-records standard — fixes the subset of
 * audit.ts's findings that are unambiguous and reversible, leaving everything
 * that needs a human call as a printed manual TODO.
 *
 * Scope: a single target repo (default cwd), matching the house conform shape
 * (conform.ts, conform.ts) — `bun conform.ts .` / `ki:decision-records:conform`.
 * KB-vs-code detection, decisions-dir resolution, index-file resolution, the DR
 * filename regex, and the prefix→decision_type map are kept in lockstep with
 * audit.ts (same source of truth, copied rather than imported so each script
 * stays valid standalone per the composition-only rule).
 *
 *   bun scripts/conform.ts [path]   # default: cwd
 *   --dry-run                            # print the plan, mutate nothing
 *   --json                               # emit the CHK-004 finding wrapper instead of prose
 *
 * `--json` reports the same finding wrapper audit.ts emits (CHK-004/010) — each action
 * becomes a finding on the shared ladder: a written/appended fix → POLISH, an
 * already-conformant no-op → PASS, an unfixable gate failure → FAIL, a judgment/manual
 * TODO → ADVISORY. area is the rubric code (kept in lockstep with audit.ts) and ref its
 * reference-doc pointer, so audit and conform render identically in the aggregate.
 * `--json` governs *reporting*; `--dry-run` governs *writing* — the two compose.
 *
 * Fixes:
 *   - `decision_type` frontmatter: when the field is missing, invalid, or
 *     inconsistent with what the filename prefix implies (FM-4 / FM-5 /
 *     PREFIX-TYPE-1), and frontmatter already exists, sets it to the value the
 *     prefix→type map derives. Frontmatter is never created from scratch (that's
 *     FM-0 — see below).
 *   - Index entries (INDEX-2): a DR file present on disk with no entry in the
 *     index (README.md in a code repo, Decisions.md in a KB) gets one APPENDED
 *     to the end of the index — existing entries and their order are never
 *     touched. A manual TODO is printed for every appended entry so the operator
 *     can move it to its correct reading-order position.
 *
 * Deliberately NEVER touches (judgment → manual TODOs):
 *   - FM-0 (frontmatter block missing entirely) — authoring a whole frontmatter
 *     block (title, tags, etc., not just decision_type) is judgment, not a
 *     mechanical fill-in.
 *   - FM-3 (`type` field wrong/missing), BODY-1/3/4 (heading, date, required
 *     sections), FILENAME-2 (serial collisions), INDEX-3 (dangling index entry),
 *     INDEX-8 (out-of-order serials) — all prose/authoring or reordering
 *     decisions, never auto-fixed here.
 *   - Where within the index an appended entry belongs — printed as a manual TODO,
 *     never guessed by this script.
 *
 * Zero npm dependencies (bun + node stdlib only). Exit code is non-zero only on
 * an unrecoverable error (decisions dir not found); findings/fixes never fail the run.
 */

import { readdir, readFile, stat, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'

// ── kept in lockstep with audit.ts ──
const PREFIX_TO_TYPE: Record<string, string> = {
  SDR: 'strategy',
  PDR: 'product',
  ADR: 'architecture',
  DDR: 'data',
  XDR: 'security',
  ODR: 'operations',
  GDR: 'governance',
  RDR: 'research',
  KDR: 'knowledge'
}
const DR_FILENAME_RE = /^(SDR|PDR|ADR|DDR|XDR|ODR|GDR|RDR|KDR)-([A-Z][A-Z0-9]*(?:-[A-Z][A-Z0-9]*)*)(-(\d{3,}))(-[a-z0-9-]+)?\.md$/
const ID_IN_ITEM = /^\s*(?:\d+\.|[-*])\s+.*?([A-Z]+DR-[A-Z][A-Z0-9-]+-\d{3,})/
const CODE_DIR = 'docs/decisions'
const KB_DIR = 'Admin/Governance/Decisions'

async function findKiConfig(startDir: string): Promise<string | null> {
  let dir = resolve(startDir)
  for (let i = 0; i < 10; i++) {
    const candidate = join(dir, '.ki-config.toml')
    try {
      await stat(candidate)
      return candidate
    } catch {
      const parent = dirname(dir)
      if (parent === dir) return null
      dir = parent
    }
  }
  return null
}

async function detectKbMode(baseDir: string): Promise<boolean> {
  const configPath = await findKiConfig(baseDir)
  if (!configPath) return false
  const content = await readFile(configPath, 'utf8')
  if (/^\s*repo_type\s*=\s*["']kb["']/m.test(content)) return true
  if (/^\[ki-kb\]/m.test(content)) return true
  return false
}

async function resolveDecisionsDir(target: string): Promise<{ dir: string; kbMode: boolean }> {
  const kbMode = await detectKbMode(target)
  for (const candidate of kbMode ? [KB_DIR, CODE_DIR] : [CODE_DIR, KB_DIR]) {
    try {
      const dir = join(target, candidate)
      await stat(dir)
      return { dir, kbMode }
    } catch {
      // not this one — try the next default
    }
  }
  return { dir: join(target, kbMode ? KB_DIR : CODE_DIR), kbMode }
}

const C = { reset: '\x1b[0m', dim: '\x1b[2m', green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m', cyan: '\x1b[36m' }
const paint = (c: string, s: string): string => `${c}${s}${C.reset}`

// Every criterion traces to the one reference doc, so `ref` is a constant pointer kept
// identical to audit.ts's REF (consistency: same criterion → same area+ref across both).
const REF = 'references/audit-rubric.md'

// Collect-then-emit harness (mirrors audit.ts / the ki-authoring conform). Each action
// records a finding; `say` prints the human line only when not in --json mode, so a direct
// run streams prose while the aggregate consumes the CHK-004 wrapper. area is the rubric
// code, ref its reference-doc pointer, file the DR path an action concerns.
type Level = 'FAIL' | 'WARN' | 'POLISH' | 'ADVISORY' | 'INFO' | 'NA' | 'PASS'
type Finding = { level: Level; area: string; msg: string; ref?: string; file?: string }

// ── entry ──
async function main() {
  const argv = process.argv.slice(2)
  const dryRun = argv.includes('--dry-run')
  const json = argv.includes('--json')
  const target = resolve(argv.find((a) => !a.startsWith('-')) ?? '.')

  const findings: Finding[] = []
  const rec = (level: Level, area: string, msg: string, file?: string, ref: string = REF) => findings.push({ level, area, msg, ref, file })
  const say = (line: string): void => {
    if (!json) console.log(line)
  }

  const { dir: resolvedDir, kbMode } = await resolveDecisionsDir(target)

  try {
    await stat(resolvedDir)
  } catch {
    console.error(paint(C.red, `decisions directory not found: ${resolvedDir}`))
    process.exit(1)
    return
  }

  say(paint(C.dim, `target: ${resolvedDir}   ${kbMode ? 'KB mode' : 'code mode'}${dryRun ? '   (dry run)' : ''}\n`))

  const entries = await readdir(resolvedDir)
  const drFiles = entries.filter((f) => DR_FILENAME_RE.test(f)).sort()
  const indexFile = kbMode ? 'Decisions.md' : 'README.md'
  const hasIndex = entries.includes(indexFile)
  const indexPath = join(resolvedDir, indexFile)
  let indexContent = hasIndex ? await readFile(indexPath, 'utf8') : ''

  const indexedIds = new Set<string>()
  for (const line of indexContent.split('\n')) {
    const idMatch = line.match(ID_IN_ITEM)
    if (idMatch) indexedIds.add(idMatch[1])
  }

  const manualTodos: string[] = []

  // ── a) decision_type frontmatter repair ──
  say(paint(C.cyan, 'decision_type frontmatter'))
  let fmFixes = 0
  for (const file of drFiles) {
    const match = DR_FILENAME_RE.exec(file)
    if (!match) continue
    const prefix = match[1] as string
    const expectedType = PREFIX_TO_TYPE[prefix]
    if (!expectedType) continue

    const filePath = join(resolvedDir, file)
    const content = await readFile(filePath, 'utf8')
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/)
    if (!fmMatch) {
      manualTodos.push(`${file}: FM-0 — no frontmatter block; author one by hand (not just decision_type)`)
      rec('ADVISORY', 'FM-0', 'no frontmatter block; author one by hand (not just decision_type)', file)
      continue
    }

    const fm = fmMatch[1] as string
    const dtMatch = fm.match(/^decision_type:\s*(.+)$/m)
    if (!dtMatch) {
      const newFm = `${fm}\ndecision_type: ${expectedType}`
      const newContent = content.replace(fmMatch[0], `---\n${newFm}\n---`)
      rec('POLISH', 'FM-4', `${dryRun ? 'would add' : 'added'} decision_type: ${expectedType}`, file)
      say(`  ${paint(C.green, 'fix')}   ${file} — add decision_type: ${expectedType}`)
      if (!dryRun) await writeFile(filePath, newContent)
      fmFixes++
      continue
    }

    const currentValue = dtMatch[1].trim()
    if (currentValue !== expectedType) {
      const newFm = fm.replace(/^decision_type:\s*.+$/m, `decision_type: ${expectedType}`)
      const newContent = content.replace(fmMatch[0], `---\n${newFm}\n---`)
      rec('POLISH', 'PREFIX-TYPE-1', `${dryRun ? 'would set' : 'set'} decision_type '${currentValue}' → '${expectedType}'`, file)
      say(`  ${paint(C.green, 'fix')}   ${file} — decision_type '${currentValue}' → '${expectedType}'`)
      if (!dryRun) await writeFile(filePath, newContent)
      fmFixes++
    }
  }
  if (fmFixes === 0) {
    rec('PASS', 'FM-4', 'decision_type frontmatter already conforms', indexFile)
    say(`  ${paint(C.dim, 'nothing to fix')}`)
  }

  // ── b) append missing index entries ──
  say(`\n${paint(C.cyan, `index entries (${indexFile})`)}`)
  if (!hasIndex) {
    manualTodos.push(`${indexFile}: INDEX-1 — index file missing entirely; author it by hand`)
    rec('ADVISORY', 'INDEX-1', 'index file missing entirely; author it by hand', indexFile)
    say(`  ${paint(C.dim, 'no index file — see manual TODOs')}`)
  } else {
    let appended = 0
    const appendLines: string[] = []
    for (const file of drFiles) {
      const match = DR_FILENAME_RE.exec(file)
      if (!match) continue
      const prefix = match[1]
      const scopeKey = match[2]
      const serial = match[4]
      const drId = `${prefix}-${scopeKey}-${serial}`
      if (indexedIds.has(drId)) continue

      const filePath = join(resolvedDir, file)
      const content = await readFile(filePath, 'utf8')
      const body = content.replace(/^---\n[\s\S]*?\n---\n/, '')
      const headingMatch = body.match(/^#\s+([A-Z]+DR-[A-Z][A-Z0-9-]+-\d{3,}):\s+(.+)$/m)
      const title = headingMatch ? headingMatch[2].trim() : '(title unknown — see file)'

      appendLines.push(`- [${drId}](${file}) — ${title}`)
      manualTodos.push(`${indexFile}: move the appended entry for ${drId} to its correct reading-order position`)
      rec(
        'POLISH',
        'INDEX-2',
        `${dryRun ? 'would append' : 'appended'} index entry for ${drId} — ${title} (then move to reading-order position)`,
        indexFile
      )
      say(`  ${paint(C.green, 'append')} ${drId} — ${title}`)
      appended++
    }
    if (appended === 0) {
      rec('PASS', 'INDEX-2', 'every DR file already has an index entry', indexFile)
      say(`  ${paint(C.dim, 'nothing to append')}`)
    } else if (!dryRun) {
      indexContent = `${indexContent.replace(/\n*$/, '\n')}${appendLines.join('\n')}\n`
      await writeFile(indexPath, indexContent)
    }
  }

  // ── judgment items — never guessed, always surfaced ──
  say(`\n${paint(C.cyan, 'manual TODOs (judgment — not scripted)')}`)
  if (manualTodos.length === 0) {
    say(`  ${paint(C.dim, 'none')}`)
  } else {
    for (const todo of manualTodos) say(`  - ${todo}`)
  }
  // Judgment handoff — always-on ADVISORY: the criteria conform cannot mechanically fix.
  rec(
    'ADVISORY',
    'judgment',
    'FM-3, BODY-1/3/4, FILENAME-2, INDEX-3, INDEX-8 and the [J] criteria are prose/authoring judgment — apply by reading',
    indexFile
  )
  say(`  - Everything else audit.ts flags (FM-3, BODY-1/3/4, FILENAME-2, INDEX-3, INDEX-8, …) is prose/authoring judgment.`)
  say(
    `\n${paint(C.dim, 'mechanical layer applied — re-run `bun scripts/audit.ts` (or `ki:decision-records:audit`) to confirm findings clear.')}`
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
      JSON.stringify({ concern: 'decision-records', target: resolvedDir, generatedAt: new Date().toISOString(), summary, findings })
    )
  }
}

main().catch((err) => {
  console.error(`ERROR: ${String(err)}`)
  process.exit(1)
})
