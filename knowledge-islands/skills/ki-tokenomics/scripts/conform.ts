#!/usr/bin/env bun

/**
 * Mechanical CONFORM for the ki-tokenomics standard.
 *
 * Honest narrow conform — it applies one deterministic edit: an unscoped or
 * mismatched project-local Headroom URL on the canonical loopback proxy is given
 * the target's `/p/<slug>` path. All other tokenomics gaps remain judgment calls
 * (does a heavy CLAUDE.md earn its tokens; is an MCP server actually used; is the
 * model tier proportionate; is Headroom's reversible/cache config optimal) or a
 * trim/choice only a human can make (which prose to lift out, which value to pick
 * for `preferred_model_type`, whether a broken `@import` is a typo or a moved file,
 * whether a cross-repo `headroom:learn` line should be re-learned or pruned). None
 * reduces to a deterministic, reversible rewrite the way (say) a DR's
 * `decision_type` derives from its filename — so there is nothing safe to auto-fix,
 * and this script guesses no trim. It re-runs audit.ts's *detection* (copied, not
 * imported, per the composition-only rule — kept in lockstep) to turn each finding
 * category into a concrete, actionable manual TODO, then points back at AUDIT.
 *
 *   bun scripts/conform.ts [path]   # default: cwd (a project or a KB base)
 *   --dry-run                       # report the Headroom URL edit without writing
 *   --json                          # emit the shared finding wrapper instead of prose
 *
 * Every other finding it surfaces is a manual/judgment TODO — level ADVISORY on
 * the shared ladder — split into a concrete section (defects the
 * mechanical scan located in this repo) and a judgment section (the [J] rubric). The
 * `--json` wrapper mirrors audit.ts's: { concern, target, generatedAt, summary, findings }.
 *
 * Manual TODOs it surfaces (derived from audit.ts's finding areas):
 *   - SURF-1  broken `@import` in a project CLAUDE.md — concrete path listed; fixing
 *             it (repair the path, or drop the include) is a judgment call.
 *   - TOOL-4  foreign `knowledgeislands/<repo>` line(s) inside the project CLAUDE.md
 *             `headroom:learn` markers — listed; re-learn here or prune (judgment).
 *   - CFG     `.ki-config.toml` [ki-tokenomics] defects: table absent (run EDUCATE),
 *             invalid `headroom`, missing/invalid `preferred_model_type`, unknown keys
 *             (validate-down), non-numeric budgets — the operator picks the value.
 *   - SURF-4 / BUDG / MCP-2/3 / RUN / TOOL-3 pointer TODOs: altitude, budget
 *             overages, MCP-server usefulness, runtime levers, Headroom optimality —
 *             inherently un-scriptable; re-run AUDIT and apply the [J] rubric.
 *
 * Zero npm dependencies (bun + node stdlib only). Exit code is non-zero only on an
 * unrecoverable error (target path unreadable); findings/TODOs never fail the run.
 */

import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { basename, dirname, isAbsolute, join, resolve } from 'node:path'

