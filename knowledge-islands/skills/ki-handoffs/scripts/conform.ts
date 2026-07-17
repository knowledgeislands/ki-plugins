#!/usr/bin/env bun
/**
 * Mechanical CONFORM for the ki-handoffs standard — an honest normalize-only
 * conform. Of the three marker-contract findings audit.ts raises, only one has a
 * single unambiguous, reversible fix; the other two need a human authoring call
 * and are printed as manual TODOs, never guessed.
 *
 * Scope: a single target tree (default cwd), matching the house conform shape
 * (audit.ts / conform.ts) — `bun conform.ts .` / `ki:handoffs:conform`. Handoffs
 * ride on a host artifact (a ki-project-roadmap plan, a ki-kb-streams proposal
 * Checklist); this only touches the delegation-readiness delta on artifacts that opt in with
 * `handoff: true`. The file walk, frontmatter parse, opt-in test, tier set, and
 * the decisions / readiness detection are kept in lockstep with audit.ts (copied
 * rather than imported, so each script stays valid standalone per composition-only).
 *
 *   bun scripts/conform.ts [path]   # default: cwd
 *   --dry-run                       # print the plan, mutate nothing
 *
 * Fixes (the one safe normalize):
 *   - HAND-3 (readiness marker missing, WARN): when a `handoff: true` artifact has
 *     frontmatter but no readiness marker at all, adds `readiness: pending` to the
 *     frontmatter. `pending` is the standard's own explicit "cold-agent test not
 *     yet run" value — it records the honest unknown state, fabricates no result,
 *     and is trivially reversible. Frontmatter is never created from scratch.
 *
 * Deliberately NEVER touches (judgment → manual TODOs):
 *   - HAND-1 (tier missing/out-of-set, FAIL) — the cheapest-safe tier is a planning
 *     judgement about how concrete the steps are; there is no safe default to guess.
 *   - HAND-2 (decisions section missing, or not naming both locked + escalate, FAIL)
 *     — authoring which judgements are closed vs need the owner is the reasoning
 *     act itself, not a mechanical fill-in.
 *   - HAND-4..8 ([J] doctrine: closed-ness of locked decisions, definition-of-done,
 *     tier fit, real readiness, the ki-tokenomics deferral) — all read-and-assess.
 *
 * Zero npm dependencies (bun + node stdlib only). Exit code is non-zero only on an
 * unrecoverable error; findings/fixes never fail the run.
 */

import { readdir, readFile, stat, writeFile } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'

// ── kept in lockstep with audit.ts ──
const VALID_TIERS = new Set(['haiku', 'sonnet', 'opus'])
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', '.ki-meta', '.attic', '.claude'])

const C = { reset: '\x1b[0m', dim: '\x1b[2m', green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m', cyan: '\x1b[36m' }
const paint = (c: string, s: string): string => `${c}${s}${C.reset}`

// Collect-then-emit harness (mirrors audit.ts). Each action records a finding; `say`
// (defined in main once --json is parsed) prints the human line only when not in --json
// mode. area is the rubric code, ref its reference-doc pointer, file the path an action
// concerns (CHK-004/009/010). --json governs *reporting*; --dry-run governs *writing*.
type Level = 'FAIL' | 'WARN' | 'POLISH' | 'ADVISORY' | 'INFO' | 'NA' | 'PASS'
type Finding = { level: Level; area: string; msg: string; ref?: string; file?: string }
const findings: Finding[] = []
const rec = (level: Level, area: string, msg: string, ref?: string, file?: string) => findings.push({ level, area, msg, ref, file })
const STANDARD = 'references/handoffs-standard.md'

async function walk(dir: string, out: string[]): Promise<void> {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name)) await walk(join(dir, e.name), out)
    } else if (e.isFile() && e.name.endsWith('.md')) {
      out.push(join(dir, e.name))
    }
  }
}

