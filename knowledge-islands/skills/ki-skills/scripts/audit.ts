#!/usr/bin/env bun
// Lint Agent Skills against the MECHANICAL criteria of the ki-skills rubric.
//
// This is the deterministic half of the rubric (see ../references/audit-rubric.md). The
// JUDGMENT half — description quality, altitude, progressive-disclosure sensibility,
// standard-vs-extension shape — needs a model and is NOT checked here. Run this first,
// then apply the judgment criteria by reading.
//
// Usage:
//   bun scripts/audit.ts [path ...]            # a skill dir, or a dir containing skills
//   bun scripts/audit.ts <skill> --footprint   # + per-skill token footprint (SIZE-5, INFO) for Mode OPTIMISE
//   bun scripts/audit.ts skills --refresh-status # + per-skill refresh class/cadence/status (LONG-3/§5, INFO)
//   bun run ki:skills:audit                              # (from the ki-agentic-harness repo root)
//
// A path containing SKILL.md is treated as one skill; otherwise its immediate
// subdirectories that contain a SKILL.md are each linted. Defaults to the current dir.
// Exits non-zero if any FAIL is reported (WARN never fails the run).
//
// With >= 2 skills in scope it also runs a cross-skill collision pass (COLL-1):
// two descriptions declaring the same quoted trigger phrase are WARNed.

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'

const C = { reset: '\x1b[0m', dim: '\x1b[2m', green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m', cyan: '\x1b[36m' }
const paint = (c: string, s: string): string => `${c}${s}${C.reset}`

type Severity = 'fail' | 'warn'
// area = the rubric code (criterion); ref = the reference-doc pointer the criterion cites
// (this skill's rubric); file = the path a file-scoped finding concerns. ref/file feed the
// cited-finding render (`[area] file msg (ref)`) and are serialised verbatim under --json.
type Finding = { severity: Severity; criterion: string; message: string; ref?: string; file?: string }

// Every ki-skills criterion is defined in this skill's rubric — the default reference pointer.
const RUBRIC = 'references/audit-rubric.md'

// --- limits (from references/agent-skills-standard.md §16 — keep in sync) ----------------------
const NAME_MAX = 64
const DESC_MAX = 1024
const COMPAT_MIN = 1
const COMPAT_MAX = 500
const BODY_MAX_LINES = 500
const BODY_MAX_TOKENS = 5000 // estimated as chars/4
const TOC_LINE_THRESHOLD = 100
const REFRESH_GRACE_DAYS = 14 // grace added once past a skill's declared cadence window before LONG-3 WARNs
const CADENCE_DAYS: Record<string, number> = { weekly: 7, monthly: 30, quarterly: 90 } // 'on-change' = no clock; '<N>d' parsed inline
const FOOTPRINT_REF_NOTE_TOKENS = 1500 // a single reference this large is a candidate to split — INFO hint only, never a cap
const RESERVED = ['anthropic', 'claude']

// --- minimal frontmatter parser --------------------------------------------
// Handles top-level scalar keys and `>`/`|` block scalars. Nested maps (e.g.
// `metadata:`) are recorded as present with an empty value; that is all the
// mechanical checks need. Avoids a YAML dependency so the script stays portable.
type Frontmatter = { keys: Map<string, string>; present: Set<string>; raw: string | null }

function parseFrontmatter(content: string): Frontmatter {
  const keys = new Map<string, string>()
  const present = new Set<string>()
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!m) return { keys, present, raw: null }
  const block = m[1] as string
  const lines = block.split(/\r?\n/)
  let i = 0
  while (i < lines.length) {
    const line = lines[i] as string
    if (line.trim() === '' || line.trimStart().startsWith('#')) {
      i++
      continue
    }
    const kv = line.match(/^([A-Za-z0-9_-]+):(.*)$/) // column-0 top-level key
    if (!kv) {
      i++
      continue
    }
    const key = kv[1] as string
    const rest = (kv[2] as string).trim()
    present.add(key)
    if (rest === '>' || rest === '|' || rest.startsWith('> ') || rest.startsWith('| ') || /^[>|][-+]?\d*\s*$/.test(rest)) {
      const folded = rest[0] === '>'
      const collected: string[] = []
      i++
      // Block body = subsequent indented lines (blank lines belong to it too).
      // Stops at the next column-0 key.
      while (i < lines.length) {
        const l = lines[i] as string
        if (l.trim() !== '' && !/^\s/.test(l)) break
        if (l.trim() !== '') collected.push(l.trim())
        i++
      }
      keys.set(key, folded ? collected.join(' ') : collected.join('\n'))
      continue
    }
    if (rest === '') {
      // bare key — could head a nested map; skip its indented children
      i++
      while (i < lines.length && /^\s+\S/.test(lines[i] as string)) i++
      keys.set(key, '')
      continue
    }
    keys.set(key, stripQuotes(rest))
    i++
  }
  return { keys, present, raw: block }
}

function stripQuotes(s: string): string {
  const t = s.trim()
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) return t.slice(1, -1)
  return t
}

const hasXmlTag = (s: string): boolean => /<\/?[a-zA-Z][^>]*>/.test(s)

// Parses a flow-list frontmatter value (`owns: ['.gitignore', 'x.json']` or
// `contributes: [.ki-config.toml]`) into its bare filenames. Empty/absent → [].
function parseListValue(raw: string | undefined): string[] {
  if (!raw) return []
  const inner = raw.trim().replace(/^\[/, '').replace(/\]$/, '')
  if (inner.trim() === '') return []
  return inner
    .split(',')
    .map((s) => stripQuotes(s))
    .filter((s) => s.length > 0)
}

// Remove fenced code blocks and inline code spans, so text-pattern checks don't
// fire on documentation/examples (e.g. a description that names `<app>` as a
// placeholder, or a rubric that quotes `[[wikilink]]` syntax to forbid it).
const stripCode = (md: string): string => md.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '')

