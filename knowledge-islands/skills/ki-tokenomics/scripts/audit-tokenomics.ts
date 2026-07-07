#!/usr/bin/env bun
// Mechanical auditor for the Knowledge Islands tokenomics standard.
//
//   bun scripts/audit-tokenomics.ts [target]    # default: cwd — a project or a KB base
//   bun scripts/audit-tokenomics.ts --no-user    # audit the project layer alone
//   bun scripts/audit-tokenomics.ts --user <dir> # point the user layer elsewhere (testing)
//   bun scripts/audit-tokenomics.ts --init       # print the .ki-config.toml table block
//
// Tokenomics is the cost of the context the model carries on EVERY turn, and
// that cost is a COMPOSITION of two configuration layers, not one file:
//   - user-wide   ~/.claude  (global CLAUDE.md + @imports, settings.json, skills/, ~/.claude.json mcpServers)
//   - project     <target>   (CLAUDE.md + @imports, .claude/settings*.json, .mcp.json, .claude/skills/)
//   - base        <target>   (Admin/MEMORY.md + per-Pillar MEMORY.md, if the target is a KB base)
//
// So, by design, this checker reads ~/.claude (the user layer) IN ADDITION to its
// target — the standard it enforces *is* that composition. `--no-user` opts out;
// `--user <dir>` redirects it. This is the one deliberate exception to the usual
// "read only the target" checker contract, called out because the concern demands it.
//
// It measures each standing-surface component it can locate, ATTRIBUTES the cost to
// its layer, and compares to per-component + total budgets (defaults, or the repo's
// [ki-tokenomics] overrides, read validate-down). It also detects
// context-compression tooling (Headroom + any registry entry) and checks the declared
// expectation is met. Token sizes are a chars/4 ESTIMATE for budgeting, not billing —
// every figure is marked `~`. Volatile numbers (model ids, prices, window sizes) are
// deferred to the claude-api skill, never hard-coded here.
//
// No npm dependencies — Bun/Node builtins only. Exit code is non-zero if any FAIL.

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { basename, dirname, isAbsolute, join, resolve } from 'node:path'

