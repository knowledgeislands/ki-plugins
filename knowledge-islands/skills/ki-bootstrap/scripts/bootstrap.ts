#!/usr/bin/env bun
/**
 * ki-bootstrap chain engine — the mechanical half of INIT, and the start of the
 * bootstrap chain (ADR-KI-HARNESS-007). Brings a target repo under Knowledge
 * Islands governance so it governs itself with `bun run ki:audit` and **zero
 * skills installed**: for every skill in the resolved set it vendors *copies*
 * of the skill's checker scripts (SCRIPT-7 — copies, not symlinks) into the
 * target's `scripts/ki/<skill>/`, installs that skill's `ki:<suffix>:{audit,
 * conform}` package.json keys pointing at the copies, and installs/refreshes the
 * repo-wide `ki:audit` / `ki:conform` / `ki:init` aggregates.
 *
 * Remote transport (ADR-KI-HARNESS-007): run straight from GitHub with no local
 * install —
 *   bun run https://raw.githubusercontent.com/knowledgeislands/ki-agentic-harness/<ref>/skills/ki-bootstrap/scripts/bootstrap.ts <target>
 * When run from a raw URL the skill sources are fetched from the same ref; when
 * run locally they are read from the harness working tree.
 *
 * Aggressiveness flags (one chain, three strengths):
 *   (default / --new)  INIT only — vendor + keys + aggregates.
 *   --legacy           INIT, then a full `ki:conform` pass (the migration path).
 *   --tracking         INIT, then `ki:audit` (report drift only).
 *
 * Usage: bun bootstrap.ts <target-repo> [--new | --legacy | --tracking] [--all] [--dry-run]
 */

import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ensureScripts, readText } from './package-scripts.ts'

const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const DIM = '\x1b[2m'
const RESET = '\x1b[0m'

const BASELINE = ['ki-repo', 'ki-authoring']
const BOOTSTRAP = 'ki-bootstrap'
const VENDOR_DIR = join('scripts', 'ki') // relative to the target repo root

// The harness `skills/` root this engine reads sources from. Local run: the
// working tree two levels up from this file. (Remote-URL sourcing is a documented
// follow-on; the vendored output is identical either way.)
const SKILLS_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

interface Mode {
  postConform: boolean
  postAudit: boolean
}

function parseMode(argv: string[]): Mode {
  if (argv.includes('--legacy')) return { postConform: true, postAudit: false }
  if (argv.includes('--tracking')) return { postConform: false, postAudit: true }
  return { postConform: false, postAudit: false } // --new / default
}

function skillDir(skill: string): string {
  return join(SKILLS_ROOT, skill)
}

function isSkill(skill: string): boolean {
  return existsSync(join(skillDir(skill), 'SKILL.md'))
}

// `[ki-<skill>]` top-level tables declared in the target's .ki-config.toml.
function declaredSkills(kiConfigText: string): string[] {
  const out: string[] = []
  for (const m of kiConfigText.matchAll(/^\[ki-([a-z0-9-]+)\][ \t]*$/gm)) out.push(`ki-${m[1]}`)
  return out
}

