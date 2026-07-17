#!/usr/bin/env bun
// skill-help.ts — surface a skill's self-description ("HELP") from what its
// SKILL.md already declares. One generator, three uses:
//
//   bun skill-help.ts <name>   print the HELP block for one skill
//   bun skill-help.ts          print the lean index of every skill (stdout)
//   bun skill-help.ts --check  coverage guard: every skill dir appears in the
//                              editorial catalogue and vice-versa; exit 1 on drift
//
// Canonical home is skills/keystone/ki-bootstrap/scripts/; also vendored into a governed
// harness-shaped target's .ki-meta/bin/ (ADR-KI-HARNESS-008). It resolves skills/
// and the catalogue from the cwd (repo root). A freshly-bootstrapped harness has
// no editorial catalogue yet, so --check SKIPS (exit 0) when it is absent rather
// than hard-failing; the render paths never touch the catalogue.
//
// HELP is *generated, not authored*: it reads only what a SKILL.md already
// declares (name, first sentence of description, argument-hint, `### Mode`
// headings), so there is no per-skill guide prose to drift. The rich editorial
// catalogue (docs/guides/user-guide/skill-catalogue.md) stays hand-authored;
// --check only guards that it covers exactly the skills that exist.

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const SKILLS_DIR = 'skills'
const CATALOGUE = 'docs/guides/user-guide/skill-catalogue.md'

// Skills live one or two levels under SKILLS_DIR — either flat (skills/<name>,
// tolerated as a migration leftover) or clustered (skills/<cluster>/<name>).
// Resolves the on-disk path for every skill name, keyed by bare name.
function skillPaths(): Map<string, string> {
  const paths = new Map<string, string>()
  const top = readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
  for (const name of top) {
    const p1 = join(SKILLS_DIR, name)
    if (existsSync(join(p1, 'SKILL.md'))) {
      paths.set(name, p1)
      continue
    }
    for (const sub of readdirSync(p1, { withFileTypes: true })) {
      if (!sub.isDirectory()) continue
      const p2 = join(p1, sub.name)
      if (existsSync(join(p2, 'SKILL.md'))) paths.set(sub.name, p2)
    }
  }
  return paths
}

interface Mode {
  name: string
  gloss: string
}

interface Skill {
  name: string
  whatItIs: string // first sentence of the description
  invoke: string | null // the argument-hint
  modes: Mode[]
  seeAlso: string | null // trailing off-ramp / routing guidance
}

/** The frontmatter block between the leading `---` fences, or null. */
function frontmatter(md: string): string | null {
  const m = md.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  return m ? m[1] : null
}

function unquote(s: string): string {
  const q = s.startsWith("'") && s.endsWith("'")
  const qq = s.startsWith('"') && s.endsWith('"')
  return q || qq ? s.slice(1, -1) : s
}

/** Read a scalar frontmatter key, joining a folded (`>`) / literal (`|`) block. */
function fmValue(fm: string, key: string): string | null {
  const lines = fm.split(/\r?\n/)
  const i = lines.findIndex((l) => new RegExp(`^${key}:`).test(l))
  if (i === -1) return null
  const rest = lines[i].replace(new RegExp(`^${key}:\\s*`), '')
  const folded = ['>', '|', '>-', '|-', ''].includes(rest.trim())
  if (!folded) return unquote(rest.trim())
  const buf: string[] = []
  for (let j = i + 1; j < lines.length; j++) {
    if (/^\S/.test(lines[j])) break // next top-level key
    buf.push(lines[j].trim())
  }
  return buf.join(' ').replace(/\s+/g, ' ').trim()
}

function firstSentence(desc: string): string {
  const m = desc.match(/^(.*?[.!?])(?:\s|$)/)
  return (m ? m[1] : desc).trim()
}

/** Modes, alphabetical (the canonical order). Prefer `## Mode X — gloss` /
 *  `### Mode X — gloss` headings (any level, glosses captured); where a skill
 *  declares its modes in prose rather than headings (e.g. ki-kb), fall back to
 *  the verbs enumerated in the argument-hint, which every skill carries. */