const C = { reset: '\x1b[0m', dim: '\x1b[2m', green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m', cyan: '\x1b[36m' }
const paint = (c: string, s: string): string => `${c}${s}${C.reset}`

// ── token estimate ────────────────────────────────────────────────────────
// chars/4 is the house budgeting proxy for Claude's tokenizer on English + code.
// It is an ESTIMATE — for exact accounting use the model's own token counting
// (the claude-api skill). Every printed figure is prefixed `~` to say so.
const approxTokens = (s: string): number => Math.ceil(s.length / 4)
const tok = (n: number): string => `~${n.toLocaleString('en-US')} tok`

// ── budgets (keep in sync with references/tokenomics-standard.md §3) ───
type BudgetKey = 'claude_md' | 'memory_index' | 'skills_surface' | 'mcp_servers' | 'total'
const BUDGET_DEFAULTS: Record<BudgetKey, number> = {
  claude_md: 2500, //       each CLAUDE.md incl. @imports
  memory_index: 1000, //    each MEMORY.md index
  skills_surface: 4000, //  sum of installed-skill descriptions, per layer
  mcp_servers: 5, //        configured MCP servers (count, all layers)
  total: 30000 //           total standing surface, all layers
}
const HEADROOM_VALUES = ['required', 'recommended', 'off'] as const
type HeadroomExpectation = (typeof HEADROOM_VALUES)[number]
const MODEL_TIER_VALUES = ['opus', 'sonnet', 'haiku', 'fable'] as const

const KI_SECTION = 'ki-tokenomics'
const KI_DEFAULT = `[${KI_SECTION}]
# How strongly a context-compression layer (e.g. Headroom) is expected here.
headroom = "recommended"          # "required" | "recommended" | "off"
# Optional — the real context window, so the total budget reads as a headroom %.
# context_window_tokens = 200000
# preferred_model = "sonnet"        # "opus" | "sonnet" | "haiku" | "fable" — default tier for this environment

# Per-component token budgets (estimates, chars/4). Omit any to take the default.
# [${KI_SECTION}.budgets]
# claude_md = 2500          # each CLAUDE.md incl. @imports
# memory_index = 1000       # each MEMORY.md index
# skills_surface = 4000     # sum of installed-skill descriptions, per layer
# mcp_servers = 5           # configured MCP servers (count, all layers)
# total = 30000             # total standing surface, all layers
`

// ── findings ────────────────────────────────────────────────────────────────
// Unified severity ladder — shared by every KI checker (enforcement-framework §2).
type Level = 'FAIL' | 'WARN' | 'POLISH' | 'ADVISORY' | 'INFO' | 'SKIP' | 'PASS'
const LADDER: Level[] = ['FAIL', 'WARN', 'POLISH', 'ADVISORY', 'INFO', 'SKIP', 'PASS']
const ICON: Record<Level, string> = { FAIL: '❌', WARN: '⚠️ ', POLISH: '✨', ADVISORY: '🧭', INFO: 'ℹ️ ', SKIP: '⊘', PASS: '✅' }
type Area = 'COMP' | 'SURF' | 'MCP' | 'BUDG' | 'RUN' | 'TOOL' | 'CFG'
const AREA_ORDER: Area[] = ['COMP', 'SURF', 'MCP', 'BUDG', 'RUN', 'TOOL', 'CFG']
type Finding = { level: Level; area: Area; msg: string }
const findings: Finding[] = []
const fail = (area: Area, msg: string): void => void findings.push({ level: 'FAIL', area, msg })
const warn = (area: Area, msg: string): void => void findings.push({ level: 'WARN', area, msg })
const note = (area: Area, msg: string): void => void findings.push({ level: 'INFO', area, msg })

// ── small IO helpers ─────────────────────────────────────────────────────────
const readText = (p: string): string | null => {
  try {
    return statSync(p).isFile() ? readFileSync(p, 'utf8') : null
  } catch {
    return null
  }
}
const readJSON = (p: string): Record<string, unknown> | null => {
  const t = readText(p)
  if (t == null) return null
  try {
    return JSON.parse(t) as Record<string, unknown>
  } catch {
    return null
  }
}
const stripCode = (md: string): string => md.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '')

// ── CLAUDE.md @import resolution ──────────────────────────────────────────────
// Claude Code pulls other files inline with `@path` (relative, /absolute, or ~/home).
// The standing cost is the RESOLVED total; an import that looks like a path but does
// not resolve is a broken include (FAIL), not mere waste. We only treat a token as an
// import when it begins with ~ . or / — a bare `@word` is an @mention, not an import.
// Code spans/fences are stripped first to avoid noise.
const IMPORT_RE = /(?:^|\s)@(~?[./][^\s)]*)/g
function claudeMdSize(file: string, seen = new Set<string>()): { tokens: number; broken: string[] } {
  const abs = resolve(file)
  if (seen.has(abs)) return { tokens: 0, broken: [] }
  seen.add(abs)
  const text = readText(abs)
  if (text == null) return { tokens: 0, broken: [] }
  let tokens = approxTokens(text)
  const broken: string[] = []
  const base = dirname(abs)
  for (const m of stripCode(text).matchAll(IMPORT_RE)) {
    const raw = m[1] as string
    const dest = raw.startsWith('~/') ? join(homedir(), raw.slice(2)) : isAbsolute(raw) ? raw : resolve(base, raw)
    if (existsSync(dest)) {
      const sub = claudeMdSize(dest, seen)
      tokens += sub.tokens
      broken.push(...sub.broken)
    } else if (raw.includes('/') || raw.endsWith('.md')) {
      broken.push(raw)
    }
  }
  return { tokens, broken }
}

