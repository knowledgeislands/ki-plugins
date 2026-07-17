#!/usr/bin/env bun
/**
 * ki-binding-chezmoi CONFORM — the write-pass twin of audit.ts.
 *
 *   bun scripts/conform.ts [chezmoi-repo]
 *   --dry-run                      # report only, write nothing
 *   --json                         # emit the checker-contract wrapper instead of prose
 *
 * The render path scaffolds NO target-repo file of its own (so no `owns:` frontmatter —
 * SHAPE-16). Its write pass is a composition: run each composed sibling's CONFORM in sequence,
 * then hand off the render step (edit `.chezmoidata`, then `chezmoi apply`) as a TODO — a
 * `chezmoi apply` mutates real surface configs and is never fired blindly from here. This
 * mirrors ki-binding, whose file-editable surfaces are conformed through chezmoi, not by a
 * script hand-editing a rendered config.
 *
 * Exit code is non-zero only on an unrecoverable error (target path missing); never because
 * judgment / render items remain outstanding.
 */
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

const C = { reset: '\x1b[0m', dim: '\x1b[2m', green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m', cyan: '\x1b[36m' }
const paint = (c: string, s: string): string => `${c}${s}${C.reset}`

const argv = process.argv.slice(2)
const json = argv.includes('--json')
const positional = argv.find((a) => !a.startsWith('-'))
const target = positional ? resolve(positional) : '.'

if (positional && !existsSync(target)) {
  console.error(paint(C.red, `${target}: no such path`))
  process.exit(2)
}

type Level = 'FAIL' | 'WARN' | 'POLISH' | 'ADVISORY' | 'INFO' | 'NA' | 'PASS'
type Finding = { level: Level; area: string; msg: string; ref?: string; file?: string }
const findings: Finding[] = []
const rec = (level: Level, area: string, msg: string, ref?: string, file?: string): void =>
  void findings.push({ level, area, msg, ref, file })
const say = (line: string): void => {
  if (!json) console.log(line)
}

const STD = 'references/binding-chezmoi-standard.md'

// ── composition handoff — printed, never auto-applied ──
// Each composed sibling owns its own write pass; the render step is a manual chezmoi apply.
const todos = [
  ['BINDCHEZ-1', 'Run `/ki-dotfiles-chezmoi CONFORM <chezmoi-repo>` — bring the chezmoi source repo into house shape first.'],
  ['BINDCHEZ-2', 'Run `/ki-binding CONFORM` — reconcile the surfaces (Code / Desktop / mcporter via the render, Cowork directly).'],
  ['BINDCHEZ-3', 'Ensure the chezmoi repo carries the MCP source data (`.chezmoidata/*mcp*`) and the `mcp-servers-json` render template.'],
  [
    'BINDCHEZ-6',
    'Render: edit the MCP source, preview with `chezmoi diff`, then `chezmoi apply` — never hand-edit a rendered surface config.'
  ]
] as const

for (const [area, msg] of todos) rec('ADVISORY', area, `${msg} (manual — not auto-applied)`, STD)

if (!json) {
  say(paint(C.cyan, 'ki-binding-chezmoi — render-path CONFORM (composition; no file scaffolded)'))
  say('')
  say(paint(C.cyan, 'Steps (not auto-applied — see references/binding-chezmoi-standard.md):'))
  for (const [area, msg] of todos) say(`  [${area}] ${msg}`)
}

// ── report ──
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
  process.stdout.write(`${JSON.stringify({ concern: 'binding-chezmoi', target, generatedAt: stamp, summary, findings }, null, 2)}\n`)
}

process.exit(0)
