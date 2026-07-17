#!/usr/bin/env bun
/**
 * ki-binding-chezmoi — audit the chezmoi render path for the KI MCP binding.
 *
 *   bun scripts/audit.ts [chezmoi-repo] [--source <path>]
 *
 * This is a COMPOSITION checker (ADR-KI-HARNESS-SKILLS-004, composition-for-backends corollary).
 * It does not fork the shared
 * modes; it runs its two composed siblings in sequence as SUBPROCESSES (never a cross-skill
 * import, so each stays valid standalone — ADR-KI-HARNESS-SKILLS-004) and then adds its own
 * render-path delta:
 *
 *   1. ki-dotfiles-chezmoi audit <chezmoi-repo>   — the chezmoi source repo is conventional.
 *   2. ki-binding audit [--source <path>]         — each surface agrees with the single source.
 *   3. BINDCHEZ-* delta                           — the chezmoi source repo actually carries the
 *                                                   MCP source data + the render template, and a
 *                                                   `chezmoi apply` would produce the surfaces
 *                                                   ki-binding audits.
 *
 * The composed siblings own their own criteria; this checker only owns the BINDCHEZ delta
 * (see references/binding-chezmoi-standard.md / references/audit-rubric.md). Exit code is
 * non-zero iff any FAIL (a composed sibling FAIL folds up as a FAIL here). No cross-skill
 * imports — Node/Bun builtins only (checker-contract.md).
 */
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, realpathSync, statSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Unified severity ladder — shared by every KI checker (checker-contract.md).
type Level = 'FAIL' | 'WARN' | 'POLISH' | 'ADVISORY' | 'INFO' | 'NA' | 'PASS'
type Finding = { level: Level; area: string; msg: string; ref?: string; file?: string }
const ORDER: Level[] = ['FAIL', 'WARN', 'POLISH', 'ADVISORY', 'INFO', 'NA', 'PASS']
const ICON: Record<Level, string> = { FAIL: '❌', WARN: '⚠️', POLISH: '✨', ADVISORY: '🧭', INFO: 'ℹ️', NA: '🚫', PASS: '✅' }
const findings: Finding[] = []
const add = (level: Level, area: string, msg: string, ref?: string, file?: string): void =>
  void findings.push({ level, area, msg, ref, file })

const STD = 'references/binding-chezmoi-standard.md'

// ── Self-location: find the harness skills/ root through the (possibly symlinked) script path ──
const SELF = realpathSync(fileURLToPath(import.meta.url))
// .../skills/<cluster>/ki-binding-chezmoi/scripts/audit.ts → up to .../skills
const SKILLS_ROOT = resolve(dirname(SELF), '..', '..', '..')

// ── Args ──
const argv = process.argv.slice(2)
const opt = (name: string): string | undefined => {
  const i = argv.indexOf(name)
  return i >= 0 ? argv[i + 1] : undefined
}
const VALUE_OPTS = new Set(['--source', '--report'])
const positional = argv.find((a, i) => !a.startsWith('-') && !VALUE_OPTS.has(argv[i - 1] ?? ''))
const sourceOverride = opt('--source')

// The chezmoi source repo that renders the surfaces. Default: the conventional chezmoi source dir,
// honouring $XDG_DATA_HOME (chezmoi itself resolves its source dir this way).
const CHEZMOI_REPO = positional ? resolve(positional) : join(process.env.XDG_DATA_HOME ?? join(homedir(), '.local', 'share'), 'chezmoi')

// ── Compose sibling audits as subprocesses (not imports) ──
// Each sibling emits the checker-contract `--json` wrapper on stdout; we fold its summary into
// a single finding so the composition edge is visible and its exit reflected. A hard error
// (source/repo not present → exit 2, no JSON) folds to INFO rather than a false FAIL.
function findSkillScript(skill: string): string | undefined {
  // Skills live under skills/<cluster>/<skill>/ — search each cluster subfolder rather than
  // assume a flat layout (skills/ was reorganised into cluster subfolders, ADR-KI-HARNESS-SKILLS-006).
  for (const cluster of readdirSync(SKILLS_ROOT, { withFileTypes: true })) {
    if (!cluster.isDirectory()) continue
    const candidate = join(SKILLS_ROOT, cluster.name, skill, 'scripts', 'audit.ts')
    if (existsSync(candidate)) return candidate
  }
  return undefined
}

