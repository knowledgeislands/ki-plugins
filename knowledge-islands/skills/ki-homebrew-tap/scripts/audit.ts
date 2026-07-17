#!/usr/bin/env bun
/**
 * Mechanical checker for a Knowledge Islands Homebrew tap (`homebrew-<x>`).
 *
 *   scripts/audit.ts [tap-path]   (default: cwd)
 *   scripts/audit.ts --educate        # print the default [ki-homebrew-tap] block
 *
 * The skill's Mode AUDIT runs this for the deterministic items; the judgment pass
 * (does the formula install what it claims, is the test meaningful) is layered on by
 * reading. What this checks, per the audit-rubric:
 *
 *   1. TAP-FORMULA-DIR — `Formula/` exists and carries ≥1 `*.rb` (else FAIL — not a tap).
 *   2. Per formula (`Formula/*.rb`):
 *      TAP-CLASS        — `class <Camel> < Formula`.
 *      TAP-FIELDS       — desc / homepage / url / sha256 / license / `def install` / `test do`.
 *      TAP-DESC-STYLE   — `desc` ≤ 80 chars and not starting with "A "/"An "/"The ".
 *      TAP-URL-VERSIONED — `url` is a tagged-release tarball, not a bare branch/HEAD.
 *   3. TAP-README       — each formula name appears in README.md (the formulae table).
 *   4. TAP-BREW         — if `brew` is on PATH, `brew style` + `brew audit --strict` per
 *                         formula (WARN on failure, INFO on pass); NA when brew is absent
 *                         (the tap's own CI runs `brew test-bot`). A brew error never crashes.
 *   5. CONFIG           — `[ki-homebrew-tap]` present; keyless, validate-down (WARN unknown keys).
 *
 * Wraps Homebrew's EXTERNAL standard (the Formula Cookbook + `brew audit`/`brew style`);
 * it does not invent a house formula style. READ-ONLY: never writes to the tap. `--educate`
 * prints the config block and nothing else. Bun/Node built-ins only. Exit non-zero on FAIL.
 */
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const FORMULA_DIR = 'Formula'
const README = 'README.md'
const KI_CONFIG = '.ki-config.toml'
const KI_SECTION = 'ki-homebrew-tap'

// The default `--educate` block: a keyless opt-in marker. Presence of the table is the
// whole config — the tap's shape is fixed by Homebrew, so the skill governs shape, not
// keys. Validate-down: any key here is unknown and WARNed (CONFIG). Extra tables free.
const KI_DEFAULT = `# Opt this repo into the ki-homebrew-tap standard (a Knowledge Islands Homebrew tap).
# Keyless marker: presence is the whole config. The tap shape is fixed by Homebrew
# (Formula/*.rb, formulae named for the tools they install), so there is nothing to tune.
[${KI_SECTION}]
`

