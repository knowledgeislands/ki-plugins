#!/usr/bin/env bun
/**
 * ki-bootstrap — wire a repo's project-local governance agents from its .ki-config.toml.
 *
 * A Knowledge Islands repo's `.claude/agents/` should mirror `agents/governance/*.md` when
 * (and only when) the repo declares the bare `[ki-agents]` table — there is no baseline
 * equivalent to skills' {repo, authoring}, since no agent is always-on. Links are RELATIVE
 * FILE symlinks into the harness's `agents/governance/` — gitignored and regenerated, never
 * committed.
 *
 * Self-locating: invoked through its global symlink
 * (`~/.claude/skills/ki-bootstrap/scripts/link-agents.ts`), `import.meta.url` resolves
 * to its real path inside the harness, from which the sibling agent sources are found.
 *
 * Usage:
 *   bun link-agents.ts [target-repo]   link declared agents into <target>/.claude/agents (default cwd)
 *   --dry-run    print what would change, touch nothing
 *   --check      audit only (no mutation): links match expected, ki:agents:link:project script present,
 *                .claude/agents gitignored; exits non-zero on FAIL
 */

import { existsSync, lstatSync, mkdirSync, readdirSync, readlinkSync, realpathSync, rmSync, symlinkSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ensureScript, gitignoresPath, hasScript, readText } from './package-scripts.ts'

// ── Self-location: find the harness agents/governance/ root through the (possibly symlinked) script path ──
const SELF = realpathSync(fileURLToPath(import.meta.url))
// .../skills/ki-bootstrap/scripts/link-agents.ts → up to the harness root, then agents/governance
const HARNESS_ROOT = resolve(dirname(SELF), '..', '..', '..')
const AGENTS_ROOT = join(HARNESS_ROOT, 'agents', 'governance')

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

function discoverAgents(): string[] {
  if (!existsSync(AGENTS_ROOT)) return []
  return readdirSync(AGENTS_ROOT)
    .filter((f) => f.endsWith('.md'))
    .sort()
}

function hasAgentsTable(kiConfigText: string): boolean {
  return /^\[ki-agents\][ \t]*$/m.test(kiConfigText)
}

function expectedSet(available: string[], kiConfigText: string): string[] {
  return hasAgentsTable(kiConfigText) ? available : []
}

// ── Link (mutate) ──
function cmdLink(target: string, set: string[], dryRun: boolean): void {
  const claudeAgents = join(target, '.claude', 'agents')
  if (!existsSync(claudeAgents) && set.length > 0) {
    console.log(`${DIM}creating ${claudeAgents}${RESET}`)
    if (!dryRun) mkdirSync(claudeAgents, { recursive: true })
  }

  for (const agent of set) {
    const source = join(AGENTS_ROOT, agent)
    const linkPath = join(claudeAgents, agent)
    const rel = relative(claudeAgents, source)
    if (isSymlink(linkPath) && resolve(dirname(linkPath), readlinkSync(linkPath)) === resolve(source)) {
      console.log(`${DIM}ok    ${agent}${RESET}`)
      continue
    }
    if (existsSync(linkPath) && !isSymlink(linkPath)) {
      console.log(`${YELLOW}skip  ${agent}${RESET} ${DIM}(a real file is in the way)${RESET}`)
      continue
    }
    if (!dryRun) {
      if (isSymlink(linkPath)) rmSync(linkPath)
      symlinkSync(rel, linkPath, 'file')
    }
    console.log(`${GREEN}link  ${RESET}${agent} -> ${DIM}${rel}${RESET}`)
  }

  // Prune symlinks no longer declared (agents table dropped, or an agent removed upstream),
  // plus any dangling symlink regardless of name.
  if (existsSync(claudeAgents)) {
    for (const name of readdirSync(claudeAgents)) {
      const p = join(claudeAgents, name)
      if (!isSymlink(p)) continue
      const dangling = !existsSync(p)
      if (!dangling && set.includes(name)) continue
      const reason = dangling ? 'dangling target' : 'no longer declared'
      console.log(`${YELLOW}prune ${RESET}${name} ${DIM}(${reason})${RESET}`)
      if (!dryRun) rmSync(p)
    }
  }

  if (set.length > 0) ensureScript(target, 'ki:agents:link:project', 'bun .claude/skills/ki-bootstrap/scripts/link-agents.ts .', dryRun)
}

// ── Check (audit only) ──
function cmdCheck(target: string, set: string[]): number {
  const findings: Finding[] = []
  const claudeAgents = join(target, '.claude', 'agents')

  const present = existsSync(claudeAgents) ? readdirSync(claudeAgents).filter((n) => isSymlink(join(claudeAgents, n))) : []
  const missing = set.filter((a) => !present.includes(a))
  const extra = present.filter((p) => !set.includes(p))
  const broken = present.filter((p) => !existsSync(join(claudeAgents, p)))
  if (missing.length === 0 && extra.length === 0 && broken.length === 0) {
    findings.push({
      severity: 'PASS',
      criterion: 'BOOT-6',
      message: `.claude/agents matches declared set (${set.length} agent${set.length === 1 ? '' : 's'})`
    })
  } else {
    if (missing.length)
      findings.push({
        severity: 'WARN',
        criterion: 'BOOT-6',
        message: `missing links: ${missing.join(', ')} — run \`ki:agents:link:project\``
      })
    if (extra.length) findings.push({ severity: 'WARN', criterion: 'BOOT-6', message: `links not in declared set: ${extra.join(', ')}` })
    if (broken.length)
      findings.push({ severity: 'WARN', criterion: 'BOOT-6', message: `dangling links (harness not reachable): ${broken.join(', ')}` })
  }

  if (set.length > 0) {
    const pkgText = readText(join(target, 'package.json'))
    findings.push(
      hasScript(pkgText, 'ki:agents:link:project')
        ? { severity: 'PASS', criterion: 'BOOT-7', message: 'package.json has a ki:agents:link:project script' }
        : {
            severity: 'WARN',
            criterion: 'BOOT-7',
            message: 'no ki:agents:link:project script in package.json — links are not reproducible on clone'
          }
    )
  }

  findings.push(
    gitignoresPath(readText(join(target, '.gitignore')), '.claude/agents')
      ? { severity: 'PASS', criterion: 'BOOT-8', message: '.claude/agents/ is gitignored' }
      : { severity: 'WARN', criterion: 'BOOT-8', message: '.claude/agents/ is not gitignored — generated links would be committed' }
  )

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
const dryRun = argv.includes('--dry-run')
const checkOnly = argv.includes('--check')
const target = resolve(argv.find((a) => !a.startsWith('-')) ?? '.')

const available = discoverAgents()
const set = expectedSet(available, readText(join(target, '.ki-config.toml')))
const setLabel = set.length > 0 ? 'declared ([ki-agents] present)' : 'none ([ki-agents] absent)'
console.log(
  `\n  ${DIM}target:${RESET} ${target}   ${DIM}agents source:${RESET} ${AGENTS_ROOT}   ${DIM}set:${RESET} ${setLabel} (${set.length})\n`
)

if (checkOnly) {
  process.exit(cmdCheck(target, set))
}
cmdLink(target, set, dryRun)
if (dryRun) console.log(`\n  ${YELLOW}(dry run — nothing changed)${RESET}`)
