#!/usr/bin/env bun
/**
 * Mechanical CONFORM for the chezmoi dotfiles-management standard — the write-pass twin
 * of audit.ts's mechanical half.
 *
 *   bun scripts/conform.ts [path]   # default: cwd
 *   --dry-run                      # check-mode only, write nothing
 *   --json                         # emit the checker-contract wrapper instead of prose
 *
 * Scaffolds `.chezmoiignore` if missing (CHEZMOI-1) — the one criterion with no
 * legitimate reason to be absent and no per-repo content to preserve, so it's safe to
 * create unconditionally. Everything else in the standard is judgment-driven — see
 * SKILL.md Mode CONFORM step 2 — and is printed here as a manual TODO, never guessed or
 * auto-applied: restructuring shell config into the loader pattern, choosing Pattern A vs
 * B for a given app config, moving CLAUDE.md content between layers, and so on.
 *
 * Exit code is non-zero only on an unrecoverable error (target path missing); never
 * because judgment items remain outstanding.
 */
import { existsSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const C = { reset: '\x1b[0m', dim: '\x1b[2m', green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m', cyan: '\x1b[36m' }
const paint = (c: string, s: string): string => `${c}${s}${C.reset}`

const argv = process.argv.slice(2)
const dryRun = argv.includes('--dry-run')
const json = argv.includes('--json')
const target = argv.find((a) => !a.startsWith('-')) ?? '.'

if (!existsSync(target)) {
  console.error(paint(C.red, `${target}: no such path`))
  process.exit(2)
}

type Level = 'FAIL' | 'WARN' | 'POLISH' | 'ADVISORY' | 'INFO' | 'NA' | 'PASS'
type Finding = { level: Level; area: string; msg: string; ref?: string; file?: string }
const findings: Finding[] = []
const rec = (level: Level, area: string, msg: string, ref?: string, file?: string) => findings.push({ level, area, msg, ref, file })
const say = (line: string): void => {
  if (!json) console.log(line)
}

// ── CHEZMOI-1: scaffold .chezmoiignore if missing ─────────────────────────────
const chezmoiignorePath = join(target, '.chezmoiignore')
if (existsSync(chezmoiignorePath)) {
  rec('PASS', 'CHEZMOI-1', '.chezmoiignore already present', 'references/dotfiles-standard.md', '.chezmoiignore')
  say(paint(C.dim, '.chezmoiignore already present'))
} else if (dryRun) {
  rec('POLISH', 'CHEZMOI-1', 'would scaffold .chezmoiignore (--dry-run, not written)', 'references/dotfiles-standard.md', '.chezmoiignore')
  say(paint(C.yellow, 'would scaffold .chezmoiignore (--dry-run)'))
} else {
  writeFileSync(
    chezmoiignorePath,
    '# Files/directories chezmoi should never manage.\n# See references/dotfiles-standard.md (Repo layout & naming) in the ki-dotfiles-chezmoi skill.\n'
  )
  rec('POLISH', 'CHEZMOI-1', 'scaffolded an empty .chezmoiignore', 'references/dotfiles-standard.md', '.chezmoiignore')
  say(paint(C.green, 'scaffolded .chezmoiignore'))
}

// ── judgment handoff — printed, never auto-applied ────────────────────────────
const judgmentTodos = [
  ['PATTERN-J1', 'For each app-mutated config file, confirm Pattern A vs Pattern B matches its actual key composition.'],
  [
    'CONFIG-J1',
    'For every Pattern A writer, select and prove a format-preserving editor with explicit absent-path and fail-closed input behavior.'
  ],
  ['LAYER-J1', 'Confirm each piece of CLAUDE.md-style guidance sits at the right layer (repo-local / user-level / memory).'],
  ['CHEZMOI-J1', 'Confirm any .chezmoiignore negation is deliberate, not an accidentally-too-broad ignore rule.'],
  ['ETIQ-J1', 'Confirm audit findings were reported as file + one-line problem + options, never a silent fix.']
] as const

for (const [area, msg] of judgmentTodos) rec('ADVISORY', area, `${msg} (manual — not auto-applied)`, 'references/audit-rubric.md')

if (!json) {
  say('')
  say(paint(C.cyan, 'Judgment items (not auto-applied — see references/audit-rubric.md):'))
  for (const [area, msg] of judgmentTodos) say(`  [${area}] ${msg}`)
}

// ── report ────────────────────────────────────────────────────────────────────
const stamp = new Date().toISOString()
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

if (json) {
  process.stdout.write(`${JSON.stringify({ concern: 'dotfiles-chezmoi', target, generatedAt: stamp, summary, findings }, null, 2)}\n`)
}

process.exit(0)