function parseModes(body: string, invoke: string | null): Mode[] {
  const modes: Mode[] = []
  for (const line of body.split(/\r?\n/)) {
    const m = line.match(/^#{2,3}\s+Mode\s+([A-Z][A-Z]+)\b\s*(?:[—-]\s*(.*))?$/)
    if (m) modes.push({ name: m[1], gloss: (m[2] ?? '').trim() })
  }
  if (modes.length === 0 && invoke !== null) {
    for (const token of invoke.split(/[\s|]+/)) {
      if (/^[a-z][a-z-]+$/.test(token)) modes.push({ name: token.toUpperCase(), gloss: '' })
    }
  }
  // HELP is universal and identical for every skill (ADR-KI-HARNESS-SKILLS-001),
  // so it is injected here rather than authored into each SKILL.md.
  if (!modes.some((m) => m.name === 'HELP')) {
    modes.push({ name: 'HELP', gloss: 'explain this skill and stop; the default when no mode is given (then routes, if interactive)' })
  }
  return modes.sort((a, b) => a.name.localeCompare(b.name))
}

/** Trailing routing guidance in the description: an "Off-ramps:" tail, or
 *  sentences that hand off to another skill ("use the `ki-x` skill"). */
function seeAlso(desc: string): string | null {
  const off = desc.match(/Off-ramps?:\s*(.*)$/i)
  if (off) return off[1].trim()
  const routing = desc.split(/(?<=[.!?])\s+/).filter((s) => /\buse\b/i.test(s) && /`?ki-[a-z]/.test(s))
  return routing.length ? routing.join(' ').trim() : null
}

function loadSkill(name: string, path: string): Skill | null {
  const md = readFileSync(join(path, 'SKILL.md'), 'utf8')
  const fm = frontmatter(md)
  if (fm === null) return null
  const desc = fmValue(fm, 'description') ?? ''
  const body = md.slice(md.indexOf('\n---', 3))
  const invoke = fmValue(fm, 'argument-hint')
  return {
    name: fmValue(fm, 'name') ?? name,
    whatItIs: firstSentence(desc),
    invoke,
    modes: parseModes(body, invoke),
    seeAlso: seeAlso(desc)
  }
}

function allSkills(): Skill[] {
  return [...skillPaths().entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([name, path]) => loadSkill(name, path))
    .filter((s): s is Skill => s !== null)
}

/** The HELP block for a single skill — what it is, how to invoke, its modes. */
function renderBlock(s: Skill): string {
  const out: string[] = [`# ${s.name}`, '', s.whatItIs, '']
  if (s.invoke) out.push(`**Invoke:** \`${s.name} ${s.invoke}\``, '')
  if (s.modes.length) {
    out.push('**Modes:**', '')
    // No column padding: prettier collapses any run of spaces to one, so padded output
    // would desync from the manifest hash the moment the Markdown gate / lint-staged runs.
    for (const m of s.modes) out.push(`- \`${m.name}\`${m.gloss ? ` — ${m.gloss}` : ''}`)
    out.push('')
  }
  if (s.seeAlso) out.push(`**See also:** ${s.seeAlso}`, '')
  return out.join('\n').trimEnd()
}

/** The lean index of every skill — name, one-liner, mode set. */
function renderIndex(skills: Skill[]): string {
  const out: string[] = ['# Skills index', '']
  for (const s of skills) {
    out.push(`- **${s.name}** — ${s.whatItIs}`)
    if (s.modes.length) out.push(`  - modes: ${s.modes.map((m) => m.name).join(' ')}`)
  }
  return out.join('\n').trimEnd()
}

/** Coverage guard: the editorial catalogue lists exactly the skills that exist. */
function check(): number {
  const skills = allSkills()
  let catalogue: string
  try {
    catalogue = readFileSync(CATALOGUE, 'utf8')
  } catch {
    // A freshly-bootstrapped harness has no editorial catalogue yet — skip the
    // coverage guard rather than hard-fail (ADR-KI-HARNESS-008). Where the
    // catalogue exists (this repo), the full two-way check below still runs.
    console.log(`SKIP  skill-help — no ${CATALOGUE} to check coverage against`)
    return 0
  }
  const errors: string[] = []
  for (const s of skills) {
    if (!catalogue.includes(`\`${s.name}\``)) errors.push(`${s.name}: not listed in ${CATALOGUE}`)
  }
  const listed = [...catalogue.matchAll(/^###\s+`([a-z0-9-]+)`/gm)].map((m) => m[1])
  const names = new Set(skills.map((s) => s.name))
  for (const l of listed) {
    if (!names.has(l)) errors.push(`${CATALOGUE} lists \`${l}\`, which is not a skill under ${SKILLS_DIR}/`)
  }
  if (errors.length > 0) {
    console.error('FAIL  skill-help — catalogue coverage:')
    for (const e of errors) console.error(`  · ${e}`)
    return 1
  }
  console.log(`PASS  skill-help — ${skills.length} skills, all present in the catalogue`)
  return 0
}

const argv = process.argv.slice(2)
if (argv.includes('--check')) {
  process.exit(check())
} else if (argv.length > 0 && !argv[0].startsWith('-')) {
  const path = skillPaths().get(argv[0])
  const s = path ? loadSkill(argv[0], path) : null
  if (s === null) {
    console.error(`No skill "${argv[0]}" under ${SKILLS_DIR}/`)
    process.exit(1)
  }
  console.log(renderBlock(s))
} else {
  console.log(renderIndex(allSkills()))
}