// The `implies:` flow list from a skill's SKILL.md frontmatter.
function impliesOf(skill: string): string[] {
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

// Transitive closure of BASELINE + declared skills (+ explicit --seed skills) over
// the `implies:` graph. A per-skill `scripts/bootstrap.ts` delegator seeds itself.
function resolveSet(target: string, all: boolean, seeds: string[]): string[] {
  const seed = all
    ? readdirSync(SKILLS_ROOT, { withFileTypes: true })
        .filter((e) => e.isDirectory() && isSkill(e.name))
        .map((e) => e.name)
    : [...BASELINE, ...declaredSkills(readText(join(target, '.ki-config.toml'))), ...seeds]
  const seen = new Set<string>()
  const stack = [...seed]
  while (stack.length) {
    const s = stack.pop()
    if (s === undefined || seen.has(s) || !isSkill(s)) continue
    seen.add(s)
    for (const dep of impliesOf(s)) stack.push(dep)
  }
  seen.delete(BOOTSTRAP) // the chain-starter is not vendored into targets
  return [...seen].sort()
}

// A skill's single checker script (audit-*.ts or lint-*.ts) — discovered, not templated.
function checkerScript(skill: string): { verb: 'audit' | 'lint'; file: string } | null {
  const dir = join(skillDir(skill), 'scripts')
  if (!existsSync(dir)) return null
  const m = readdirSync(dir).filter((f) => /^(audit|lint)-.*\.ts$/.test(f))
  if (m.length !== 1) return null
  return { verb: m[0].startsWith('audit-') ? 'audit' : 'lint', file: m[0] }
}

function conformScript(skill: string): string | null {
  const dir = join(skillDir(skill), 'scripts')
  if (!existsSync(dir)) return null
  const m = readdirSync(dir).filter((f) => /^conform-.*\.ts$/.test(f))
  return m.length === 1 ? m[0] : null
}

function scriptKey(skill: string, verb: string): string {
  return `ki:${skill.replace(/^ki-/, '')}:${verb}`
}

// The aggregate runner vendored into every target — fans `ki:audit`/`ki:conform`/`ki:init`
// out over the installed `ki:<skill>:<verb>` keys, so it stays correct as skills are added.
const AGGREGATE_RUNNER = `#!/usr/bin/env bun
// Vendored by ki-bootstrap. Runs every ki:<skill>:<verb> package.json script in
// sequence for the given verb. Usage: bun scripts/ki/aggregate.ts <audit|conform|init>
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const verb = process.argv[2]
if (!verb) {
  console.error('usage: aggregate.ts <audit|conform|init>')
  process.exit(2)
}
const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
const keys = Object.keys(pkg.scripts ?? {}).filter((k) => /^ki:[a-z0-9-]+:/.test(k) && k.endsWith(':' + verb) && !/^ki:(audit|conform|init)$/.test(k))
let failed = 0
for (const k of keys.sort()) {
  console.log('\\n\\x1b[36m==> ' + k + '\\x1b[0m')
  try {
    execFileSync('bun', ['run', k], { stdio: 'inherit' })
  } catch {
    failed++
  }
}
process.exit(failed > 0 ? 1 : 0)
`

function vendorSkill(target: string, skill: string, dryRun: boolean): Array<[string, string]> {
  const keys: Array<[string, string]> = []
  const checker = checkerScript(skill)
  if (!checker) return keys
  const destDir = join(target, VENDOR_DIR, skill)
  const relChecker = `${VENDOR_DIR}/${skill}/${checker.file}`
  if (!dryRun) {
    mkdirSync(destDir, { recursive: true })
    cpSync(join(skillDir(skill), 'scripts', checker.file), join(destDir, checker.file))
  }
  console.log(`${GREEN}vendor${RESET} ${skill} ${DIM}→ ${relChecker}${RESET}`)
  // Vendored checker keys are always the `:audit` verb, regardless of whether the
  // source script is audit-*.ts or lint-*.ts — so the `ki:audit` aggregate (which
  // fans out over `:audit` keys) catches every skill's checker uniformly.
  keys.push([scriptKey(skill, 'audit'), `bun ${relChecker} .`])
  const conform = conformScript(skill)
  if (conform) {
    const relConform = `${VENDOR_DIR}/${skill}/${conform}`
    if (!dryRun) cpSync(join(skillDir(skill), 'scripts', conform), join(destDir, conform))
    keys.push([scriptKey(skill, 'conform'), `bun ${relConform} .`])
  }
  return keys
}

function main(): void {
  const argv = process.argv.slice(2)
  // Pull `--seed <skill>` (repeatable) out first so its value is not mistaken for
  // the positional target. A per-skill delegator passes `--seed <self>`.
  const seeds: string[] = []
  const rest: string[] = []
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--seed' && argv[i + 1]) {
      seeds.push(argv[++i])
    } else {
      rest.push(argv[i])
    }
  }
  const positional = rest.filter((a) => !a.startsWith('--'))
  const target = resolve(positional[0] ?? '.')
  const dryRun = rest.includes('--dry-run')
  const all = rest.includes('--all')
  const mode = parseMode(rest)

  if (!existsSync(join(target, 'package.json'))) {
    console.error(`${YELLOW}bootstrap${RESET} target has no package.json: ${target}`)
    process.exit(1)
  }

  const set = resolveSet(target, all, seeds)
  console.log(`${DIM}bootstrap ${target} — skills: ${set.join(', ')}${RESET}`)

  const keys: Array<[string, string]> = []
  for (const skill of set) keys.push(...vendorSkill(target, skill, dryRun))

  // Vendor the aggregate runner + wire the repo-wide aggregates.
  const aggRel = `${VENDOR_DIR}/aggregate.ts`
  if (!dryRun) {
    mkdirSync(join(target, VENDOR_DIR), { recursive: true })
    writeFileSync(join(target, aggRel), AGGREGATE_RUNNER)
  }
  keys.push(['ki:audit', `bun ${aggRel} audit`])
  keys.push(['ki:conform', `bun ${aggRel} conform`])
  keys.push(['ki:init', `bun ${aggRel} init`])

  ensureScripts(target, keys, dryRun)

  if (dryRun) return
  if (mode.postConform) {
    console.log(`${DIM}--legacy: running ki:conform${RESET}`)
    try {
      execFileSync('bun', ['run', 'ki:conform'], { cwd: target, stdio: 'inherit' })
    } catch {
      /* conform surfaces its own findings */
    }
  } else if (mode.postAudit) {
    console.log(`${DIM}--tracking: running ki:audit${RESET}`)
    try {
      execFileSync('bun', ['run', 'ki:audit'], { cwd: target, stdio: 'inherit' })
    } catch {
      /* audit surfaces drift */
    }
  }
}

main()