const C = { reset: '\x1b[0m', dim: '\x1b[2m', green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m', cyan: '\x1b[36m' }
const paint = (c: string, s: string): string => `${c}${s}${C.reset}`

// Unified severity ladder — shared by every KI checker (enforcement-framework §2).
type Level = 'FAIL' | 'WARN' | 'POLISH' | 'ADVISORY' | 'INFO' | 'NA' | 'PASS'
// area is the rubric code (references/audit-rubric.md); ref is its reference-doc
// pointer; file names the path a file-scoped finding concerns. ref/file are optional
// and ride into --json for the aggregate to render.
type Finding = { level: Level; area: string; msg: string; ref?: string; file?: string }
const ORDER: Level[] = ['FAIL', 'WARN', 'POLISH', 'ADVISORY', 'INFO', 'NA', 'PASS']
const ICON: Record<Level, string> = { FAIL: '❌', WARN: '⚠️', POLISH: '✨', ADVISORY: '🧭', INFO: 'ℹ️', NA: '🚫', PASS: '✅' }
// The reference doc every tap-shape criterion cites.
const STD = 'references/homebrew-tap-standard.md'
const mk = () => {
  const f: Finding[] = []
  const push =
    (level: Level) =>
    (area: string, msg: string, ref?: string, file?: string): void =>
      void f.push({ level, area, msg, ref, file })
  return {
    f,
    fail: push('FAIL'),
    warn: push('WARN'),
    note: push('INFO'),
    na: push('NA'),
    advisory: push('ADVISORY'),
    polish: push('POLISH')
  }
}

const isDir = (p: string): boolean => existsSync(p) && statSync(p).isDirectory()
const isFile = (p: string): boolean => existsSync(p) && statSync(p).isFile()
const TOML = (globalThis as unknown as { Bun: { TOML: { parse(text: string): unknown } } }).Bun.TOML

// ── config: read ONLY this skill's [ki-homebrew-tap] table (validate down, ignore across) ──
// Semantic parser for the constrained schema. Quoted table keys are declarations;
// header-shaped text inside TOML strings is not. Malformed TOML is distinguished so
// applicability fails closed.
type KiTap = { keys: string[] }
type KiTapParse = { value: KiTap | null; malformed: boolean }
function parseKiTap(text: string): KiTapParse {
  let document: Record<string, unknown>
  try {
    document = TOML.parse(text) as Record<string, unknown>
  } catch {
    return { value: null, malformed: true }
  }
  const value = document[KI_SECTION]
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { value: null, malformed: false }
  return { value: { keys: Object.keys(value as Record<string, unknown>) }, malformed: false }
}

// ── formula parsing ────────────────────────────────────────────────────────────
type Formula = { name: string; file: string; text: string }
function listFormulae(dir: string): Formula[] {
  if (!isDir(dir)) return []
  return readdirSync(dir)
    .filter((n) => n.endsWith('.rb'))
    .sort()
    .map((n) => ({ name: n.replace(/\.rb$/, ''), file: n, text: readFileSync(join(dir, n), 'utf8') }))
}

// The `desc "..."` value, or null when the field is absent.
function descValue(text: string): string | null {
  const m = text.match(/^\s*desc\s+"([^"]*)"/m)
  return m ? (m[1] as string) : null
}

// ── the audit ────────────────────────────────────────────────────────────────
function auditTap(base: string): Finding[] {
  const { f, fail, warn, note, na } = mk()
  const formulaDir = join(base, FORMULA_DIR)
  const formulae = listFormulae(formulaDir)

  // TAP-FORMULA-DIR [FAIL] — a tap is Formula/ + ≥1 *.rb.
  if (!isDir(formulaDir)) {
    fail('TAP-FORMULA-DIR', `no ${FORMULA_DIR}/ directory — not a Homebrew tap`, STD)
    return f
  }
  if (formulae.length === 0) {
    fail('TAP-FORMULA-DIR', `${FORMULA_DIR}/ has no *.rb formulae`, STD)
    return f
  }
  note('TAP-FORMULA-DIR', `${formulae.length} formula(e): ${formulae.map((x) => x.name).join(', ')}`, STD)

  // README, read once for TAP-README.
  const readmePath = join(base, README)
  const readme = isFile(readmePath) ? readFileSync(readmePath, 'utf8') : null
  if (readme === null) warn('TAP-README', `no ${README} — cannot verify a formulae table lists each formula`, STD, README)

  for (const fx of formulae) {
    const where = `${FORMULA_DIR}/${fx.file}`

    // TAP-CLASS [WARN] — `class <Camel> < Formula`.
    if (!/^\s*class\s+[A-Z][A-Za-z0-9]*\s+<\s+Formula\b/m.test(fx.text))
      warn('TAP-CLASS', 'no `class <Camel> < Formula` declaration', STD, where)

    // TAP-FIELDS [WARN] — one warn per missing field.
    const fields: Array<[string, RegExp]> = [
      ['desc', /^\s*desc\s+"/m],
      ['homepage', /^\s*homepage\s+"/m],
      ['url', /^\s*url\s+"/m],
      ['sha256', /^\s*sha256\s+"/m],
      ['license', /^\s*license\s+/m],
      ['install method', /^\s*def\s+install\b/m],
      ['test do', /^\s*test\s+do\b/m]
    ]
    for (const [label, re] of fields) if (!re.test(fx.text)) warn('TAP-FIELDS', `missing \`${label}\``, STD, where)

    // TAP-DESC-STYLE [WARN] — ≤ 80 chars, not starting with an article (Homebrew style).
    const desc = descValue(fx.text)
    if (desc !== null) {
      if (desc.length > 80) warn('TAP-DESC-STYLE', `\`desc\` is ${desc.length} chars (Homebrew style: ≤ 80)`, STD, where)
      if (/^(A|An|The)\s/.test(desc))
        warn('TAP-DESC-STYLE', `\`desc\` starts with an article ("${desc.split(' ')[0]} …") — Homebrew style forbids it`, STD, where)
    }

    // TAP-URL-VERSIONED [WARN] — a tagged-release tarball, not a bare branch/HEAD.
    const urlM = fx.text.match(/^\s*url\s+"([^"]*)"/m)
    if (urlM) {
      const url = urlM[1] as string
      if (!/\/archive\/refs\/tags\/|\/releases\/download\//.test(url))
        warn(
          'TAP-URL-VERSIONED',
          `\`url\` is not a tagged-release tarball (expected /archive/refs/tags/ or /releases/download/) → ${url}`,
          STD,
          where
        )
    }

    // TAP-README [WARN] — the formula name appears in the README formulae table.
    if (readme !== null && !readme.includes(fx.name)) warn('TAP-README', `formula name "${fx.name}" not found in ${README}`, STD, where)
  }

  // TAP-BREW [capability] — delegate to Homebrew's own audit when brew is on PATH.
  runBrew(base, formulaDir, formulae, { warn, note, na })

  return f
}

// Delegate to `brew style` + `brew audit --strict` per formula. Capability-gated: NA
// when brew is absent (the tap's own CI runs `brew test-bot`). Robust: any spawn error,
// non-zero-that-is-not-a-lint-finding, or timeout is caught and downgraded to NA so a
// broken brew never crashes the checker.
function runBrew(
  base: string,
  formulaDir: string,
  formulae: Formula[],
  out: {
    warn: (a: string, m: string, ref?: string, file?: string) => void
    note: (a: string, m: string, ref?: string, file?: string) => void
    na: (a: string, m: string, ref?: string, file?: string) => void
  }
): void {
  const brew = spawnSafe('brew', ['--version'])
  if (brew?.status !== 0) {
    out.na('TAP-BREW', 'brew is not on PATH — skipping `brew audit`/`brew style` (the tap runs brew test-bot in CI)', STD)
    return
  }
  // An invocation / resolution problem (formula not tapped, path-arg form disabled in newer
  // Homebrew, bad usage) is NOT a formula defect — downgrade it to NA so a brew quirk never
  // reads as a finding. Only a genuine lint result (brew ran and reported issues) is a WARN.
  const invocationError = (s: string): boolean =>
    /no available formula|not tapped|is disabled|Error: Calling|Usage:|invalid option|unknown command/i.test(s)
  for (const fx of formulae) {
    const path = join(formulaDir, fx.file)
    const where = `${FORMULA_DIR}/${fx.file}`
    // `brew style` takes a path; `brew audit` needs the formula NAME (path args are disabled in
    // newer Homebrew and resolve to nothing unless the tap is installed).
    for (const [sub, args] of [
      ['style', ['style', path]],
      ['audit', ['audit', '--strict', fx.name]]
    ] as Array<[string, string[]]>) {
      const r = spawnSafe('brew', args, base)
      if (!r) {
        out.na('TAP-BREW', `\`brew ${sub}\` could not be run (spawn error) — skipped`, STD, where)
        continue
      }
      const output = `${r.stdout}\n${r.stderr}`.trim()
      if (r.status === 0) out.note('TAP-BREW', `\`brew ${sub}\` clean`, STD, where)
      else if (invocationError(output))
        out.na(
          'TAP-BREW',
          `\`brew ${sub}\` not run against this tap (${sub === 'audit' ? 'formula not tapped — run `brew tap` first, or rely on brew test-bot CI' : 'brew invocation issue'}) — skipped`,
          STD,
          where
        )
      else {
        const detail = output.split(/\r?\n/).filter(Boolean).slice(0, 4).join(' · ')
        out.warn('TAP-BREW', `\`brew ${sub}\` reported issues — ${detail || `exit ${r.status}`}`, STD, where)
      }
    }
  }
}

type SpawnResult = { status: number | null; stdout: string; stderr: string }
function spawnSafe(cmd: string, args: string[], cwd?: string): SpawnResult | null {
  try {
    const r = spawnSync(cmd, args, { cwd, encoding: 'utf8', timeout: 120_000 })
    if (r.error) return null
    return { status: r.status, stdout: r.stdout ?? '', stderr: r.stderr ?? '' }
  } catch {
    return null
  }
}

// ── run ──────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2)
if (argv.includes('--educate')) {
  process.stdout.write(KI_DEFAULT)
  process.exit(0)
}

const base = resolve(argv.find((a) => !a.startsWith('-')) ?? '.')
if (!isDir(base)) {
  console.error(paint(C.red, `not a directory: ${base}`))
  process.exit(2)
}

// CONFIG [WARN] — the opt-in marker, validate-down (warn on unknown keys).
const kiPath = join(base, KI_CONFIG)
const parsedKiTap = isFile(kiPath) ? parseKiTap(readFileSync(kiPath, 'utf8')) : { value: null, malformed: false }
const ki = parsedKiTap.value
const hasTapStructure = isDir(join(base, FORMULA_DIR))
if (!ki && !parsedKiTap.malformed && !hasTapStructure) {
  const { f, na } = mk()
  na('CONFIG', 'ki-homebrew-tap not applicable: no [ki-homebrew-tap] declaration or Formula/ structural marker', STD)
  emit(f, base, 'homebrew-tap', `Homebrew tap audit — ${base}`, '')
}

const findings = auditTap(base)

if (!ki)
  findings.push({
    level: 'WARN',
    area: 'CONFIG',
    msg: `no [${KI_SECTION}] table in ${KI_CONFIG} — add it (run with --educate to print the default block) so this tap is a declared, self-governing repo`,
    ref: STD,
    file: KI_CONFIG
  })
else if (ki.keys.length)
  findings.push({
    level: 'WARN',
    area: 'CONFIG',
    msg: `[${KI_SECTION}] is a keyless marker; unknown key(s): ${ki.keys.join(', ')}`,
    ref: STD,
    file: KI_CONFIG
  })
else findings.push({ level: 'INFO', area: 'CONFIG', msg: `[${KI_SECTION}] present (keyless marker)`, ref: STD, file: KI_CONFIG })

emit(
  findings,
  base,
  'homebrew-tap',
  `Homebrew tap audit — ${base}`,
  'mechanical checks only — apply the judgment (does the formula install what it claims, is the test meaningful) by reading. Homebrew shape is the external standard; see references/homebrew-tap-standard.md.'
)

// ── report ────────────────────────────────────────────────────────────────────
// Shared emit harness — copy verbatim across KI checkers (enforcement-framework §2/§5).
// Renders the painted table by default, JSON on `--json`, and writes the latest
// report under <target>/.ki-meta/audits/<concern>.{md,json} on `--report [dir]`.
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
    if (footer) console.log(footer)
    if (summary.fail + summary.warn + summary.polish > 0)
      console.log('→ to address: run /ki-homebrew-tap CONFORM   (judgment criteria: references/audit-rubric.md)')
    if (report) console.log(`report → ${join(reportDir, `${concern}.{md,json}`)}`)
    console.log('')
  }
  process.exit(summary.fail ? 1 : 0)
}
