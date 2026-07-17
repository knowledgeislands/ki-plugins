#!/usr/bin/env bun
/**
 * Mechanical CONFORM for the ki-harness standard — an honest normalize-only
 * conform. The harness standard governs the five-part *container*, and almost
 * everything audit.ts flags needs a human call (authoring a CLAUDE.md, choosing
 * a package.json script's command string, deciding whether a name/dir mismatch
 * is fixed by renaming the directory or editing the frontmatter). Those are
 * never guessed — they record as ADVISORY manual TODOs. Only two normalizations
 * are unambiguous and reversible, and this script applies just those.
 *
 *   bun scripts/conform.ts [path]   # default: cwd
 *   --dry-run                       # print the plan, mutate nothing
 *   --json                          # emit the finding wrapper instead of prose
 *
 * `--json` reports the same finding wrapper audit emits: each action becomes a
 * finding on the shared ladder (created/scaffolded/appended → POLISH, already
 * present/no-op → PASS, judgment/manual-TODO → ADVISORY), carrying the same
 * `area` rubric code + `ref` as the matching audit criterion, and `file` when the
 * action is path-scoped. `--json` governs *reporting*; `--dry-run` governs
 * *writing* — the two compose. Exit code is non-zero only on an unrecoverable
 * error (target path missing); never because findings were reported.
 *
 * Fixes (unambiguous, reversible):
 *   - LAY-1 / LAY-2: a missing part directory (or a present one lacking a
 *     README.md) is created from the canonical five-part template.
 *   - CONFIG-1: when `.ki-config.toml` exists but has no `[ki-harness]` table,
 *     a keyless `[ki-harness]` table is appended (presence alone is the
 *     declaration — a complete fix, not a stub).
 *
 * Deliberately NEVER touches (judgment → ADVISORY manual TODOs): LAY-3/4/5,
 * PKG-1/2/4, CONFIG-2, SKILLS-1/2, and the prose criteria CLAUDE-1..5.
 *
 * Zero npm dependencies (bun + node stdlib only).
 */

import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

// ── kept in lockstep with audit.ts ──
const STD = 'references/harness-standard.md'
const PARTS = ['skills', 'agents', 'mcp', 'evals', 'hooks'] as const
const ROOT_FILES = ['CLAUDE.md', 'ROADMAP.md', '.ki-config.toml', 'package.json'] as const
const PKG1_SCRIPT = 'ki:skills:link:project'
const PKG2_SCRIPT = 'ki:skills:audit'
const PKG4_SCRIPTS = ['ki:skills:link:global', 'ki:skills:status', 'ki:skills:unlink', 'ki:skills:refresh-status', 'ki:eval']