// Parse a leading `--- ... ---` frontmatter block into a flat string map (audit.ts parity).
function parseFrontmatter(fmBody: string): Record<string, string> {
  const fm: Record<string, string> = {}
  for (const line of fmBody.split('\n')) {
    const m = line.match(/^([a-zA-Z-]+):\s*(.*)$/)
    if (m)
      fm[m[1]] = m[2]
        .trim()
        .replace(/\s+#.*$/, '')
        .replace(/^['"]|['"]$/g, '')
  }
  return fm
}

// ── entry ──
async function main() {
  const argv = process.argv.slice(2)
  const dryRun = argv.includes('--dry-run')
  const json = argv.includes('--json')
  const target = resolve(argv.find((a) => !a.startsWith('-')) ?? '.')
  const say = (line: string): void => {
    if (!json) console.log(line)
  }

  try {
    await stat(target)
  } catch {
    console.error(paint(C.red, `target path not found: ${target}`))
    process.exit(1)
    return
  }

  say(paint(C.dim, `target: ${target}${dryRun ? '   (dry run)' : ''}\n`))

  const files: string[] = []
  if ((await stat(target)).isDirectory()) await walk(target, files)
  else files.push(target)
  files.sort()

  const manualTodos: string[] = []
  let optedIn = 0
  let readinessFixes = 0

  say(paint(C.cyan, 'readiness marker (HAND-3)'))
  for (const path of files) {
    const content = await readFile(path, 'utf8')
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/)
    if (!fmMatch) continue
    const fm = parseFrontmatter(fmMatch[1] as string)
    if (fm.handoff !== 'true') continue
    optedIn++
    const rel = relative(target, path) || path
    const body = content.slice(fmMatch[0].length)

    // HAND-1: valid tier — judgment, never guessed.
    if (!fm.tier) {
      const msg = `add 'tier' frontmatter (haiku | sonnet | opus): the cheapest tier the spec makes safe`
      manualTodos.push(`${rel}: HAND-1 — ${msg}`)
      rec('ADVISORY', 'HAND-1', msg, STANDARD, rel)
    } else if (!VALID_TIERS.has(fm.tier)) {
      const msg = `tier '${fm.tier}' is out-of-set; set it to one of haiku | sonnet | opus`
      manualTodos.push(`${rel}: HAND-1 — ${msg}`)
      rec('ADVISORY', 'HAND-1', msg, STANDARD, rel)
    }

    // HAND-2: decisions section naming both locked and escalate — authoring, never guessed.
    const hasDecisionsHeading = /^#{2,}\s+.*decisions/im.test(body)
    const namesLocked = /locked/i.test(body)
    const namesEscalate = /escalate/i.test(body)
    if (!hasDecisionsHeading) {
      const msg = `add a '## Decisions' section splitting locked (closed) from escalate (needs owner)`
      manualTodos.push(`${rel}: HAND-2 — ${msg}`)
      rec('ADVISORY', 'HAND-2', msg, STANDARD, rel)
    } else if (!(namesLocked && namesEscalate)) {
      const msg = `decisions section must name both 'locked' and 'escalate' (use "Escalate: none" if empty)`
      manualTodos.push(`${rel}: HAND-2 — ${msg}`)
      rec('ADVISORY', 'HAND-2', msg, STANDARD, rel)
    }

    // HAND-3: readiness marker — the one safe normalize (add readiness: pending).
    const hasReadiness = 'readiness' in fm || /^#{2,}\s+readiness/im.test(body) || /\[[ xX]\]\s*readiness test/i.test(body)
    if (!hasReadiness) {
      const newContent = content.replace(fmMatch[0], `---\n${fmMatch[1]}\nreadiness: pending\n---`)
      rec('POLISH', 'HAND-3', `${rel} — added readiness: pending (cold-agent test not yet run)`, STANDARD, rel)
      say(`  ${paint(C.green, 'fix')}   ${rel} — add readiness: pending (cold-agent test not yet run)`)
      if (!dryRun) await writeFile(path, newContent)
      readinessFixes++
    }
  }
  if (optedIn === 0) {
    rec('INFO', 'scope', 'no handoff-opted-in artifacts (handoff: true) — nothing to conform')
    say(`  ${paint(C.dim, 'no handoff-opted-in artifacts (handoff: true) — nothing to conform')}`)
  } else if (readinessFixes === 0) {
    rec('PASS', 'HAND-3', 'readiness markers already present — nothing to fix', STANDARD)
    say(`  ${paint(C.dim, 'nothing to fix')}`)
  }

  // ── judgment items — never guessed, always surfaced ──
  say(`\n${paint(C.cyan, 'manual TODOs (judgment — not scripted)')}`)
  if (manualTodos.length === 0) {
    say(`  ${paint(C.dim, 'none')}`)
  } else {
    for (const todo of manualTodos) say(`  - ${todo}`)
  }
  rec(
    'ADVISORY',
    'judgment',
    'Everything else audit.ts flags (HAND-4..8: closed decisions, definition-of-done, tier fit, real readiness, ki-tokenomics deferral) is doctrine judgment — read and assess.',
    'references/audit-rubric.md'
  )
  say(
    `  - Everything else audit.ts flags (HAND-4..8: closed decisions, definition-of-done, tier fit, real readiness, ki-tokenomics deferral) is doctrine judgment — read and assess.`
  )
  say(`\n${paint(C.dim, 'normalize layer applied — re-run `bun scripts/audit.ts` (or `ki:handoffs:audit`) to confirm findings clear.')}`)

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
    process.stdout.write(JSON.stringify({ concern: 'handoffs', target, generatedAt: new Date().toISOString(), summary, findings }))
  }
}

main().catch((err) => {
  console.error(`ERROR: ${String(err)}`)
  process.exit(1)
})
