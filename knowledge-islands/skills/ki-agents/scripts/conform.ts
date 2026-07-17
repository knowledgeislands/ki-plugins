#!/usr/bin/env bun
/**
 * Mechanical CONFORM for the ki-agents rubric — fixes the one unambiguous,
 * reversible finding from audit.ts and leaves everything else as a
 * printed manual TODO.
 *
 * Scope: this skill's CONFORM mode only auto-fixes LAY-3 (an agent file's
 * `name:` frontmatter does not match its own filename stem) — rewrites the
 * `name` field to match the stem. Every other mechanical finding
 * (NAME-1/2/3/4/5, DESC-1/2/3, PROMPT-1, LINK-1) and every judgment criterion
 * is printed as a manual TODO with its finding code — never auto-fixed here.
 *
 *   bun scripts/conform.ts [path]   # default: agents  (relative to cwd)
 *   --dry-run                                # print the plan, mutate nothing
 *   --json                                   # emit the shared finding wrapper instead of prose
 *
 * Reporting mirrors ki-authoring conform.ts: each action records a finding on the shared ladder
 * (a fix written/would-write → POLISH, an agent already in shape → PASS, a criterion this script
 * cannot mechanically fix → ADVISORY). The finding's `area` carries the rubric code (LAY-3, …) and
 * `ref` its reference-doc pointer — so audit and conform cite the same criterion the same way.
 * `--json` governs *reporting* (suppresses the prose, emits the wrapper); `--dry-run` governs
 * *writing* — the two compose, and `--json` on its own still writes.
 *
 * audit.ts must be invoked against an agents/ directory, not repo root
 * (see this repo's CLAUDE.md learned pattern) — this script's default target
 * is the sibling `agents` dir, and it resolves any `[path]` the same way
 * audit.ts's own discovery does (an `agents` dir itself, or a repo root
 * whose `agents/` subdir is preferred over walking the whole tree).
 *
 * Zero npm dependencies (bun + node stdlib only). Exit code is non-zero only
 * on unrecoverable setup errors (bad path) — findings left as manual TODOs
 * never fail the run.
 */

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'

const C = { reset: '\x1b[0m', dim: '\x1b[2m', green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m', cyan: '\x1b[36m' }
const paint = (c: string, s: string): string => `${c}${s}${C.reset}`

// Collect-then-emit harness (mirrors ki-authoring conform.ts). Each action records a finding on the
// shared ladder; `say` prints the human line only when not in --json mode, so a direct run streams
// prose while the aggregate consumes the wrapper. area is the rubric code, ref its reference-doc
// pointer, file the agent path an action concerns.
const RUBRIC = 'references/audit-rubric.md'
type Level = 'FAIL' | 'WARN' | 'POLISH' | 'ADVISORY' | 'INFO' | 'NA' | 'PASS'
type Finding = { level: Level; area: string; msg: string; ref?: string; file?: string }
const findings: Finding[] = []
const rec = (level: Level, area: string, msg: string, ref?: string, file?: string): void =>
  void findings.push({ level, area, msg, ref, file })

// When --json, emit the shared wrapper (single line) as the only stdout — the lowercased ladder
// summary plus the findings verbatim. --dry-run still writes; --json only changes reporting.
function emit(): void {
  if (!json) return
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
  process.stdout.write(JSON.stringify({ concern: 'agents', target, generatedAt: new Date().toISOString(), summary, findings }))
}

// --- minimal frontmatter parser (name field only — kept in lockstep with audit.ts's parser
// for the one field this script touches; not imported so each script stays valid standalone per
// the composition-only rule) --------------------------------------------------------------------
function findName(content: string): { value: string } | null {
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!m) return null
  const block = m[1] as string
  for (const l of block.split(/\r?\n/)) {
    const kv = l.match(/^name:(.*)$/)
    if (kv) {
      let value = (kv[1] as string).trim()
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      return { value }
    }
  }
  return null
}

// --- discovery (mirrors audit.ts's agentsRoot/discoverAgentFiles) -------------------------
function agentsRoot(abs: string): string {
  if (basename(abs) === 'agents') return abs
  const candidate = join(abs, 'agents')
  return existsSync(candidate) && statSync(candidate).isDirectory() ? candidate : abs
}

function discoverAgentFiles(p: string): string[] {
  const abs = resolve(p)
  if (!existsSync(abs)) return []
  if (statSync(abs).isFile()) return abs.endsWith('.md') ? [abs] : []
  const root = agentsRoot(abs)
  const out: string[] = []
  const walk = (d: string): void => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.name.startsWith('.') || e.name === 'node_modules') continue
      const fp = join(d, e.name)
      if (e.isDirectory() || e.isSymbolicLink()) {
        try {
          if (statSync(fp).isDirectory()) walk(fp)
        } catch {
          /* dangling symlink */
        }
      } else if (e.name.endsWith('.md') && e.name !== 'README.md') {
        out.push(fp)
      }
    }
  }
  walk(root)
  return out.sort()
}

