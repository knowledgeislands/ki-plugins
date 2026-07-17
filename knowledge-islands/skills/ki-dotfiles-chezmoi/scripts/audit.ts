#!/usr/bin/env bun
/**
 * Mechanical auditor for the chezmoi dotfiles-management standard.
 *
 *   bun scripts/audit.ts <repo-path>
 *
 * Mechanical half: four real, self-contained filesystem checks (CHEZMOI-1, CHEZMOI-2, BIN-1,
 * GIT-1) — see references/audit-rubric.md. No package.json / ki-engineering dependency.
 *
 * Judgment half: surfaces the [J] criteria from references/audit-rubric.md as ADVISORY
 * findings. These cannot be automated — a reader must assess them.
 *
 * Output is grouped by severity; exit code is non-zero iff any FAIL. No dependencies —
 * Node/Bun builtins only; no cross-skill imports (checker-contract.md).
 */
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { basename, join } from 'node:path'

// Unified severity ladder — shared by every KI checker (checker-contract.md).
type Level = 'FAIL' | 'WARN' | 'POLISH' | 'ADVISORY' | 'INFO' | 'NA' | 'PASS'
type Finding = { level: Level; area: string; msg: string; ref?: string; file?: string }
const ORDER: Level[] = ['FAIL', 'WARN', 'POLISH', 'ADVISORY', 'INFO', 'NA', 'PASS']
const ICON: Record<Level, string> = { FAIL: '❌', WARN: '⚠️', POLISH: '✨', ADVISORY: '🧭', INFO: 'ℹ️', NA: '🚫', PASS: '✅' }
const findings: Finding[] = []
const add = (level: Level, area: string, msg: string, ref?: string, file?: string) => findings.push({ level, area, msg, ref, file })

const repo = process.argv[2]
if (!repo || !existsSync(repo)) {
  console.error('usage: audit.ts <repo-path>   (path must exist)')
  process.exit(2)
}
const at = (...p: string[]) => join(repo, ...p)
const has = (...p: string[]) => existsSync(at(...p))

function walk(dir: string, onFile: (path: string) => void, skip: (name: string) => boolean): void {
  let entries: string[]
  try {
    entries = readdirSync(dir)
  } catch {
    return
  }
  for (const entry of entries) {
    if (skip(entry)) continue
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) walk(full, onFile, skip)
    else onFile(full)
  }
}

const SKIP_DIRS = new Set(['.git', 'node_modules', '.ki-meta', '.claude'])

// ── CHEZMOI-1: .chezmoiignore present ─────────────────────────────────────────
if (has('.chezmoiignore')) {
  add('PASS', 'CHEZMOI-1', '.chezmoiignore present', 'references/dotfiles-standard.md')
} else {
  add(
    'FAIL',
    'CHEZMOI-1',
    '.chezmoiignore missing — run CONFORM to scaffold an empty one',
    'references/dotfiles-standard.md',
    '.chezmoiignore'
  )
}

// ── CHEZMOI-2: .chezmoidata/.chezmoitemplates present iff .tmpl files exist ──
let hasTmplFiles = false
walk(
  repo,
  (path) => {
    if (path.endsWith('.tmpl')) hasTmplFiles = true
  },
  (name) => SKIP_DIRS.has(name)
)
if (!hasTmplFiles) {
  add('NA', 'CHEZMOI-2', 'no .tmpl files in tree — .chezmoidata/.chezmoitemplates check not applicable')
} else if (has('.chezmoidata') || has('.chezmoitemplates')) {
  add('PASS', 'CHEZMOI-2', '.chezmoidata/ or .chezmoitemplates/ present alongside .tmpl files', 'references/dotfiles-standard.md')
} else {
  add(
    'WARN',
    'CHEZMOI-2',
    '.tmpl files exist but neither .chezmoidata/ nor .chezmoitemplates/ is present — templating may be ad hoc rather than using the shared-data/shared-partial shape',
    'references/dotfiles-standard.md'
  )
}

// ── BIN-1: bin/ executable-prefix conformance ─────────────────────────────────
if (has('bin')) {
  let anyBinFile = false
  for (const entry of readdirSync(at('bin'))) {
    const full = at('bin', entry)
    if (statSync(full).isDirectory()) continue // subsystem dirs (e.g. bin/env/) checked separately, not flattened here
    anyBinFile = true
    // Recognized chezmoi source-attribute prefixes — bin/ commonly holds executable_
    // scripts, but symlink_/private_/dot_ etc. are equally legitimate chezmoi attributes
    // for a file living under bin/; only a file with none of these is worth a WARN.
    const RECOGNIZED_PREFIXES = ['executable_', 'symlink_', 'private_', 'readonly_', 'dot_', 'create_', 'modify_']
    const prefix = RECOGNIZED_PREFIXES.find((p) => entry.startsWith(p))
    if (prefix) {
      add('PASS', 'BIN-1', `follows the ${prefix} naming convention`, 'references/dotfiles-standard.md', `bin/${entry}`)
    } else {
      add(
        'WARN',
        'BIN-1',
        'no recognized chezmoi source-attribute prefix — confirm this is intentionally unmanaged (e.g. a README)',
        'references/dotfiles-standard.md',
        `bin/${entry}`
      )
    }
  }
  if (!anyBinFile) add('NA', 'BIN-1', 'bin/ exists but contains no direct files to check')
} else {
  add('NA', 'BIN-1', 'no bin/ directory in tree')
}