// ── colour helpers (same style as audit.ts) ──
const C = { reset: '\x1b[0m', dim: '\x1b[2m', green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m', cyan: '\x1b[36m' }
const paint = (c: string, s: string): string => `${c}${s}${C.reset}`

// ── collect-then-emit harness (mirrors audit.ts / ki-authoring conform) ──
// This conform has one narrow mechanical normalization (TOOL-5); every other finding
// is a manual or judgment TODO — level ADVISORY (or INFO where merely informational). area is
// the FINE rubric code kept in lockstep with audit.ts; ref the reference-doc
// pointer; file the path a file-scoped TODO concerns. `say` prints the human line
// only outside --json, so a direct run streams prose while the aggregate consumes
// the wrapper.
type Level = 'FAIL' | 'WARN' | 'POLISH' | 'ADVISORY' | 'INFO' | 'NA' | 'PASS'
type Finding = { level: Level; area: string; msg: string; ref?: string; file?: string }
const findings: Finding[] = []
const rec = (level: Level, area: string, msg: string, ref?: string, file?: string): void =>
  void findings.push({ level, area, msg, ref, file })
const RUBRIC = 'references/audit-rubric.md'

// ── kept in lockstep with audit.ts ──
const KI_SECTION = 'ki-tokenomics'
const HEADROOM_VALUES = ['required', 'recommended', 'off'] as const
// Portable, purpose-based model *types* (ADR-KI-HARNESS-009) — kept in lockstep
// with audit.ts. Concrete models per runtime live in docs/guides/prompting/.
const MODEL_TIER_VALUES = ['frontier', 'reasoning', 'standard', 'fast'] as const
const LEGACY_ALIAS_TO_TYPE: Record<string, string> = { fable: 'frontier', opus: 'reasoning', sonnet: 'standard', haiku: 'fast' }
const BUDGET_KEYS = new Set<string>(['claude_md', 'memory_index', 'skills_surface', 'mcp_servers', 'total'])

const readText = (p: string): string | null => {
  try {
    return statSync(p).isFile() ? readFileSync(p, 'utf8') : null
  } catch {
    return null
  }
}

const SAFE_PROJECT_SLUG = /^[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?$/
function safeProjectSlug(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const unscoped = value.startsWith('@') ? value.slice(value.indexOf('/') + 1) : value
  return SAFE_PROJECT_SLUG.test(unscoped) ? unscoped : null
}

function expectedProjectSlug(target: string): string {
  if (readText(join(target, '.git')) != null) {
    const result = spawnSync('git', ['-C', target, 'remote', 'get-url', 'origin'], { encoding: 'utf8' })
    if (result.status === 0) {
      const remoteName = result.stdout
        .trim()
        .replace(/[\\/]$/, '')
        .split(/[\\/:]/)
        .at(-1)
        ?.replace(/\.git$/, '')
      const fromRemote = safeProjectSlug(remoteName)
      if (fromRemote) return fromRemote
    }
  }
  return safeProjectSlug(basename(target)) ?? basename(target)
}

type HeadroomProjectUrl = { recognized: false } | { recognized: true; valid: boolean; actualSlug: string | null; corrected: string }

function inspectHeadroomProjectUrl(raw: string, expectedSlug: string): HeadroomProjectUrl {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return { recognized: false }
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return { recognized: false }
  const host = url.hostname.replace(/^\[|\]$/g, '').toLowerCase()
  if (!['127.0.0.1', 'localhost', '::1'].includes(host)) return { recognized: false }
  const match = url.pathname.match(/^\/p\/([^/]+)\/?$/)
  const cleanRoot = url.pathname === '/' && url.search === '' && url.hash === ''
  if (!match && !(url.port === '8787' && cleanRoot)) return { recognized: false }
  let actualSlug: string | null = null
  if (match) {
    try {
      actualSlug = decodeURIComponent(match[1] as string)
    } catch {
      actualSlug = null
    }
  }
  url.pathname = `/p/${encodeURIComponent(expectedSlug)}`
  return { recognized: true, valid: actualSlug === expectedSlug, actualSlug, corrected: url.toString() }
}

function headroomProjectHeader(raw: unknown): { present: boolean; project: string; malformedEncoding: boolean } {
  if (typeof raw !== 'string') return { present: false, project: '', malformedEncoding: false }
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^\s*X-Headroom-Project\s*:\s*(.*?)\s*$/i)
    if (match) {
      const encoded = match[1] as string
      try {
        return { present: true, project: decodeURIComponent(encoded), malformedEncoding: false }
      } catch {
        return { present: true, project: encoded, malformedEncoding: true }
      }
    }
  }
  return { present: false, project: '', malformedEncoding: false }
}

function replaceUniqueJsonStringValue(text: string, key: string, oldValue: string, newValue: string): string | null {
  const stringToken = /"(?:\\.|[^"\\])*"/g
  const matches: { start: number; end: number; value: unknown }[] = []
  for (const match of text.matchAll(stringToken)) {
    let decoded: unknown
    try {
      decoded = JSON.parse(match[0])
    } catch {
      continue
    }
    if (decoded !== key || match.index == null) continue
    const afterKey = text.slice(match.index + match[0].length)
    const separator = afterKey.match(/^\s*:\s*/)?.[0]
    if (!separator) continue
    const valueStart = match.index + match[0].length + separator.length
    stringToken.lastIndex = valueStart
    const valueMatch = stringToken.exec(text)
    if (!valueMatch || valueMatch.index !== valueStart) continue
    try {
      matches.push({ start: valueStart, end: valueStart + valueMatch[0].length, value: JSON.parse(valueMatch[0]) })
    } catch {
      // Fail closed below when no uniquely matching token is available.
    }
  }
  if (matches.length !== 1) return null
  const [match] = matches
  if (match?.value !== oldValue) return null
  return `${text.slice(0, match?.start)}${JSON.stringify(newValue)}${text.slice(match?.end)}`
}
const stripCode = (md: string): string => md.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '')

