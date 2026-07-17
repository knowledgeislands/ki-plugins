/**
 * Set-resolution helpers shared by the EDUCATE chain (`bootstrap.ts`) and the
 * vendored-set alignment checker (`audit.ts`). Pure, read-only: given a
 * target repo and the harness `skills/` root, computes which skills *should* be
 * vendored — the transitive `implies:` closure of the baseline plus whatever the
 * target's `.ki-config.toml` declares — and locates each skill's checker/conform
 * script. Kept import-only (no top-level side effects) so both callers can use it
 * without triggering the other's CLI behaviour.
 */

import { existsSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readText } from './package-scripts.ts'

export const BOOTSTRAP = 'ki-bootstrap'

// The harness `skills/` root this engine reads sources from. Local run: the
// working tree three levels up from this file (scripts/ → ki-bootstrap/ → keystone/
// → skills/). (Remote-URL sourcing is a documented follow-on; the vendored output
// is identical either way.)
export const SKILLS_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')

// Skills live two levels under SKILLS_ROOT (skills/<cluster>/<name>/SKILL.md) —
// built once and memoized so every by-name lookup below stays O(1) after the
// first call. Keyed by bare skill name; callers never need to know a skill's
// cluster.
let skillIndexCache: Map<string, string> | null = null
function skillIndex(): Map<string, string> {
  if (skillIndexCache) return skillIndexCache
  const idx = new Map<string, string>()
  for (const entry of readdirSync(SKILLS_ROOT, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const clusterDir = join(SKILLS_ROOT, entry.name)
    if (existsSync(join(clusterDir, 'SKILL.md'))) {
      idx.set(entry.name, clusterDir) // tolerate a flat leftover during migration
      continue
    }
    for (const sub of readdirSync(clusterDir, { withFileTypes: true })) {
      if (!sub.isDirectory()) continue
      const skillPath = join(clusterDir, sub.name)
      if (existsSync(join(skillPath, 'SKILL.md'))) idx.set(sub.name, skillPath)
    }
  }
  skillIndexCache = idx
  return idx
}

export class SkillResolutionError extends Error {
  readonly unresolved: string[]

  constructor(unresolved: Iterable<string>) {
    const sorted = [...new Set(unresolved)].sort()
    super(`unresolvable skill root${sorted.length === 1 ? '' : 's'}: ${sorted.join(', ')}`)
    this.name = 'SkillResolutionError'
    this.unresolved = sorted
  }
}

export function skillDir(skill: string): string {
  const dir = skillIndex().get(skill)
  if (!dir) throw new SkillResolutionError([skill])
  return dir
}

export function allSkillNames(): string[] {
  return [...skillIndex().keys()].sort()
}

export function isSkill(skill: string): boolean {
  return skillIndex().has(skill)
}

type MultilineDelimiter = '"""' | "'''"

function tripleClose(line: string, delimiter: MultilineDelimiter, from: number): number {
  let at = line.indexOf(delimiter, from)
  while (at !== -1) {
    const backslashes = line.slice(0, at).match(/\\+$/)?.[0].length ?? 0
    if (delimiter === "'''" || backslashes % 2 === 0) return at
    at = line.indexOf(delimiter, at + delimiter.length)
  }
  return -1
}

// Return only physical TOML table-header lines, ignoring comments, ordinary
// strings, and whole lines occupied by multiline basic/literal strings.
function tableHeaderLines(text: string): string[] {
  const headers: string[] = []
  let multiline: MultilineDelimiter | null = null
  for (const raw of text.split(/\r?\n/)) {
    if (multiline) {
      if (tripleClose(raw, multiline, 0) !== -1) multiline = null
      continue
    }
    let code = ''
    let quote: '"' | "'" | null = null
    let escaped = false
    for (let i = 0; i < raw.length; i++) {
      const delimiter = raw.startsWith('"""', i) ? '"""' : raw.startsWith("'''", i) ? "'''" : null
      if (!quote && delimiter) {
        if (tripleClose(raw, delimiter, i + delimiter.length) === -1) multiline = delimiter
        break
      }
      const char = raw[i] as string
      if (!quote && char === '#') break
      code += char
      if (quote === '"') {
        if (!escaped && char === '"') quote = null
        escaped = !escaped && char === '\\'
      } else if (quote === "'") {
        if (char === "'") quote = null
      } else if (char === '"' || char === "'") {
        quote = char
        escaped = false
      }
    }
    const header = code.trim()
    if (header.startsWith('[')) headers.push(header)
  }
  return headers
}

// Skill roots named by exact or dotted TOML tables. Bare and simply-quoted root
// keys are accepted; malformed/noncanonical ki-like names reach resolution and
// fail against the index instead of disappearing. Repeated roots collapse.
export function declaredSkills(kiConfigText: string): string[] {
  const out = new Set<string>()
  for (const header of tableHeaderLines(kiConfigText)) {
    const match = header.match(/^\[\s*(?:"(ki-[^"\\]+)"|'(ki-[^']+)'|(ki-[A-Za-z0-9_-]+))\s*(?:\.|\])/)
    const root = match?.[1] ?? match?.[2] ?? match?.[3]
    if (root) out.add(root)
  }
  return [...out].sort()
}

export function assertResolvableSkills(skills: Iterable<string>): void {
  const unresolved = [...new Set(skills)].filter((skill) => !isSkill(skill))
  if (unresolved.length) throw new SkillResolutionError(unresolved)
}

// The `implies:` flow list from a skill's SKILL.md frontmatter.
export function impliesOf(skill: string): string[] {
  const md = readText(join(skillDir(skill), 'SKILL.md'))
  const fm = md.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!fm) return []
  const line = fm[1].split(/\r?\n/).find((l) => /^implies:/.test(l))
  if (!line) return []
  const inner = line
    .replace(/^implies:\s*/, '')
    .trim()
    .replace(/^\[/, '')
    .replace(/\]$/, '')
    .trim()
  return inner
    ? inner
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : []
}

// Transitive closure of the declared skills (+ explicit --seed skills) over the
// `implies:` graph. Coverage is purely what `.ki-config.toml` declares — every repo
// declares its own foundations (`[ki-repo]`, `[ki-authoring]`), so there is no injected
// baseline. A per-skill `scripts/educate.ts` delegator seeds itself.
export function resolveSet(target: string, all: boolean, seeds: string[]): string[] {
  const seed = all ? allSkillNames() : [...declaredSkills(readText(join(target, '.ki-config.toml'))), ...seeds]
  const seen = new Set<string>()
  const unresolved = new Set<string>()
  const stack = [...seed]
  while (stack.length) {
    const s = stack.pop()
    if (s === undefined || seen.has(s)) continue
    if (!isSkill(s)) {
      unresolved.add(s)
      continue
    }
    seen.add(s)
    for (const dep of impliesOf(s)) stack.push(dep)
  }
  if (unresolved.size) throw new SkillResolutionError(unresolved)
  seen.delete(BOOTSTRAP) // the chain-starter is not vendored into targets
  return [...seen].sort()
}

// A checker/conform source file, excluding co-located test files (`*.test.ts`), which
// would otherwise collide with the single-match discovery below (e.g. `audit.ts`
// + `audit.test.ts`) and silently drop the skill from the vendored set.
export const isSource = (f: string): boolean => !/\.test\.ts$/.test(f)

// A skill's single legacy checker script (audit-*.ts / lint-*.ts / bare audit.ts) —
// discovered, not templated. Migration fallback only: the primary source is the
// `vendors:` frontmatter declaration below.
export function checkerScript(skill: string): { verb: 'audit'; file: string } | null {
  const dir = join(skillDir(skill), 'scripts')
  if (!existsSync(dir)) return null
  const m = readdirSync(dir).filter((f) => /^(audit\.ts|(audit|lint)-.*\.ts)$/.test(f) && isSource(f))
  if (m.length !== 1) return null
  return { verb: 'audit', file: m[0] }
}

export function conformScript(skill: string): string | null {
  const dir = join(skillDir(skill), 'scripts')
  if (!existsSync(dir)) return null
  const m = readdirSync(dir).filter((f) => /^(conform\.ts|conform-.*\.ts)$/.test(f) && isSource(f))
  return m.length === 1 ? m[0] : null
}

// ── `vendors:` frontmatter (ADR-KI-HARNESS-007) ──────────────────────────────────
// Per-skill declaration, central execution. Every governance skill declares the
// universal modes it vendors as a single-line flow LIST beside `implies:`:
//
//   vendors: [educate, audit, conform, help]
//
// Mode → artifact is DERIVED (no override):
//   educate / audit / conform → scripts/<mode>.ts, vendored as a copied file
//   help                   → a rendered SKILL.md snapshot (no script; see bootstrap.ts)
// `refresh` is never vendored (harness-only). During migration two legacy forms are
// still parsed with a WARN: the map form `vendors: { audit: scripts/x.ts, conform:
// scripts/y.ts }` (a bare path is a FILE; a quoted `"cmd: ..."` is a COMMAND), and
// filename-convention discovery when a skill has no `vendors:` line at all.
export const VENDOR_MODES = ['educate', 'audit', 'conform', 'help'] as const
export type VendorMode = (typeof VENDOR_MODES)[number]
export type VendorUnit = { kind: 'file'; path: string } | { kind: 'command'; command: string }

// The raw `vendors:` line's inner text, or null when there is no such line.
function vendorsInner(skill: string): string | null {
  const md = readText(join(skillDir(skill), 'SKILL.md'))
  const fm = md.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!fm) return null
  const line = fm[1].split(/\r?\n/).find((l) => /^vendors:/.test(l))
  if (!line) return null
  const inner = line.replace(/^vendors:\s*/, '').trim()
  return inner || null
}