// ── GIT-1: no stray .git/*.lock files ─────────────────────────────────────────
const lockCandidates = ['.git/index.lock', '.git/HEAD.lock', '.git/config.lock', '.git/packed-refs.lock']
const strayLocks: string[] = lockCandidates.filter((p) => has(p))
if (has('.git', 'refs')) {
  walk(
    at('.git', 'refs'),
    (path) => {
      if (path.endsWith('.lock')) strayLocks.push(path.slice(repo.length + 1))
    },
    () => false
  )
}
if (!has('.git')) {
  add('NA', 'GIT-1', 'no .git directory — not a git repo')
} else if (strayLocks.length) {
  for (const lock of strayLocks) add('FAIL', 'GIT-1', `stray git lock file present: ${lock}`, 'references/dotfiles-standard.md', lock)
} else {
  add('PASS', 'GIT-1', 'no stray .git/*.lock files', 'references/dotfiles-standard.md')
}

// ── judgment surface: [J] criteria from references/audit-rubric.md ───────────
add(
  'ADVISORY',
  'PATTERN-J1',
  'for each app-mutated config file, confirm Pattern A (surgical patch) vs Pattern B (full template + ' +
    'reverse-merge) matches the ≥90%-app-owned decision rule for that specific file.',
  'references/dotfiles-standard.md'
)
add(
  'ADVISORY',
  'CONFIG-J1',
  'for every Pattern A writer, confirm the edit API fits its declared format, absent paths are explicit, ' +
    'unsupported input fails closed, representative fixtures preserve unrelated syntax, and a second identical run is a no-op.',
  'references/dotfiles-standard.md'
)
add(
  'ADVISORY',
  'LAYER-J1',
  'confirm CLAUDE.md-style guidance sits at the right layer — repo-local vs user-level vs persistent memory.',
  'references/dotfiles-standard.md'
)
if (has('.chezmoiignore')) {
  add(
    'ADVISORY',
    'CHEZMOI-J1',
    'confirm any .chezmoiignore negation (!pattern) is a deliberate, documented un-ignore, not an ' + 'accidentally-too-broad ignore rule.',
    'references/dotfiles-standard.md',
    '.chezmoiignore'
  )
}
add(
  'ADVISORY',
  'ETIQ-J1',
  'confirm audit findings were reported as file + one-line problem + options, with no fix applied ' + 'without confirmation.',
  'references/dotfiles-standard.md'
)
add(
  'ADVISORY',
  'SYNC-1',
  'this rubric, the standard, and this script must agree; when the standard moves, all three move together (REFRESH).',
  'references/audit-rubric.md'
)

// ── report ────────────────────────────────────────────────────────────────────
// Shared emit harness — copy verbatim across KI checkers (checker-contract.md).
function emit(items: Finding[], target: string, concern: string, title: string): never {
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
    process.stdout.write(`${JSON.stringify({ concern, target, generatedAt: stamp, summary, findings: items }, null, 2)}\n`)
  } else {
    console.log(`\n${title}\n${'─'.repeat(60)}`)
    for (const l of ORDER) {
      const rows = items.filter((f) => f.level === l)
      if (!rows.length) continue
      console.log(`\n${ICON[l]} ${l} (${rows.length})`)
      for (const r of rows) console.log(`   [${r.area}]${r.file ? ` ${r.file}` : ''} ${r.msg}${r.ref ? ` (${r.ref})` : ''}`)
    }
    console.log(`\n${'─'.repeat(60)}\n${tally}`)
    if (summary.fail + summary.warn + summary.polish > 0)
      console.log('→ to address: run /ki-dotfiles-chezmoi CONFORM   (judgment criteria: references/audit-rubric.md)')
    if (report) console.log(`report → ${join(reportDir, `${concern}.{md,json}`)}`)
    console.log('')
  }
  process.exit(summary.fail ? 1 : 0)
}

add('INFO', 'SCOPE', 'chezmoi dotfiles-management conventions — filesystem mechanical gate + judgment criteria surface')

emit(findings, repo, 'dotfiles-chezmoi', `Chezmoi dotfiles audit — ${basename(repo)}  (${repo})`)