function hasTomlTable(toml: string, table: string): boolean {
  const escaped = table.replace(/-/g, '\\-')
  return new RegExp(`^\\[${escaped}\\]`, 'm').test(toml)
}
function parseFrontmatterName(content: string): string | null {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/)
  if (!match) return null
  const nameMatch = (match[1] as string).match(/^name:\s*(.+)$/m)
  return nameMatch ? (nameMatch[1] as string).trim() : null
}
async function exists(path: string): Promise<boolean> {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

const C = { reset: '\x1b[0m', dim: '\x1b[2m', green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m', cyan: '\x1b[36m' }
const paint = (c: string, s: string): string => `${c}${s}${C.reset}`

// ── collect-then-emit harness (mirrors audit.ts / ki-authoring conform) ──
type Level = 'FAIL' | 'WARN' | 'POLISH' | 'ADVISORY' | 'INFO' | 'NA' | 'PASS'
type Finding = { level: Level; area: string; msg: string; ref?: string; file?: string }
const findings: Finding[] = []
const rec = (level: Level, area: string, msg: string, ref?: string, file?: string) => findings.push({ level, area, msg, ref, file })

const argv = process.argv.slice(2)
const dryRun = argv.includes('--dry-run')
const json = argv.includes('--json')
const say = (line: string): void => {
  if (!json) console.log(line)
}

async function main() {
  const target = resolve(argv.find((a) => !a.startsWith('-')) ?? '.')
  if (!(await exists(target))) {
    console.error(paint(C.red, `harness root not found: ${target}`))
    process.exit(1)
    return
  }

  say(paint(C.dim, `target: ${target}${dryRun ? '   (dry run)' : ''}\n`))

  // ── a) five-part directories + shelf READMEs (LAY-1 / LAY-2) ──
  say(paint(C.cyan, 'five-part layout (skills/ agents/ mcp/ evals/ hooks/)'))
  let layFixes = 0
  for (const part of PARTS) {
    const dir = join(target, part)
    if (!(await exists(dir))) {
      rec('POLISH', 'LAY-1', `${part}/ ${dryRun ? 'would be created' : 'created'} (was missing)`, STD, `${part}/`)
      say(`  ${paint(C.green, 'mkdir')} ${part}/`)
      if (!dryRun) await mkdir(dir, { recursive: true })
      layFixes++
    } else {
      rec('PASS', 'LAY-1', `${part}/ present`, STD, `${part}/`)
    }
    const readme = join(dir, 'README.md')
    if (!(await exists(readme))) {
      const stub = `# \`${part}/\`\n\nEmpty shelf — no ${part} yet. TODO: describe what this part holds and its status.\n`
      rec(
        'POLISH',
        'LAY-2',
        `${part}/README.md ${dryRun ? 'would be scaffolded' : 'scaffolded'} (shelf stub — flesh out with real status/contents)`,
        STD,
        `${part}/README.md`
      )
      say(`  ${paint(C.green, 'write')} ${part}/README.md ${paint(C.dim, '(shelf stub)')}`)
      if (!dryRun) await writeFile(readme, stub)
      layFixes++
    } else {
      rec('PASS', 'LAY-2', `${part}/README.md present`, STD, `${part}/README.md`)
    }
  }
  if (layFixes === 0) say(`  ${paint(C.dim, 'nothing to create')}`)

  // ── b) keyless [ki-harness] table (CONFIG-1) ──
  say(`\n${paint(C.cyan, '.ki-config.toml [ki-harness] table')}`)
  const tomlPath = join(target, '.ki-config.toml')
  if (!(await exists(tomlPath))) {
    rec('ADVISORY', 'LAY-5', '.ki-config.toml missing at root — author by hand', STD, '.ki-config.toml')
    say(`  ${paint(C.dim, 'no .ki-config.toml — see manual TODOs (LAY-5)')}`)
  } else {
    const toml = await readFile(tomlPath, 'utf8')
    if (hasTomlTable(toml, 'ki-harness')) {
      rec('PASS', 'CONFIG-1', '[ki-harness] table already present', STD, '.ki-config.toml')
      say(`  ${paint(C.dim, '[ki-harness] already present')}`)
    } else {
      rec(
        'POLISH',
        'CONFIG-1',
        `keyless [ki-harness] table ${dryRun ? 'would be appended' : 'appended'} (presence is the declaration)`,
        STD,
        '.ki-config.toml'
      )
      say(`  ${paint(C.green, 'append')} [ki-harness]  ${paint(C.dim, '(keyless — presence is the declaration)')}`)
      if (!dryRun) await writeFile(tomlPath, `${toml.replace(/\n*$/, '\n')}\n[ki-harness]\n`)
    }
    if (!hasTomlTable(toml, 'ki-repo')) {
      rec('ADVISORY', 'CONFIG-2', 'no [ki-repo] table; its contents are owned by ki-repo — add by hand', STD, '.ki-config.toml')
    }
  }

  // ── surface the judgment findings as ADVISORY manual TODOs (never guessed) ──
  say(`\n${paint(C.cyan, 'manual TODOs (judgment — not scripted)')}`)
  const before = findings.length

  // LAY-3/4/5 — missing root files
  for (const file of ROOT_FILES) {
    if (file === 'package.json' || file === '.ki-config.toml') continue // handled above / in PKG scan
    if (!(await exists(join(target, file)))) {
      rec('ADVISORY', file === 'CLAUDE.md' ? 'LAY-3' : 'LAY-4', `${file} missing at root — author by hand`, STD, file)
    }
  }

  // PKG-1/2/4 — missing package.json scripts
  const pkgPath = join(target, 'package.json')
  if (!(await exists(pkgPath))) {
    rec('ADVISORY', 'PKG-1', 'package.json missing at root — author it with the required script families (PKG-1/2/4)', STD, 'package.json')
  } else {
    let scripts: Record<string, unknown> = {}
    try {
      const parsed = JSON.parse(await readFile(pkgPath, 'utf8')) as { scripts?: Record<string, unknown> }
      scripts = parsed.scripts ?? {}
    } catch {
      rec('ADVISORY', 'PKG-1', 'package.json could not be parsed as JSON — fix it by hand', STD, 'package.json')
    }
    const missing = [PKG1_SCRIPT, PKG2_SCRIPT, ...PKG4_SCRIPTS].filter((s) => !(s in scripts))
    if (missing.length > 0) {
      rec('ADVISORY', 'PKG-1', `add scripts (command strings are repo-specific, not guessed): ${missing.join(', ')}`, STD, 'package.json')
    }
  }

  // SKILLS-1/2 — name/dir mismatch and duplicates
  const skillsDir = join(target, 'skills')
  if (await exists(skillsDir)) {
    const names = new Map<string, string[]>()
    for (const entry of await readdir(skillsDir)) {
      const skillMd = join(skillsDir, entry, 'SKILL.md')
      if (!(await exists(skillMd))) continue
      const declared = parseFrontmatterName(await readFile(skillMd, 'utf8'))
      if (declared === null) {
        rec('ADVISORY', 'SKILLS-1', 'no parseable name: frontmatter', STD, `skills/${entry}/SKILL.md`)
        continue
      }
      if (declared !== entry) {
        rec(
          'ADVISORY',
          'SKILLS-1',
          `name: '${declared}' != dir '${entry}' — rename dir OR edit frontmatter (your call)`,
          STD,
          `skills/${entry}`
        )
      }
      const seen = names.get(declared) ?? []
      seen.push(entry)
      names.set(declared, seen)
    }
    for (const [dupName, dirs] of names) {
      if (dirs.length > 1) {
        rec('ADVISORY', 'SKILLS-2', `duplicate name: '${dupName}' in ${dirs.map((d) => `skills/${d}`).join(', ')}`, STD, 'skills/')
      }
    }
  }

  // prose judgment criteria — always surfaced
  rec(
    'ADVISORY',
    'judgment',
    'CLAUDE.md coverage/freshness (CLAUDE-1..5) is prose judgment — read the rubric. ROADMAP content discipline is governed by ki-project-roadmap.',
    'references/audit-rubric.md'
  )

  for (const f of findings.slice(before)) say(`  - [${f.area}]${f.file ? ` ${f.file}` : ''} ${f.msg}`)

  say(`\n${paint(C.dim, 'mechanical layer applied — re-run `bun scripts/audit.ts` (or `ki:harness:audit`) to confirm findings clear.')}`)

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
    process.stdout.write(JSON.stringify({ concern: 'harness', target, generatedAt: new Date().toISOString(), summary, findings }))
  }
}

main().catch((err) => {
  console.error(`ERROR: ${String(err)}`)
  process.exit(1)
})
