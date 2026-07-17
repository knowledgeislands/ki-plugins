#!/usr/bin/env bun
/**
 * Mechanical CONFORM for the `Streams` zone of a Knowledge Islands base — the
 * write twin of scripts/audit.ts. This is an HONEST NORMALIZE-ONLY conform:
 * almost everything the audit flags is a judgment call (a rename, an authored
 * index, a lifecycle transition, an authored gate directive), so this script
 * fixes only the ONE class of drift that is unambiguous AND reversible, and
 * prints every other category as a manual TODO — it never guesses.
 *
 *   bun scripts/conform.ts [base-path]   # default: cwd
 *   --dry-run                            # print the plan, mutate nothing
 *
 * The structure model (FOCI / STATUS / PRIORITY vocabularies, the ` Proposal`
 * suffix, the proposal frontmatter keys), the `.ki-config.toml` reader, the
 * frontmatter parser, the markdown walk, and the leaf/parent detection are all
 * COPIED from audit.ts (not imported — the composition-only rule keeps each
 * script valid standalone), and MUST be kept in lockstep with it.
 *
 * Fixes (unambiguous + reversible only):
 *   - ENACT-2 status/priority prose → bare token. When a `* Proposal.md`'s
 *     `status:` or `priority:` value STARTS WITH a valid vocabulary token but
 *     carries trailing prose (`status: in-progress - April 2026`,
 *     `priority: high (blocked)`), truncate it to the bare token
 *     (`status: in-progress`). This is derivable from the vocabulary and loses
 *     no lifecycle meaning — the trailing note was never machine-read. A value
 *     that does NOT begin with a known token is left alone (see manual TODOs).
 *
 * Deliberately NEVER touched (judgment → manual TODOs):
 *   - STREAM-1  a non-Focus folder under Streams/ — moving a stream into a Focus
 *               is a routing decision (and a rename → the name-confirmation gate).
 *   - STREAM-2  a Focus folder's missing same-name index — the Focus dashboard
 *               carries authored prose + the ordered `## Streams` table.
 *   - STREAM-3  a proposal stream missing the ` Proposal` suffix — the fix is a
 *               folder/file RENAME, gated on user confirmation; never auto-done.
 *   - ENACT-1   a missing `status`/`priority`/`dependencies` key, or unterminated
 *               frontmatter (`FAIL`) — the VALUE is content, not derivable, and
 *               where the `---` fence should close cannot be inferred safely.
 *   - ENACT-2   a status/priority value that begins with no known token — the
 *               intended token cannot be guessed.
 *   - GATE-1    an unanchored Enactment gate — installing the CLAUDE.md/AGENTS.md
 *               directive first needs the base-should-run-proposals judgment.
 *   - CONFIG    an unrecognised / invalid `[ki-kb-streams]` key — intent unknown.
 *   - Everything `[J]` in the rubric (STREAM-4/5, ENACT-3/4/5, GATE-2).
 *
 * Zero npm dependencies (bun + node stdlib only). Exit code is non-zero ONLY on
 * an unrecoverable error (base path is not a directory); findings and fixes
 * never fail the run.
 */

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'

// ── the structure model — kept in lockstep with audit.ts ─────────────────────
const FOCI = ['Active', 'Background', 'Dormant', 'Future', 'Settled'] as const
const STATUS = ['draft', 'ready', 'rejected', 'in-progress', 'rolled-out', 'reviewed', 'completed']
const PRIORITY = ['urgent', 'high', 'medium', 'low']
const PROPOSAL_SUFFIX = ' Proposal'
const PROPOSAL_FM = ['status', 'priority', 'dependencies']

const KI_CONFIG = '.ki-config.toml'
const KI_SECTION = 'ki-kb-streams'
const KB_ZONES = 'ki-kb.zones'
const SCHEMES = ['type', 'tags']

// Reference-doc pointers for the cited-finding standard — kept in lockstep with audit.ts.
const REF_STRUCTURE = 'references/Streams Structure Reference.md'
const REF_ENACT = 'references/Enactment Process Reference.md'
const REF_SKILL = '../SKILL.md'