// ── installed-skill selection surface ─────────────────────────────────────────
// What loads at selection time is each skill's `name` + `description`. Sum that across
// a skills/ dir as the per-layer selection-surface cost. Robust extraction over the
// frontmatter block; falls back to the whole block if a field can't be isolated.
function skillSelectionTokens(skillsDir: string): { count: number; tokens: number } {
  if (!existsSync(skillsDir)) return { count: 0, tokens: 0 }
  let count = 0
  let tokens = 0
  for (const e of readdirSync(skillsDir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue
    const md = readText(join(skillsDir, e.name, 'SKILL.md'))
    if (md == null) continue
    count++
    const fm = md.match(/^---\r?\n([\s\S]*?)\r?\n---/)
    const block = fm ? (fm[1] as string) : ''
    const name = block.match(/^name:(.*)$/m)?.[1]?.trim() ?? ''
    const desc = block.match(/^description:\s*([\s\S]*?)(?:\n[A-Za-z0-9_-]+:|$)/m)?.[1] ?? block
    tokens += approxTokens(name) + approxTokens(desc)
  }
  return { count, tokens }
}

// ── MCP servers across both layers ─────────────────────────────────────────────
type Layer = 'user' | 'project' | 'base'
type McpServer = { name: string; layer: Layer; command: string }
const mcpServersFrom = (obj: Record<string, unknown> | null): Record<string, { command?: unknown; args?: unknown }> =>
  (obj?.mcpServers as Record<string, { command?: unknown; args?: unknown }>) ?? {}
function collectMcp(obj: Record<string, unknown> | null, layer: Layer, out: McpServer[]): void {
  for (const [name, cfg] of Object.entries(mcpServersFrom(obj))) {
    const command = [typeof cfg?.command === 'string' ? cfg.command : '', Array.isArray(cfg?.args) ? cfg.args.join(' ') : '']
      .join(' ')
      .trim()
    out.push({ name, layer, command })
  }
}

// env blocks (for HEADROOM_* detection)
const envKeysFrom = (obj: Record<string, unknown> | null): string[] => {
  const env = obj?.env
  return env && typeof env === 'object' ? Object.keys(env as Record<string, unknown>) : []
}

// ── compression-tooling registry (extensible — "Headroom and other projects") ──
// Each entry knows how to DETECT itself from the gathered config. Add new context /
// compression projects here with their own signals; the optimal-setup nuance that
// isn't yet documented stays a [J] item in the rubric (TOOL-3).
type DetectCtx = { mcp: McpServer[]; envKeys: string[] }
type Tool = { name: string; detect: (c: DetectCtx) => string | null } // returns the mode it's wired in, or null
const REGISTRY: Tool[] = [
  {
    name: 'headroom',
    detect: ({ mcp, envKeys }) => {
      const server = mcp.find((s) => s.name.toLowerCase() === 'headroom' || /(^|\W)headroom(\W|$)/i.test(s.command))
      if (server) return `mcp/proxy (${server.layer})`
      if (envKeys.some((k) => k.toUpperCase().startsWith('HEADROOM_'))) return 'env'
      return null
    }
  }
]

// ── minimal TOML for the [ki-tokenomics] table ──────────────
// Subset parser: `[table]` / `[table.budgets]` headers, `key = "string"` and
// `key = <number>` on one line, `#` comments. NOT a full TOML parser. Returns the
// skill's config (or absent), the unknown keys seen (validate-down → WARN), and any
// malformed budget value (non-numeric → FAIL).
type KiConfig = {
  present: boolean
  headroom?: string
  headroomBad?: string
  modelTier?: string
  modelTierBad?: string
  contextWindow?: number
  budgets: Partial<Record<BudgetKey, number>>
  unknownKeys: string[]
  badBudgets: string[]
}
const BUDGET_KEYS = new Set<string>(['claude_md', 'memory_index', 'skills_surface', 'mcp_servers', 'total'])
function parseKiConfig(text: string): KiConfig {
  const cfg: KiConfig = { present: false, budgets: {}, unknownKeys: [], badBudgets: [] }
  let section = ''
  const BUDGETS = `${KI_SECTION}.budgets`
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, '').trim()
    if (!line) continue
    const header = line.match(/^\[(.+)\]$/)
    if (header) {
      section = (header[1] as string).trim()
      if (section === KI_SECTION || section === BUDGETS) cfg.present = true
      continue
    }
    if (section !== KI_SECTION && section !== BUDGETS) continue
    const eq = line.indexOf('=')
    if (eq === -1) continue
    const key = line.slice(0, eq).trim()
    const val = line
      .slice(eq + 1)
      .trim()
      .replace(/^["']|["']$/g, '')
    if (section === KI_SECTION) {
      if (key === 'headroom') {
        if ((HEADROOM_VALUES as readonly string[]).includes(val)) cfg.headroom = val
        else cfg.headroomBad = val
      } else if (key === 'preferred_model') {
        if ((MODEL_TIER_VALUES as readonly string[]).includes(val)) cfg.modelTier = val
        else cfg.modelTierBad = val
      } else if (key === 'context_window_tokens') {
        const n = Number(val)
        if (Number.isFinite(n) && n > 0) cfg.contextWindow = n
        else cfg.badBudgets.push(key)
      } else cfg.unknownKeys.push(key)
    } else if (!BUDGET_KEYS.has(key)) {
      cfg.unknownKeys.push(key)
    } else {
      const n = Number(val)
      if (Number.isFinite(n) && n >= 0) cfg.budgets[key as BudgetKey] = n
      else cfg.badBudgets.push(key)
    }
  }
  return cfg
}

// ── run ──────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2)
if (argv.includes('--init')) {
  process.stdout.write(KI_DEFAULT)
  process.exit(0)
}
const noUser = argv.includes('--no-user')
const userIdx = argv.indexOf('--user')
const userDir = userIdx !== -1 ? resolve(argv[userIdx + 1] ?? '') : join(homedir(), '.claude')
const target = resolve(argv.find((a, i) => !a.startsWith('-') && argv[i - 1] !== '--user') ?? '.')

if (!argv.includes('--json')) {
  console.log(paint(C.dim, `target: ${target}`))
  console.log(paint(C.dim, `user layer: ${noUser ? '(skipped)' : userDir}`))
  console.log(
    paint(
      C.dim,
      'standard: standing surface (CLAUDE.md+@imports · memory · skills · MCP tool surface · settings) + runtime levers; budgets WARN-only; figures ~chars/4 estimates'
    )
  )
}

// COMP — which layers were read
if (noUser) note('COMP', 'user-wide layer skipped (--no-user) — auditing the project layer alone')
else if (existsSync(userDir)) note('COMP', `[user] ${userDir}`)
else warn('COMP', `[user] ${userDir} not found — cannot weigh the user-wide layer (is this the right home?)`)
note('COMP', `[project] ${target}`)

// Gather config table first (drives budgets + headroom expectation).
const kiText = readText(join(target, '.ki-config.toml'))
const ki = kiText != null ? parseKiConfig(kiText) : null
const budget = (k: BudgetKey): number => ki?.budgets[k] ?? BUDGET_DEFAULTS[k]

let standingTotal = 0
const layers: { layer: Layer; dir: string }[] = []
if (!noUser && existsSync(userDir)) layers.push({ layer: 'user', dir: userDir })
layers.push({ layer: 'project', dir: target })

// ── SURF + BUDG: CLAUDE.md (+imports), per layer ──
const claudeMdCandidates: Record<Layer, string[]> = {
  user: [join(userDir, 'CLAUDE.md')],
  project: [join(target, 'CLAUDE.md'), join(target, 'AGENTS.md')],
  base: []
}
for (const { layer } of layers) {
  for (const file of claudeMdCandidates[layer]) {
    if (!existsSync(file)) continue
    const { tokens, broken } = claudeMdSize(file)
    standingTotal += tokens
    const label = `[${layer}] ${basename(file)}${broken.length ? ' (+@imports)' : ''}`
    if (tokens > budget('claude_md'))
      warn('SURF', `${label} ${tok(tokens)} > budget ${tok(budget('claude_md'))} — lift rarely-read detail into on-demand files`)
    else note('SURF', `${label} ${tok(tokens)}`)
    for (const b of broken) fail('SURF', `[${layer}] ${basename(file)} has an unresolved @import → "${b}" (broken include)`)
  }
}

// Memory: MEMORY.md indices the checker can locate. Project/base: top-level MEMORY.md,
// Admin/MEMORY.md, and per-Pillar MEMORY.md. User: the per-project memory dir Claude
// Code derives by encoding the target path (slashes/dots → dashes).
const memoryFiles: { layer: Layer; file: string }[] = []
const pushMem = (layer: Layer, file: string): void => {
  if (existsSync(file)) memoryFiles.push({ layer, file })
}
pushMem('project', join(target, 'MEMORY.md'))
pushMem('base', join(target, 'Admin', 'MEMORY.md'))
const pillarsDir = join(target, 'Pillars')
if (existsSync(pillarsDir)) {
  for (const e of readdirSync(pillarsDir, { withFileTypes: true })) {
    if (e.isDirectory()) pushMem('base', join(pillarsDir, e.name, 'MEMORY.md'))
  }
}
if (!noUser && existsSync(userDir)) {
  const enc = target.replace(/[/.]/g, '-')
  pushMem('user', join(userDir, 'projects', enc, 'memory', 'MEMORY.md'))
}
for (const { layer, file } of memoryFiles) {
  const tokens = approxTokens(readText(file) ?? '')
  standingTotal += tokens
  const label = `[${layer}] ${file.includes('/Pillars/') ? `Pillars/${basename(dirname(file))}/MEMORY.md` : basename(file)}`
  if (tokens > budget('memory_index')) warn('SURF', `${label} ${tok(tokens)} > budget ${tok(budget('memory_index'))} — prune stale entries`)
  else note('SURF', `${label} ${tok(tokens)}`)
}

// ── SURF + BUDG: installed-skill selection surface, per layer ──
for (const { layer, dir } of layers) {
  const skillsDir = layer === 'user' ? join(dir, 'skills') : join(dir, '.claude', 'skills')
  const { count, tokens } = skillSelectionTokens(skillsDir)
  if (count === 0) continue
  standingTotal += tokens
  const label = `[${layer}] ${count} skill description(s)`
  if (tokens > budget('skills_surface'))
    warn('SURF', `${label} ${tok(tokens)} > budget ${tok(budget('skills_surface'))} — consolidate or tighten descriptions (ki-skills)`)
  else note('SURF', `${label} ${tok(tokens)}`)
}

// ── MCP tool surface + RUN: settings signals ──
const mcp: McpServer[] = []
const envKeys: string[] = []
const settingsSources: { layer: Layer; file: string }[] = []
if (!noUser) {
  settingsSources.push({ layer: 'user', file: join(userDir, 'settings.json') })
  settingsSources.push({ layer: 'user', file: join(homedir(), '.claude.json') })
}
settingsSources.push({ layer: 'project', file: join(target, '.claude', 'settings.json') })
settingsSources.push({ layer: 'project', file: join(target, '.claude', 'settings.local.json') })
settingsSources.push({ layer: 'project', file: join(target, '.mcp.json') })
let pinnedModel: string | null = null
for (const { layer, file } of settingsSources) {
  const obj = readJSON(file)
  if (obj == null) continue
  collectMcp(obj, layer, mcp)
  envKeys.push(...envKeysFrom(obj))
  if (typeof obj.model === 'string' && !pinnedModel) pinnedModel = obj.model
}
if (mcp.length) {
  const byLayer: Record<string, number> = {}
  for (const s of mcp) byLayer[s.layer] = (byLayer[s.layer] ?? 0) + 1
  note(
    'MCP',
    `${mcp.length} server(s): ${mcp.map((s) => s.name).join(', ')} (${Object.entries(byLayer)
      .map(([l, n]) => `${n} ${l}`)
      .join(', ')})`
  )
  if (mcp.length > budget('mcp_servers'))
    warn(
      'MCP',
      `${mcp.length} MCP servers > budget ${budget('mcp_servers')} — tool definitions are the dominant standing cost; disable/scope servers this work does not use (ki-mcp)`
    )
} else note('MCP', 'no MCP servers configured')

// RUN: the only config-level runtime signal the checker can see is a pinned model.
if (pinnedModel) note('RUN', `default model pinned: ${pinnedModel} — confirm the tier matches the work (RUN-2)`)
else note('RUN', 'no default model pinned in settings — tier is the session default (runtime judgment)')

// ── TOOL: compression tooling + declared expectation ──
const detectCtx: DetectCtx = { mcp, envKeys }
const present = REGISTRY.map((t) => ({ name: t.name, mode: t.detect(detectCtx) })).filter((d) => d.mode)
for (const d of present)
  note(
    'TOOL',
    `${d.name} detected — ${d.mode}; confirm reversible store + cache-aligner are optimal (TOOL-3, keys undocumented — judgment)`
  )
const expectation: HeadroomExpectation = (ki?.headroom as HeadroomExpectation) ?? 'recommended'
const headroomPresent = present.some((d) => d.name === 'headroom')
if (!headroomPresent) {
  if (expectation === 'required')
    fail('TOOL', 'headroom = "required" but no Headroom configuration detected (mcpServers entry, proxy, or HEADROOM_* env)')
  else if (expectation === 'recommended')
    warn('TOOL', 'no context-compression layer detected — Headroom is recommended for tool-heavy work (set headroom = "off" to silence)')
  else note('TOOL', 'compression layer off (headroom = "off")')
}

// ── BUDG: total standing surface ──
const total = standingTotal
const overTotal = total > budget('total')
const headroomPct = ki?.contextWindow
  ? ` — ${Math.round((total / ki.contextWindow) * 100)}% of the declared ${ki.contextWindow.toLocaleString('en-US')}-token window`
  : ''
if (overTotal) warn('BUDG', `total standing surface ${tok(total)} > budget ${tok(budget('total'))}${headroomPct}`)
else note('BUDG', `total standing surface ${tok(total)} (budget ${tok(budget('total'))})${headroomPct}`)

// ── CFG: the config table, validated down ──
if (!ki?.present) note('CFG', `no [${KI_SECTION}] table in .ki-config.toml — using default budgets (run --init to opt in and tune)`)
else {
  note('CFG', `[${KI_SECTION}] present (headroom = "${expectation}"${ki.contextWindow ? `, window ${ki.contextWindow}` : ''})`)
  if (ki.headroomBad)
    warn('CFG', `headroom = "${ki.headroomBad}" is not one of ${HEADROOM_VALUES.join(' / ')} — defaulting to "recommended"`)
  if (ki.modelTier) note('CFG', `preferred_model = "${ki.modelTier}" — confirm the tier is appropriate for this environment (RUN-2)`)
  else if (ki.modelTierBad)
    warn('CFG', `preferred_model = "${ki.modelTierBad}" is not one of ${MODEL_TIER_VALUES.join(' / ')} — value unrecognised`)
  else warn('CFG', `preferred_model not declared in [${KI_SECTION}] — add it to codify the default tier for this environment (CFG-4)`)
  for (const k of ki.unknownKeys)
    warn('CFG', `unrecognised key "${k}" in [${KI_SECTION}] — validate-down (known budgets: ${[...BUDGET_KEYS].join(', ')})`)
  for (const k of ki.badBudgets) fail('CFG', `"${k}" has a non-numeric/invalid value in [${KI_SECTION}]`)
}

// ── report ───────────────────────────────────────────────────────────────────
// Unified-ladder output; keeps the by-area console grouping, adds --json / --report (enforcement-framework §2/§5).
const jsonOut = argv.includes('--json')
const ri = argv.indexOf('--report')
const reportOut = ri !== -1
const reportDir = reportOut && argv[ri + 1] && !argv[ri + 1].startsWith('-') ? argv[ri + 1] : join(target, '.ki-meta', 'audits')

const fails = findings.filter((x) => x.level === 'FAIL')
const warns = findings.filter((x) => x.level === 'WARN')
const n = (l: Level): number => findings.filter((x) => x.level === l).length
const summary = {
  fail: fails.length,
  warn: warns.length,
  polish: n('POLISH'),
  advisory: n('ADVISORY'),
  info: n('INFO'),
  skip: n('SKIP'),
  pass: n('PASS')
}
const isoStamp = new Date().toISOString()

if (reportOut) {
  mkdirSync(reportDir, { recursive: true })
  const body = LADDER.flatMap((l) => {
    const rows = findings.filter((f) => f.level === l)
    return rows.length ? ['', `## ${ICON[l]} ${l} (${rows.length})`, ...rows.map((r) => `- [${r.area}] ${r.msg}`)] : []
  })
  const tally = `${summary.fail} fail · ${summary.warn} warn · ${summary.polish} polish · ${summary.pass} pass  ·  ${summary.advisory} advisory · ${summary.skip} skip · standing surface ${tok(total)}`
  writeFileSync(
    join(reportDir, 'tokenomics.md'),
    [`# tokenomics audit — ${target}`, '', `_${isoStamp}_`, '', tally, ...body, ''].join('\n')
  )
  writeFileSync(
    join(reportDir, 'tokenomics.json'),
    `${JSON.stringify({ concern: 'tokenomics', target, generatedAt: isoStamp, summary, findings }, null, 2)}\n`
  )
}

if (jsonOut) {
  process.stdout.write(`${JSON.stringify({ concern: 'tokenomics', target, generatedAt: isoStamp, summary, findings }, null, 2)}\n`)
} else {
  const head = fails.length ? paint(C.red, 'FAIL') : warns.length ? paint(C.yellow, 'WARN') : paint(C.green, 'PASS')
  console.log(`\n${head}  ${paint(C.cyan, basename(target))}`)
  for (const area of AREA_ORDER) {
    const inArea = findings.filter((x) => x.area === area)
    if (!inArea.length) continue
    console.log(paint(C.dim, `  ── ${area} ──`))
    for (const x of inArea) {
      if (x.level === 'FAIL') console.log(`  ${paint(C.red, 'fail')} ${x.msg}`)
      else if (x.level === 'WARN') console.log(`  ${paint(C.yellow, 'warn')} ${x.msg}`)
      else console.log(`  ${paint(C.dim, `${x.level.toLowerCase()} ${x.msg}`)}`)
    }
  }
  console.log(
    `\n${paint(C.cyan, 'summary')}: ${paint(C.red, `${fails.length} fail`)}, ${paint(C.yellow, `${warns.length} warn`)} · standing surface ${tok(total)}`
  )
  if (reportOut) console.log(paint(C.dim, `report → ${join(reportDir, 'tokenomics.{md,json}')}`))
  console.log(
    paint(
      C.dim,
      'mechanical checks only — apply the judgment criteria (altitude, MCP usefulness, runtime levers, Headroom optimality) from references/audit-rubric.md by reading.'
    )
  )
}
process.exit(fails.length > 0 ? 1 : 0)
