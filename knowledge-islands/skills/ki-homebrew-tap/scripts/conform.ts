#!/usr/bin/env bun
/**
 * Mechanical CONFORM for the ki-homebrew-tap standard — an honest normalize-only
 * conform. This skill WRAPS Homebrew's external standard rather than inventing a
 * house one, so almost every divergence a tap can carry is either authoring
 * (write a `desc`/`url`/`sha256`, add a README row) or is delegated to `brew`
 * (`brew style`/`brew audit --strict`). Neither is a safe, reversible string
 * rewrite. The ONE unambiguous fix this script makes is the config marker:
 *
 *   - CONFIG — when `.ki-config.toml` exists but carries no `[ki-homebrew-tap]`
 *     table, APPEND the keyless opt-in marker block (the same block
 *     `audit.ts --educate` prints). Existing content is never rewritten.
 *
 * Everything else audit.ts flags is surfaced as a printed manual TODO, never
 * guessed:
 *   - TAP-FIELDS (missing `desc`/`homepage`/`url`/`sha256`/`license`/`def install`/
 *     `test do`), TAP-CLASS, TAP-DESC-STYLE (shorten / de-article — recapitalising
 *     is judgment), TAP-URL-VERSIONED (repoint at a tagged tarball + recompute
 *     `sha256`), TAP-README (author the formulae-table row) — all authoring.
 *   - TAP-BREW — delegated to `brew` itself; run `brew style` / `brew audit
 *     --strict` locally and fix by hand. Never scripted here.
 *   - `.ki-config.toml` missing entirely — authoring the repo's config is
 *     `ki-repo`'s job, not a mechanical fill-in.
 *
 * Scope: a single target tap (default cwd), matching the house conform shape.
 * The Formula-dir constant, config constants/marker, the per-formula field/desc/
 * url regexes, and the `[ki-homebrew-tap]` parser are COPIED from audit.ts (same
 * source of truth, kept in lockstep rather than imported so each script stays
 * valid standalone per the composition-only rule).
 *
 *   bun scripts/conform.ts [path]   # default: cwd
 *   --dry-run                       # print the plan, mutate nothing
 *
 * Zero npm dependencies (bun + node stdlib only). Exit code is non-zero only on
 * an unrecoverable error (no `Formula/` — the target is not a tap); findings and
 * fixes never fail the run.
 */

import { readdir, readFile, stat, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

// ── kept in lockstep with audit.ts ──
const FORMULA_DIR = 'Formula'
const README = 'README.md'
const KI_CONFIG = '.ki-config.toml'
const KI_SECTION = 'ki-homebrew-tap'

// The default marker block: a keyless opt-in table. Presence is the whole config.
const KI_DEFAULT = `# Opt this repo into the ki-homebrew-tap standard (a Knowledge Islands Homebrew tap).
# Keyless marker: presence is the whole config. The tap shape is fixed by Homebrew
# (Formula/*.rb, formulae named for the tools they install), so there is nothing to tune.
[${KI_SECTION}]
`

// Per-formula field probes — mirror audit.ts's TAP-FIELDS array.
const FIELD_PROBES: Array<[string, RegExp]> = [
  ['desc', /^\s*desc\s+"/m],
  ['homepage', /^\s*homepage\s+"/m],
  ['url', /^\s*url\s+"/m],
  ['sha256', /^\s*sha256\s+"/m],
  ['license', /^\s*license\s+/m],
  ['install method', /^\s*def\s+install\b/m],
  ['test do', /^\s*test\s+do\b/m]
]
const CLASS_RE = /^\s*class\s+[A-Z][A-Za-z0-9]*\s+<\s+Formula\b/m
const DESC_RE = /^\s*desc\s+"([^"]*)"/m
const URL_RE = /^\s*url\s+"([^"]*)"/m
const VERSIONED_URL_RE = /\/archive\/refs\/tags\/|\/releases\/download\//

// True when `.ki-config.toml` carries a `[ki-homebrew-tap]` table (comment-stripped,
// like audit.ts's parseKiTap) — presence is the whole opt-in.
function hasKiTap(text: string): boolean {
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, '').trim()
    if (line === '') continue
    const header = line.match(/^\[(.+)\]$/)
    if (header && (header[1] as string).trim() === KI_SECTION) return true
  }
  return false
}