const C = { reset: '\x1b[0m', dim: '\x1b[2m', green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m', cyan: '\x1b[36m' }
const paint = (c: string, s: string): string => `${c}${s}${C.reset}`

// Collect-then-emit harness (mirrors audit.ts + ki-authoring conform.ts). Each action
// records a finding on the shared ladder; `say` prints the human line only when not in
// --json mode, so a direct run streams prose while the aggregate consumes the wrapper.
// area is the rubric code, ref its reference-doc pointer, file the path an action concerns.
type Level = 'FAIL' | 'WARN' | 'POLISH' | 'ADVISORY' | 'INFO' | 'NA' | 'PASS'
type Finding = { level: Level; area: string; msg: string; ref?: string; file?: string }
const findings: Finding[] = []
const rec = (level: Level, area: string, msg: string, ref?: string, file?: string): void =>
  void findings.push({ level, area, msg, ref, file })
const json = process.argv.slice(2).includes('--json')
const say = (line: string): void => {
  if (!json) console.log(line)
}

// ── filesystem helpers — copied from audit.ts ────────────────────────────────
const isDir = (p: string): boolean => existsSync(p) && statSync(p).isDirectory()
const isFile = (p: string): boolean => existsSync(p) && statSync(p).isFile()
const subdirs = (p: string): string[] =>
  isDir(p)
    ? readdirSync(p, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
    : []

// Minimal `.ki-config.toml` reader: this skill's own `[ki-kb-streams]` scalars and
// the kb `[ki-kb.zones]` Streams alias. Validate down, ignore across. (Copied.)
type Ki = { keys: Record<string, string>; streamsZone: string }
const unquote = (s: string): string => s.replace(/^["']|["']$/g, '')
function parseKi(text: string): Ki {
  const out: Ki = { keys: {}, streamsZone: 'Streams' }
  let section = ''
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, '').trim()
    if (!line) continue
    const header = line.match(/^\[(.+)\]$/)
    if (header) {
      section = (header[1] as string).trim()
      continue
    }
    const eq = line.indexOf('=')
    if (eq === -1) continue
    const key = line.slice(0, eq).trim()
    const val = unquote(line.slice(eq + 1).trim())
    if (section === KI_SECTION) out.keys[key] = val
    else if (section === KB_ZONES && key === 'Streams') out.streamsZone = val
  }
  return out
}

// A note's top-level frontmatter as key→raw-value, plus whether the `---` fence
// closes. Returns null when the file has no leading `---` fence. (Copied.)
function frontmatter(text: string): { map: Record<string, string>; terminated: boolean } | null {
  const lines = text.split(/\r?\n/)
  if (lines[0]?.trim() !== '---') return null
  const map: Record<string, string> = {}
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i] as string
    if (line.trim() === '---') return { map, terminated: true }
    if (/^\s/.test(line)) continue // nested (list item / sub-map) — not a top-level key
    const ci = line.indexOf(':')
    if (ci > 0) map[line.slice(0, ci).trim()] = line.slice(ci + 1).trim()
  }
  return { map, terminated: false }
}

// Every `.md` under a directory, skipping dotdirs and node_modules. (Copied.)
function walkMarkdown(dir: string, acc: string[] = []): string[] {
  if (!isDir(dir)) return acc
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || e.name === 'node_modules') continue
    const p = join(dir, e.name)
    if (e.isDirectory()) walkMarkdown(p, acc)
    else if (e.name.endsWith('.md')) acc.push(p)
  }
  return acc
}

// Does a folder directly hold a `<X> Proposal.md` note? (Copied.)
const hasProposalNote = (dir: string): boolean => isDir(dir) && readdirSync(dir).some((n) => n.endsWith(`${PROPOSAL_SUFFIX}.md`))

// Stream folders under a Focus: a leaf or notes-only parent (no subfolders) that
// holds a same-name index note. Recurse into folders that have subfolders. (Copied.)
function leafStreamFolders(focusDir: string, acc: string[] = []): string[] {
  for (const name of subdirs(focusDir)) {
    const dir = join(focusDir, name)
    const kids = subdirs(dir)
    if (kids.length === 0) {
      if (isFile(join(dir, `${name}.md`))) acc.push(dir)
    } else leafStreamFolders(dir, acc)
  }
  return acc
}