// --- main ----------------------------------------------------------------------------------------
const rawArgs = process.argv.slice(2)
const dryRun = rawArgs.includes('--dry-run')
const json = rawArgs.includes('--json')
const say = (line: string): void => {
  if (!json) console.log(line)
}
const pathArgs = rawArgs.filter((a) => !a.startsWith('-'))
// Default target is the sibling `agents` dir (relative to cwd), never repo root — audit.ts
// must be pointed at agents/ per this repo's own learned pattern, and this script's default
// mirrors that.
const target = pathArgs[0] ?? 'agents'
const abs = resolve(target)

if (!existsSync(abs)) {
  console.error(paint(C.red, `path not found: ${abs}`))
  process.exit(1)
}

say(paint(C.dim, `ki-agents CONFORM (mechanical) — ${abs}${dryRun ? ' [dry-run]' : ''}`))

const files = discoverAgentFiles(abs)
if (files.length === 0) {
  rec('PASS', 'scope', 'no agents found — nothing to conform', RUBRIC)
  say(paint(C.dim, 'no agents found — nothing to conform'))
  emit()
  process.exit(0)
}

let fixed = 0

for (const file of files) {
  const content = readFileSync(file, 'utf8')
  const stem = basename(file).replace(/\.md$/, '')
  const found = findName(content)

  if (!found) {
    // No `name:` field at all (NAME-1) or no frontmatter block (LAY-1) — not this script's fix,
    // but record the handoff so the aggregate still sees it.
    rec('ADVISORY', 'NAME-1', `${basename(file)} has no name: field to conform — author it (or add frontmatter, LAY-1)`, RUBRIC, file)
    continue
  }

  if (found.value && found.value !== stem) {
    say(`\n${paint(C.cyan, basename(file))} ${paint(C.dim, file)}`)
    say(`  ${paint(C.yellow, '[LAY-3]')} \`name\` "${found.value}" does not match filename stem "${stem}"`)
    if (dryRun) {
      rec('POLISH', 'LAY-3', `\`name\` "${found.value}" does not match filename stem "${stem}" — would rewrite to "${stem}"`, RUBRIC, file)
      say(`  ${paint(C.dim, `would rewrite name: ${found.value} → ${stem}`)}`)
    } else {
      const fullLines = content.split(/\r?\n/)
      const nameLineIdx = fullLines.findIndex((l) => /^name:/.test(l))
      if (nameLineIdx !== -1) {
        fullLines[nameLineIdx] = `name: ${stem}`
        writeFileSync(file, fullLines.join('\n'))
        rec('POLISH', 'LAY-3', `\`name\` rewritten "${found.value}" → "${stem}" to match filename stem`, RUBRIC, file)
        say(`  ${paint(C.green, 'fixed')} name: ${found.value} → ${stem}`)
        fixed++
      }
    }
  } else {
    rec('PASS', 'LAY-3', `${basename(file)} \`name\` already matches filename stem`, RUBRIC, file)
  }
}

// --- everything else: printed as manual TODOs, never auto-fixed ---------------------------------
// One consolidated ADVISORY carries the judgment handoff into the aggregate (mirrors ki-authoring
// conform.ts's single judgment advisory); the human enumeration below stays as prose.
rec(
  'ADVISORY',
  'judgment',
  'the remaining mechanical findings (NAME-1/2/3/4/5, DESC-1/2/3, COLL-1) and every judgment criterion are not auto-fixed — run Mode AUDIT and apply by reading',
  RUBRIC
)
say(`\n${paint(C.cyan, 'manual TODOs (judgment — not auto-fixed by this script)')}`)
say(paint(C.dim, '  NAME-1  `name` missing from frontmatter — author it'))
say(paint(C.dim, '  NAME-2  `name` charset/length invalid — rename per the rubric'))
say(paint(C.dim, '  NAME-3  `name` starts/ends with a hyphen or contains "--" — rename'))
say(paint(C.dim, '  NAME-4  `name` contains an XML tag or a reserved word — rename'))
say(paint(C.dim, '  NAME-5  duplicate `name` across the agent set — rename one'))
say(paint(C.dim, '  DESC-1  `description` missing or empty — author it'))
say(paint(C.dim, '  DESC-2  `description` over the soft length cap — consider trimming'))
say(paint(C.dim, '  DESC-3  `description` contains an XML tag — remove it'))
say(paint(C.dim, '  COLL-1  shared quoted trigger phrase across agents — confirm each names the other as an off-ramp'))
say(
  paint(
    C.dim,
    '  … plus every judgment criterion in references/audit-rubric.md (delegation signal, role/lane, grounding, own-vs-defer, tools/model least-privilege, longevity) — apply by reading, run Mode AUDIT for the full list.'
  )
)

say(
  `\n${paint(C.cyan, 'summary')}: ${files.length} agent(s) scanned · ${fixed} fixed (LAY-3)${dryRun ? ' [dry-run — nothing written]' : ''}`
)
say('→ re-run `bun scripts/audit.ts <path>` to confirm, then Mode AUDIT for the judgment criteria.')
emit()
process.exit(0)