// The declared mode list. Handles the new flow-list form directly, and derives the
// list from a legacy map form's keys. null when there is no `vendors:` line.
export function vendorModesOf(skill: string): VendorMode[] | null {
  const inner = vendorsInner(skill)
  if (inner === null) return null
  if (inner.startsWith('[')) {
    return inner
      .replace(/^\[/, '')
      .replace(/\]$/, '')
      .split(',')
      .map((s) => s.trim())
      .filter((s): s is VendorMode => (VENDOR_MODES as readonly string[]).includes(s))
  }
  // Legacy map form: keys are the modes.
  const modes: VendorMode[] = []
  for (const raw of inner
    .replace(/^\{/, '')
    .replace(/\}$/, '')
    .match(/(?:[^,"]+|"[^"]*")+/g) ?? []) {
    const m = raw.trim().match(/^(audit|conform):/)
    if (m && !modes.includes(m[1] as VendorMode)) modes.push(m[1] as VendorMode)
  }
  return modes.length ? modes : null
}

// A legacy map form's explicit unit for one verb (audit/conform), or null.
function legacyMapUnit(skill: string, verb: 'audit' | 'conform'): VendorUnit | null {
  const inner = vendorsInner(skill)
  if (inner === null || inner.startsWith('[')) return null
  for (const raw of inner
    .replace(/^\{/, '')
    .replace(/\}$/, '')
    .match(/(?:[^,"]+|"[^"]*")+/g) ?? []) {
    const m = raw.trim().match(/^(audit|conform):\s*(.+)$/)
    if (!m || m[1] !== verb) continue
    let value = m[2].trim()
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1)
    return value.startsWith('cmd:') ? { kind: 'command', command: value.slice(4).trim() } : { kind: 'file', path: value }
  }
  return null
}

// Resolves a skill's vendorable unit for one mode (educate/audit/conform — help never
// vendors a script). Order: derived `scripts/<mode>.ts` from a flow-list declaration,
// else the legacy map's explicit path, else filename-convention discovery — the last
// two printing a WARN (never a hard fail) per the ADR's migration fallback.
export function vendorUnit(skill: string, mode: 'educate' | 'audit' | 'conform'): VendorUnit | null {
  const modes = vendorModesOf(skill)
  const inner = vendorsInner(skill)

  // New flow-list form: pure derivation.
  if (inner?.startsWith('[')) {
    if (!modes?.includes(mode)) return null
    const path = `scripts/${mode}.ts`
    if (!existsSync(join(skillDir(skill), path))) return null
    return { kind: 'file', path }
  }

  // educate has no legacy encoding — only the derived form above.
  if (mode === 'educate') {
    const path = 'scripts/educate.ts'
    return existsSync(join(skillDir(skill), path)) ? { kind: 'file', path } : null
  }

  // Legacy map form.
  const mapped = legacyMapUnit(skill, mode)
  if (mapped) {
    console.error(
      `${'\x1b[33m'}WARN${'\x1b[0m'}  ${skill} uses the legacy \`vendors: { … }\` map — migrate to \`vendors: [educate, audit, conform, help]\` with bare scripts/${mode}.ts.`
    )
    return mapped
  }

  // Filename-convention discovery.
  const legacy = mode === 'audit' ? checkerScript(skill)?.file : conformScript(skill)
  if (!legacy) return null
  console.error(
    `${'\x1b[33m'}WARN${'\x1b[0m'}  ${skill} has no \`vendors:\` declaration for ${mode} — falling back to filename-convention discovery (scripts/${legacy}). Add \`vendors: [educate, audit, conform, help]\` and rename to scripts/${mode}.ts.`
  )
  return { kind: 'file', path: `scripts/${legacy}` }
}