const sampleList = (xs: string[], n = 10): string => xs.slice(0, n).join('; ') + (xs.length > n ? `; …+${xs.length - n} more` : '')

// The derivable ENACT-2 fix. If `value` starts with a vocabulary token followed by
// a separator (space / `-␣` / punctuation) but is not already the bare token,
// return the bare token; otherwise return null (already clean, or unfixable — the
// token cannot be guessed). Longest tokens first so `in-progress` wins over any
// shorter prefix. A value equal to a valid token needs no fix.
function bareToken(value: string, vocab: string[]): string | null {
  if (vocab.includes(value)) return null
  for (const token of [...vocab].sort((a, b) => b.length - a.length)) {
    if (value === token) return null
    if (value.startsWith(token)) {
      const next = value.charAt(token.length)
      // Only truncate at a genuine boundary — never mid-word (`readyish` ≠ `ready`).
      if (next === '' || /[\s,;.()-]/.test(next)) return token
    }
  }
  return null
}

// ── entry ────────────────────────────────────────────────────────────────────
function main(): void {
  const argv = process.argv.slice(2)
  const dryRun = argv.includes('--dry-run')
  const base = resolve(argv.find((a) => !a.startsWith('-')) ?? '.')

  if (!isDir(base)) {
    console.error(paint(C.red, `not a directory: ${base}`))
    process.exit(2)
  }

  const kiPath = join(base, KI_CONFIG)
  const ki: Ki = isFile(kiPath) ? parseKi(readFileSync(kiPath, 'utf8')) : { keys: {}, streamsZone: 'Streams' }
  const streamsRoot = join(base, ki.streamsZone)

  say(
    paint(
      C.dim,
      `target: ${streamsRoot}   ${ki.streamsZone !== 'Streams' ? `(aliased from Streams/)   ` : ''}${dryRun ? '(dry run)' : ''}\n`
    )
  )

  if (!isDir(streamsRoot)) {
    rec('NA', 'zone', `no ${ki.streamsZone}/ zone — nothing to conform (its presence is a ki-kb ZONE check)`, REF_STRUCTURE)
    say(paint(C.dim, `no ${ki.streamsZone}/ zone — nothing to conform (its presence is a ki-kb ZONE check).`))
    emitJson(base)
    return
  }

  const manualTodos: string[] = []

  // ── ENACT-2: normalise status/priority prose → bare token ──
  say(paint(C.cyan, 'ENACT-2 status/priority bare-token normalization'))
  const proposals = walkMarkdown(streamsRoot).filter((p) => basename(p, '.md').endsWith(PROPOSAL_SUFFIX))
  let fixes = 0
  for (const file of proposals) {
    const content = readFileSync(file, 'utf8')
    const fm = frontmatter(content)
    const rel = file.slice(base.length + 1)
    if (!fm) {
      rec('ADVISORY', 'ENACT-1', 'no frontmatter block; author status/priority/dependencies by hand', REF_ENACT, rel)
      manualTodos.push(`${rel}: ENACT-1 — no frontmatter block; author status/priority/dependencies by hand`)
      continue
    }
    if (!fm.terminated) {
      rec('ADVISORY', 'ENACT-1', 'unterminated frontmatter (no closing `---`); fix the fence by hand', REF_ENACT, rel)
      manualTodos.push(`${rel}: ENACT-1 — unterminated frontmatter (no closing \`---\`); fix the fence by hand`)
      continue
    }
    for (const k of PROPOSAL_FM)
      if (!(k in fm.map)) {
        rec('ADVISORY', 'ENACT-1', `missing \`${k}\` (value is content, not derivable)`, REF_ENACT, rel)
        manualTodos.push(`${rel}: ENACT-1 — missing \`${k}\` (value is content, not derivable)`)
      }

    // Rewrite only the top-level status:/priority: lines, inside the frontmatter block.
    const lines = content.split('\n')
    let inFm = false
    let changed = false
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] as string
      if (i === 0 && line.trim() === '---') {
        inFm = true
        continue
      }
      if (inFm && line.trim() === '---') break
      if (!inFm) continue
      const m = line.match(/^(status|priority):[ \t]*(\S.*)$/)
      if (!m) continue
      const key = m[1] as string
      const raw = (m[2] as string).trim()
      const bare = bareToken(raw, key === 'status' ? STATUS : PRIORITY)
      if (bare === null) {
        if (!(key === 'status' ? STATUS : PRIORITY).includes(raw)) {
          rec('ADVISORY', 'ENACT-2', `${key} "${raw}" begins with no known token; set it by hand`, REF_ENACT, rel)
          manualTodos.push(`${rel}: ENACT-2 — ${key} "${raw}" begins with no known token; set it by hand`)
        }
        continue
      }
      lines[i] = `${key}: ${bare}`
      rec('POLISH', 'ENACT-2', `${key} "${raw}" ${dryRun ? '→ would normalize to' : 'normalized to'} "${bare}"`, REF_ENACT, rel)
      say(`  ${paint(C.green, 'fix')}   ${rel} — ${key} "${raw}" → "${bare}"`)
      changed = true
      fixes++
    }
    if (changed && !dryRun) writeFileSync(file, lines.join('\n'))
  }
  if (fixes === 0) {
    rec('PASS', 'ENACT-2', 'status/priority already bare tokens — nothing to normalize', REF_ENACT)
    say(`  ${paint(C.dim, 'nothing to normalize')}`)
  }

  // ── gather the judgment categories the audit would flag, as manual TODOs ──
  gatherJudgmentTodos(base, ki, streamsRoot, proposals, manualTodos)

  // ── manual TODOs — never guessed, always surfaced ──
  say(`\n${paint(C.cyan, 'manual TODOs (judgment — not scripted)')}`)
  if (manualTodos.length === 0) {
    say(`  ${paint(C.dim, 'none')}`)
  } else {
    for (const todo of manualTodos) say(`  - ${todo}`)
  }
  rec(
    'ADVISORY',
    'judgment',
    'everything audit.ts grades [J] (STREAM-4/5, ENACT-3/4/5, GATE-2) is judgment — apply it by reading the rubric',
    'references/audit-rubric.md'
  )
  say(`  - Everything else audit.ts grades [J] (STREAM-4/5, ENACT-3/4/5, GATE-2) is judgment — apply it by reading the rubric.`)

  say(
    `\n${paint(C.dim, 'normalize-only layer applied — re-run `bun scripts/audit.ts` (or `ki:kb-streams:audit`) to confirm findings clear.')}`
  )

  emitJson(base)
}

