#!/usr/bin/env bun
/**
 * ki-bootstrap — wire a repo's project-local skills from its .ki-config.toml.
 *
 * A Knowledge Islands repo's `.claude/skills/` should mirror the skills it declares
 * (`[ki-*]` tables), plus the baseline `ki-repo` +
 * `ki-authoring` (so even a greenfield repo with no coverage tables can still reach
 * repo's INIT). Links are RELATIVE symlinks into the harness's `skills/` — gitignored and
 * regenerated, never committed.
 *
 * Self-locating: invoked through its global symlink
 * (`~/.claude/skills/ki-bootstrap/scripts/link-skills.ts`), `import.meta.url` resolves
 * to its real path inside the harness, from which the sibling skill sources are found.
 *
 * Usage:
 *   bun link-skills.ts [target-repo]   link declared∪baseline into <target>/.claude/skills (default cwd)
 *   --all        link every skill under the harness skills/ (for the harness itself, the authoring hub)
 *   --dry-run    print what would change, touch nothing
 *   --check      audit only (no mutation): links match expected, ki:skills:link:project script present,
 *                .claude/skills gitignored; exits non-zero on FAIL
 */

import {
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync
} from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// ── Self-location: find the harness skills/ root through the (possibly symlinked) script path ──
const SELF = realpathSync(fileURLToPath(import.meta.url))
// .../skills/ki-bootstrap/scripts/link-skills.ts → up to .../skills
const SKILLS_ROOT = resolve(dirname(SELF), '..', '..')

const BOOTSTRAP = 'ki-bootstrap'
const BASELINE = ['ki-repo', 'ki-authoring']

// ── ANSI ──
const RED = '\x1b[31m'
const YELLOW = '\x1b[33m'
const GREEN = '\x1b[32m'
const DIM = '\x1b[2m'
const RESET = '\x1b[0m'

// ── Types ──
type Severity = 'FAIL' | 'WARN' | 'PASS'
interface Finding {
  severity: Severity
  criterion: string
  message: string
}

// ── Helpers ──
function isSymlink(p: string): boolean {
  try {
    return lstatSync(p).isSymbolicLink()
  } catch {
    return false
  }
}

function readText(path: string): string {
  return existsSync(path) ? readFileSync(path, 'utf8') : ''
}

function hasScript(pkgText: string, name: string): boolean {
  try {
    const pkg = JSON.parse(pkgText) as { scripts?: Record<string, unknown> }
    return !!pkg.scripts && name in pkg.scripts
  } catch {
    return false
  }
}

function gitignoresClaudeSkills(gitignore: string): boolean {
  return gitignore.split(/\r?\n/).some((l) => /^\.claude\/skills\/?$/.test(l.trim()))
}

function discoverSkills(): string[] {
  if (!existsSync(SKILLS_ROOT)) return []
  return readdirSync(SKILLS_ROOT, { withFileTypes: true })
    .filter((e) => e.isDirectory() && existsSync(join(SKILLS_ROOT, e.name, 'SKILL.md')))
    .map((e) => e.name)
    .sort()
}

// A skill's checker script isn't a fixed function of its name (ki-kb-base -> audit-kb.ts,
// ki-decision-records -> audit-drs.ts) — discover it by scanning scripts/ instead of templating.
interface CheckerScript {
  verb: 'audit' | 'lint'
  file: string
}

function discoverCheckerScript(skill: string): CheckerScript | null {
  const scriptsDir = join(SKILLS_ROOT, skill, 'scripts')
  if (!existsSync(scriptsDir)) return null
  const matches = readdirSync(scriptsDir).filter((f) => /^(audit|lint)-.*\.ts$/.test(f))
  if (matches.length !== 1) {
    if (matches.length > 1) console.log(`${YELLOW}skip  ${RESET}${skill} ${DIM}(ambiguous checker scripts: ${matches.join(', ')})${RESET}`)
    return null
  }
  const verb = matches[0].startsWith('audit-') ? 'audit' : 'lint'
  return { verb, file: matches[0] }
}

function scriptKey(skill: string, verb: string): string {
  return `ki:${skill.replace(/^ki-/, '')}:${verb}`
}

