#!/usr/bin/env bun
// Sync this repo's skills into a Claude skills directory by symlink.
//
// A "skill" is any directory under skills/ that contains a SKILL.md.
// Symlinking (rather than copying) keeps installed skills live: editing here,
// or `git pull`, updates every consumer at once.
//
// Usage:
//   bun sync-skills.ts <command> [--runtime <name>] [--target <dir>] [--root <dir>] [--dry-run]
//
// Canonical home is skills/keystone/ki-bootstrap/scripts/; it is also vendored into a
// governed harness-shaped target's .ki-meta/bin/. It resolves the skills tree
// from the current working directory (repo root), not relative to its own file,
// so the same copy works from either location (ADR-KI-HARNESS-008).
//
// Commands:
//   link      Create/refresh a symlink for every skill in the target dir
//   unlink    Remove only the symlinks that point back into this repo
//   status    Show each skill and its link state in the target dir
//
// Options:
//   --runtime <name> Target one runtime's install dir: claude-code → ~/.claude/skills,
//                    codex → ~/.agents/skills. Without it, loops every runtime the
//                    repo declares (--root's .ki-config.toml [ki-repo] target_runtimes,
//                    default ["claude-code"]) — one pass per runtime, each with its own
//                    `[<runtime>]` header.
//   --target <dir>   Where to install (overrides runtime resolution — a single pinned
//                    directory, no loop)
//   --root <dir>     Repo root holding skills/ (default: current working directory)
//   --relative       Emit relative symlinks (portable: survives a clone when the
//                    target and this repo keep their relative layout). Default is
//                    absolute, for a machine-local global install.
//   --only <a,b,c>   Act on just these skills (comma-separated names) instead of all
//                    — e.g. to scope a repo's .claude/skills to the skills it uses.
//   --dry-run        Print what would change without touching the filesystem

import { existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, readlinkSync, rmSync, symlinkSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'

// --- arg parsing -----------------------------------------------------------
const argv = process.argv.slice(2)
const command = argv.find((a) => !a.startsWith('-'))
const dryRun = argv.includes('--dry-run')
const useRelative = argv.includes('--relative')
// Resolve the skills tree from the repo root — the cwd by default (package.json
// keys and the vendored .ki-meta/bin wrapper both run at root), or an explicit
// --root. Never file-relative: a vendored copy under .ki-meta/bin must still find
// the target's skills/ (ADR-KI-HARNESS-008).
const rootFlag = argv.indexOf('--root')
const repoRoot = rootFlag !== -1 && argv[rootFlag + 1] ? resolve(argv[rootFlag + 1] as string) : process.cwd()
const skillsRoot = join(repoRoot, 'skills')
const onlyFlag = argv.indexOf('--only')
const onlyNames =
  onlyFlag !== -1 && argv[onlyFlag + 1]
    ? (argv[onlyFlag + 1] as string)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : null
// Per-runtime default install dir under $HOME. --runtime picks the discovery path
// (Claude Code → .claude/skills, Codex → .agents/skills); default preserves the
// historical ~/.claude/skills. An explicit --target always overrides. Inlined (not
// imported) so the vendored .ki-meta/bin copy stays self-contained.
const RUNTIME_SKILLS_SUBDIR: Record<string, string> = {
  'claude-code': join('.claude', 'skills'),
  codex: join('.agents', 'skills')
}
const runtimeFlag = argv.indexOf('--runtime')
const explicitRuntime = runtimeFlag !== -1 && argv[runtimeFlag + 1] ? (argv[runtimeFlag + 1] as string) : null
const targetFlag = argv.indexOf('--target')
const explicitTarget = targetFlag !== -1 && argv[targetFlag + 1] ? resolve(argv[targetFlag + 1] as string) : null

// Runtimes to operate over, resolved in precedence order: an explicit --runtime always
// wins (the override, single runtime); else an explicit --target runs once, standalone
// (the directory is already pinned — no runtime loop needed); else the repo's declared
// `target_runtimes` (`.ki-config.toml` [ki-repo]), defaulting to ["claude-code"] so a
// repo predating multi-runtime support is unchanged. Regex mirrors package-scripts.ts's
// targetRuntimes — inlined (not imported) so the vendored .ki-meta/bin copy stays
// self-contained.
function declaredTargetRuntimes(): string[] {
  const cfgPath = join(repoRoot, '.ki-config.toml')
  const text = existsSync(cfgPath) ? readFileSync(cfgPath, 'utf8') : ''
  const m = text.match(/^target_runtimes\s*=\s*\[([^\]]*)\]/m)
  if (!m) return ['claude-code']
  const list = [...(m[1] as string).matchAll(/["']([^"']+)["']/g)].map((x) => x[1] as string)
  return list.length ? list : ['claude-code']
}
const runtimes = explicitRuntime ? [explicitRuntime] : explicitTarget ? [] : declaredTargetRuntimes()
for (const rt of runtimes) {
  if (!RUNTIME_SKILLS_SUBDIR[rt]) {
    console.error(`unknown target runtime "${rt}" (expected one of: ${Object.keys(RUNTIME_SKILLS_SUBDIR).join(', ')})`)
    process.exit(1)
  }
}
let target = explicitTarget ?? join(homedir(), RUNTIME_SKILLS_SUBDIR[runtimes[0] as string] as string)