function composeAudit(skill: string, scriptArgs: string[], criterion: string): void {
  const script = findSkillScript(skill)
  if (!script) {
    add(
      'INFO',
      criterion,
      `composed ${skill} checker not found — sibling audit skipped`,
      STD,
      join(SKILLS_ROOT, '*', skill, 'scripts', 'audit.ts')
    )
    return
  }
  const r = spawnSync('bun', [script, ...scriptArgs, '--json'], { encoding: 'utf8' })
  let summary: { fail?: number; warn?: number } | null = null
  try {
    summary = JSON.parse((r.stdout ?? '').trim()).summary
  } catch {
    summary = null
  }
  if (summary === null) {
    add('INFO', criterion, `composed ${skill} audit could not run to completion (exit ${r.status}) — run it directly`, STD)
    return
  }
  const fail = summary.fail ?? 0
  const warn = summary.warn ?? 0
  if (fail > 0) add('FAIL', criterion, `composed ${skill} audit reported ${fail} FAIL — run /${skill} CONFORM`, STD)
  else if (warn > 0) add('WARN', criterion, `composed ${skill} audit reported ${warn} WARN — run /${skill} CONFORM`, STD)
  else add('PASS', criterion, `composed ${skill} audit clean`, STD)
}

// BINDCHEZ-1a — the chezmoi repo is conventional (composes ki-dotfiles-chezmoi).
if (existsSync(CHEZMOI_REPO)) composeAudit('ki-dotfiles-chezmoi', [CHEZMOI_REPO], 'BINDCHEZ-1')
else
  add(
    'INFO',
    'BINDCHEZ-1',
    `chezmoi source repo not present at ${CHEZMOI_REPO} — render-repo checks skipped (pass a path)`,
    STD,
    CHEZMOI_REPO
  )

// BINDCHEZ-2 — each surface agrees with the single source (composes ki-binding).
composeAudit('ki-binding', sourceOverride ? ['--source', sourceOverride] : [], 'BINDCHEZ-2')

// ── Render-path delta (BINDCHEZ-3/4/5) — only meaningful once the chezmoi repo is present ──
function walk(dir: string, onFile: (path: string) => void, depth = 0): void {
  if (depth > 6) return
  let entries: string[]
  try {
    entries = readdirSync(dir)
  } catch {
    return
  }
  for (const entry of entries) {
    if (entry === '.git' || entry === 'node_modules') continue
    const full = join(dir, entry)
    let st: ReturnType<typeof statSync>
    try {
      st = statSync(full)
    } catch {
      continue
    }
    if (st.isDirectory()) walk(full, onFile, depth + 1)
    else onFile(full)
  }
}