// --- SHAPE-2 endorsement detection (composition-only) -----------------------
// Composition is the sole sanctioned inter-skill relationship; the base-coupled
// extension pattern is retired (a base declares differences in .ki-config / CLAUDE.md,
// it does not ship a <base>-kb skill that takes the shared modes). Keyed on ENDORSEMENT
// phrasing, not the bare word "extension" — the meta-skills must name the retired
// pattern in order to forbid it. Runs over the SKILL.md body AND each reference file.
// Citation ≠ assertion: the rubric/standard QUOTE the forbidden phrases to forbid them,
// so before testing we strip code + double-quoted spans and skip any line that disavows
// (retired / never / forbid / flag / heuristic / anti-pattern). What remains and still
// matches is a bare assertion of the pattern. WARN for the [J] reviewer to confirm.
const ENDORSE_EXTENSION_RES = [
  /\bprefer that (extension )?skill\b/i,
  /delegat\w*[^.\n]*\bmodes?\b[^.\n]*\bback\b/i,
  /\bextends this one\b/i
]
const DISAVOWAL_CUE = /retir|never|forbid|\bflag|heurist|anti-pattern|disavow|must not|do not/i
function endorsesRetiredExtension(md: string): boolean {
  const stripped = stripCode(md).replace(/"[^"\n]*"/g, '')
  return stripped.split(/\r?\n/).some((line) => !DISAVOWAL_CUE.test(line) && ENDORSE_EXTENSION_RES.some((re) => re.test(line)))
}

// --- markdown link extraction ----------------------------------------------
// Returns relative link targets (skips http/https/mailto/# anchors). Strips the
// CommonMark angle-bracket form and any #anchor suffix.
function relativeLinkTargets(md: string): string[] {
  const out: string[] = []
  const re = /\[[^\]]*\]\(([^)]+)\)/g
  let m: RegExpExecArray | null
  // biome-ignore lint/suspicious/noAssignInExpressions: standard regex-exec loop
  while ((m = re.exec(md)) !== null) {
    let target = (m[1] as string).trim()
    if (target.startsWith('<') && target.endsWith('>')) target = target.slice(1, -1).trim()
    if (/^[a-z]+:\/\//i.test(target) || target.startsWith('mailto:') || target.startsWith('#')) continue
    const hash = target.indexOf('#')
    if (hash !== -1) target = target.slice(0, hash)
    if (target) out.push(target)
  }
  return out
}

const hasWikilink = (md: string): boolean => /\[\[[^\]]+\]\]/.test(md)
const hasBackslashLink = (md: string): boolean => /\[[^\]]*\]\([^)]*\\[^)]*\)/.test(md)

