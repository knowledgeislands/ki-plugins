#!/usr/bin/env bun
// Lint Claude Code subagents against the MECHANICAL criteria of the ki-agents rubric.
//
// This is the deterministic half of the rubric (see ../references/audit-rubric.md). The JUDGMENT
// half — description as a delegation signal, role/lane quality, grounding, own-vs-defer — needs a
// model and is NOT checked here. Run this first, then apply the judgment criteria by reading.
//
// Usage:
//   bun scripts/lint-agents.ts [path ...]   # an agent .md file, or a dir of agents
//
// An agent is a single .md file (frontmatter + system prompt). A path to a .md file lints that
// file; a directory is walked recursively for *.md (README.md excluded). An existing dir with no
// agents is a clean pass (exit 0); a path that does not exist is an error (exit 1). Exits non-zero
// if any FAIL is reported (WARN never fails the run).
//
// With >= 2 agents in scope it also runs cross-agent checks: duplicate `name` (NAME-5, FAIL) and
// shared quoted trigger phrases between descriptions (COLL-1, WARN).

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'

const C = { reset: '\x1b[0m', dim: '\x1b[2m', green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m', cyan: '\x1b[36m' }
const paint = (c: string, s: string): string => `${c}${s}${C.reset}`

type Severity = 'fail' | 'warn'
type Finding = { severity: Severity; criterion: string; message: string }

// --- limits (from references/agent-definitions-standard.md — keep in sync) ---------------------
// NAME_MAX and RESERVED derive from the skills `name` spec (BP), not the CC subagents page — that
// page states only "lowercase letters and hyphens, unique" for a subagent name. We carry the caps
// for consistency with skills; do not "correct" them against the CC subagents docs.
const NAME_MAX = 64
const DESC_MAX = 1024 // soft cap → WARN
const RESERVED = ['anthropic', 'claude']

// --- minimal frontmatter parser (shared shape with lint-skills.ts) -----------
// Handles top-level scalar keys and `>`/`|` block scalars. Avoids a YAML dependency.
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
    const kv = line.match(/^([A-Za-z0-9_-]+):(.*)$/)
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
const stripCode = (md: string): string => md.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '')

// --- markdown link extraction (relative targets only; wikilinks are NOT matched here, and are
// allowed for agents per LINK-2) ---------------------------------------------------------------
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

// --- the lint (single agent file) ------------------------------------------
type Agent = { file: string; name: string | undefined; desc: string | undefined }

function lintAgent(file: string): { findings: Finding[]; agent: Agent } {
  const f: Finding[] = []
  const fail = (criterion: string, message: string): void => void f.push({ severity: 'fail', criterion, message })
  const warn = (criterion: string, message: string): void => void f.push({ severity: 'warn', criterion, message })

  const content = readFileSync(file, 'utf8')
  const stem = basename(file).replace(/\.md$/, '')

  const fm = parseFrontmatter(content)
  if (fm.raw === null) {
    fail('LAY-1', 'no YAML frontmatter block (--- ... ---) at the top of the file')
    return { findings: f, agent: { file, name: undefined, desc: undefined } }
  }
  const name = fm.keys.get('name')
  const desc = fm.keys.get('description')

  // name (NAME-1..4, NAME-6 mechanical-ish; NAME-5 uniqueness is cross-set)
  if (!name) fail('NAME-1', '`name` is missing from frontmatter')
  else {
    if (name.length > NAME_MAX) fail('NAME-2', `\`name\` is ${name.length} chars (max ${NAME_MAX})`)
    if (!/^[a-z0-9-]+$/.test(name)) fail('NAME-2', `\`name\` "${name}" must be lowercase letters, digits, and hyphens only`)
    if (name.startsWith('-') || name.endsWith('-') || name.includes('--'))
      fail('NAME-3', `\`name\` "${name}" must not start/end with a hyphen or contain "--"`)
    if (hasXmlTag(name)) fail('NAME-4', '`name` contains an XML tag')
    for (const r of RESERVED) if (name.includes(r)) fail('NAME-4', `\`name\` contains the reserved word "${r}"`)
    if (name !== stem) warn('LAY-3', `\`name\` "${name}" does not match the filename stem "${stem}" — rename one so they agree`)
  }

  // description (DESC-1..3 mechanical)
  if (!desc || desc.trim() === '') fail('DESC-1', '`description` is missing or empty')
  else {
    if (desc.length > DESC_MAX) warn('DESC-2', `\`description\` is ${desc.length} chars (recommended ≤ ${DESC_MAX})`)
    if (hasXmlTag(stripCode(desc))) fail('DESC-3', '`description` contains an XML tag')
  }

  // body present (PROMPT-1)
  const body = content.slice((content.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/) || [''])[0].length)
  if (body.trim() === '') fail('PROMPT-1', 'no system-prompt body after the frontmatter')

  // relative links resolve (LINK-1); wikilinks are intentionally NOT checked (LINK-2 allows them)
  const text = stripCode(body)
  for (const target of relativeLinkTargets(text)) {
    if (!existsSync(resolve(dirname(file), target))) fail('LINK-1', `broken relative link → "${target}"`)
  }

  return { findings: f, agent: { file, name, desc } }
}