if (existsSync(CHEZMOI_REPO)) {
  // BINDCHEZ-3 — the chezmoi source repo carries the MCP source data, either as the legacy
  // `.chezmoidata/*mcp*` data-merge file, or as a plain managed source file applied verbatim to
  // the canonical XDG path (inverted pattern, e.g. dot_config/ki/mcp-servers.yaml).
  const dataDir = join(CHEZMOI_REPO, '.chezmoidata')
  let dataFile: string | null = null
  let dataPattern: 'data-merge' | 'inverted' | null = null
  if (existsSync(dataDir)) {
    for (const e of readdirSync(dataDir))
      if (/mcp/i.test(e) && /\.(ya?ml|toml|json)$/.test(e)) {
        dataFile = join('.chezmoidata', e)
        dataPattern = 'data-merge'
      }
  }
  if (!dataFile) {
    walk(CHEZMOI_REPO, (p) => {
      if (dataFile) return
      if (/mcp-servers\.ya?ml$/i.test(basename(p)) && !p.endsWith('.tmpl')) {
        dataFile = p.slice(CHEZMOI_REPO.length + 1)
        dataPattern = 'inverted'
      }
    })
  }
  if (dataFile) add('PASS', 'BINDCHEZ-3', `chezmoi repo carries the MCP source data (${dataFile}, ${dataPattern} pattern)`, STD, dataFile)
  else
    add(
      'WARN',
      'BINDCHEZ-3',
      'chezmoi repo has no `.chezmoidata/*mcp*` data file and no inverted `*mcp-servers.yaml` source file — the render path has no MCP source to render from',
      STD,
      '.chezmoidata/'
    )

  // BINDCHEZ-4 — the render template partial exists (`mcp-servers-json`).
  let templateFile: string | null = null
  walk(CHEZMOI_REPO, (p) => {
    if (/mcp-servers-json/i.test(basename(p))) templateFile = p.slice(CHEZMOI_REPO.length + 1)
  })
  if (templateFile) add('PASS', 'BINDCHEZ-4', `render template present (${templateFile})`, STD, templateFile)
  else
    add(
      'WARN',
      'BINDCHEZ-4',
      'no `mcp-servers-json` render template found in the chezmoi repo — surfaces cannot be rendered from the source',
      STD
    )

  // BINDCHEZ-5 — the template is wired to at least one surface target `.tmpl`.
  let wired: string | null = null
  walk(CHEZMOI_REPO, (p) => {
    if (!p.endsWith('.tmpl')) return
    try {
      if (/mcp-servers-json/i.test(readFileSync(p, 'utf8'))) wired = p.slice(CHEZMOI_REPO.length + 1)
    } catch {
      /* unreadable — skip */
    }
  })
  if (wired) add('PASS', 'BINDCHEZ-5', `render template is wired into a surface target (${wired})`, STD, wired)
  else
    add(
      'WARN',
      'BINDCHEZ-5',
      'no `.tmpl` target references `mcp-servers-json` — the template exists but no surface is rendered through it',
      STD
    )
}

// ── judgment surface: [J] criteria from references/audit-rubric.md ──
add(
  'ADVISORY',
  'BINDCHEZ-6',
  'confirm a `chezmoi apply` (preview with `chezmoi diff`) reproduces exactly the surfaces ki-binding audits — render parity is a read, not run here.',
  STD
)
add(
  'ADVISORY',
  'BINDCHEZ-7',
  'this rubric, the standard, and this script must agree; when the standard moves, all three move together (REFRESH).',
  'references/audit-rubric.md'
)

// ── report ──────────────────────────────────────────────────────────────────
// Shared emit harness — copy verbatim across KI checkers (checker-contract.md).
function emit(items: Finding[], target: string, concern: string, title: string): never {
  const a = process.argv.slice(2)
  const json = a.includes('--json')
  const ri = a.indexOf('--report')
  const report = ri !== -1
  const reportDir = report && a[ri + 1] && !a[ri + 1].startsWith('-') ? a[ri + 1] : join(process.cwd(), '.ki-meta', 'audits')

  const n = (l: Level): number => items.filter((x) => x.level === l).length
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
      const rows = items.filter((x) => x.level === l)
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
      const rows = items.filter((x) => x.level === l)
      if (!rows.length) continue
      console.log(`\n${ICON[l]} ${l} (${rows.length})`)
      for (const r of rows) console.log(`   [${r.area}]${r.file ? ` ${r.file}` : ''} ${r.msg}${r.ref ? ` (${r.ref})` : ''}`)
    }
    console.log(`\n${'─'.repeat(60)}\n${tally}`)
    if (summary.fail + summary.warn + summary.polish > 0)
      console.log('→ to address: run /ki-binding-chezmoi CONFORM   (judgment criteria: references/audit-rubric.md)')
    if (report) console.log(`report → ${join(reportDir, `${concern}.{md,json}`)}`)
    console.log('')
  }
  process.exit(summary.fail ? 1 : 0)
}

add(
  'INFO',
  'SCOPE',
  'chezmoi render path for the KI MCP binding — composes ki-dotfiles-chezmoi + ki-binding, adds the render-contract delta'
)

emit(findings, CHEZMOI_REPO, 'binding-chezmoi', `ki-binding-chezmoi — render-path audit  (${basename(CHEZMOI_REPO)})`)