// --- process vs governance (SHAPE-3 / ADR-KI-HARNESS-SKILLS-006) -----------
// A process skill self-declares in its description: "(kind: process, ADR-...)".
// Everything else in the fleet is a governance skill for the purposes of the
// universal-mode checks (SHAPE-11/12/13).
const isProcessSkill = (desc: string): boolean => /\(kind:\s*process\b/i.test(desc)

// --- SHAPE-12/13: mode vocabulary + heading structure -----------------------
// The `## Operating modes` H2 is the home for the shared no-mode/HELP intro plus
// each mode as a `### Mode <NAME>` H3 (or a `| Mode | … |` dispatch table for
// router skills with many operational verbs). extractBodyModes reads whichever
// form is present, scoped to that section only, so a stray "### X" elsewhere in
// the body (an example, a reference aside) is never mistaken for a mode heading.
function extractSection(body: string, heading: string): string | null {
  const re = new RegExp(`^##\\s+${heading}\\s*$`, 'im')
  const m = re.exec(body)
  if (!m) return null
  const start = (m.index ?? 0) + m[0].length
  const rest = body.slice(start)
  const next = rest.search(/^##\s+/m)
  return next === -1 ? rest : rest.slice(0, next)
}

function extractBodyModes(body: string): Set<string> {
  const modes = new Set<string>()
  const section = extractSection(body, 'Operating modes')
  if (!section) return modes
  for (const m of section.matchAll(/^###\s+Mode\s+(\w+)/gim)) modes.add((m[1] as string).toUpperCase())
  let headerSeen = false
  for (const rawLine of section.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line.startsWith('|')) {
      headerSeen = false
      continue
    }
    const cells = line
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim())
    if (!headerSeen) {
      if (/^mode$/i.test(cells[0] ?? '')) headerSeen = true
      continue
    }
    const first = (cells[0] ?? '').replace(/`/g, '').trim()
    if (/^:?-+:?$/.test(first)) continue // separator row
    if (first) modes.add(first.toUpperCase())
  }
  return modes
}

// First word of each `|`-separated segment of an argument-hint, e.g.
// `'audit | conform <target> | help'` → ['AUDIT', 'CONFORM', 'HELP'].
function hintVerbs(hint: string): string[] {
  const out: string[] = []
  for (const seg of hint.split('|')) {
    const m = seg.trim().match(/^[a-zA-Z][a-zA-Z0-9-]*/)
    if (m) out.push(m[0].toUpperCase())
  }
  return out
}

function listMarkdownFiles(dir: string): string[] {
  const out: string[] = []
  const walk = (d: string): void => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.name.startsWith('.') || e.name === 'node_modules') continue
      const p = join(d, e.name)
      if (e.isDirectory()) walk(p)
      else if (e.name.endsWith('.md')) out.push(p)
    }
  }
  walk(dir)
  return out
}

function hasTableOfContents(md: string): boolean {
  const head = md.split(/\r?\n/).slice(0, 40).join('\n').toLowerCase()
  if (/^#{1,3}\s+(table of )?contents\b/m.test(head)) return true
  const linkListItems = (head.match(/^\s*[-*]\s+\[[^\]]+\]\(/gm) || []).length
  return linkListItems >= 3
}

// --- footprint (SIZE-5, INFO under --footprint) -----------------------------
// Per-skill token estimate of everything the skill adds to context: the description
// (standing cost — paid every turn in the selection surface), the SKILL.md body
// (loaded when the skill fires), and each references/ file (loaded on demand). Same
// chars/4 method as SIZE-2; never a cap — measurement for Mode OPTIMISE. The
// environment-level aggregate of all descriptions is ki-tokenomics'.
const estTok = (s: string): number => Math.round(s.length / 4)
type FootprintRow = { kind: 'description' | 'body' | 'reference'; path: string; tokens: number }
function footprint(skillDir: string): { rows: FootprintRow[]; total: number } {
  const content = readFileSync(join(skillDir, 'SKILL.md'), 'utf8')
  const desc = parseFrontmatter(content).keys.get('description') ?? ''
  const body = content.slice((content.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/) || [''])[0].length)
  const rows: FootprintRow[] = [
    { kind: 'description', path: 'SKILL.md:description', tokens: estTok(desc) },
    { kind: 'body', path: 'SKILL.md:body', tokens: estTok(body) }
  ]
  for (const file of listMarkdownFiles(skillDir)) {
    if (basename(file) === 'SKILL.md') continue
    rows.push({ kind: 'reference', path: file.slice(skillDir.length + 1), tokens: estTok(readFileSync(file, 'utf8')) })
  }
  return { rows, total: rows.reduce((n, r) => n + r.tokens, 0) }
}

// --- the lint --------------------------------------------------------------
// Latest date in the "Last reviewed" column of a sources.md, or null. Reads the
// column by its header so forward-looking dates quoted in prose (e.g. a spec's
// release date in the "## Last review" block) are never mistaken for a review date.
function latestReviewDate(text: string): string | null {
  let col = -1
  let latest: string | null = null
  for (const line of text.split(/\r?\n/)) {
    if (!line.trimStart().startsWith('|')) {
      col = -1
      continue
    }
    const cells = line
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim())
    const header = cells.findIndex((c) => /^last reviewed$/i.test(c))
    if (header >= 0) {
      col = header
      continue
    }
    if (col < 0) continue
    const m = (cells[col] ?? '').match(/\d{4}-\d{2}-\d{2}/)
    if (m && (latest === null || m[0] > latest)) latest = m[0]
  }
  return latest
}

// --- refresh cadence (enforcement framework §4/§5) ----------------------------
// One `**Refresh:** <class> · <cadence>` marker per sources.md drives both LONG-3
// (overdue WARN) and the REFRESH too-soon gate, via one status computation.
type RefreshClass = 'external-spec' | 'canonical'
type RefreshStatus = 'due' | 'within-window' | 'overdue' | 'no-clock' | 'unmarked'
interface RefreshInfo {
  cls: RefreshClass | null
  cadence: string | null // raw token: weekly | monthly | quarterly | on-change | <N>d
  windowDays: number | null // null = no clock (on-change)
  lastReviewed: string | null
  ageDays: number | null
  status: RefreshStatus
}

// Parse the marker from the top of a sources.md. Returns null when absent/malformed
// (including a non-positive `<N>d`). 'on-change' yields windowDays = null (no clock).
function parseRefreshMarker(text: string): { cls: RefreshClass; cadence: string; windowDays: number | null } | null {
  const m = text.match(/^\*\*Refresh:\*\*\s*(external-spec|canonical)\s*·\s*(weekly|monthly|quarterly|on-change|\d+d)\s*$/m)
  if (!m) return null
  const cls = m[1] as RefreshClass
  const cadence = m[2] as string
  let windowDays: number | null
  if (cadence === 'on-change') windowDays = null
  else if (/^\d+d$/.test(cadence)) {
    const n = Number.parseInt(cadence, 10)
    if (n <= 0) return null // 0d is malformed → treat as unmarked
    windowDays = n
  } else windowDays = CADENCE_DAYS[cadence] ?? null
  return { cls, cadence, windowDays }
}

function computeRefreshStatus(sourcesText: string): RefreshInfo {
  const marker = parseRefreshMarker(sourcesText)
  const lastReviewed = latestReviewDate(sourcesText)
  const ageDays = lastReviewed ? Math.floor((Date.now() - Date.parse(`${lastReviewed}T00:00:00Z`)) / 86_400_000) : null
  if (!marker) return { cls: null, cadence: null, windowDays: null, lastReviewed, ageDays, status: 'unmarked' }
  const { cls, cadence, windowDays } = marker
  if (windowDays === null) return { cls, cadence, windowDays, lastReviewed, ageDays, status: 'no-clock' }
  if (ageDays === null) return { cls, cadence, windowDays, lastReviewed, ageDays, status: 'overdue' } // clock declared, no date
  let status: RefreshStatus
  if (ageDays > windowDays + REFRESH_GRACE_DAYS) status = 'overdue'
  else if (ageDays < windowDays) status = 'within-window'
  else status = 'due'
  return { cls, cadence, windowDays, lastReviewed, ageDays, status }
}

function lintSkill(skillDir: string): Finding[] {
  const f: Finding[] = []
  const fail = (criterion: string, message: string, file?: string): void =>
    void f.push({ severity: 'fail', criterion, message, ref: RUBRIC, file })
  const warn = (criterion: string, message: string, file?: string): void =>
    void f.push({ severity: 'warn', criterion, message, ref: RUBRIC, file })

  const skillMd = join(skillDir, 'SKILL.md')
  if (!existsSync(skillMd)) {
    fail('LAY-1', 'SKILL.md is missing')
    return f
  }
  const content = readFileSync(skillMd, 'utf8')
  const dirName = basename(skillDir)

  // --- frontmatter ---
  const fm = parseFrontmatter(content)
  if (fm.raw === null) {
    fail('LAY-1/NAME-1', 'No YAML frontmatter block (--- ... ---) at the top of SKILL.md')
    return f
  }
  const name = fm.keys.get('name')
  const desc = fm.keys.get('description')

  // name (NAME-1–NAME-7 mechanical)
  if (!name) fail('NAME-1', '`name` is missing from frontmatter')
  else {
    if (name.length > NAME_MAX) fail('NAME-2', `\`name\` is ${name.length} chars (max ${NAME_MAX})`)
    if (!/^[a-z0-9-]+$/.test(name)) fail('NAME-3', `\`name\` "${name}" must be lowercase letters, digits, and hyphens only`)
    if (name.startsWith('-') || name.endsWith('-') || name.includes('--'))
      fail('NAME-4', `\`name\` "${name}" must not start/end with a hyphen or contain "--"`)
    if (name !== dirName) fail('NAME-5', `\`name\` "${name}" does not match the directory name "${dirName}"`)
    if (hasXmlTag(name)) fail('NAME-6', '`name` contains an XML tag')
    for (const r of RESERVED) if (name.includes(r)) fail('NAME-6', `\`name\` contains the reserved word "${r}"`)
  }

  // description (DESC-1–DESC-3 mechanical)
  if (!desc || desc.trim() === '') fail('DESC-1', '`description` is missing or empty')
  else {
    if (desc.length > DESC_MAX) fail('DESC-2', `\`description\` is ${desc.length} chars (max ${DESC_MAX})`)
    if (hasXmlTag(stripCode(desc))) fail('DESC-3', '`description` contains an XML tag')
  }

  // compatibility (OPT-1 mechanical)
  const compat = fm.keys.get('compatibility')
  if (compat !== undefined && (compat.length < COMPAT_MIN || compat.length > COMPAT_MAX))
    fail('OPT-1', `\`compatibility\` is ${compat.length} chars (must be ${COMPAT_MIN}–${COMPAT_MAX})`)

  // universal HELP mode (SHAPE-10 mechanical; ADR-KI-HARNESS-SKILLS-001). Every
  // governance skill exposes HELP — the no-mode default and the `help`/`-h`/`?`
  // pure-explain form — so its `argument-hint` must list a `help` verb. The
  // HELP block itself is generated (skills/keystone/ki-bootstrap/scripts/skill-help.ts); this only checks the
  // one-token footprint. The prose HELP semantics are a [J] criterion.
  const hint = fm.keys.get('argument-hint')
  if (hint !== undefined && !/(^|[|\s'"])help([|\s'"]|$)/.test(hint))
    fail('SHAPE-11', '`argument-hint` does not expose the universal `help` mode (ADR-KI-HARNESS-SKILLS-001)')

  // --- body size (SIZE-1/SIZE-2 soft → WARN) ---
  const body = content.slice((content.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/) || [''])[0].length)

  // SHAPE-16 [M]: declared file ownership. A skill that scaffolds a house-standard
  // file into a target repo (`scaffold(...)` / `syncOwned(...)` with a literal
  // filename) must declare that filename under `owns:`; every filename declared
  // under `owns:`/`contributes:`/`requires:` must also appear literally in the
  // skill's own audit.ts, since that's where the corresponding check lives. This
  // covers house-standard files in the *target repo's* working tree — not
  // `.ki-meta/`, which has its own vendoring/hash mechanism (`vendors:`, SHAPE-12/15).
  // Applies to every skill (not gated on process-vs-governance kind, unlike SHAPE-12/13).
  {
    const owns = parseListValue(fm.keys.get('owns'))
    const contributes = parseListValue(fm.keys.get('contributes'))
    const requires = parseListValue(fm.keys.get('requires'))
    const conformPath = join(skillDir, 'scripts', 'conform.ts')
    const auditPath = join(skillDir, 'scripts', 'audit.ts')
    if (existsSync(conformPath)) {
      // This greps conform SOURCE for scaffold(...)/syncOwned(...) calls, so the scaffolded
      // filename MUST be the first string literal of the call. Line comments are stripped
      // first so prose that merely mentions the pattern is not mis-detected as a scaffold —
      // that false positive bit twice during the cited-findings sweep (ADR-KI-HARNESS-SKILLS-010).
      const conformSrc = readFileSync(conformPath, 'utf8').replace(/\/\/.*$/gm, '')
      const scaffolded = new Set<string>()
      for (const m of conformSrc.matchAll(/\b(?:scaffold|syncOwned)\(\s*['"]([^'"]+)['"]/g)) scaffolded.add(m[1] as string)
      for (const file of scaffolded)
        if (!owns.includes(file)) warn('SHAPE-16', `scaffolds \`${file}\` but does not declare it under \`owns:\` in frontmatter`)
    }
    if (existsSync(auditPath)) {
      const auditSrc = readFileSync(auditPath, 'utf8')
      for (const file of [...owns, ...contributes, ...requires])
        if (!auditSrc.includes(file))
          warn('SHAPE-16', `declares \`${file}\` (owns/contributes/requires) but \`scripts/audit.ts\` never checks it`)
    }
  }

  // SCRIPT-9 [M]: no cross-skill relative imports. `ki-bootstrap` vendors a skill's
  // scripts/*.ts as standalone copies, flat, into every governed repo's
  // .ki-meta/skills/<skill>/ — no sibling skill directory is ever copied alongside it
  // (ADR-KI-HARNESS-006), so a relative import climbing out of the skill's own directory
  // would silently break wherever the unit is vendored.
  {
    const scriptsDir = join(skillDir, 'scripts')
    if (existsSync(scriptsDir)) {
      for (const entry of readdirSync(scriptsDir)) {
        // Only vendorable units are in scope — test files are never vendored (SCRIPT-9's
        // premise), and a *.test.ts routinely embeds import-shaped strings as fixture data.
        if (!entry.endsWith('.ts') || entry.endsWith('.test.ts')) continue
        const scriptPath = join(scriptsDir, entry)
        const src = readFileSync(scriptPath, 'utf8')
        for (const m of src.matchAll(/\bfrom\s+['"](\.\.?\/[^'"]+)['"]/g)) {
          const spec = m[1] as string
          const resolved = resolve(dirname(scriptPath), spec)
          if (!resolved.startsWith(`${skillDir}/`))
            fail(
              'SCRIPT-9',
              `\`scripts/${entry}\` imports \`${spec}\`, which resolves outside the skill's own directory — vendoring copies this file standalone, so the import would break in every repo that vendors it`
            )
        }
      }
    }
  }

  // --- SHAPE-12/13: universal-mode vocabulary + mode-heading structure ---
  // Both gate on kind: a process skill (self-declared "(kind: process" in its
  // description, per SHAPE-3) is fully exempt — its mode count follows its own
  // lifecycle. Everything else is a governance skill and must carry the canonical
  // vocabulary (SHAPE-12) and the `## Operating modes` structure (SHAPE-13).
  if (!isProcessSkill(desc ?? '')) {
    // SHAPE-12: argument-hint exposes every universal verb (EDUCATE is the common gap).
    const verbs = hintVerbs(hint ?? '')
    const missing = ['audit', 'conform', 'help', 'educate', 'refresh'].filter((v) => !verbs.includes(v.toUpperCase()))
    if (missing.length > 0)
      warn(
        'SHAPE-12',
        `\`argument-hint\` is missing the universal verb(s) ${missing.join(', ')} — a governance skill exposes AUDIT, CONFORM, EDUCATE, REFRESH and HELP (ADR-KI-HARNESS-SKILLS-001)`
      )
    // SHAPE-12 vendoring leg: the frontmatter declares the vendorable mechanical unit.
    if (!fm.present.has('vendors'))
      warn(
        'SHAPE-12',
        'frontmatter carries no `vendors:` declaration — declare the vendored modes beside `implies:` so the bootstrap engine can vendor them (ADR-KI-HARNESS-007)'
      )

    // SHAPE-15 [M]: the vendored modes are declared UNIFORMLY as the flow-list
    // `[educate, audit, conform, help]` (modes derive their scripts by name — no map form,
    // no override), and the bare mode scripts exist. `refresh` is harness-only and never
    // vendored. Redundant skill-name-suffixed scripts (audit-<skill>.ts) are the
    // pre-migration form (ADR-KI-HARNESS-007).
    if (fm.present.has('vendors')) {
      const vendorsLine = (fm.keys.get('vendors') ?? '').trim()
      if (vendorsLine !== '[educate, audit, conform, help]')
        fail(
          'SHAPE-15',
          `\`vendors:\` must be the uniform list \`[educate, audit, conform, help]\` (got \`${vendorsLine}\`) — modes derive their scripts by name; the map/override form is retired (ADR-KI-HARNESS-007)`
        )
      const sdir = join(skillDir, 'scripts')
      for (const mode of ['educate', 'audit', 'conform'])
        if (!existsSync(join(sdir, `${mode}.ts`)))
          fail('SHAPE-15', `\`scripts/${mode}.ts\` missing — a governance skill vendors bare \`educate.ts\`/\`audit.ts\`/\`conform.ts\``)
      if (existsSync(sdir))
        for (const n of readdirSync(sdir))
          if (/^(audit|lint|conform)-[a-z0-9-]+\.ts$/.test(n) && !n.endsWith('.test.ts'))
            fail('SHAPE-15', `\`scripts/${n}\` uses the redundant skill-name suffix — rename to bare \`audit.ts\`/\`conform.ts\``)
    }

    // SHAPE-13: single `## Operating modes` H2 wrapper; modes as `### Mode <NAME>`
    // H3s or a `| Mode | … |` dispatch table inside it; hint ⊆ body.
    const section = extractSection(body, 'Operating modes')
    if (section === null) warn('SHAPE-13', 'no `## Operating modes` H2 — modes live under a single wrapper H2 (ADR-KI-HARNESS-SKILLS-001)')
    const flatModeH2s = [...stripCode(body).matchAll(/^##\s+Mode\s+(\w+)/gim)].map((m) => m[1] as string)
    for (const flat of flatModeH2s)
      warn('SHAPE-13', `flat \`## Mode ${flat}\` H2 — demote to \`### Mode ${flat}\` inside the \`## Operating modes\` wrapper`)
    if (section !== null) {
      for (const h3 of stripCode(section).matchAll(/^###\s+(?!Mode\b)(\S[^\n]*)/gim))
        warn(
          'SHAPE-13',
          `bare \`### ${(h3[1] as string).trim()}\` inside \`## Operating modes\` — mode headings carry the \`Mode \` prefix`
        )
      // hint ⊆ body: every argument-hint verb appears as a mode in the section
      // (a `### Mode X` H3 and a `| Mode |` table row count equally). `help` may
      // instead be satisfied by the no-mode intro (the prose before the first H3
      // or table) mentioning help — the HELP block itself is generated (SHAPE-11).
      const bodyModes = extractBodyModes(body)
      const intro = section.split(/^###\s+|^\s*\|/m)[0] ?? ''
      for (const v of hintVerbs(hint ?? '')) {
        if (bodyModes.has(v)) continue
        if (v === 'HELP' && /\bhelp\b/i.test(intro)) continue
        warn('SHAPE-13', `\`argument-hint\` verb \`${v.toLowerCase()}\` has no mode in the \`## Operating modes\` section (hint ⊆ body)`)
      }
    }

    // SHAPE-14: REFRESH states its harness-only precondition. Its write target is
    // always this skill's own canonical files in ki-agentic-harness — invoked from a
    // repo where the skill is merely vendored, it must stop and redirect there (or to
    // ki-kb's IMPROVE mode). A missing REFRESH section entirely is already SHAPE-12's
    // job; this only checks the precondition text once a REFRESH mode is present.
    if (section !== null) {
      const refreshMatch = /^###\s+Mode\s+REFRESH\b[\s\S]*?(?=^###\s+Mode\s+|$(?![\s\S]))/im.exec(section)
      let refreshText = refreshMatch ? refreshMatch[0] : ''
      const refreshRefPath = join(skillDir, 'references', 'mode-refresh.md')
      if (existsSync(refreshRefPath)) refreshText += `\n${readFileSync(refreshRefPath, 'utf8')}`
      if (refreshText) {
        const namesHarness = /ki-agentic-harness/.test(refreshText)
        const stopsAndRedirects = /\bstop(s)?\b[\s\S]{0,160}\b(redirect|names?|route)/i.test(refreshText)
        if (!namesHarness || !stopsAndRedirects)
          warn(
            'SHAPE-14',
            'REFRESH section does not state the harness-only precondition — it should name `ki-agentic-harness` as the only place it writes and instruct stopping/redirecting when invoked from a vendored install'
          )
      }
    }
  }
  const bodyLines = body.split(/\r?\n/).length
  if (bodyLines > BODY_MAX_LINES)
    warn('SIZE-1', `SKILL.md body is ${bodyLines} lines (recommended < ${BODY_MAX_LINES}) — split into references/`)
  const estTokens = Math.round(body.length / 4)
  if (estTokens > BODY_MAX_TOKENS) warn('SIZE-2', `SKILL.md body is ~${estTokens} tokens (recommended < ${BODY_MAX_TOKENS})`)

  // --- per-file checks across all markdown (LAY-4, LINK-1, LINK-2, REF-3, SHAPE-2) ---
  for (const file of listMarkdownFiles(skillDir)) {
    const md = readFileSync(file, 'utf8')
    const text = stripCode(md) // exclude code blocks/spans from text-pattern checks
    const rel = file.slice(skillDir.length + 1)
    const isSkillMd = basename(file) === 'SKILL.md'
    if (hasWikilink(text)) fail('LINK-1', 'uses Obsidian wikilinks ([[...]]) — use relative markdown links', rel)
    if (hasBackslashLink(text)) fail('LAY-4', 'a link target uses backslashes — use forward slashes', rel)
    for (const target of relativeLinkTargets(text)) {
      const resolved = resolve(dirname(file), target)
      if (!existsSync(resolved)) fail('LINK-2', `broken relative link → "${target}"`, rel)
    }
    // ToC on long reference files (not SKILL.md itself)
    if (!isSkillMd) {
      const lineCount = md.split(/\r?\n/).length
      if (lineCount > TOC_LINE_THRESHOLD && !hasTableOfContents(md))
        warn('REF-3', `${lineCount} lines but no table of contents near the top`, rel)
    }
    // SHAPE-2: endorsement of the retired extension pattern, in the SKILL.md body OR any
    // reference file (a standard's prose can drift even when the SKILL.md body is clean).
    if (endorsesRetiredExtension(isSkillMd ? body : md))
      warn(
        'SHAPE-2',
        'endorses the retired base-coupled extension pattern (ship/"prefer" an extension skill, "delegates the modes back", "extends this one") — relationships are composition only; declare base differences in .ki-config / CLAUDE.md, per SHAPE-2',
        rel
      )
  }

  // --- behaviour-changing skills must anchor their gate (SHAPE-7 heuristic) ---
  // A skill that installs a gate / standing rule can't rely on its own description
  // to fire (skills load on demand). Strong gate phrasing — in the body OR a mode /
  // reference file, since mode-routing (REF-5) lifts procedures out of the body —
  // without an always-on anchor (CLAUDE.md/AGENTS.md) AND a checker that verifies it,
  // is a candidate gap. Evaluated over body + references as ONE unit: the gate phrasing
  // and its anchor may legitimately live in different files. WARN for the [J] reviewer.
  const refsText = listMarkdownFiles(skillDir)
    .filter((file) => basename(file) !== 'SKILL.md')
    .map((file) => readFileSync(file, 'utf8'))
    .join('\n')
  const skillText = `${body}\n${refsText}`
  const strongGate = /do not edit[^.\n]*directly|go through (a )?proposal|standing directive|installing the gate/i.test(
    stripCode(skillText)
  )
  if (strongGate) {
    const anchored = /CLAUDE\.md|AGENTS\.md|always-loaded|installing the gate|\banchor/i.test(skillText)
    const scriptsDir = join(skillDir, 'scripts')
    const checkerAnchors =
      existsSync(scriptsDir) &&
      readdirSync(scriptsDir).some((n) => n.endsWith('.ts') && /CLAUDE\.md|AGENTS\.md/.test(readFileSync(join(scriptsDir, n), 'utf8')))
    if (!(anchored && checkerAnchors))
      warn(
        'SHAPE-7',
        'reads as behaviour-changing (a gate / standing rule) but does not evidence an always-on anchor verified by its checker — anchor it in CLAUDE.md/AGENTS.md and check the anchor, per SHAPE-7'
      )
  }

  // --- mechanical work belongs in the checker, not in tokens (SHAPE-9 heuristic) ---
  // A rubric that tags criteria [M] (mechanical) must ship a scripts/ checker that
  // implements them — or document delegation to another skill-scoped audit.
  // [M] criteria left to prose make the reader re-derive deterministic checks in tokens.
  const rubricFile = join(skillDir, 'references', 'audit-rubric.md')
  if (existsSync(rubricFile)) {
    const rubric = readFileSync(rubricFile, 'utf8')
    const mechanical = (rubric.match(/\[M\]/g) ?? []).length
    if (mechanical > 0) {
      const rubricScriptsDir = join(skillDir, 'scripts')
      const hasChecker = existsSync(rubricScriptsDir) && readdirSync(rubricScriptsDir).some((n) => n.endsWith('.ts'))
      const documentsDelegation = /lint:md|toolchain (?:already )?enforces/i.test(rubric)
      if (!hasChecker && !documentsDelegation)
        warn(
          'SHAPE-9',
          `rubric tags ${mechanical} criteria [M] but the skill ships no scripts/ checker (nor a documented toolchain delegation) — mechanical work belongs in the checker, not in tokens, per SHAPE-9`
        )
    }
  }

  // --- SHAPE-8 mechanical: the checker ships the remediation footer ---
  // checker-contract.md requires every checker to print a remediation footer on a
  // non-clean summary, naming its OWN skill's CONFORM mode. A checker source with no
  // such footer (or one naming another skill) has drifted from the contract. The footer
  // prefix is standardised wording, so a source scan is reliable; guarding it on non-clean
  // and suppressing it under --json/--report stay [J] (verify by reading the emit path).
  const contractScriptsDir = join(skillDir, 'scripts')
  if (existsSync(contractScriptsDir)) {
    const checkers = readdirSync(contractScriptsDir).filter(
      (n) => (n === 'audit.ts' || n.startsWith('audit-') || n.startsWith('lint-')) && n.endsWith('.ts') && !n.endsWith('.test.ts')
    )
    for (const checker of checkers) {
      const src = readFileSync(join(contractScriptsDir, checker), 'utf8')
      const footers = [...src.matchAll(/→ to address: run \/([a-z0-9-]+)\b/g)].map((m) => m[1])
      if (footers.length === 0)
        warn(
          'SHAPE-8',
          `checker ${checker} ships no remediation footer ("→ to address: run /${dirName} CONFORM …") — required by checker-contract.md`
        )
      else if (!footers.includes(dirName))
        warn(
          'SHAPE-8',
          `checker ${checker}'s remediation footer names /${footers[0]}, not its own skill /${dirName} — per checker-contract.md`
        )
    }
  }

  // --- LONG-3 / LONG-4: the declared refresh cadence ---
  // One `**Refresh:**` marker drives both. LONG-4 checks the marker is present &
  // coherent; LONG-3 WARNs when overdue against the skill's OWN cadence. WARN-only —
  // staleness is elapsed time, not a defect in the commit; a canonical · on-change
  // skill carries no clock and is exempt. Only fires where a source list exists
  // (LONG-1 leaves runtime-resolved skills without one).
  const sourcesPath = join(skillDir, 'references', 'sources.md')
  if (existsSync(sourcesPath)) {
    const info = computeRefreshStatus(readFileSync(sourcesPath, 'utf8'))
    if (info.status === 'unmarked') {
      warn('LONG-4', 'references/sources.md has no parseable `**Refresh:** <class> · <cadence>` marker near the top (LONG-4a)')
    } else {
      if (info.cls === 'external-spec' && info.cadence === 'on-change')
        warn(
          'LONG-4',
          '`**Refresh:**` marks this external-spec but cadence is `on-change` — an external-spec tracker needs a clock cadence (LONG-4b)'
        )
      if (info.status === 'overdue')
        warn(
          'LONG-3',
          info.lastReviewed
            ? `references/sources.md last reviewed ${info.lastReviewed} (${info.ageDays} days ago), past its ${info.cadence} REFRESH cadence + ${REFRESH_GRACE_DAYS}d grace — run Mode REFRESH`
            : `references/sources.md declares a ${info.cadence} cadence but has no \`Last reviewed\` date — run Mode REFRESH`
        )
    }
  }

  return f
}

// --- cross-skill collision (COLL-1 mechanical) -----------------------------
// A description's "triggers" are its quoted phrases. Two skills declaring the
// SAME trigger compete at selection time — WARN (an off-ramp in the prose, which
// the model judges per COLL-2, can make it acceptable, so never FAIL). Only runs
// when >= 2 skills are in scope; point the linter at the repo to get the set.
function triggerPhrases(desc: string): string[] {
  const out = new Set<string>()
  const re = /"([^"]{2,})"/g
  let m: RegExpExecArray | null
  // biome-ignore lint/suspicious/noAssignInExpressions: standard regex-exec loop
  while ((m = re.exec(desc)) !== null) {
    const t = (m[1] as string).toLowerCase().replace(/\s+/g, ' ').trim()
    if (t) out.add(t)
  }
  return [...out]
}

function collisionFindings(dirs: string[]): Finding[] {
  if (dirs.length < 2) return []
  const byPhrase = new Map<string, Set<string>>()
  for (const dir of dirs) {
    const skillMd = join(dir, 'SKILL.md')
    if (!existsSync(skillMd)) continue
    const desc = parseFrontmatter(readFileSync(skillMd, 'utf8')).keys.get('description') ?? ''
    for (const phrase of triggerPhrases(desc)) {
      if (!byPhrase.has(phrase)) byPhrase.set(phrase, new Set())
      byPhrase.get(phrase)?.add(basename(dir))
    }
  }
  const out: Finding[] = []
  for (const [phrase, skills] of byPhrase) {
    if (skills.size > 1)
      out.push({
        severity: 'warn',
        criterion: 'COLL-1',
        message: `trigger "${phrase}" is shared by ${[...skills].sort().join(', ')} — confirm each names the other as an off-ramp (COLL-2)`,
        ref: RUBRIC
      })
  }
  return out.sort((a, b) => a.message.localeCompare(b.message))
}

// SHAPE-16 collision leg: `owns:` is exclusive — two skills both claiming `owns:`
// on the same filename is a real conflict (the exact shape of the .prettierrc.json
// bug this criterion exists to catch). `contributes:`/`requires:` are exempt —
// multiple skills sharing those on one filename is the normal, expected case.
function ownsCollisions(dirs: string[]): Finding[] {
  if (dirs.length < 2) return []
  const byFile = new Map<string, Set<string>>()
  for (const dir of dirs) {
    const skillMd = join(dir, 'SKILL.md')
    if (!existsSync(skillMd)) continue
    const owns = parseListValue(parseFrontmatter(readFileSync(skillMd, 'utf8')).keys.get('owns'))
    for (const file of owns) {
      if (!byFile.has(file)) byFile.set(file, new Set())
      byFile.get(file)?.add(basename(dir))
    }
  }
  const out: Finding[] = []
  for (const [file, skills] of byFile)
    if (skills.size > 1)
      out.push({
        severity: 'warn',
        criterion: 'SHAPE-16',
        message: `\`owns: ${file}\` is declared by ${[...skills].sort().join(', ')} — owns: is exclusive; split into a single owner plus contributes:/requires: on the rest`,
        ref: RUBRIC
      })
  return out.sort((a, b) => a.message.localeCompare(b.message))
}

// --- discovery -------------------------------------------------------------
function discoverSkillDirs(p: string): string[] {
  const abs = resolve(p)
  if (!existsSync(abs)) {
    console.error(paint(C.red, `path not found: ${abs}`))
    return []
  }
  if (existsSync(join(abs, 'SKILL.md'))) return [abs]
  // Given a repo root (rather than a skills dir itself), prefer its skills/
  // subdir — a bare repo root has no SKILL.md among its immediate children.
  const root = basename(abs) === 'skills' || !existsSync(join(abs, 'skills')) ? abs : join(abs, 'skills')
  const dirs: string[] = []
  for (const e of readdirSync(root, { withFileTypes: true })) {
    if (!e.isDirectory() || e.name.startsWith('.') || e.name === 'node_modules' || e.name === 'scripts') continue
    const p1 = join(root, e.name)
    if (existsSync(join(p1, 'SKILL.md'))) {
      dirs.push(p1) // flat: skills/<name>
      continue
    }
    // clustered: skills/<cluster>/<name>
    for (const sub of readdirSync(p1, { withFileTypes: true })) {
      if (!sub.isDirectory()) continue
      const p2 = join(p1, sub.name)
      if (existsSync(join(p2, 'SKILL.md'))) dirs.push(p2)
    }
  }
  return dirs.sort()
}

// --- main ------------------------------------------------------------------
const args = process.argv.slice(2).filter((a) => !a.startsWith('-'))
const roots = args.length ? args : ['.']
const skillDirs = [...new Set(roots.flatMap(discoverSkillDirs))].sort()

if (skillDirs.length === 0) {
  console.error(paint(C.red, 'No skills found (no directory with a SKILL.md).'))
  process.exit(1)
}

// One-line key for the area codes printed below (full catalogue: references/audit-rubric.md).
const LEGEND =
  'area codes — LAY layout · NAME name · DESC description · OPT optional-fm · SIZE size · REF references · BODY content · SCRIPT scripts · LINK linking · SHAPE KI-shape · PROC process · COLL collision · LONG longevity'

// Output flags + unified-ladder aggregation across every audited skill (enforcement-framework §2/§5).
const rawArgv = process.argv.slice(2)
const jsonOut = rawArgv.includes('--json')
const footprintOut = rawArgv.includes('--footprint') // SIZE-5: per-skill token footprint as INFO (Mode OPTIMISE)
const refreshStatusOut = rawArgv.includes('--refresh-status') // per-skill refresh cadence status as INFO (LONG-3/§5; the REFRESH gate reads this)
const ri = rawArgv.indexOf('--report')
const reportOut = ri !== -1
const reportTarget = resolve('.')
const reportDir =
  reportOut && rawArgv[ri + 1] && !rawArgv[ri + 1].startsWith('-') ? rawArgv[ri + 1] : join(reportTarget, '.ki-meta', 'audits')
type Level = 'FAIL' | 'WARN' | 'POLISH' | 'ADVISORY' | 'INFO' | 'NA' | 'PASS'
const LADDER: Level[] = ['FAIL', 'WARN', 'POLISH', 'ADVISORY', 'INFO', 'NA', 'PASS']
const ICON: Record<Level, string> = { FAIL: '❌', WARN: '⚠️', POLISH: '✨', ADVISORY: '🧭', INFO: 'ℹ️', NA: '🚫', PASS: '✅' }
const all: { level: Level; area: string; msg: string; ref?: string; file?: string }[] = []

if (!jsonOut) console.log(paint(C.dim, LEGEND))

let totalFails = 0
let totalWarns = 0
for (const dir of skillDirs) {
  const findings = lintSkill(dir)
  const fails = findings.filter((x) => x.severity === 'fail')
  const warns = findings.filter((x) => x.severity === 'warn')
  totalFails += fails.length
  totalWarns += warns.length
  for (const x of findings)
    all.push({
      level: x.severity === 'fail' ? 'FAIL' : 'WARN',
      area: `${basename(dir)}:${x.criterion}`,
      msg: x.message,
      ref: x.ref,
      file: x.file
    })
  if (!jsonOut) {
    const stamp = fails.length ? paint(C.red, 'FAIL') : warns.length ? paint(C.yellow, 'WARN') : paint(C.green, 'PASS')
    console.log(`\n${stamp}  ${paint(C.cyan, basename(dir))}`)
    for (const x of findings) {
      const tag = x.severity === 'fail' ? paint(C.red, 'fail') : paint(C.yellow, 'warn')
      console.log(
        `  ${tag} ${paint(C.dim, `[${x.criterion}]`)}${x.file ? ` ${x.file}` : ''} ${x.message}${x.ref ? paint(C.dim, ` (${x.ref})`) : ''}`
      )
    }
    if (findings.length === 0) console.log(paint(C.dim, '  all mechanical checks passed'))
  }
}

// cross-skill pass: collision between sibling descriptions (COLL-1)
const collisions = [...collisionFindings(skillDirs), ...ownsCollisions(skillDirs)]
if (collisions.length > 0) {
  totalWarns += collisions.length
  for (const x of collisions) all.push({ level: 'WARN', area: `collision:${x.criterion}`, msg: x.message, ref: x.ref })
  if (!jsonOut) {
    console.log(`\n${paint(C.yellow, 'WARN')}  ${paint(C.cyan, 'collision (cross-skill)')}`)
    for (const x of collisions)
      console.log(
        `  ${paint(C.yellow, 'warn')} ${paint(C.dim, `[${x.criterion}]`)} ${x.message}${x.ref ? paint(C.dim, ` (${x.ref})`) : ''}`
      )
  }
}

// per-skill footprint (SIZE-5) — opt-in, INFO only, never affects the fail/warn tally or exit code
if (footprintOut) {
  for (const dir of skillDirs) {
    const fp = footprint(dir)
    const sk = basename(dir)
    const refs = fp.rows.filter((r) => r.kind === 'reference').length
    all.push({ level: 'INFO', area: `${sk}:SIZE-5`, msg: `footprint ~${fp.total} tokens (description + body + ${refs} reference file(s))` })
    for (const r of fp.rows) {
      const big = r.kind === 'reference' && r.tokens > FOOTPRINT_REF_NOTE_TOKENS
      all.push({
        level: 'INFO',
        area: `${sk}:SIZE-5`,
        msg: `  ${r.kind} ${r.path}: ~${r.tokens} tokens${big ? ' — large, candidate to split or trim' : ''}`
      })
    }
    if (!jsonOut) {
      console.log(`\n${paint(C.cyan, sk)} ${paint(C.dim, 'footprint')}  ${ICON.INFO}~${fp.total} tokens`)
      for (const r of fp.rows) {
        const big = r.kind === 'reference' && r.tokens > FOOTPRINT_REF_NOTE_TOKENS
        console.log(
          paint(C.dim, `    ${r.kind} ${r.path}: ~${r.tokens} tokens`) + (big ? paint(C.yellow, ' — large, candidate to split') : '')
        )
      }
    }
  }
}

// per-skill refresh status (LONG-3/§5) — opt-in, INFO only, never affects the fail/warn tally or exit code.
// The REFRESH mode's too-soon gate reads this (within-window → confirm before forcing / skip on a scheduled run).
if (refreshStatusOut) {
  for (const dir of skillDirs) {
    const sk = basename(dir)
    const sp = join(dir, 'references', 'sources.md')
    const line = existsSync(sp)
      ? (() => {
          const i = computeRefreshStatus(readFileSync(sp, 'utf8'))
          return `${i.cls ?? 'unmarked'} · ${i.cadence ?? '—'} · last ${i.lastReviewed ?? '—'} · age ${i.ageDays ?? '—'}d · ${i.status.toUpperCase()}`
        })()
      : 'no sources.md'
    all.push({ level: 'INFO', area: `${sk}:refresh`, msg: line })
    if (!jsonOut) console.log(`\n${paint(C.cyan, sk)} ${paint(C.dim, 'refresh')}  ${ICON.INFO}${line}`)
  }
}

const summary = {
  fail: totalFails,
  warn: totalWarns,
  polish: 0,
  advisory: 0,
  info: all.filter((x) => x.level === 'INFO').length,
  na: 0,
  pass: 0
}
const stampIso = new Date().toISOString()

if (reportOut) {
  mkdirSync(reportDir, { recursive: true })
  const body = LADDER.flatMap((l) => {
    const rows = all.filter((f) => f.level === l)
    return rows.length
      ? [
          '',
          `## ${ICON[l]} ${l} (${rows.length})`,
          ...rows.map((r) => `- [${r.area}]${r.file ? ` ${r.file}` : ''} ${r.msg}${r.ref ? ` (${r.ref})` : ''}`)
        ]
      : []
  })
  const tally = `${skillDirs.length} skill(s) · FAIL=${summary.fail} WARN=${summary.warn}`
  writeFileSync(join(reportDir, 'skills.md'), [`# skills audit — ${reportTarget}`, '', `_${stampIso}_`, '', tally, ...body, ''].join('\n'))
  writeFileSync(
    join(reportDir, 'skills.json'),
    `${JSON.stringify({ concern: 'skills', target: reportTarget, generatedAt: stampIso, summary, findings: all }, null, 2)}\n`
  )
}

if (jsonOut) {
  process.stdout.write(
    `${JSON.stringify({ concern: 'skills', target: reportTarget, generatedAt: stampIso, summary, findings: all }, null, 2)}\n`
  )
} else {
  console.log(`\n${paint(C.cyan, 'summary')}: ${skillDirs.length} skill(s) · FAIL=${totalFails} WARN=${totalWarns}`)
  if (reportOut) console.log(paint(C.dim, `report → ${join(reportDir, 'skills.{md,json}')}`))
  if (totalFails + totalWarns > 0) console.log('→ to address: run /ki-skills CONFORM   (judgment criteria: references/audit-rubric.md)')
  console.log(paint(C.dim, 'mechanical checks only — apply the judgment criteria from references/audit-rubric.md by reading.'))
}
process.exit(totalFails > 0 ? 1 : 0)