// ── CLAUDE.md @import resolution (copied from audit.ts) ──
// Only a token that begins with ~ . or / is an import; a bare `@word` is an @mention.
const IMPORT_RE = /(?:^|\s)@(~?[./][^\s)]*)/g
function brokenImports(file: string, seen = new Set<string>(), out: string[] = []): string[] {
  const abs = resolve(file)
  if (seen.has(abs)) return out
  seen.add(abs)
  const text = readText(abs)
  if (text == null) return out
  const base = dirname(abs)
  for (const m of stripCode(text).matchAll(IMPORT_RE)) {
    const raw = m[1] as string
    const dest = raw.startsWith('~/') ? join(homedir(), raw.slice(2)) : isAbsolute(raw) ? raw : resolve(base, raw)
    if (existsSync(dest)) brokenImports(dest, seen, out)
    else if (raw.includes('/') || raw.endsWith('.md')) out.push(raw)
  }
  return out
}

// ── minimal TOML for the [ki-tokenomics] table (copied from audit.ts) ──
type KiConfig = {
  present: boolean
  headroomBad?: string
  modelTierType?: string
  modelTierTypeBad?: string
  legacyModelTier?: string
  bindingBadKeys: string[]
  bindingEmptyKeys: string[]
  unknownKeys: string[]
  badBudgets: string[]
}
function parseKiConfig(text: string): KiConfig {
  const cfg: KiConfig = { present: false, bindingBadKeys: [], bindingEmptyKeys: [], unknownKeys: [], badBudgets: [] }
  let section = ''
  const BUDGETS = `${KI_SECTION}.budgets`
  const BINDINGS = `${KI_SECTION}.model_tier_bindings`
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, '').trim()
    if (!line) continue
    const header = line.match(/^\[(.+)\]$/)
    if (header) {
      section = (header[1] as string).trim()
      if (section === KI_SECTION || section === BUDGETS || section === BINDINGS) cfg.present = true
      continue
    }
    if (section !== KI_SECTION && section !== BUDGETS && section !== BINDINGS) continue
    const eq = line.indexOf('=')
    if (eq === -1) continue
    const key = line.slice(0, eq).trim()
    const val = line
      .slice(eq + 1)
      .trim()
      .replace(/^["']|["']$/g, '')
    if (section === KI_SECTION) {
      if (key === 'headroom') {
        if (!(HEADROOM_VALUES as readonly string[]).includes(val)) cfg.headroomBad = val
      } else if (key === 'preferred_model_type') {
        if ((MODEL_TIER_VALUES as readonly string[]).includes(val)) cfg.modelTierType = val
        else cfg.modelTierTypeBad = val
      } else if (key === 'preferred_model') {
        cfg.legacyModelTier = val // pre-ADR-008 key — conform maps it to preferred_model_type
      } else if (key === 'context_window_tokens') {
        const n = Number(val)
        if (!(Number.isFinite(n) && n > 0)) cfg.badBudgets.push(key)
      } else cfg.unknownKeys.push(key)
    } else if (section === BINDINGS) {
      if (!(MODEL_TIER_VALUES as readonly string[]).includes(key)) cfg.bindingBadKeys.push(key)
      else if (
        val
          .split(',')
          .map((e) => e.trim())
          .filter(Boolean).length === 0
      )
        cfg.bindingEmptyKeys.push(key)
    } else if (!BUDGET_KEYS.has(key)) {
      cfg.unknownKeys.push(key)
    } else {
      const n = Number(val)
      if (!(Number.isFinite(n) && n >= 0)) cfg.badBudgets.push(key)
    }
  }
  return cfg
}