const C = { reset: '\x1b[0m', dim: '\x1b[2m', green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m', cyan: '\x1b[36m' }
const paint = (c: string, s: string): string => `${c}${s}${C.reset}`

type LinkState =
  | { kind: 'absent' }
  | { kind: 'occupied' }
  | { kind: 'linked'; dest: string }
  | { kind: 'linked-other-here'; dest: string }
  | { kind: 'linked-elsewhere'; dest: string }

// --- discovery -------------------------------------------------------------
// Skills live one or two levels under skillsRoot — either flat (skills/<name>,
// tolerated as a migration leftover) or clustered (skills/<cluster>/<name>).
// Memoized so every by-name source lookup below stays O(1) after the first call.
let skillIndexCache: Map<string, string> | null = null
function skillIndex(): Map<string, string> {
  if (skillIndexCache) return skillIndexCache
  const idx = new Map<string, string>()
  if (existsSync(skillsRoot)) {
    for (const entry of readdirSync(skillsRoot, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) continue
      const clusterDir = join(skillsRoot, entry.name)
      if (existsSync(join(clusterDir, 'SKILL.md'))) {
        idx.set(entry.name, clusterDir)
        continue
      }
      for (const sub of readdirSync(clusterDir, { withFileTypes: true })) {
        if (!sub.isDirectory()) continue
        const skillPath = join(clusterDir, sub.name)
        if (existsSync(join(skillPath, 'SKILL.md'))) idx.set(sub.name, skillPath)
      }
    }
  }
  skillIndexCache = idx
  return idx
}

function discoverSkills(): string[] {
  return [...skillIndex().keys()].sort()
}

function isSymlink(p: string): boolean {
  try {
    return lstatSync(p).isSymbolicLink()
  } catch {
    return false
  }
}

// Returns the link state of `linkPath` relative to the repo's expected source.
function linkState(linkPath: string, expectedSource: string): LinkState {
  if (!existsSync(linkPath) && !isSymlink(linkPath)) return { kind: 'absent' }
  if (!isSymlink(linkPath)) return { kind: 'occupied' } // a real file/dir is in the way
  const dest = resolve(dirname(linkPath), readlinkSync(linkPath))
  if (dest === expectedSource) return { kind: 'linked', dest }
  if (dest.startsWith(`${skillsRoot}/`)) return { kind: 'linked-other-here', dest }
  return { kind: 'linked-elsewhere', dest }
}

// --- commands --------------------------------------------------------------
function cmdLink(skills: string[]): void {
  if (!existsSync(target)) {
    console.log(paint(C.dim, `creating ${target}`))
    if (!dryRun) mkdirSync(target, { recursive: true })
  }
  for (const name of skills) {
    const source = skillIndex().get(name) ?? join(skillsRoot, name)
    const linkPath = join(target, name)
    const state = linkState(linkPath, source)

    if (state.kind === 'linked') {
      console.log(`${paint(C.dim, 'ok    ')} ${name} ${paint(C.dim, '(already linked)')}`)
      continue
    }
    if (state.kind === 'occupied') {
      console.log(`${paint(C.red, 'skip  ')} ${name} ${paint(C.red, '(a real file/dir exists at target — remove it manually)')}`)
      continue
    }
    // absent, or a symlink pointing somewhere else: (re)create it.
    if (isSymlink(linkPath) && !dryRun) rmSync(linkPath)
    const linkText = useRelative ? relative(dirname(linkPath), source) : source
    if (!dryRun) symlinkSync(linkText, linkPath, 'dir')
    const verb = state.kind.startsWith('linked') ? 'relink' : 'link  '
    console.log(`${paint(C.green, verb)} ${name} -> ${paint(C.dim, linkText)}`)
  }
  if (dryRun) console.log(paint(C.yellow, '\n(dry run — nothing changed)'))
}

function cmdUnlink(skills: string[]): void {
  for (const name of skills) {
    const source = skillIndex().get(name) ?? join(skillsRoot, name)
    const linkPath = join(target, name)
    const state = linkState(linkPath, source)
    if (state.kind === 'linked' || state.kind === 'linked-other-here') {
      if (!dryRun) rmSync(linkPath)
      console.log(`${paint(C.green, 'unlink')} ${name}`)
    } else if (state.kind === 'occupied') {
      console.log(`${paint(C.yellow, 'skip  ')} ${name} ${paint(C.dim, '(not a symlink — left untouched)')}`)
    } else {
      console.log(`${paint(C.dim, 'absent')} ${name}`)
    }
  }
  if (dryRun) console.log(paint(C.yellow, '\n(dry run — nothing changed)'))
}

function cmdStatus(skills: string[]): void {
  console.log(paint(C.cyan, `target: ${target}\n`))
  for (const name of skills) {
    const source = skillIndex().get(name) ?? join(skillsRoot, name)
    const state = linkState(join(target, name), source)
    const dest = 'dest' in state ? state.dest : ''
    const label = {
      linked: paint(C.green, 'linked'),
      'linked-other-here': paint(C.yellow, 'linked → different skill in this repo'),
      'linked-elsewhere': paint(C.yellow, `linked → elsewhere (${dest})`),
      occupied: paint(C.red, 'occupied by a real file/dir'),
      absent: paint(C.dim, 'not installed')
    }[state.kind]
    console.log(`  ${name.padEnd(28)} ${label}`)
  }
}

// --- main ------------------------------------------------------------------
const allSkills = discoverSkills()
if (allSkills.length === 0) {
  console.error(paint(C.red, 'No skills found (no directory under skills/ contains a SKILL.md).'))
  process.exit(1)
}
if (onlyNames) {
  const unknown = onlyNames.filter((n) => !allSkills.includes(n))
  if (unknown.length) {
    console.error(paint(C.red, `--only names not found under skills/: ${unknown.join(', ')}`))
    process.exit(1)
  }
}
const skills = onlyNames ? allSkills.filter((n) => onlyNames.includes(n)) : allSkills

function dispatch(): void {
  switch (command) {
    case 'link':
      cmdLink(skills)
      break
    case 'unlink':
      cmdUnlink(skills)
      break
    case undefined:
    case 'status':
      cmdStatus(skills)
      break
    default:
      console.error(paint(C.red, `Unknown command: ${command}`))
      console.error('Usage: bun sync-skills.ts <link|unlink|status> [--runtime <name>] [--target <dir>] [--root <dir>] [--dry-run]')
      process.exit(1)
  }
}

// An explicit --target pins a single directory — run once, no runtime loop. Otherwise
// loop the resolved runtimes (one, from --runtime; or the declared set), printing a
// `[<runtime>]` group header per iteration (mirrors link-skills.ts's project-linker loop).
if (explicitTarget) {
  dispatch()
} else {
  for (const rt of runtimes) {
    target = join(homedir(), RUNTIME_SKILLS_SUBDIR[rt] as string)
    console.log(paint(C.cyan, `[${rt}]`))
    dispatch()
  }
}