// --- cross-agent checks (NAME-5 dup names FAIL, COLL-1 shared triggers WARN) ----
function crossAgentFindings(agents: Agent[]): Finding[] {
  if (agents.length < 2) return []
  const out: Finding[] = []

  // NAME-5 — duplicate names
  const byName = new Map<string, string[]>()
  for (const a of agents) {
    if (!a.name) continue
    if (!byName.has(a.name)) byName.set(a.name, [])
    byName.get(a.name)?.push(basename(a.file))
  }
  for (const [name, files] of byName) {
    if (files.length > 1)
      out.push({
        severity: 'fail',
        criterion: 'NAME-5',
        message: `\`name\` "${name}" is used by ${files.sort().join(', ')} — names must be unique across the agent set`
      })
  }

  // COLL-1 — shared quoted trigger phrases
  const byPhrase = new Map<string, Set<string>>()
  for (const a of agents) {
    for (const phrase of triggerPhrases(a.desc ?? '')) {
      if (!byPhrase.has(phrase)) byPhrase.set(phrase, new Set())
      byPhrase.get(phrase)?.add(a.name ?? basename(a.file))
    }
  }
  for (const [phrase, who] of byPhrase) {
    if (who.size > 1)
      out.push({
        severity: 'warn',
        criterion: 'COLL-1',
        message: `trigger "${phrase}" is shared by ${[...who].sort().join(', ')} — confirm each names the other as an off-ramp (COLL-2)`
      })
  }

  return out.sort((a, b) => a.criterion.localeCompare(b.criterion) || a.message.localeCompare(b.message))
}

// --- discovery -------------------------------------------------------------
function discoverAgentFiles(p: string): string[] {
  const abs = resolve(p)
  if (!existsSync(abs)) return []
  if (statSync(abs).isFile()) return abs.endsWith('.md') ? [abs] : []
  const out: string[] = []
  const walk = (d: string): void => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.name.startsWith('.') || e.name === 'node_modules') continue
      const fp = join(d, e.name)
      if (e.isDirectory() || e.isSymbolicLink()) {
        try {
          if (statSync(fp).isDirectory()) walk(fp)
        } catch {
          /* dangling symlink */
        }
      } else if (e.name.endsWith('.md') && e.name !== 'README.md') {
        out.push(fp)
      }
    }
  }
  walk(abs)
  return out.sort()
}

// --- main ------------------------------------------------------------------
const args = process.argv.slice(2).filter((a) => !a.startsWith('-'))
const roots = args.length ? args : ['.']

const missing = roots.filter((r) => !existsSync(resolve(r)))
if (missing.length) {
  for (const r of missing) console.error(paint(C.red, `path not found: ${resolve(r)}`))
  process.exit(1)
}

const files = [...new Set(roots.flatMap(discoverAgentFiles))].sort()
if (files.length === 0) {
  console.log(paint(C.dim, 'no agents found — nothing to lint'))
  process.exit(0)
}

const LEGEND =
  'area codes — LAY layout · NAME name · DESC description · FM tools/model · PROMPT system-prompt · LANE lane · LINK linking · PROC process · LONG longevity · COLL collision'