// ── JSON wrapper — the same finding shape audit.ts emits, so the aggregate renders
// conform and audit identically. `--json` governs reporting; `--dry-run` governs writing.
function emitJson(target: string): void {
  if (!json) return
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
  process.stdout.write(JSON.stringify({ concern: 'kb-streams', target, generatedAt: new Date().toISOString(), summary, findings }))
}

// Surface the non-derivable drift categories as manual TODOs (a subset of what
// audit.ts flags, restated here so a CONFORM run is a self-contained worklist).
function gatherJudgmentTodos(base: string, ki: Ki, streamsRoot: string, proposals: string[], todos: string[]): void {
  // CONFIG — validate this skill's own table, down.
  for (const key of Object.keys(ki.keys))
    if (key !== 'process_note' && key !== 'note_type_scheme') {
      rec('ADVISORY', 'CONFIG-1', `unrecognised key "${key}"; recognised: process_note, note_type_scheme`, REF_SKILL, KI_CONFIG)
      todos.push(`.ki-config.toml: CONFIG-1 — unrecognised [${KI_SECTION}] key "${key}"; recognised: process_note, note_type_scheme`)
    }
  const scheme = ki.keys.note_type_scheme
  if (scheme !== undefined && !SCHEMES.includes(scheme)) {
    rec('ADVISORY', 'CONFIG-2', `note_type_scheme "${scheme}" not one of ${SCHEMES.join(', ')}`, REF_SKILL, KI_CONFIG)
    todos.push(`.ki-config.toml: CONFIG-2 — note_type_scheme "${scheme}" not one of ${SCHEMES.join(', ')}`)
  }

  // STREAM-1 — stray non-Focus folders directly under the zone.
  const present = subdirs(streamsRoot)
  const stray = present.filter((n) => !(FOCI as readonly string[]).includes(n))
  if (stray.length) {
    rec(
      'ADVISORY',
      'STREAM-1',
      `non-Focus folder(s) under ${ki.streamsZone}/: ${sampleList(stray)}; move each into a Focus (rename — confirm first)`,
      REF_STRUCTURE
    )
    todos.push(
      `STREAM-1 — non-Focus folder(s) under ${ki.streamsZone}/: ${sampleList(stray)}; move each into a Focus (rename — confirm first)`
    )
  }
  const foci = FOCI.filter((x) => present.includes(x))

  // STREAM-2 — a present Focus missing its same-name index note.
  for (const focus of foci)
    if (!isFile(join(streamsRoot, focus, `${focus}.md`))) {
      rec(
        'ADVISORY',
        'STREAM-2',
        `has no ${focus}.md index note; author the Focus dashboard + ordered table by hand`,
        REF_STRUCTURE,
        `${ki.streamsZone}/${focus}`
      )
      todos.push(`STREAM-2 — ${ki.streamsZone}/${focus}/ has no ${focus}.md index note; author the Focus dashboard + ordered table by hand`)
    }

  // STREAM-3 — a stream that declares itself a proposal but lacks the ` Proposal` suffix.
  const missingSuffix: string[] = []
  for (const focus of foci) {
    const focusDir = join(streamsRoot, focus)
    for (const leaf of leafStreamFolders(focusDir)) {
      if (hasProposalNote(leaf)) continue
      const idx = join(leaf, `${basename(leaf)}.md`)
      const fm = isFile(idx) ? frontmatter(readFileSync(idx, 'utf8')) : null
      const declaresProposal = !!fm && (fm.map.type === 'stream-proposal' || STATUS.includes(fm.map.status ?? ''))
      if (declaresProposal) missingSuffix.push(leaf.slice(base.length + 1))
    }
  }
  if (missingSuffix.length) {
    rec(
      'ADVISORY',
      'STREAM-3',
      `proposal stream(s) missing the \` Proposal\` suffix: ${sampleList(missingSuffix)}; rename folder + note (confirm first)`,
      REF_ENACT
    )
    todos.push(
      `STREAM-3 — proposal stream(s) missing the \` Proposal\` suffix: ${sampleList(missingSuffix)}; rename folder + note (confirm first)`
    )
  }

  // GATE-1 — once proposals exist, the gate must be anchored in always-loaded context.
  if (proposals.length > 0) {
    const anchorFile = ['CLAUDE.md', 'AGENTS.md'].map((n) => join(base, n)).find(isFile)
    if (!anchorFile) {
      rec(
        'ADVISORY',
        'GATE-1',
        'no CLAUDE.md / AGENTS.md at the base root; add one anchoring the Enactment gate (first confirm the base should run proposals)',
        REF_SKILL
      )
      todos.push(
        'GATE-1 — no CLAUDE.md / AGENTS.md at the base root; add one anchoring the Enactment gate (first confirm the base should run proposals)'
      )
    } else {
      const txt = readFileSync(anchorFile, 'utf8')
      const anchored = /Enactment Process|ki-kb-streams/i.test(txt) && /proposal|canonical/i.test(txt)
      if (!anchored) {
        rec(
          'ADVISORY',
          'GATE-1',
          'does not anchor the Enactment gate; add the standing directive by hand (first confirm the base should run proposals)',
          REF_SKILL,
          basename(anchorFile)
        )
        todos.push(
          `GATE-1 — ${basename(anchorFile)} does not anchor the Enactment gate; add the standing directive by hand (first confirm the base should run proposals)`
        )
      }
    }
  }
}

main()