// Add missing per-skill checker scripts to package.json — never overwrite an existing entry
// (a repo may have deliberately customized the command), never create package.json from scratch.
// Edited as text (not JSON.parse -> JSON.stringify) so untouched parts of the file — formatting,
// key order, whether an array is inlined or multi-line — are never rewritten as a side effect.
function ensureCheckerScripts(target: string, set: string[], dryRun: boolean): void {
  const pkgPath = join(target, 'package.json')
  if (!existsSync(pkgPath)) return

  const pkgText = readFileSync(pkgPath, 'utf8')
  let pkg: { scripts?: Record<string, string> }
  try {
    pkg = JSON.parse(pkgText)
  } catch {
    console.log(`${YELLOW}skip  ${RESET}package.json ${DIM}(not valid JSON — leaving scripts untouched)${RESET}`)
    return
  }

  const additions: Array<[string, string]> = []
  for (const skill of set) {
    const checker = discoverCheckerScript(skill)
    if (!checker) continue
    const key = scriptKey(skill, checker.verb)
    if (pkg.scripts?.[key]) continue
    additions.push([key, `bun .claude/skills/${skill}/scripts/${checker.file} .`])
  }
  if (additions.length === 0) return

  for (const [key, command] of additions) console.log(`${GREEN}script${RESET} ${key} -> ${DIM}${command}${RESET}`)
  if (dryRun) return

  const scriptsMatch = pkgText.match(/^([ \t]*)"scripts"\s*:\s*\{([\s\S]*?)\n([ \t]*)\}/m)
  if (!scriptsMatch) {
    console.log(`${YELLOW}skip  ${RESET}package.json ${DIM}(no "scripts" block to extend — add one by hand first)${RESET}`)
    return
  }
  const [whole, , body, closeIndent] = scriptsMatch
  const entryIndent = `${closeIndent}  `
  const trimmedBody = body.replace(/,\s*$/, '')
  const newLines = additions.map(([key, command]) => `${entryIndent}"${key}": ${JSON.stringify(command)}`).join(',\n')
  const rebuilt = `${scriptsMatch[1]}"scripts": {${trimmedBody ? `${trimmedBody},\n` : '\n'}${newLines}\n${closeIndent}}`
  writeFileSync(pkgPath, pkgText.replace(whole, rebuilt))
}

// Declared `[ki-<skill>]` top-level tables (sub-tables like `.checks` / `.zones` are ignored).
function declaredSkills(kiConfigText: string): string[] {
  const out: string[] = []
  for (const m of kiConfigText.matchAll(/^\[ki-([a-z0-9-]+)\][ \t]*$/gm)) out.push(`ki-${m[1]}`)
  return out
}

function expectedSet(all: boolean, available: string[], kiConfigText: string): string[] {
  if (all) return available
  const want = new Set([...BASELINE, ...declaredSkills(kiConfigText)])
  want.delete(BOOTSTRAP) // the keystone is installed globally; never duplicated project-local
  return [...want].filter((s) => available.includes(s)).sort()
}

// ── Link (mutate) ──
function cmdLink(target: string, set: string[], dryRun: boolean): void {
  const claudeSkills = join(target, '.claude', 'skills')
  if (!existsSync(claudeSkills)) {
    console.log(`${DIM}creating ${claudeSkills}${RESET}`)
    if (!dryRun) mkdirSync(claudeSkills, { recursive: true })
  }

  for (const skill of set) {
    const source = join(SKILLS_ROOT, skill)
    const linkPath = join(claudeSkills, skill)
    const rel = relative(claudeSkills, source)
    if (isSymlink(linkPath) && resolve(dirname(linkPath), readlinkSync(linkPath)) === resolve(source)) {
      console.log(`${DIM}ok    ${skill}${RESET}`)
      continue
    }
    if (existsSync(linkPath) && !isSymlink(linkPath)) {
      console.log(`${YELLOW}skip  ${skill}${RESET} ${DIM}(a real file/dir is in the way)${RESET}`)
      continue
    }
    if (!dryRun) {
      if (isSymlink(linkPath)) rmSync(linkPath)
      symlinkSync(rel, linkPath, 'dir')
    }
    console.log(`${GREEN}link  ${RESET}${skill} -> ${DIM}${rel}${RESET}`)
  }

  // Prune ki-* symlinks no longer in the set (a dropped coverage table), plus any
  // dangling symlink regardless of name — covers legacy knowledgeislands-* leftovers.
  if (existsSync(claudeSkills)) {
    for (const name of readdirSync(claudeSkills)) {
      const p = join(claudeSkills, name)
      if (!isSymlink(p)) continue
      const dangling = !existsSync(p)
      if (!dangling && (!name.startsWith('ki-') || set.includes(name))) continue
      const reason = dangling ? 'dangling target' : 'no longer declared'
      console.log(`${YELLOW}prune ${RESET}${name} ${DIM}(${reason})${RESET}`)
      if (!dryRun) rmSync(p)
    }
  }

  ensureCheckerScripts(target, set, dryRun)
}

