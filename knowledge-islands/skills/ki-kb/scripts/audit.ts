#!/usr/bin/env bun
/**
 * Mechanical checker for a Knowledge Islands knowledge base.
 *
 *   bun scripts/audit.ts [base-path]   # audit a base (default: cwd)
 *   bun scripts/audit.ts --educate        # print the default [ki-kb] block
 *
 * This is the mechanical half of the skill's Mode AUDIT — the deterministic
 * layer the judgment pass (note routing, memory-index accuracy) builds on. It
 * checks three things against a base directory:
 *
 *   1. ZONE LAYOUT — the five zones (Calendar, Pillars, Resources, Streams,
 *      Admin) are present, each carries a same-name index note, and the root
 *      memory index Admin/MEMORY.md exists. `+` and `-` are inbound/outbound
 *      staging, not zones, so they carry no same-name index — reported only
 *      informationally. Zone folders are resolved THROUGH the zone alias below,
 *      so a base mid-rename is audited at its real folder.
 *
 *   2. CONFIG TABLE — the base's `.ki-config.toml` `[ki-kb]`
 *      table, validated DOWN (this skill's own keys only) per the shared-file
 *      contract owned by `ki-repo`: warn on a key it does not
 *      recognise, advise dropping a zone mapped to its own canonical name, and
 *      never read another skill's table. The keys are the
 *      `[ki-kb.zones]` aliases (any canonical zone or staging area
 *      mapped to a local folder name), an optional `required_frontmatter` array
 *      (see point 3), and an optional `preflight` array (note paths/globs to read
 *      before drafting).
 *
 *   3. NOTE FRONTMATTER — for every note that HAS a `---` frontmatter block:
 *      the fence must close (well-formed) and its top-level keys must be
 *      snake_case (the house convention) — both base-agnostic. When the base
 *      declares `required_frontmatter = [...]` in its table, those keys must be
 *      present too (extra keys stay free); omitted, required frontmatter is left
 *      to the judgment pass. Whether a note SHOULD carry frontmatter at all is
 *      base/type-specific and stays judgment.
 *
 * READ-ONLY: never mutates the base. `--educate` writes nothing — it prints the
 * default block to stdout for the author to paste into the base's config.
 * No npm dependencies — Bun/Node built-ins only. Exit code is non-zero on any FAIL.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

// ── the structure model (keep in sync with ../SKILL.md + the reference) ──────
// The five index-carrying zones, in canonical order.
const ZONES = ['Calendar', 'Pillars', 'Resources', 'Streams', 'Admin'] as const
// Inbound / outbound staging — NOT zones; exempt from the same-name index rule.
const STAGING = ['+', '-']
// The root memory index lives in the Admin zone (resolved through any alias).
const MEMORY_INDEX = 'MEMORY.md'

const KI_CONFIG = '.ki-config.toml'
const KI_SECTION = 'ki-kb'
const ZONES_SECTION = `${KI_SECTION}.zones`

// Reference-doc pointers cited by findings (cited-finding standard). The rubric is the
// criteria index; the frontmatter standard is the substantive doc for NOTE-* checks.
const RUBRIC = 'references/audit-rubric.md'
const FM = 'references/frontmatter-standard.md'

// The default block `--educate` emits. The bare [ki-kb] header is the
// OPT-IN MARKER: its presence declares this base governed by the kb standard
// (ki-repo's coverage cascade warns a base that has the zone layout but
// no table). The keys below are all optional — a base on the canonical zone names with
// no frontmatter contract and no extra pre-flight declares just the bare table.
const KI_DEFAULT = `# ${KI_SECTION} — opt-in marker: declaring this table opts the base into the kb standard.
# The keys below are optional; a base on the canonical zone names (${ZONES.join(' / ')})
# with no frontmatter contract and no extra pre-flight declares just the bare table header.
[${KI_SECTION}]
# Frontmatter keys every note that HAS frontmatter must carry (extra keys are free).
# Omit to leave required frontmatter as a judgment call. Keys must be snake_case.
# required_frontmatter = ["tags", "status", "author"]
#
# Notes (paths or globs, relative to the base) to read before drafting — the
# base-specific pre-flight. Omit for none beyond the memory cascade.
# preflight = ["Pillars/<Pillar>/Profiles", "Admin/Conventions.md"]

# [${ZONES_SECTION}]
# canonical zone or staging area = this base's local folder. Resolve every zone
# reference through it; for a rename in progress, drop the line once the folder
# reaches its canonical name.
# Pillars = "<local folder name>"
`

const C = { reset: '\x1b[0m', dim: '\x1b[2m', green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m', cyan: '\x1b[36m' }
const paint = (c: string, s: string): string => `${c}${s}${C.reset}`

// Unified severity ladder — shared by every KI checker (enforcement-framework §2).
type Level = 'FAIL' | 'WARN' | 'POLISH' | 'ADVISORY' | 'INFO' | 'NA' | 'PASS'
// area is the rubric code (references/audit-rubric.md); ref its reference-doc pointer;
// file the path a file-scoped finding concerns. ref/file ride into --json for the
// aggregate to render (cited-finding standard).
type Finding = { level: Level; area: string; msg: string; ref?: string; file?: string }
const ORDER: Level[] = ['FAIL', 'WARN', 'POLISH', 'ADVISORY', 'INFO', 'NA', 'PASS']
const ICON: Record<Level, string> = { FAIL: '❌', WARN: '⚠️', POLISH: '✨', ADVISORY: '🧭', INFO: 'ℹ️', NA: '🚫', PASS: '✅' }
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

// Semantic parser for this skill's owned table. It reads ONLY the parsed
// [ki-kb] object (validate down, ignore across), accepts quoted/dotted table
// spellings, and distinguishes malformed TOML so applicability fails closed.
type KiKb = {
  keys: Record<string, string>
  zones: Record<string, string>
  requiredFrontmatter: string[] | null
  preflight: string[] | null
}
type KiKbParse = { value: KiKb | null; malformed: boolean }
function parseKiKb(text: string): KiKbParse {
  let document: Record<string, unknown>
  try {
    document = TOML.parse(text) as Record<string, unknown>
  } catch {
    return { value: null, malformed: true }
  }
  const value = document[KI_SECTION]
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { value: null, malformed: false }
  const table = value as Record<string, unknown>
  const out: KiKb = { keys: {}, zones: {}, requiredFrontmatter: null, preflight: null }
  if (Array.isArray(table.required_frontmatter))
    out.requiredFrontmatter = table.required_frontmatter.filter((entry): entry is string => typeof entry === 'string')
  if (Array.isArray(table.preflight)) out.preflight = table.preflight.filter((entry): entry is string => typeof entry === 'string')
  const zones = table.zones
  if (zones && typeof zones === 'object' && !Array.isArray(zones)) {
    for (const [zone, folder] of Object.entries(zones as Record<string, unknown>)) {
      if (typeof folder === 'string') out.zones[zone] = folder
    }
  }
  for (const [key, entry] of Object.entries(table)) {
    if (key !== 'required_frontmatter' && key !== 'preflight' && key !== 'zones') out.keys[key] = String(entry)
  }
  return { value: out, malformed: false }
}

// House convention: frontmatter keys are snake_case (lowercase, digits, underscore).
const SNAKE = /^[a-z][a-z0-9_]*$/
// Every *.md under the base, skipping dotdirs (.git, …) and node_modules.
function walkMarkdown(dir: string, acc: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || e.name === 'node_modules') continue
    const p = join(dir, e.name)
    if (e.isDirectory()) walkMarkdown(p, acc)
    else if (e.name.endsWith('.md')) acc.push(p)
  }
  return acc
}
// A note's top-level frontmatter keys + whether the opening `---` fence closes.
// Returns null when the file has no leading `---` fence (no frontmatter — fine).
function frontmatterKeys(text: string): { keys: string[]; terminated: boolean } | null {
  const lines = text.split(/\r?\n/)
  if (lines[0]?.trim() !== '---') return null
  const keys: string[] = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i] as string
    if (line.trim() === '---') return { keys, terminated: true }
    if (/^\s/.test(line)) continue // nested (list item / sub-map) — not a top-level key
    const ci = line.indexOf(':')
    if (ci > 0) keys.push(line.slice(0, ci).trim())
  }
  return { keys, terminated: false }
}
const sampleList = (xs: string[], n = 10): string => xs.slice(0, n).join('; ') + (xs.length > n ? `; …+${xs.length - n} more` : '')

function auditBase(base: string, ki: KiKb | null): Finding[] {
  const { f, fail, warn, note } = mk()
  const zoneOf = (z: string): string => ki?.zones[z] ?? z

  // ── config table: validate this skill's own table, DOWN ──
  if (ki) {
    for (const key of Object.keys(ki.keys)) {
      warn('CONFIG-1', `[${KI_SECTION}] has no scalar key "${key}" — the only keys are zone aliases under [${ZONES_SECTION}]`, RUBRIC)
    }
    const aliasable = [...ZONES, ...STAGING]
    for (const [zone, folder] of Object.entries(ki.zones)) {
      if (!aliasable.includes(zone))
        warn('CONFIG-3', `[${ZONES_SECTION}] "${zone}" is not a zone or staging area (one of: ${aliasable.join(', ')})`, RUBRIC)
      else if (folder === zone) note('CONFIG-2', `[${ZONES_SECTION}] ${zone} = "${folder}" restates the canonical name — drop it`, RUBRIC)
      else note('CONFIG-4', `alias in effect: ${zone} resolves to ${folder}/`, RUBRIC)
    }
  }

  // ── preflight (declared reads before drafting), validate-down ──
  // Recognised as this skill's key so it doesn't warn as unknown; literal
  // (non-glob) entries should resolve under the base, globs are left to runtime.
  if (ki?.preflight) {
    const missing = ki.preflight.filter((p) => !/[*?[\]]/.test(p) && !existsSync(join(base, p)))
    if (missing.length) warn('CONFIG-5', `declared preflight path(s) not found under the base: ${sampleList(missing)}`, RUBRIC)
    note('CONFIG-5', `preflight: ${ki.preflight.length} entr${ki.preflight.length === 1 ? 'y' : 'ies'} declared`, RUBRIC)
  }

  // ── zone layout (resolved through any alias) ──
  const present = ZONES.filter((z) => isDir(join(base, zoneOf(z))))
  if (present.length === 0) {
    fail('ZONE-1', `no Knowledge Islands zone folders found at ${base} — not a KB base, or wrong path`, RUBRIC)
    return f
  }
  for (const z of ZONES) {
    const folder = zoneOf(z)
    if (!isDir(join(base, folder))) {
      fail('ZONE-1', `zone ${z} missing (expected ${folder}/)`, RUBRIC, `${folder}/`)
      continue
    }
    if (!isFile(join(base, folder, `${folder}.md`)))
      warn('ZONE-2', `${folder}/ has no same-name index note`, RUBRIC, `${folder}/${folder}.md`)
  }

  // ── root memory index (in the Admin zone) ──
  const adminFolder = zoneOf('Admin')
  if (isDir(join(base, adminFolder)) && !isFile(join(base, adminFolder, MEMORY_INDEX)))
    fail('ZONE-3', `root memory index is missing (lists the active Pillars)`, RUBRIC, `${adminFolder}/${MEMORY_INDEX}`)

  // ── Admin/ subdivisions (Governance/ and Operations/) ──
  // Both are canonical but opt-in: WARN if absent, WARN if present but missing index note.
  if (isDir(join(base, adminFolder))) {
    for (const sub of ['Governance', 'Operations'] as const) {
      const subPath = join(base, adminFolder, sub)
      if (!isDir(subPath)) {
        warn(
          'ADMIN-1',
          `${sub}/ is absent — consider creating it when that concern becomes active (index note: ${sub}.md)`,
          RUBRIC,
          `${adminFolder}/${sub}/`
        )
      } else if (!isFile(join(subPath, `${sub}.md`))) {
        warn('ADMIN-1', `${sub}/ exists but has no index note`, RUBRIC, `${adminFolder}/${sub}/${sub}.md`)
      }
    }

    // ── Charter + Conformance baseline (live in Admin/Governance/) ──
    // WARN if Governance/ is present but either required document is absent.
    const govPath = join(base, adminFolder, 'Governance')
    if (isDir(govPath)) {
      if (!isFile(join(govPath, 'Charter.md')))
        warn(
          'ADMIN-2',
          `Charter.md is absent — it should declare the base's scope, purpose, and owner`,
          RUBRIC,
          `${adminFolder}/Governance/Charter.md`
        )
      if (!isFile(join(govPath, 'Conformance.md')))
        warn(
          'ADMIN-3',
          `Conformance.md is absent — it should list the active skills and their adoption date`,
          RUBRIC,
          `${adminFolder}/Governance/Conformance.md`
        )
    }
  }

  // ── MEM-2: the memory cascade is anchored in always-loaded context ──
  // The cascade (scope to a Pillar + load MEMORY before substantive work) only runs
  // if the base's CLAUDE.md / AGENTS.md points to it — skills load on demand, so an
  // unanchored cascade is silently skipped on a plain request.
  const anchorName = ['CLAUDE.md', 'AGENTS.md'].find((n) => isFile(join(base, n)))
  if (!anchorName)
    warn(
      'MEM-2',
      'no CLAUDE.md / AGENTS.md at the base root — the memory cascade (scope + load MEMORY before work) has no always-on anchor',
      RUBRIC
    )
  else if (/memory|ki-kb/i.test(readFileSync(join(base, anchorName), 'utf8')))
    note('MEM-2', `memory cascade anchored in ${anchorName}`, RUBRIC, anchorName)
  else
    warn(
      'MEM-2',
      `doesn't anchor the memory cascade — name the root MEMORY index / the scope-before-work rule so it runs on a plain request`,
      RUBRIC,
      anchorName
    )

  // ── note frontmatter ──
  // Base-agnostic [M]: a note with frontmatter must close its `---` fence and use
  // snake_case keys (the house convention). Base-declared [M]: when the base lists
  // `required_frontmatter` in its [ki-kb] table, every note that HAS
  // frontmatter must carry those keys (extra keys stay free). Whether a given note
  // SHOULD have frontmatter at all is base/type-specific — that stays judgment.
  const required = ki?.requiredFrontmatter ?? []
  let scanned = 0
  let withFm = 0
  const unterminated: string[] = []
  const badKeys: string[] = []
  const missingReq: string[] = []
  for (const file of walkMarkdown(base)) {
    scanned++
    const fm = frontmatterKeys(readFileSync(file, 'utf8'))
    if (!fm) continue
    withFm++
    const rel = file.slice(base.length + 1)
    if (!fm.terminated) {
      unterminated.push(rel)
      continue // keys past an unclosed fence aren't trustworthy
    }
    for (const k of fm.keys) if (!SNAKE.test(k)) badKeys.push(`${rel}: "${k}"`)
    for (const r of required) if (!fm.keys.includes(r)) missingReq.push(`${rel} (${r})`)
  }
  if (unterminated.length)
    fail('NOTE-1a', `unterminated frontmatter (no closing \`---\`) in ${unterminated.length} note(s): ${sampleList(unterminated)}`, FM)
  if (missingReq.length)
    fail('NOTE-1', `missing required key(s) [${required.join(', ')}] in ${missingReq.length} note(s): ${sampleList(missingReq)}`, FM)
  if (badKeys.length) warn('NOTE-1b', `non-snake_case frontmatter key(s) in ${badKeys.length} note(s): ${sampleList(badKeys)}`, FM)
  note(
    'NOTE-1',
    `scanned ${scanned} note(s), ${withFm} with frontmatter${required.length ? ` · required keys: ${required.join(', ')}` : ' · no required_frontmatter declared'}`,
    FM
  )

  // ── staging (informational only) ──
  for (const s of STAGING) {
    const folder = zoneOf(s)
    note('ZONE-4', `${folder}/ ${isDir(join(base, folder)) ? 'present' : 'absent'} (staging, not a zone)`, RUBRIC)
  }

  return f
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

const kiPath = join(base, KI_CONFIG)
const parsedKiKb = isFile(kiPath) ? parseKiKb(readFileSync(kiPath, 'utf8')) : { value: null, malformed: false }
const ki = parsedKiKb.value

const hasKbStructure = ZONES.some((zone) => isDir(join(base, zone)))
if (!ki && !parsedKiKb.malformed && !hasKbStructure) {
  const { f, na } = mk()
  na('ZONE-1', 'ki-kb not applicable: no [ki-kb] declaration or canonical KB zone structural marker', RUBRIC)
  emit(f, base, 'kb', `Knowledge base audit — ${base}`, '')
}

const findings = auditBase(base, ki)
emit(
  findings,
  base,
  'kb',
  `Knowledge base audit — ${base}`,
  'mechanical checks only — apply the judgment criteria (note routing, whether a note needs frontmatter, memory-index accuracy) by reading.'
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
      console.log('→ to address: run /ki-kb CONFORM   (judgment criteria: references/audit-rubric.md)')
    if (report) console.log(`report → ${join(reportDir, `${concern}.{md,json}`)}`)
    console.log('')
  }
  process.exit(summary.fail ? 1 : 0)
}