// ── TOOL-4: foreign roots inside the project CLAUDE.md headroom:learn block (copied) ──
function foreignLearnRoots(target: string): { repos: string[]; lines: number } {
  const projClaudeMd = join(target, 'CLAUDE.md')
  const text = existsSync(projClaudeMd) ? (readText(projClaudeMd) ?? '') : ''
  const start = text.indexOf('<!-- headroom:learn:start -->')
  const end = text.indexOf('<!-- headroom:learn:end -->')
  if (start === -1 || end === -1 || end <= start) return { repos: [], lines: 0 }
  const repoName = basename(target)
  const foreign = new Set<string>()
  let foreignLines = 0
  for (const line of text.slice(start, end).split('\n')) {
    const names = [...line.matchAll(/knowledgeislands\/([A-Za-z0-9_-]+)/g)].map((mm) => mm[1]).filter((nm) => nm !== repoName)
    if (names.length > 0) {
      foreignLines++
      for (const nm of names) foreign.add(nm as string)
    }
  }
  return { repos: [...foreign], lines: foreignLines }
}

// ── entry ──
function main(): number {
  const argv = process.argv.slice(2)
  const dryRun = argv.includes('--dry-run')
  const json = argv.includes('--json')
  const target = resolve(argv.find((a) => !a.startsWith('-')) ?? '.')
  const say = (line: string): void => {
    if (!json) console.log(line)
  }

  if (!existsSync(target)) {
    console.error(paint(C.red, `target path not found: ${target}`))
    return 1
  }

  say(paint(C.dim, `target: ${target}${dryRun ? '   (dry run)' : ''}`))
  say(paint(C.dim, 'ki-tokenomics conform applies only safe Headroom URL scoping; every other gap needs a human trim or choice.\n'))

  // ── manual TODOs (concrete — derived from this repo's state) — all ADVISORY (nothing is written) ──
  say(paint(C.cyan, 'manual TODOs (concrete — from this repo)'))
  let concrete = 0
  const todo = (area: string, msg: string, file?: string): void => {
    concrete++
    rec('ADVISORY', area, msg, RUBRIC, file)
    say(`  ${paint(C.yellow, '-')} [${area}]${file ? ` ${file}` : ''} ${msg}`)
  }

  // ── SURF-1: broken @imports in the project CLAUDE.md (+ AGENTS.md) ──
  for (const name of ['CLAUDE.md', 'AGENTS.md']) {
    const file = join(target, name)
    if (!existsSync(file)) continue
    for (const b of brokenImports(file)) {
      todo('SURF-1', `${name} has an unresolved @import "${b}" (broken include); repair the path or drop the include`, name)
    }
  }

  // ── TOOL-4: foreign headroom:learn roots ──
  const { repos, lines } = foreignLearnRoots(target)
  if (repos.length > 0) {
    todo(
      'TOOL-4',
      `CLAUDE.md headroom:learn block has ${lines} line(s) rooted in other repo(s) (${repos.join(', ')}); re-learn here or prune`,
      'CLAUDE.md'
    )
  }

  // ── TOOL-5: safely scope the effective project-local Headroom URL ──
  type ProjectSettings = { name: string; file: string; text: string; obj: Record<string, unknown> }
  const projectSettings: ProjectSettings[] = []
  let projectSettingsMalformed = false
  for (const name of ['settings.json', 'settings.local.json']) {
    const file = join(target, '.claude', name)
    const text = readText(file)
    if (text == null) continue
    try {
      const parsed = JSON.parse(text) as unknown
      if (parsed == null || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('root is not an object')
      projectSettings.push({ name, file, text, obj: parsed as Record<string, unknown> })
    } catch {
      projectSettingsMalformed = true
      todo('TOOL-5', `${name} is malformed; preserve it and inspect Headroom project scope manually`, `.claude/${name}`)
    }
  }
  const envOf = (settings: ProjectSettings | undefined): Record<string, unknown> => {
    const env = settings?.obj.env
    return env && typeof env === 'object' && !Array.isArray(env) ? (env as Record<string, unknown>) : {}
  }
  const baseSettings = projectSettings.find((s) => s.name === 'settings.json')
  const localSettings = projectSettings.find((s) => s.name === 'settings.local.json')
  const baseEnv = envOf(baseSettings)
  const localEnv = envOf(localSettings)
  const effectiveValue = (key: string): { value: unknown; settings: ProjectSettings | undefined } =>
    Object.hasOwn(localEnv, key) ? { value: localEnv[key], settings: localSettings } : { value: baseEnv[key], settings: baseSettings }
  const { value: rawUrl, settings: urlSettings } = effectiveValue('ANTHROPIC_BASE_URL')
  if (!projectSettingsMalformed && typeof rawUrl === 'string' && urlSettings) {
    const slug = expectedProjectSlug(target)
    const inspected = inspectHeadroomProjectUrl(rawUrl, slug)
    if (inspected.recognized) {
      const { value: rawHeaders, settings: headerSettings } = effectiveValue('ANTHROPIC_CUSTOM_HEADERS')
      const header = headroomProjectHeader(rawHeaders)
      if (header.present) {
        if (header.project === slug) {
          rec('PASS', 'TOOL-5', `Headroom project header already scopes ${slug}`, RUBRIC, `.claude/${headerSettings?.name}`)
          say(`  ${paint(C.green, '-')} [TOOL-5] Headroom project header already scopes ${slug}`)
        } else {
          todo(
            'TOOL-5',
            `X-Headroom-Project scopes ${header.project || '(empty)'}${header.malformedEncoding ? ' (malformed percent-encoding)' : ''}, expected ${slug}; header wins over the URL, so correct it manually`,
            `.claude/${headerSettings?.name}`
          )
        }
      } else if (inspected.valid) {
        rec('PASS', 'TOOL-5', `Headroom URL already scopes /p/${slug}`, RUBRIC, `.claude/${urlSettings.name}`)
        say(`  ${paint(C.green, '-')} [TOOL-5] Headroom URL already scopes /p/${slug}`)
      } else if (urlSettings.name === 'settings.local.json') {
        todo(
          'TOOL-5',
          `effective Headroom URL needs /p/${slug}, but settings.local.json may be runtime-owned; correct it manually`,
          '.claude/settings.local.json'
        )
      } else {
        const updated = replaceUniqueJsonStringValue(urlSettings.text, 'ANTHROPIC_BASE_URL', rawUrl, inspected.corrected)
        if (updated == null) {
          todo(
            'TOOL-5',
            `could not identify one unambiguous ANTHROPIC_BASE_URL token; preserve settings.json and scope /p/${slug} manually`,
            '.claude/settings.json'
          )
        } else {
          if (!dryRun) writeFileSync(urlSettings.file, updated)
          rec(
            'POLISH',
            'TOOL-5',
            `${dryRun ? 'would scope' : 'scoped'} the local Headroom proxy to /p/${slug}`,
            RUBRIC,
            '.claude/settings.json'
          )
          say(`  ${paint(C.cyan, '-')} [TOOL-5] ${dryRun ? 'would scope' : 'scoped'} local Headroom URL to /p/${slug}`)
        }
      }
    }
  }

  // ── CFG: [ki-tokenomics] table defects ──
  const kiText = readText(join(target, '.ki-config.toml'))
  if (kiText == null) {
    todo(
      'CFG-2',
      'no .ki-config.toml at target; a KI repo needs one (see ki-repo), then run EDUCATE to add the [ki-tokenomics] table',
      '.ki-config.toml'
    )
  } else {
    const ki = parseKiConfig(kiText)
    if (!ki.present) {
      todo(
        'CFG-2',
        `no [${KI_SECTION}] table in .ki-config.toml; run \`bun scripts/educate.ts\` / \`--educate\` to scaffold it, then tune`,
        '.ki-config.toml'
      )
    } else {
      if (ki.headroomBad)
        todo('CFG-1', `headroom = "${ki.headroomBad}" invalid; set one of ${HEADROOM_VALUES.join(' / ')}`, '.ki-config.toml')
      if (ki.legacyModelTier) {
        const mapped = LEGACY_ALIAS_TO_TYPE[ki.legacyModelTier]
        const to = mapped ? `preferred_model_type = "${mapped}"` : `preferred_model_type = "…" (${MODEL_TIER_VALUES.join(' / ')})`
        todo(
          'CFG-4',
          `preferred_model = "${ki.legacyModelTier}" is the retired Claude-only key; replace it with ${to} (ADR-KI-HARNESS-009)`,
          '.ki-config.toml'
        )
      } else if (ki.modelTierTypeBad)
        todo(
          'CFG-4',
          `preferred_model_type = "${ki.modelTierTypeBad}" invalid; set one of ${MODEL_TIER_VALUES.join(' / ')}`,
          '.ki-config.toml'
        )
      else if (!ki.modelTierType)
        todo(
          'CFG-4',
          `preferred_model_type not declared in [${KI_SECTION}]; add the default type (${MODEL_TIER_VALUES.join(' / ')})`,
          '.ki-config.toml'
        )
      for (const k of ki.bindingBadKeys)
        todo(
          'CFG-5',
          `"${k}" in [${KI_SECTION}.model_tier_bindings] is not a model type; keys must be one of ${MODEL_TIER_VALUES.join(' / ')}`,
          '.ki-config.toml'
        )
      for (const k of ki.bindingEmptyKeys)
        todo(
          'CFG-5',
          `${k} in [${KI_SECTION}.model_tier_bindings] has no non-empty model; give a comma-separated list (e.g. "opus, gpt-5.6-sol")`,
          '.ki-config.toml'
        )
      for (const k of ki.unknownKeys)
        todo(
          'CFG-1',
          `unrecognised key "${k}" in [${KI_SECTION}] (validate-down); remove it or move it to its own table`,
          '.ki-config.toml'
        )
      for (const k of ki.badBudgets)
        todo('CFG-1', `"${k}" has a non-numeric/invalid value in [${KI_SECTION}]; set a number`, '.ki-config.toml')
    }
  }

  if (concrete === 0) say(`  ${paint(C.dim, 'none found by the mechanical scan')}`)

  // ── judgment TODOs — the [J] rubric the script cannot decide, always surfaced (ADVISORY) ──
  say(`\n${paint(C.cyan, 'judgment TODOs (re-run AUDIT, apply the [J] rubric by reading)')}`)
  for (const [area, p] of [
    [
      'SURF-4',
      'does each heavy CLAUDE.md / memory entry EARN its tokens, or restate what the model knows / belong in an on-demand file? Lift it out.'
    ],
    ['BUDG-3', 'any sustained budget overage is either trimmed or a deliberate, recorded decision — not waved-off drift.'],
    [
      'MCP-2',
      'is each configured MCP server actually used here? Disable/scope unused or over-broad servers (keep tool search on); this is usually the biggest lever.'
    ],
    ['RUN-2', 'prompt-cache hits, model tier vs work value, autocompact + sub-agent fan-out, tool-result verbosity.'],
    [
      'TOOL-3',
      'where Headroom is present, confirm the reversible store (CCR) + cache-aligner + output-shaper are set optimally (keys undocumented — judgment).'
    ]
  ] as const) {
    rec('ADVISORY', area, p, RUBRIC)
    say(`  ${paint(C.dim, `- [${area}] ${p}`)}`)
  }

  say(
    `\n${paint(C.dim, 'make the remaining trims/choices above by hand, then re-run `bun scripts/audit.ts` (or `ki:tokenomics:audit`) to confirm they clear.')}`
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
    process.stdout.write(JSON.stringify({ concern: 'tokenomics', target, generatedAt: new Date().toISOString(), summary, findings }))
  }
  return 0
}

try {
  process.exit(main())
} catch (err) {
  console.error(`ERROR: ${String(err)}`)
  process.exit(1)
}