// Output flags + unified-ladder aggregation across every audited agent (enforcement-framework §2/§5).
const jsonOut = process.argv.slice(2).includes('--json')
const reportOut = process.argv.slice(2).includes('--report')
const reportTarget = resolve('.')
const reportDir = join(reportTarget, '.ki-meta', 'audits')
type Level = 'FAIL' | 'WARN' | 'POLISH' | 'ADVISORY' | 'INFO' | 'SKIP' | 'PASS'
const LADDER: Level[] = ['FAIL', 'WARN', 'POLISH', 'ADVISORY', 'INFO', 'SKIP', 'PASS']
const ICON: Record<Level, string> = { FAIL: '❌', WARN: '⚠️ ', POLISH: '✨', ADVISORY: '🧭', INFO: 'ℹ️ ', SKIP: '⊘', PASS: '✅' }
const all: { level: Level; area: string; msg: string }[] = []

if (!jsonOut) console.log(paint(C.dim, LEGEND))

let totalFails = 0
let totalWarns = 0
let totalPass = 0
const agents: Agent[] = []
for (const file of files) {
  const { findings, agent } = lintAgent(file)
  agents.push(agent)
  const fails = findings.filter((x) => x.severity === 'fail')
  const warns = findings.filter((x) => x.severity === 'warn')
  totalFails += fails.length
  totalWarns += warns.length
  if (fails.length === 0 && warns.length === 0) totalPass++
  const label = agent.name ?? basename(file)
  for (const x of findings) all.push({ level: x.severity === 'fail' ? 'FAIL' : 'WARN', area: `${label}:${x.criterion}`, msg: x.message })
  if (!jsonOut) {
    const stamp = fails.length ? paint(C.red, 'FAIL') : warns.length ? paint(C.yellow, 'WARN') : paint(C.green, 'PASS')
    console.log(`\n${stamp}  ${paint(C.cyan, label)} ${paint(C.dim, file)}`)
    for (const x of findings) {
      const tag = x.severity === 'fail' ? paint(C.red, 'fail') : paint(C.yellow, 'warn')
      console.log(`  ${tag} ${paint(C.dim, `[${x.criterion}]`)} ${x.message}`)
    }
    if (findings.length === 0) console.log(paint(C.dim, '  all mechanical checks passed'))
  }
}

const cross = crossAgentFindings(agents)
if (cross.length > 0) {
  for (const x of cross) {
    if (x.severity === 'fail') totalFails++
    else totalWarns++
    all.push({ level: x.severity === 'fail' ? 'FAIL' : 'WARN', area: `cross-agent:${x.criterion}`, msg: x.message })
  }
  if (!jsonOut) {
    console.log(`\n${paint(C.yellow, 'CROSS')}  ${paint(C.cyan, 'cross-agent')}`)
    for (const x of cross) {
      const tag = x.severity === 'fail' ? paint(C.red, 'fail') : paint(C.yellow, 'warn')
      console.log(`  ${tag} ${paint(C.dim, `[${x.criterion}]`)} ${x.message}`)
    }
  }
}

const summary = { fail: totalFails, warn: totalWarns, polish: 0, advisory: 0, info: 0, skip: 0, pass: totalPass }
const stampIso = new Date().toISOString()

if (reportOut) {
  mkdirSync(reportDir, { recursive: true })
  const body = LADDER.flatMap((l) => {
    const rows = all.filter((f) => f.level === l)
    return rows.length ? ['', `## ${ICON[l]} ${l} (${rows.length})`, ...rows.map((r) => `- [${r.area}] ${r.msg}`)] : []
  })
  const tally = `${files.length} agent(s) · ${summary.fail} fail · ${summary.warn} warn`
  writeFileSync(join(reportDir, 'agents.md'), [`# agents audit — ${reportTarget}`, '', `_${stampIso}_`, '', tally, ...body, ''].join('\n'))
  writeFileSync(
    join(reportDir, 'agents.json'),
    `${JSON.stringify({ concern: 'agents', target: reportTarget, generatedAt: stampIso, summary, findings: all }, null, 2)}\n`
  )
}

if (jsonOut) {
  process.stdout.write(
    `${JSON.stringify({ concern: 'agents', target: reportTarget, generatedAt: stampIso, summary, findings: all }, null, 2)}\n`
  )
} else {
  console.log(
    `\n${paint(C.cyan, 'summary')}: ${files.length} agent(s), ${paint(C.red, `${totalFails} fail`)}, ${paint(C.yellow, `${totalWarns} warn`)}`
  )
  if (reportOut) console.log(paint(C.dim, `report → ${join(reportDir, 'agents.{md,json}')}`))
  console.log(paint(C.dim, 'mechanical checks only — apply the judgment criteria from references/audit-rubric.md by reading.'))
}
process.exit(totalFails > 0 ? 1 : 0)
