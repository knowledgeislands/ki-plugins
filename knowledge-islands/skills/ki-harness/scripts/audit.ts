#!/usr/bin/env bun
/**
 * Mechanical audit for a Knowledge Islands agentic harness.
 * Checks the [M]-tagged criteria in references/audit-rubric.md.
 * Judgment ([J]) criteria are assessed by the agent reading the rubric.
 *
 *   bun scripts/audit.ts [path-to-harness-root]   # default: cwd
 *   --json                                         # emit the finding wrapper (CHK-004/010)
 *   --report [dir]                                 # also write <concern>.{md,json}
 *
 * Findings carry a rubric `area` code, its reference-doc `ref`, and a `file` when
 * the concern is path-scoped — so the aggregate renders each on the shared ladder.
 * Zero npm dependencies (bun + node stdlib only). Exit code is non-zero only when
 * a FAIL-level criterion trips.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'

// ── severity ladder — shared by every KI checker (enforcement-framework §2) ──
type Level = 'FAIL' | 'WARN' | 'POLISH' | 'ADVISORY' | 'INFO' | 'NA' | 'PASS'
// area is the rubric code (references/audit-rubric.md); ref its reference-doc pointer;
// file names the path a file-scoped finding concerns. ref/file are optional and ride
// into --json for the aggregate to render (CHK-004/009/010).
type Finding = { level: Level; area: string; msg: string; ref?: string; file?: string }
const ORDER: Level[] = ['FAIL', 'WARN', 'POLISH', 'ADVISORY', 'INFO', 'NA', 'PASS']
const ICON: Record<Level, string> = { FAIL: '❌', WARN: '⚠️', POLISH: '✨', ADVISORY: '🧭', INFO: 'ℹ️', NA: '🚫', PASS: '✅' }
const findings: Finding[] = []
const add = (level: Level, area: string, msg: string, ref?: string, file?: string) => findings.push({ level, area, msg, ref, file })

// The standard doc every [M] criterion cites (standard §...).
const STD = 'references/harness-standard.md'

const root = resolve(process.argv[2] ?? '.')
if (!existsSync(root)) {
  console.error('usage: audit.ts <harness-root>   (path must exist)')
  process.exit(2)
}
const name = basename(root)

// ── helpers ──
function hasTomlTable(toml: string, table: string): boolean {
  const escaped = table.replace(/-/g, '\\-')
  return new RegExp(`^\\[${escaped}\\]`, 'm').test(toml)
}
function readPackageJson(path: string): Record<string, unknown> {
  if (!existsSync(path)) return {}
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>
  } catch {
    return {}
  }
}
function hasScript(pkg: Record<string, unknown>, script: string): boolean {
  const scripts = pkg.scripts as Record<string, unknown> | undefined
  return typeof scripts === 'object' && scripts !== null && script in scripts
}
function parseFrontmatterName(content: string): string | null {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/)
  if (!match) return null
  const nameMatch = (match[1] as string).match(/^name:\s*(.+)$/m)
  return nameMatch ? (nameMatch[1] as string).trim() : null
}
const check = (level: Level, area: string, ok: boolean, msg: string, ref?: string, file?: string): void => {
  add(ok ? 'PASS' : level, area, msg, ref, file)
}

// ── LAY — Directory layout and file presence ──
const PARTS = ['skills', 'agents', 'mcp', 'evals', 'hooks'] as const
for (const part of PARTS) {
  const dir = join(root, part)
  check('FAIL', 'LAY-1', existsSync(dir), `${part}/ directory must exist`, STD, `${part}/`)
  if (existsSync(dir)) {
    check('WARN', 'LAY-2', existsSync(join(dir, 'README.md')), 'README.md must exist', STD, `${part}/README.md`)
  }
}
check('FAIL', 'LAY-3', existsSync(join(root, 'CLAUDE.md')), 'CLAUDE.md must exist at harness root', STD, 'CLAUDE.md')
check('WARN', 'LAY-4', existsSync(join(root, 'ROADMAP.md')), 'ROADMAP.md must exist at harness root', STD, 'ROADMAP.md')
check('FAIL', 'LAY-5', existsSync(join(root, '.ki-config.toml')), '.ki-config.toml must exist at harness root', STD, '.ki-config.toml')

// ── PKG — package.json script families ──
const pkgPath = join(root, 'package.json')
if (!existsSync(pkgPath)) {
  add('FAIL', 'PKG-1', 'package.json missing — cannot check scripts', STD, 'package.json')
  add('FAIL', 'PKG-2', 'package.json missing — cannot check scripts', STD, 'package.json')
} else {
  const pkg = readPackageJson(pkgPath)
  check(
    'FAIL',
    'PKG-1',
    hasScript(pkg, 'ki:skills:link:project'),
    "must have a 'ki:skills:link:project' script (the ki-bootstrap delivery mechanism)",
    STD,
    'package.json'
  )
  check('FAIL', 'PKG-2', hasScript(pkg, 'ki:skills:audit'), "must have a 'ki:skills:audit' script", STD, 'package.json')
  for (const script of ['ki:skills:link:global', 'ki:skills:status', 'ki:skills:unlink', 'ki:skills:refresh-status', 'ki:eval']) {
    check(
      'WARN',
      'PKG-4',
      hasScript(pkg, script),
      `should have a '${script}' script (harness skill-management / eval surface)`,
      STD,
      'package.json'
    )
  }
  // PKG-6 — every ki:* key that shells `bun <path>` must reference a file that
  // exists. A dangling target means the key is dead on arrival — e.g. a vendored
  // .ki-meta/bin script the target was never bootstrapped to receive.
  const scripts = (pkg.scripts as Record<string, string> | undefined) ?? {}
  const isScriptPath = (t: string): boolean => /\.(ts|tsx|js|mjs|cjs|sh)$/.test(t) || t.startsWith('./') || t.startsWith('.ki-meta/')
  let danglers = 0
  for (const [key, cmd] of Object.entries(scripts)) {
    if (!key.startsWith('ki:') || typeof cmd !== 'string') continue
    for (const segment of cmd.split(/&&|\|\||[;|]/)) {
      const tokens = segment.trim().split(/\s+/)
      for (let i = 0; i < tokens.length - 1; i++) {
        if (tokens[i] !== 'bun' && tokens[i] !== 'bunx') continue
        const arg = tokens[i + 1] as string
        if (arg === 'run' || arg.startsWith('-') || !isScriptPath(arg)) continue
        if (!existsSync(join(root, arg))) {
          add('WARN', 'PKG-6', `script '${key}' shells 'bun ${arg}', which does not exist`, STD, 'package.json')
          danglers++
        }
      }
    }
  }
  if (danglers === 0) add('PASS', 'PKG-6', 'all ki:* `bun <path>` script targets resolve to a file', STD, 'package.json')
}

// ── CONFIG — .ki-config.toml declarations ──
const tomlPath = join(root, '.ki-config.toml')
if (!existsSync(tomlPath)) {
  add('NA', 'CONFIG-1', '.ki-config.toml missing — skipping table checks (LAY-5 already FAILs)', STD, '.ki-config.toml')
  add('NA', 'CONFIG-2', '.ki-config.toml missing', STD, '.ki-config.toml')
} else {
  const toml = readFileSync(tomlPath, 'utf8')
  check('FAIL', 'CONFIG-1', hasTomlTable(toml, 'ki-harness'), 'must have a [ki-harness] table', STD, '.ki-config.toml')
  check('WARN', 'CONFIG-2', hasTomlTable(toml, 'ki-repo'), 'should have a [ki-repo] table', STD, '.ki-config.toml')
}

// ── SKILLS — skills/ directory name vs SKILL.md name: matching ──
const skillsDir = join(root, 'skills')
if (existsSync(skillsDir)) {
  const names = new Map<string, string[]>()
  for (const entry of readdirSync(skillsDir)) {
    const entryPath = join(skillsDir, entry)
    if (!statSync(entryPath).isDirectory()) continue
    const skillMdPath = join(entryPath, 'SKILL.md')
    if (!existsSync(skillMdPath)) continue
    const declaredName = parseFrontmatterName(readFileSync(skillMdPath, 'utf8'))
    if (declaredName === null) {
      add('WARN', 'SKILLS-1', 'no parseable name: frontmatter', STD, `skills/${entry}/SKILL.md`)
      continue
    }
    check(
      'FAIL',
      'SKILLS-1',
      declaredName === entry,
      `directory name '${entry}' must match name: '${declaredName}' in SKILL.md`,
      STD,
      `skills/${entry}`
    )
    const existing = names.get(declaredName) ?? []
    existing.push(entry)
    names.set(declaredName, existing)
  }
  for (const [dupName, dirs] of names) {
    if (dirs.length > 1) {
      add('FAIL', 'SKILLS-2', `duplicate name: '${dupName}' in ${dirs.map((d) => `skills/${d}`).join(', ')}`, STD, 'skills/')
    }
  }
} else {
  add('NA', 'SKILLS-1', 'skills/ does not exist — skipping name checks', STD, 'skills/')
  add('NA', 'SKILLS-2', 'skills/ does not exist — skipping duplicate name check', STD, 'skills/')
}

// ── judgment surface ──
add('INFO', 'scope', 'harness container audit — five-part layout, CLAUDE.md, package.json families, .ki-config.toml tables, skills/ names')
add(
  'ADVISORY',
  'judgment',
  'CLAUDE-1..5 (coverage/freshness), LONG-1, and COLL-1 are [J] criteria — assess by reading the rubric. ROADMAP content discipline is governed by ki-project-roadmap.',
  'references/audit-rubric.md'
)

// ── report ──────────────────────────────────────────────────────────────────
// Shared emit harness — copy verbatim across KI checkers (enforcement-framework §2/§5).
function emit(items: Finding[], target: string, concern: string, title: string, footer: string): never {
  const argv = process.argv.slice(2)
  const json = argv.includes('--json')
  const ri = argv.indexOf('--report')
  const report = ri !== -1
  const reportDir = report && argv[ri + 1] && !argv[ri + 1].startsWith('-') ? argv[ri + 1] : join(target, '.ki-meta', 'audits')

  const n = (l: Level): number => items.filter((f) => f.level === l).length
  const summary = {
    fail: n('FAIL'),
    warn: n('WARN'),
    polish: n('POLISH'),
    advisory: n('ADVISORY'),
    info: n('INFO'),
    na: n('NA'),
    pass: n('PASS')
  }
  const tally = `FAIL=${summary.fail} WARN=${summary.warn} POLISH=${summary.polish} PASS=${summary.pass} ADVISORY=${summary.advisory} NA=${summary.na}`
  const stamp = new Date().toISOString()

  if (report) {
    mkdirSync(reportDir, { recursive: true })
    const body = ORDER.flatMap((l) => {
      const rows = items.filter((f) => f.level === l)
      return rows.length
        ? [
            '',
            `## ${ICON[l]} ${l} (${rows.length})`,
            ...rows.map((r) => `- [${r.area}]${r.file ? ` ${r.file}` : ''} ${r.msg}${r.ref ? ` (${r.ref})` : ''}`)
          ]
        : []
    })
    writeFileSync(join(reportDir, `${concern}.md`), [`# ${concern} audit — ${target}`, '', `_${stamp}_`, '', tally, ...body, ''].join('\n'))
    writeFileSync(
      join(reportDir, `${concern}.json`),
      `${JSON.stringify({ concern, target, generatedAt: stamp, summary, findings: items }, null, 2)}\n`
    )
  }

  if (json) {
    process.stdout.write(JSON.stringify({ concern, target, generatedAt: stamp, summary, findings: items }))
  } else {
    console.log(`\n${title}\n${'─'.repeat(60)}`)
    for (const l of ORDER) {
      const rows = items.filter((f) => f.level === l)
      if (!rows.length) continue
      console.log(`\n${ICON[l]} ${l} (${rows.length})`)
      for (const r of rows) console.log(`   [${r.area}]${r.file ? ` ${r.file}` : ''} ${r.msg}${r.ref ? ` (${r.ref})` : ''}`)
    }
    console.log(`\n${'─'.repeat(60)}\n${tally}`)
    if (footer) console.log(footer)
    if (summary.fail + summary.warn + summary.polish > 0)
      console.log('→ to address: run /ki-harness CONFORM   (judgment criteria: references/audit-rubric.md)')
    if (report) console.log(`report → ${join(reportDir, `${concern}.{md,json}`)}`)
    console.log('')
  }
  process.exit(summary.fail ? 1 : 0)
}

emit(
  findings,
  root,
  'harness',
  `Harness audit — ${name}  (${root})`,
  'Judgment criteria ([J]) are surfaced as ADVISORY — a reviewer must assess them by reading the rubric.'
)