const C = { reset: '\x1b[0m', dim: '\x1b[2m', green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m', cyan: '\x1b[36m' }
const paint = (c: string, s: string): string => `${c}${s}${C.reset}`

// The reference doc every tap-shape criterion cites (mirrors audit.ts's STD).
const STD = 'references/homebrew-tap-standard.md'

async function isDir(p: string): Promise<boolean> {
  try {
    return (await stat(p)).isDirectory()
  } catch {
    return false
  }
}

// Collect-then-emit harness (mirrors audit.ts + ki-authoring conform.ts). Each action
// records a finding; `say` prints the human line only when not in --json mode, so a direct
// run streams prose while the aggregate consumes the wrapper. area is the rubric code, ref
// its reference-doc pointer, file the path an action concerns.
type Level = 'FAIL' | 'WARN' | 'POLISH' | 'ADVISORY' | 'INFO' | 'NA' | 'PASS'
type Finding = { level: Level; area: string; msg: string; ref?: string; file?: string }
const findings: Finding[] = []
const rec = (level: Level, area: string, msg: string, ref?: string, file?: string): void =>
  void findings.push({ level, area, msg, ref, file })

// ── entry ──
async function main() {
  const argv = process.argv.slice(2)
  const dryRun = argv.includes('--dry-run')
  const json = argv.includes('--json')
  const target = resolve(argv.find((a) => !a.startsWith('-')) ?? '.')
  const say = (line: string): void => {
    if (!json) console.log(line)
  }

  const formulaDir = join(target, FORMULA_DIR)
  if (!(await isDir(formulaDir))) {
    console.error(paint(C.red, `no ${FORMULA_DIR}/ directory at ${target} — not a Homebrew tap; nothing to conform`))
    process.exit(1)
    return
  }

  say(paint(C.dim, `target: ${target}${dryRun ? '   (dry run)' : ''}\n`))

  const formulae = (await readdir(formulaDir)).filter((n) => n.endsWith('.rb')).sort()

  // README, read once for the TAP-README findings.
  const readmePath = join(target, README)
  let readme: string | null = null
  try {
    readme = await readFile(readmePath, 'utf8')
  } catch {
    rec('ADVISORY', 'TAP-README', 'absent — author a formulae table so each formula is discoverable', STD, README)
  }

  // ── a) config marker — the one mechanical, reversible fix ──
  say(paint(C.cyan, `config marker ([${KI_SECTION}] in ${KI_CONFIG})`))
  const configPath = join(target, KI_CONFIG)
  let configText: string | null = null
  try {
    configText = await readFile(configPath, 'utf8')
  } catch {
    configText = null
  }
  if (configText === null) {
    rec('ADVISORY', 'CONFIG', "absent — author the repo config (that is ki-repo's job), then re-run to add the marker", STD, KI_CONFIG)
    say(`  ${paint(C.dim, `no ${KI_CONFIG} — see manual TODOs`)}`)
  } else if (hasKiTap(configText)) {
    rec('PASS', 'CONFIG', `[${KI_SECTION}] marker already present`, STD, KI_CONFIG)
    say(`  ${paint(C.dim, 'nothing to fix')}`)
  } else {
    const newText = `${configText.replace(/\n*$/, '\n')}\n${KI_DEFAULT}`
    rec('POLISH', 'CONFIG', `append the keyless [${KI_SECTION}] marker${dryRun ? ' (dry run — not written)' : ''}`, STD, KI_CONFIG)
    say(`  ${paint(C.green, 'fix')}   ${KI_CONFIG} — append the keyless [${KI_SECTION}] marker`)
    if (!dryRun) await writeFile(configPath, newText)
  }

  // ── b) formula-shape divergences — authoring / brew-delegated → ADVISORY (never guessed) ──
  say(`\n${paint(C.cyan, 'formula shape (authoring / brew — not scripted)')}`)
  for (const file of formulae) {
    const where = `${FORMULA_DIR}/${file}`
    const text = await readFile(join(formulaDir, file), 'utf8')
    const name = file.replace(/\.rb$/, '')

    if (!CLASS_RE.test(text)) rec('ADVISORY', 'TAP-CLASS', 'no `class <Camel> < Formula` declaration — author by hand', STD, where)
    for (const [label, re] of FIELD_PROBES)
      if (!re.test(text)) rec('ADVISORY', 'TAP-FIELDS', `missing \`${label}\` — author by hand`, STD, where)

    const descM = text.match(DESC_RE)
    if (descM) {
      const desc = descM[1] as string
      if (desc.length > 80) rec('ADVISORY', 'TAP-DESC-STYLE', `\`desc\` is ${desc.length} chars (≤ 80) — shorten by hand`, STD, where)
      if (/^(A|An|The)\s/.test(desc))
        rec('ADVISORY', 'TAP-DESC-STYLE', '`desc` starts with an article — de-article + recapitalise by hand', STD, where)
    }

    const urlM = text.match(URL_RE)
    if (urlM && !VERSIONED_URL_RE.test(urlM[1] as string))
      rec('ADVISORY', 'TAP-URL-VERSIONED', '`url` is not a tagged-release tarball — repoint + recompute sha256 by hand', STD, where)

    if (readme !== null && !readme.includes(name))
      rec('ADVISORY', 'TAP-README', `formula "${name}" not in ${README} — add its formulae-table row by hand`, STD, where)
  }

  // ── judgment / delegated items — never guessed, always surfaced ──
  rec(
    'ADVISORY',
    'TAP-BREW',
    "run `brew style` + `brew audit --strict` per formula locally and fix by hand — Homebrew's audit is delegated, never scripted here",
    STD
  )

  const advisories = findings.filter((f) => f.level === 'ADVISORY')
  say(`\n${paint(C.cyan, 'manual TODOs (judgment / brew-delegated — not scripted)')}`)
  for (const f of advisories) say(`  - ${f.file ? `${f.file}: ` : ''}${f.msg} (${f.area})`)

  const configFixes = findings.filter((f) => f.area === 'CONFIG' && f.level === 'POLISH').length
  say(
    `\n${paint(C.dim, `${configFixes} mechanical fix(es) applied${dryRun ? ' (dry run — nothing written)' : ''} — re-run \`bun scripts/audit.ts\` (or \`ki:homebrew-tap:audit\`) to confirm findings clear.`)}`
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
    process.stdout.write(JSON.stringify({ concern: 'homebrew-tap', target, generatedAt: new Date().toISOString(), summary, findings }))
  }
}

main().catch((err) => {
  console.error(`ERROR: ${String(err)}`)
  process.exit(1)
})