// ── Check (audit only) ──
function cmdCheck(target: string, set: string[]): number {
  const findings: Finding[] = []
  const claudeSkills = join(target, '.claude', 'skills')

  const present = existsSync(claudeSkills)
    ? readdirSync(claudeSkills).filter((n) => n.startsWith('ki-') && isSymlink(join(claudeSkills, n)))
    : []
  const missing = set.filter((s) => !present.includes(s))
  const extra = present.filter((p) => !set.includes(p))
  const broken = present.filter((p) => !existsSync(join(claudeSkills, p)))
  if (missing.length === 0 && extra.length === 0 && broken.length === 0) {
    findings.push({
      severity: 'PASS',
      criterion: 'BOOT-1',
      message: `.claude/skills matches declared coverage (${set.length} skill${set.length === 1 ? '' : 's'})`
    })
  } else {
    if (missing.length)
      findings.push({
        severity: 'WARN',
        criterion: 'BOOT-1',
        message: `missing links: ${missing.join(', ')} — run \`ki:skills:link:project\``
      })
    if (extra.length)
      findings.push({ severity: 'WARN', criterion: 'BOOT-1', message: `links not in declared coverage: ${extra.join(', ')}` })
    if (broken.length)
      findings.push({ severity: 'WARN', criterion: 'BOOT-1', message: `dangling links (harness not reachable): ${broken.join(', ')}` })
  }

  const pkgText = readText(join(target, 'package.json'))
  findings.push(
    hasScript(pkgText, 'ki:skills:link:project')
      ? { severity: 'PASS', criterion: 'BOOT-2', message: 'package.json has a ki:skills:link:project script' }
      : {
          severity: 'WARN',
          criterion: 'BOOT-2',
          message: 'no ki:skills:link:project script in package.json — links are not reproducible on clone'
        }
  )

  findings.push(
    gitignoresClaudeSkills(readText(join(target, '.gitignore')))
      ? { severity: 'PASS', criterion: 'BOOT-3', message: '.claude/skills/ is gitignored' }
      : { severity: 'WARN', criterion: 'BOOT-3', message: '.claude/skills/ is not gitignored — generated links would be committed' }
  )

  const missingScripts = set.filter((skill) => {
    const checker = discoverCheckerScript(skill)
    return checker && !hasScript(pkgText, scriptKey(skill, checker.verb))
  })
  if (missingScripts.length === 0) {
    findings.push({
      severity: 'PASS',
      criterion: 'BOOT-5',
      message: 'every linked skill with a checker script has a matching package.json script'
    })
  } else {
    findings.push({
      severity: 'WARN',
      criterion: 'BOOT-5',
      message: `missing checker scripts: ${missingScripts.map((s) => scriptKey(s, discoverCheckerScript(s)!.verb)).join(', ')} — run \`ki:skills:link:project\``
    })
  }

  for (const f of findings) {
    if (f.severity === 'PASS') continue
    const badge = f.severity === 'FAIL' ? `${RED}FAIL${RESET}` : `${YELLOW}WARN${RESET}`
    console.log(`  ${badge}  [${f.criterion}]  ${f.message}`)
  }
  const fails = findings.filter((f) => f.severity === 'FAIL').length
  const warns = findings.filter((f) => f.severity === 'WARN').length
  console.log(
    `\n  ${DIM}${findings.filter((f) => f.severity === 'PASS').length} passed${RESET}   ${fails ? `${RED}${fails} failed${RESET}` : `${DIM}0 failed${RESET}`}   ${warns ? `${YELLOW}${warns} warned${RESET}` : `${DIM}0 warned${RESET}`}`
  )
  return fails > 0 ? 1 : 0
}

// ── Entry ──
const argv = process.argv.slice(2)
const all = argv.includes('--all')
const dryRun = argv.includes('--dry-run')
const checkOnly = argv.includes('--check')
const target = resolve(argv.find((a) => !a.startsWith('-')) ?? '.')

// The harness is the authoring hub and intentionally links every skill via --all.
// Detect it automatically so --check reports PASS rather than a false-positive BOOT-1 WARN.
const HARNESS_ROOT = resolve(dirname(SKILLS_ROOT))
const isHarness = resolve(target) === HARNESS_ROOT

const available = discoverSkills()
if (available.length === 0) {
  console.error(
    `${RED}No skills found under ${SKILLS_ROOT}.${RESET} This script self-locates the harness via its own path; if it was copied (not symlinked), that resolution failed.`
  )
  process.exit(1)
}

const effectiveAll = all || isHarness
const set = expectedSet(effectiveAll, available, readText(join(target, '.ki-config.toml')))
const setLabel = effectiveAll ? (isHarness && !all ? 'all (harness — auto)' : 'all') : 'declared ∪ {repo, authoring}'
console.log(
  `\n  ${DIM}target:${RESET} ${target}   ${DIM}skills source:${RESET} ${SKILLS_ROOT}   ${DIM}set:${RESET} ${setLabel} (${set.length})\n`
)

if (checkOnly) {
  process.exit(cmdCheck(target, set))
}
cmdLink(target, set, dryRun)
if (dryRun) console.log(`\n  ${YELLOW}(dry run — nothing changed)${RESET}`)
