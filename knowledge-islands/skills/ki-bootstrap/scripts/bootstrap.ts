#!/usr/bin/env bun
/**
 * ki-bootstrap chain engine — the mechanical half of EDUCATE, and the start of the
 * bootstrap chain (ADR-KI-HARNESS-006). Brings a target repo under Knowledge
 * Islands governance so it governs itself with `./.ki-meta/bin/ki-audit` and
 * **zero skills installed** — and with **no `package.json` of its own** (dotfiles,
 * KB, tap): for every skill in the resolved set it reads the skill's declared
 * `vendors:` unit(s) (SKILL.md frontmatter — `resolve.ts#vendorUnit`; falls back to
 * filename-convention discovery with a WARN if undeclared) and vendors either a
 * *copy* of the checker file (SCRIPT-7 — copies, not symlinks) or a generated thin
 * command-wrapper into the target's `.ki-meta/skills/<skill>/` (named by verb:
 * `audit.ts`/`conform.ts`), plus a rendered HELP snapshot (`help.md`). It then writes
 * a `.ki-meta/bin/aggregate.ts` that discovers and fans out over those copies, the
 * four `package.json`-free entry points `.ki-meta/bin/{ki-audit, ki-conform, ki-educate,
 * ki-help}`, and stamps `.ki-meta/manifest.json` (harness ref + per-file hashes) so
 * `ki-educate` can re-run this chain at the same ref later.
 *
 * Remote transport (ADR-KI-HARNESS-006): the sibling `bootstrap.sh` is the
 * zero-install `curl | sh` entry point — cd into the repo and pipe it to sh; it
 * fetches the source tarball and runs this engine from the extracted tree (Bun
 * cannot execute a module over HTTP, and the POSIX entry point does not assume
 * bun is even installed):
 *   curl -fsSL https://raw.githubusercontent.com/knowledgeislands/ki-agentic-harness/main/skills/keystone/ki-bootstrap/scripts/bootstrap.sh | sh
 * Everything after `sh -s --` ripples through to this engine; bootstrap.sh injects
 * the cwd target and `--ref main` only when absent. Where bun is already installed,
 * the bunx form runs this engine as the package bin directly (pin a sha — bunx
 * caches floating git refs):
 *   bunx github:knowledgeislands/ki-agentic-harness#<sha> <target> --ref <sha>
 * The vendored `.ki-meta/bin/ki-educate` wrapper pipes the same script at `main` by
 * default (or the `--ref` passed). Skill sources are always read from the engine's
 * own working tree; `--ref` supplies the ref when that tree has no `.git` (a tarball
 * extract), and the engine resolves it to a concrete SHA before recording it in the
 * manifest.
 *
 * Bootstrap's one job is to build `.ki-meta/` — vendor each resolved skill's
 * mechanical unit + HELP snapshot, write the `bin/` wrappers, stamp the manifest.
 * It never touches `package.json` (the `ki:*` convenience keys are ki-engineering's
 * to wire, as sugar over these bins). Re-running it is the single idempotent way to
 * bring a target up to date — no separate legacy/tracking modes.
 *
 * Harness-shaped targets only: when the resolved set includes `ki-harness` (the
 * target authors and operates its own skills/ tree), the engine additionally
 * vendors the three cross-skill operational scripts (skill-graph, skill-help,
 * sync-skills) into `.ki-meta/bin/`, each manifest-hashed like every other vendored
 * file. These are engine-level, not per-skill `vendors:` units — the same class as
 * the aggregate runner and bin wrappers (ADR-KI-HARNESS-008). A non-harness repo
 * has no skills/ tree to operate on and never receives them.
 *
 * Usage: bun bootstrap.ts <target-repo> [--seed <skill>] [--ref <ref>] [--dry-run]
 */

import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  chmodSync,
  closeSync,
  cpSync,
  fstatSync,
  fsyncSync,
  linkSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  readdirSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmdirSync,
  rmSync,
  unlinkSync,
  writeFileSync
} from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { resolveSet, SKILLS_ROOT, SkillResolutionError, skillDir, vendorModesOf, vendorUnit } from './resolve.ts'

const GREEN = '\x1b[32m'
const DIM = '\x1b[2m'
const RESET = '\x1b[0m'

const VENDOR_DIR = '.ki-meta' // relative to the target repo root (dot-prefixed, generated-not-authored)
const REPO_SLUG = 'knowledgeislands/ki-agentic-harness'

// Cross-skill operational scripts a harness-shaped target needs to run its own
// skills/ tree: validate/render the `implies:` graph, render HELP, install skills.
// Vendored into .ki-meta/bin/ ONLY when the resolved set includes ki-harness —
// engine-level, not per-skill `vendors:` units (ADR-KI-HARNESS-008). Their
// canonical home is skills/keystone/ki-bootstrap/scripts/.
const HARNESS_BIN_SCRIPTS = ['skill-graph.ts', 'skill-help.ts', 'sync-skills.ts'] as const

// The current harness ref — recorded in the manifest so `ki-educate` can re-run the
// chain at the same point later. Falls back to 'unknown' when not in a git
// checkout (e.g. fetched over HTTP without a .git dir) — offline-safe, never fatal.
function harnessRef(): string {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: SKILLS_ROOT_FOR_REF,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'] // no stderr noise from a .git-less tarball/bunx extract
    }).trim()
  } catch {
    return 'unknown'
  }
}
const SKILLS_ROOT_FOR_REF = resolve(import.meta.dirname, '..', '..', '..', '..')

// Resolve a possibly-symbolic ref (a branch like `main`, a tag, a short SHA) to the
// concrete 40-hex commit SHA, so the manifest always records an immutable point even
// when the chain was invoked with `--ref main`. This is the record/policy split:
// `ki-educate` defaults its *policy* to the moving `main` (always fetch latest), while the
// manifest keeps an exact *record* of what was actually applied. Best-effort: a full
// SHA passes through untouched, and any failure (git absent, offline) falls back to the
// ref as given — offline-safe, never fatal, matching harnessRef().
function resolveRef(ref: string): string {
  if (/^[0-9a-f]{40}$/.test(ref) || ref === 'unknown') return ref
  try {
    const out = execFileSync('git', ['ls-remote', `https://github.com/${REPO_SLUG}.git`, ref], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim()
    const sha = out.split('\n')[0]?.split('\t')[0]?.trim()
    return sha && /^[0-9a-f]{40}$/.test(sha) ? sha : ref
  } catch {
    return ref
  }
}

// The aggregate runner vendored into every target — discovers the vendored checkers
// under its sibling `../skills/` dir (an allowlist: only that dir is scanned, so `bin/`
// and the report dirs are never mistaken for skills) and fans out over them for the
// given verb. It reads the filesystem, not `package.json`, so it works in a repo that
// has no `package.json` at all, and stays correct as skills are vendored in or out.
// The `educate` verb is the local re-sync prompt — it execs the sibling `ki-educate`
// wrapper, which re-runs the remote chain at `main` (or a passed `--ref`)
// (ADR-KI-HARNESS-006's Consequences: "EDUCATE vendors nothing per skill... the
// aggregate educate verb is instead the local re-sync prompt").
const AGGREGATE_RUNNER = `#!/usr/bin/env bun
// Vendored by ki-bootstrap. Runs each vendored skill checker under ../skills/ in
// sequence for the given verb — no package.json required.
// Usage: bun .ki-meta/bin/aggregate.ts <audit|conform|educate|help>
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const verb = process.argv[2]
if (!verb) {
  console.error('usage: aggregate.ts <audit|conform|educate|help>')
  process.exit(2)
}
const binDir = dirname(fileURLToPath(import.meta.url))
if (verb === 'educate' || verb === 'help') {
  // educate: the local re-sync prompt (re-run the remote chain at the manifest's ref).
  // help: the vendored HELP snapshots. Both exec the sibling wrapper.
  execFileSync(join(binDir, verb === 'educate' ? 'ki-educate' : 'ki-help'), process.argv.slice(3), { stdio: 'inherit' })
  process.exit(0)
}
if (verb === 'refresh') {
  // REFRESH's write target is always a skill's own canonical files under skills/<name>/
  // in ki-agentic-harness — this vendored runner is by construction never running
  // there, so refresh is always out of scope here. Say so explicitly instead of
  // silently falling through the pattern match below to a bare exit(0).
  console.error(
    '\\x1b[33m⚠️  REFRESH is harness-only\\x1b[0m — it edits only its own canonical\\n' +
      "files, which live in ki-agentic-harness. Run it there, or use ki-kb's\\n" +
      'IMPROVE mode for a pattern recurring across bases.'
  )
  process.exit(3)
}
// Vendored copies are named by verb (audit.ts / conform.ts) — the skill dir already
// carries the identity.
const pattern = verb === 'audit' ? /^(audit|lint)\\.ts$/ : verb === 'conform' ? /^conform\\.ts$/ : null
if (!pattern) process.exit(0)
const skillsDir = join(binDir, '..', 'skills')
if (!existsSync(skillsDir)) process.exit(0)
const skills = readdirSync(skillsDir, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name)
  .sort()

// Unified severity ladder — most audit-*.ts/lint-*.ts checkers normalize findings to
// { level, area, msg } and, under --json, wrap them as
// { concern, target, generatedAt, summary, findings }. A couple of outliers (e.g.
// ki-housekeeping) emit a bare findings array with { id, severity: <0-6>, message }
// instead — SEV_BY_NUM and the field fallbacks below absorb that variant too.
// Every icon must occupy two display columns so the level column aligns. Most are
// Emoji_Presentation=Yes glyphs (genuinely 2 cols everywhere); ⚠️/ℹ️ have narrow base
// chars that VS16 does NOT widen under wcwidth-style terminals (VS Code/xterm.js counts
// them 1 col), so they carry an explicit trailing space to make up the second column.
// NA uses 🚫 (a 2-col circle-slash) in place of the 1-col ⊘.
const ICON = { FAIL: '\\u274c', WARN: '\\u26a0\\ufe0f ', POLISH: '\\u2728', ADVISORY: '\\ud83e\\udded', INFO: '\\u2139\\ufe0f ', NA: '\\ud83d\\udeab', PASS: '\\u2705' }
const SEV_BY_NUM = ['FAIL', 'WARN', 'POLISH', 'ADVISORY', 'INFO', 'NA', 'PASS']
// The recap splits real violations (FAIL/WARN/POLISH — the checker decided a criterion
// is broken) from ADVISORY (always-on judgment reminders the checker cannot decide). A
// genuine failure must never be buried under the unconditional reminders.
const FAILURE_LEVELS = ['FAIL', 'WARN', 'POLISH']
const RECAP_LEVELS = ['FAIL', 'WARN', 'POLISH', 'ADVISORY']
const verbed = verb === 'conform' ? 'conformed' : 'audited'
// Render one finding row: icon status [code] file msg (ref). file/ref shown only when
// the finding carries them (structured fields — most checkers only populate them once
// swept). full=false trims msg to its first line (recap rows stay one-line).
// Fixed-width short level tags (fail/warn/pol/adv/info/na/pass) keep the [code] column
// aligned at a tight 4-wide field — without them "advisory" would force an 8-wide pad.
// Icons are each two display columns (sub-width glyphs ⊘/⚠️/ℹ️ carry a trailing space),
// so [code] lands in a constant column across both body and recap rows.
const SHORT = { FAIL: 'fail', WARN: 'warn', POLISH: 'pol', ADVISORY: 'adv', INFO: 'info', NA: 'na', PASS: 'pass' }
const findingLine = (icon, level, code, file, msg, ref, skill, full) =>
  '  ' + icon + ' ' + (SHORT[level] || level.toLowerCase()).padEnd(4) +
  (skill ? ' ' + skill.padEnd(20) : '') +
  ' \\x1b[2m[' + code + ']\\x1b[0m' +
  (file ? ' \\x1b[36m' + file + '\\x1b[0m' : '') +
  ' ' + (full ? msg : String(msg).split('\\n')[0]) +
  (ref ? ' \\x1b[2m(' + ref + ')\\x1b[0m' : '')
let failed = 0
const recap = []
const unstructured = []
const extraArgs = process.argv.slice(3).filter((a) => a !== '--json')
for (const skill of skills) {
  const dir = join(skillsDir, skill)
  const script = readdirSync(dir).find((f) => pattern.test(f))
  if (!script) continue
  const key = 'ki:' + skill.replace(/^ki-/, '') + ':' + verb
  console.log('\\n\\x1b[36m==> ' + key + '\\x1b[0m')
  const scriptPath = join(dir, script)
  // Both verbs render through the same structured path: run --json, parse the wrapper,
  // render uniform rows, accumulate the recap. A checker (still) without --json support
  // falls back to its native display. For conform this means --json also drives the
  // writes (a conform without --json just runs its normal write pass and streams prose).
  // Flags after the verb (e.g. --dry-run) forward through to every child script —
  // conform's write pass must be skippable aggregate-wide, not just per-skill.
  const res = spawnSync('bun', [scriptPath, '.', ...extraArgs, '--json'], { encoding: 'utf8' })
  let parsed = null
  try {
    parsed = JSON.parse(res.stdout ?? '')
  } catch {
    parsed = null
  }
  const findingsArr = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.findings) ? parsed.findings : null
  if (!findingsArr) {
    // no --json support (or a crash, or a shape we don't recognise) — fall back to
    // this checker's native display.
    process.stdout.write(res.stdout ?? '')
    process.stderr.write(res.stderr ?? '')
    unstructured.push(skill)
  } else {
    const counts = {}
    for (const raw of findingsArr) {
      const level =
        typeof raw.level === 'string'
          ? raw.level.toUpperCase()
          : typeof raw.severity === 'number'
            ? SEV_BY_NUM[raw.severity] ?? 'INFO'
            : typeof raw.severity === 'string'
              ? raw.severity.toUpperCase()
              : 'INFO'
      const area = String(raw.area ?? raw.criterion ?? raw.check ?? raw.id ?? '?')
      const msg = String(raw.msg ?? raw.message ?? '')
      const ref = raw.ref ? String(raw.ref) : ''
      const file = raw.file ? String(raw.file) : ''
      const icon = ICON[level] ?? ''
      console.log(findingLine(icon, level, area, file, msg, ref, '', true))
      counts[level] = (counts[level] ?? 0) + 1
      if (RECAP_LEVELS.includes(level)) recap.push({ skill, level, code: area, msg, ref, file })
    }
    const wrapperSummary = !Array.isArray(parsed) ? parsed?.summary : null
    const s = wrapperSummary ?? {
      fail: counts.FAIL ?? 0,
      warn: counts.WARN ?? 0,
      polish: counts.POLISH ?? 0,
      pass: counts.PASS ?? 0,
      advisory: counts.ADVISORY ?? 0,
      na: counts.NA ?? 0
    }
    // Icon prefixes the label; the KEY=n tokens stay byte-identical so CHK-005 parses.
    const sicon = (s.fail ?? 0) ? ICON.FAIL : (s.warn ?? 0) ? ICON.WARN : (s.polish ?? 0) ? ICON.POLISH : (s.advisory ?? 0) ? ICON.ADVISORY : ICON.PASS
    console.log(
      '  ' + sicon + ' \\x1b[2msummary: FAIL=' +
        (s.fail ?? 0) +
        ' WARN=' +
        (s.warn ?? 0) +
        ' POLISH=' +
        (s.polish ?? 0) +
        ' PASS=' +
        (s.pass ?? 0) +
        ' ADVISORY=' +
        (s.advisory ?? 0) +
        ' NA=' +
        (s.na ?? 0) +
        '\\x1b[0m'
    )
  }
  if ((res.status ?? 0) !== 0) failed++
}
console.log('\\n\\x1b[36m==> recap\\x1b[0m')
const fails = recap.filter((r) => FAILURE_LEVELS.includes(r.level))
const reminders = recap.filter((r) => r.level === 'ADVISORY')
if (fails.length === 0) {
  console.log('  \\x1b[32m\\u2705 no FAIL / WARN / POLISH across ' + verbed + ' skills\\x1b[0m')
} else {
  console.log('  \\x1b[1mfailures & warnings\\x1b[0m')
  for (const level of FAILURE_LEVELS)
    for (const h of fails.filter((r) => r.level === level))
      console.log(findingLine(ICON[level], level, h.code, h.file, h.msg, h.ref, h.skill, false))
}
if (reminders.length) {
  console.log('  \\x1b[1mjudgment reminders (always on — read & assess)\\x1b[0m')
  for (const h of reminders) console.log(findingLine(ICON.ADVISORY, 'ADVISORY', h.code, h.file, h.msg, h.ref, h.skill, false))
}
const count = (l) => recap.filter((r) => r.level === l).length
const ticon = count('FAIL') ? ICON.FAIL : count('WARN') ? ICON.WARN : count('POLISH') ? ICON.POLISH : ICON.PASS
console.log(
  '  ' + ticon + ' \\x1b[2mtotals: FAIL=' + count('FAIL') + ' WARN=' + count('WARN') + ' POLISH=' + count('POLISH') + ' ADVISORY=' + count('ADVISORY') + '\\x1b[0m'
)
if (unstructured.length) {
  console.log('  \\x1b[2m(no structured output — see native output above for: ' + unstructured.join(', ') + ')\\x1b[0m')
}
process.exit(failed > 0 ? 1 : 0)
`

// The package.json-free entry point vendored into every target: a tiny wrapper that
// cd's to the repo root and runs the vendored aggregate. It lives under .ki-meta/bin/ so
// the whole generated surface is dot-prefixed — off the repo's own bin/ and auto-ignored
// by dotfile managers (chezmoi). Usage: ./.ki-meta/bin/ki-audit [verb].
const BIN_KI_AUDIT = `#!/bin/sh
# Vendored by ki-bootstrap — the package.json-free entry to a repo's self-check.
# Usage: ./.ki-meta/bin/ki-audit [audit|conform|educate|help] [--dry-run ...]   (default verb: audit)
set -eu
case "\${1:-}" in
  -h|--help)
    echo "usage: ki-audit [audit|conform|educate|help] [--dry-run ...]   (default verb: audit)"
    echo "  runs each vendored skill checker under .ki-meta/skills/ for the given verb."
    echo "  audit    read-only self-check (the default verb)"
    echo "  conform  apply the mechanical fixes (same as ./.ki-meta/bin/ki-conform)"
    echo "  educate     re-sync the vendored scripts from the harness (same as ./.ki-meta/bin/ki-educate)"
    echo "  help     list governed skills, or show one skill's HELP (same as ./.ki-meta/bin/ki-help)"
    exit 0
    ;;
esac
root="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$root"
verb="\${1:-audit}"
[ $# -gt 0 ] && shift
exec bun ".ki-meta/bin/aggregate.ts" "$verb" "$@"
`

// The conform twin — same runner, verb pinned, so the write pass is a first-class
// entry beside ki-audit rather than an argument to it. Flags (e.g. --dry-run) still
// forward through — the verb is pinned, not the whole argument list.
const BIN_KI_CONFORM = `#!/bin/sh
# Vendored by ki-bootstrap — apply the mechanical fixes across the vendored set.
# Usage: ./.ki-meta/bin/ki-conform [--dry-run]
set -eu
case "\${1:-}" in
  -h|--help)
    echo "usage: ki-conform [--dry-run]"
    echo "  applies each vendored skill's mechanical fixes across .ki-meta/skills/."
    echo "  --dry-run  report what would change without writing."
    exit 0
    ;;
esac
root="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$root"
exec bun ".ki-meta/bin/aggregate.ts" conform "$@"
`

// The vendored HELP surface: pure POSIX shell over the per-skill help.md snapshots
// the engine renders at vendor time — readable even on a machine without bun.
const BIN_KI_HELP = `#!/bin/sh
# Vendored by ki-bootstrap — each governed skill's HELP block, rendered from its
# SKILL.md at vendor time (re-synced by ki-educate).
# Usage: ./.ki-meta/bin/ki-help [skill]    (no argument: list the governed skills)
set -eu
meta="$(cd "$(dirname "$0")/.." && pwd)"
if [ $# -eq 0 ]; then
  echo "governed skills (./.ki-meta/bin/ki-help <skill>):"
  for d in "$meta"/skills/*/; do
    s="$(basename "$d")"
    [ -f "$d/help.md" ] && echo "  $s"
  done
  exit 0
fi
f="$meta/skills/$1/help.md"
if [ ! -f "$f" ]; then
  echo "no help vendored for '$1'" >&2
  exit 1
fi
cat "$f"
`

// The re-bootstrap wrapper: bare, it re-runs the chain at `main` — always pulling the
// latest harness — while `--ref <ref>` pins to a specific commit/tag. It pipes the
// sibling `bootstrap.sh` entry point at that ref through bash, so the transport
// (tarball fetch, temp-dir extract, prerequisite checks) is implemented exactly once.
// Requires a ref that ships `bootstrap.sh` — true for every ref a current engine can
// have stamped. The exact commit last applied is not baked in here (it would just
// duplicate — and drift from — the manifest): `.ki-meta/manifest.json` is the sole
// record of what was applied, and the engine resolves whatever ref ran to a concrete
// SHA before writing it there (see resolveRef).
// Network-requiring and idempotent; never invoked automatically (only via `ki-educate`
// or the aggregate's `educate` verb).
function binKiInit(): string {
  return `#!/bin/sh
# Vendored by ki-bootstrap — re-runs the remote EDUCATE chain to refresh this repo's
# vendored scripts. Usage: ./.ki-meta/bin/ki-educate [--ref <ref>] [--dry-run] [--help]
set -eu
DEFAULT_REF="main"
REPO="knowledgeislands/ki-agentic-harness"
ref="$DEFAULT_REF"
pass=""
while [ $# -gt 0 ]; do
  case "$1" in
    --ref) ref="$2"; shift 2 ;;
    --help|-h)
      echo "usage: ki-educate [--ref <ref>] [--dry-run]"
      echo "  re-runs the remote bootstrap chain against this repo at <ref> (default: main — the latest harness)."
      echo "  the exact commit last applied is recorded in .ki-meta/manifest.json."
      exit 0
      ;;
    *) pass="$pass $1"; shift ;;
  esac
done
root="$(cd "$(dirname "$0")/../.." && pwd)"
echo "re-bootstrapping $root from $REPO@$ref"
curl -fsSL "https://raw.githubusercontent.com/$REPO/$ref/skills/keystone/ki-bootstrap/scripts/bootstrap.sh" | sh -s -- "$root" --ref "$ref"$pass
`
}

interface VendoredFile {
  rel: string
  abs: string
}

type EntrySnapshot =
  | { kind: 'directory'; dev: number; ino: number; mode: number; uid: number }
  | { kind: 'file'; dev: number; ino: number; mode: number; uid: number; bytes: Buffer }

type OwnedSnapshot = Map<string, EntrySnapshot>

interface PublishedEntry {
  rel: string
  after: EntrySnapshot
  before?: QuarantinedEntry
}

interface QuarantinedEntry {
  rel: string
  expected: EntrySnapshot
  path: string
  movedPath: string
}

interface CreatedDirectory {
  rel: string
  identity: EntrySnapshot & { kind: 'directory' }
}

class RollbackConflictError extends Error {}

function lstatOrNull(path: string): ReturnType<typeof lstatSync> | null {
  try {
    return lstatSync(path)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw error
  }
}

function snapshotEntry(path: string): EntrySnapshot {
  const stat = lstatSync(path)
  const common = { dev: stat.dev, ino: stat.ino, mode: stat.mode & 0o777, uid: stat.uid }
  if (stat.isSymbolicLink()) throw new Error(`unsafe symlink entry: ${path}`)
  if (stat.isDirectory()) return { kind: 'directory', ...common }
  if (stat.isFile()) return { kind: 'file', ...common, bytes: readFileSync(path) }
  throw new Error(`unsafe non-file entry: ${path}`)
}

function sameSnapshot(a: EntrySnapshot | undefined, b: EntrySnapshot | undefined, identity = true): boolean {
  if (!a || !b || a.kind !== b.kind || a.mode !== b.mode || a.uid !== b.uid) return a === b
  if (identity && (a.dev !== b.dev || a.ino !== b.ino)) return false
  return a.kind === 'directory' || (b.kind === 'file' && a.bytes.equals(b.bytes))
}

function snapshotTree(metaDir: string, rel: string, out: OwnedSnapshot): void {
  const abs = join(metaDir, rel)
  const snap = snapshotEntry(abs)
  out.set(rel, snap)
  if (snap.kind !== 'directory') return
  for (const name of readdirSync(abs).sort()) snapshotTree(metaDir, join(rel, name), out)
}

function snapshotOwned(metaDir: string): OwnedSnapshot {
  const out: OwnedSnapshot = new Map()
  for (const rel of ['skills', 'bin', 'manifest.json']) {
    if (lstatOrNull(join(metaDir, rel))) snapshotTree(metaDir, rel, out)
  }
  return out
}

function sameOwnedSnapshot(a: OwnedSnapshot, b: OwnedSnapshot): boolean {
  if (a.size !== b.size) return false
  for (const [rel, before] of a) if (!sameSnapshot(before, b.get(rel))) return false
  return true
}

function assertCurrent(metaDir: string, rel: string, expected: EntrySnapshot | undefined): void {
  const path = join(metaDir, rel)
  const current = lstatOrNull(path) ? snapshotEntry(path) : undefined
  if (!sameSnapshot(expected, current)) throw new Error(`destination changed before publication: ${join(VENDOR_DIR, rel)}`)
}

function physicalTarget(path: string): { path: string; identity: EntrySnapshot & { kind: 'directory' } } {
  const canonical = realpathSync(resolve(path))
  const identity = snapshotEntry(canonical)
  if (identity.kind !== 'directory') throw new Error(`target must resolve to a real directory: ${path}`)
  return { path: canonical, identity }
}

function establishMeta(
  target: string,
  targetIdentity: EntrySnapshot & { kind: 'directory' }
): { path: string; created?: EntrySnapshot & { kind: 'directory' } } {
  if (!exactIdentity(target, targetIdentity) || realpathSync(target) !== target) {
    throw new Error('physical target changed before .ki-meta establishment')
  }
  const metaDir = join(target, VENDOR_DIR)
  const existing = lstatOrNull(metaDir)
  if (!existing) {
    if (process.env.NODE_ENV === 'test' && process.env.KI_BOOTSTRAP_TEST_RACE_META_CREATE === '1') mkdirSync(metaDir)
    mkdirSync(metaDir, { mode: 0o755 })
    const created = snapshotEntry(metaDir)
    try {
      if (created.kind !== 'directory' || realpathSync(metaDir) !== metaDir || dirname(metaDir) !== target) {
        throw new Error(`${VENDOR_DIR} was not created as the expected real directory`)
      }
    } catch (error) {
      if (created.kind === 'directory' && exactIdentity(metaDir, created) && readdirSync(metaDir).length === 0) rmdirSync(metaDir)
      throw error
    }
    if (!exactIdentity(target, targetIdentity)) throw new Error('physical target changed during .ki-meta establishment')
    validateMetaPrivacy(metaDir)
    return { path: metaDir, created }
  }
  const current = snapshotEntry(metaDir)
  if (current.kind !== 'directory' || realpathSync(metaDir) !== metaDir || dirname(metaDir) !== target) {
    throw new Error(`${VENDOR_DIR} must be a real directory directly beneath the physical target`)
  }
  if (!exactIdentity(target, targetIdentity)) throw new Error('physical target changed during .ki-meta validation')
  validateMetaPrivacy(metaDir)
  return { path: metaDir }
}

function validateMetaPrivacy(metaDir: string): void {
  const stat = lstatSync(metaDir)
  const getuid = process.getuid
  if (typeof getuid === 'function' && stat.uid !== getuid.call(process)) {
    throw new Error(`${VENDOR_DIR} must be owned by the current user before creating private transaction state`)
  }
  if ((stat.mode & 0o022) !== 0) throw new Error(`${VENDOR_DIR} must not be writable by group or other users`)
}

function exactIdentity(path: string, expected: EntrySnapshot): boolean {
  const current = lstatOrNull(path)
  if (!current) return false
  const snap = snapshotEntry(path)
  return snap.kind === expected.kind && snap.dev === expected.dev && snap.ino === expected.ino
}

function cleanupExact(path: string, expected: EntrySnapshot, recursive = false): void {
  if (!exactIdentity(path, expected)) throw new Error(`refusing cleanup after identity change: ${path}`)
  if (recursive) rmSync(path, { recursive: true })
  else if (expected.kind === 'directory') rmdirSync(path)
  else unlinkSync(path)
}

function acquireLock(metaDir: string): { path: string; identity: EntrySnapshot & { kind: 'file' } } {
  const path = join(metaDir, '.bootstrap.lock')
  const fd = openSync(path, 'wx', 0o600)
  const stat = fstatSync(fd)
  const identity: EntrySnapshot & { kind: 'file' } = {
    kind: 'file',
    dev: stat.dev,
    ino: stat.ino,
    mode: stat.mode & 0o777,
    uid: stat.uid,
    bytes: Buffer.alloc(0)
  }
  closeSync(fd)
  if (!exactIdentity(path, identity)) throw new Error('bootstrap lock changed during acquisition')
  return { path, identity }
}

function createStaging(metaDir: string): { path: string; identity: EntrySnapshot & { kind: 'directory' } } {
  const forcedSuffix = process.env.NODE_ENV === 'test' ? process.env.KI_BOOTSTRAP_TEST_STAGING_SUFFIX : undefined
  const path = forcedSuffix ? join(metaDir, `.bootstrap-staging-${forcedSuffix}`) : mkdtempSync(join(metaDir, '.bootstrap-staging-'))
  if (forcedSuffix) mkdirSync(path, { mode: 0o700 })
  chmodSync(path, 0o700)
  const identity = snapshotEntry(path)
  if (identity.kind !== 'directory') throw new Error('bootstrap staging entry is not a directory')
  return { path, identity }
}

function validateGeneration(staging: string, journal: OwnedSnapshot, manifestFiles: Record<string, string>): OwnedSnapshot {
  const topLevel = readdirSync(staging).sort()
  if (JSON.stringify(topLevel) !== JSON.stringify(['bin', 'manifest.json', 'skills'])) {
    throw new Error(`candidate generation has unexpected top-level entries: ${topLevel.join(', ')}`)
  }
  const tree = new Map<string, EntrySnapshot>()
  for (const rel of ['skills', 'bin', 'manifest.json']) {
    if (!lstatOrNull(join(staging, rel))) throw new Error(`candidate generation is missing ${rel}`)
    snapshotTree(staging, rel, tree)
  }
  if (!sameOwnedSnapshot(journal, tree)) throw new Error('candidate generation changed after creation journal entry')
  for (const [manifestRel, expectedHash] of Object.entries(manifestFiles)) {
    const rel = manifestRel.startsWith(`${VENDOR_DIR}/`) ? manifestRel.slice(VENDOR_DIR.length + 1) : manifestRel
    const entry = tree.get(rel)
    if (entry?.kind !== 'file' || createHash('sha256').update(entry.bytes).digest('hex') !== expectedHash) {
      throw new Error(`candidate generation hash mismatch: ${manifestRel}`)
    }
  }
  return tree
}

function restoreSnapshot(path: string, before: EntrySnapshot & { kind: 'file' }): void {
  const temp = join(dirname(path), `.bootstrap-restore-${process.pid}-${Math.random().toString(16).slice(2)}`)
  const fd = openSync(temp, 'wx', 0o600)
  try {
    writeFileSync(fd, before.bytes)
    fsyncSync(fd)
    chmodSync(temp, before.mode)
  } finally {
    closeSync(fd)
  }
  try {
    renameSync(temp, path)
  } finally {
    if (lstatOrNull(temp)) unlinkSync(temp)
  }
}

function maybeInjectPublicationFailure(count: number): void {
  if (process.env.NODE_ENV !== 'test') return
  const after = Number(process.env.KI_BOOTSTRAP_TEST_FAIL_AFTER ?? '')
  if (Number.isInteger(after) && after > 0 && count === after) throw new Error(`injected publication failure after ${count}`)
}

function copyRegularFile(source: string, destination: string): void {
  const before = snapshotEntry(source)
  if (before.kind !== 'file') throw new Error(`source is not a regular file: ${source}`)
  cpSync(source, destination)
  const after = snapshotEntry(destination)
  if (after.kind !== 'file' || !before.bytes.equals(after.bytes)) throw new Error(`copied source changed during read: ${source}`)
}

function recordGenerated(journal: OwnedSnapshot, staging: string, rel: string): void {
  journal.set(rel, snapshotEntry(join(staging, rel)))
  if (process.env.NODE_ENV === 'test' && process.env.KI_BOOTSTRAP_TEST_FAIL_BUILD_AFTER_REL === rel) {
    throw new Error(`injected candidate-build failure after ${rel}`)
  }
}

function hashJournalFile(journal: OwnedSnapshot, rel: string): string {
  const entry = journal.get(rel)
  if (entry?.kind !== 'file') throw new Error(`creation journal is missing regular file: ${rel}`)
  return createHash('sha256').update(entry.bytes).digest('hex')
}

// The universal modes that vendor a COPIED per-skill script. `educate` is NOT here: its
// per-skill `scripts/educate.ts` is a harness-relative seed delegator (it resolves the
// engine via ../../ki-bootstrap) so a verbatim copy into a target's .ki-meta would be
// a broken path — EDUCATE is instead the aggregate `ki:educate` re-sync (ADR-KI-HARNESS-007).
// `help` renders a snapshot below; `refresh` is harness-only and never vendored.
const SCRIPT_MODES = ['audit', 'conform'] as const

function vendorSkill(
  generationRoot: string,
  skill: string,
  dryRun: boolean,
  manifestFiles: Record<string, string>,
  journal?: OwnedSnapshot
): void {
  const declared = vendorModesOf(skill)
  // Which script modes to copy: the skill's declared list ∩ {audit, conform}, or — for
  // a skill still on filename-convention discovery (no `vendors:`) — both, as before.
  const scriptModes = SCRIPT_MODES.filter((m) => !declared || declared.includes(m))
  const destDir = join(generationRoot, 'skills', skill)
  const written: VendoredFile[] = []

  for (const mode of scriptModes) {
    const unit = vendorUnit(skill, mode)
    if (unit) written.push(...vendorOne(generationRoot, destDir, skill, mode, unit, dryRun, journal))
  }
  // Nothing vendored (no audit/conform resolvable) — skip the skill entirely, matching
  // the old `if (!audit) return` guard so bare non-governance dirs are ignored.
  if (written.length === 0) return

  // HELP snapshot — rendered from the skill's SKILL.md at vendor time, the one
  // moment the sources are guaranteed present, so `.ki-meta/bin/ki-help` answers
  // offline in a target that has no SKILL.md files. This resolves
  // ADR-KI-HARNESS-006's former open question by rendered snapshot; drift is
  // covered by the manifest hash like every other vendored file.
  const helpAbs = join(destDir, 'help.md')
  const helpEnv = process.env.KI_BOOTSTRAP_TEST_HELP_PATH ? { ...process.env, PATH: process.env.KI_BOOTSTRAP_TEST_HELP_PATH } : process.env
  const help = execFileSync('bun', [join(skillDir('ki-bootstrap'), 'scripts', 'skill-help.ts'), skill], {
    cwd: join(SKILLS_ROOT, '..'),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
    env: helpEnv
  })
  console.log(`${GREEN}vendor${RESET} ${skill} ${DIM}→ ${VENDOR_DIR}/skills/${skill}/help.md (help snapshot)${RESET}`)
  if (!dryRun) {
    mkdirSync(destDir, { recursive: true })
    if (journal) recordGenerated(journal, generationRoot, join('skills', skill))
    writeFileSync(helpAbs, help)
    if (journal) recordGenerated(journal, generationRoot, join('skills', skill, 'help.md'))
    written.push({ rel: `${VENDOR_DIR}/skills/${skill}/help.md`, abs: helpAbs })
  }

  for (const f of written) {
    if (!dryRun) {
      if (!journal) throw new Error('candidate generation requires a creation journal')
      manifestFiles[f.rel] = hashJournalFile(journal, f.rel.slice(VENDOR_DIR.length + 1))
    }
  }
}

// Vendors one declared unit: a checker FILE is copied as-is; a COMMAND is wrapped
// in a thin generated script so it runs with no package.json in the target
// (ADR-KI-HARNESS-006 — "even a skill whose mechanical gate is a shared command...
// yields a unit runnable in a non-engineering, no-package.json repo").
function vendorOne(
  generationRoot: string,
  destDir: string,
  skill: string,
  mode: 'audit' | 'conform',
  unit: { kind: 'file'; path: string } | { kind: 'command'; command: string },
  dryRun: boolean,
  journal?: OwnedSnapshot
): VendoredFile[] {
  const destFile = `${mode}.ts`
  const rel = `${VENDOR_DIR}/skills/${skill}/${destFile}`
  const abs = join(destDir, destFile)
  if (unit.kind === 'file') {
    console.log(`${GREEN}vendor${RESET} ${skill} ${DIM}→ ${rel} (file)${RESET}`)
    if (!dryRun) {
      mkdirSync(destDir, { recursive: true })
      if (journal) recordGenerated(journal, generationRoot, join('skills', skill))
      copyRegularFile(join(skillDir(skill), unit.path), abs)
      if (journal) recordGenerated(journal, generationRoot, join('skills', skill, destFile))
    }
  } else {
    console.log(`${GREEN}vendor${RESET} ${skill} ${DIM}→ ${rel} (command wrapper)${RESET}`)
    if (!dryRun) {
      mkdirSync(destDir, { recursive: true })
      if (journal) recordGenerated(journal, generationRoot, join('skills', skill))
      writeFileSync(abs, commandWrapper(unit.command))
      if (journal) recordGenerated(journal, generationRoot, join('skills', skill, destFile))
    }
  }
  return [{ rel, abs }]
}

// A generated command wrapper — no package.json required. Runs the declared
// command with the target repo (arg 1, defaulting to '.') as cwd.
function commandWrapper(command: string): string {
  return `#!/usr/bin/env bun
// Generated by ki-bootstrap from a \`vendors:\` command declaration. Do not edit —
// re-run EDUCATE to regenerate.
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'

const target = resolve(process.argv[2] ?? '.')
try {
  execFileSync('bash', ['-c', ${JSON.stringify('COMMAND_PLACEHOLDER')}], { cwd: target, stdio: 'inherit' })
} catch (err) {
  process.exit((err as { status?: number }).status ?? 1)
}
`.replace('COMMAND_PLACEHOLDER', command.replace(/\\/g, '\\\\').replace(/"/g, '\\"'))
}

function scaffoldRepoConfig(target: string, targetIdentity: EntrySnapshot & { kind: 'directory' }, dryRun: boolean): void {
  const repoInit = join(skillDir('ki-repo'), 'scripts', 'educate.ts')
  if (!exactIdentity(target, targetIdentity) || realpathSync(target) !== target) {
    throw new Error('physical target changed before repository config scaffold')
  }
  try {
    execFileSync('bun', [repoInit, target, '--scaffold-config-only', ...(dryRun ? ['--dry-run'] : [])], { stdio: 'inherit' })
  } catch (error) {
    process.exit((error as { status?: number }).status ?? 1)
  }
  if (process.env.NODE_ENV === 'test' && process.env.KI_BOOTSTRAP_TEST_REPLACE_ROOT_AFTER_SCAFFOLD_WITH) {
    renameSync(target, process.env.KI_BOOTSTRAP_TEST_REPLACE_ROOT_AFTER_SCAFFOLD_WITH)
    mkdirSync(target)
  }
  if (!exactIdentity(target, targetIdentity) || realpathSync(target) !== target) {
    throw new Error('physical target changed during repository config scaffold')
  }
}

function resolvedSetOrExit(target: string, seeds: string[]): string[] {
  try {
    return resolveSet(target, false, seeds)
  } catch (error) {
    if (!(error instanceof SkillResolutionError)) throw error
    console.error(`${'\x1b[31m'}FAIL${RESET}  [BOOT-9] ${error.message} — reconcile .ki-config.toml or the explicit --seed value`)
    process.exit(1)
  }
}

function buildCandidate(
  staging: string,
  set: string[],
  ref: string,
  journal: OwnedSnapshot
): { files: Record<string, string>; tree: OwnedSnapshot } {
  const manifestFiles: Record<string, string> = {}
  mkdirSync(join(staging, 'skills'), { mode: 0o755 })
  recordGenerated(journal, staging, 'skills')
  mkdirSync(join(staging, 'bin'), { mode: 0o755 })
  recordGenerated(journal, staging, 'bin')
  for (const skill of set) vendorSkill(staging, skill, false, manifestFiles, journal)

  const aggregate = join(staging, 'bin', 'aggregate.ts')
  writeFileSync(aggregate, AGGREGATE_RUNNER)
  recordGenerated(journal, staging, join('bin', 'aggregate.ts'))
  writeFileSync(join(staging, 'bin', 'ki-audit'), BIN_KI_AUDIT)
  chmodSync(join(staging, 'bin', 'ki-audit'), 0o755)
  recordGenerated(journal, staging, join('bin', 'ki-audit'))
  writeFileSync(join(staging, 'bin', 'ki-conform'), BIN_KI_CONFORM)
  chmodSync(join(staging, 'bin', 'ki-conform'), 0o755)
  recordGenerated(journal, staging, join('bin', 'ki-conform'))
  writeFileSync(join(staging, 'bin', 'ki-educate'), binKiInit())
  chmodSync(join(staging, 'bin', 'ki-educate'), 0o755)
  recordGenerated(journal, staging, join('bin', 'ki-educate'))
  writeFileSync(join(staging, 'bin', 'ki-help'), BIN_KI_HELP)
  chmodSync(join(staging, 'bin', 'ki-help'), 0o755)
  recordGenerated(journal, staging, join('bin', 'ki-help'))
  manifestFiles[join(VENDOR_DIR, 'bin', 'aggregate.ts')] = hashJournalFile(journal, join('bin', 'aggregate.ts'))

  if (set.includes('ki-harness')) {
    for (const name of HARNESS_BIN_SCRIPTS) {
      const destination = join(staging, 'bin', name)
      copyRegularFile(join(skillDir('ki-bootstrap'), 'scripts', name), destination)
      recordGenerated(journal, staging, join('bin', name))
      manifestFiles[join(VENDOR_DIR, 'bin', name)] = hashJournalFile(journal, join('bin', name))
    }
    console.log(`${GREEN}bin${RESET} ${DIM}→ ${VENDOR_DIR}/bin/{${HARNESS_BIN_SCRIPTS.join(', ')}} (harness cross-skill scripts)${RESET}`)
  }

  writeFileSync(join(staging, 'manifest.json'), `${JSON.stringify({ ref, files: manifestFiles }, null, 2)}\n`)
  recordGenerated(journal, staging, 'manifest.json')
  maybeInjectStagedMutation(staging)
  return { files: manifestFiles, tree: validateGeneration(staging, journal, manifestFiles) }
}

function validateTransactionParents(
  target: string,
  targetIdentity: EntrySnapshot & { kind: 'directory' },
  metaDir: string,
  metaIdentity: EntrySnapshot & { kind: 'directory' },
  lockPath: string,
  lockIdentity: EntrySnapshot & { kind: 'file' }
): void {
  if (!exactIdentity(target, targetIdentity) || realpathSync(target) !== target) {
    throw new Error('physical target changed before publication')
  }
  if (!exactIdentity(metaDir, metaIdentity) || realpathSync(metaDir) !== metaDir || dirname(metaDir) !== target) {
    throw new Error(`${VENDOR_DIR} changed before publication`)
  }
  if (!exactIdentity(lockPath, lockIdentity)) throw new Error('bootstrap lock changed before publication')
}

function validateDestinationShape(metaDir: string, candidate: OwnedSnapshot, includeManifest: boolean): OwnedSnapshot {
  const current = snapshotOwned(metaDir)
  const expectedEntries = [...candidate.entries()].filter(([rel]) => includeManifest || rel !== 'manifest.json')
  const currentEntries = [...current.entries()].filter(([rel]) => includeManifest || rel !== 'manifest.json')
  if (expectedEntries.length !== currentEntries.length) throw new Error('published generation has an unexpected owned-entry set')
  for (const [rel, expected] of expectedEntries) {
    if (!sameSnapshot(expected, current.get(rel), false)) throw new Error(`published generation differs at ${join(VENDOR_DIR, rel)}`)
  }
  return current
}

function validateStagingForCleanup(staging: string, identity: EntrySnapshot, candidate: OwnedSnapshot): void {
  if (!exactIdentity(staging, identity)) throw new Error(`refusing staging cleanup after identity change: ${staging}`)
  const current = new Map<string, EntrySnapshot>()
  for (const name of readdirSync(staging).sort()) snapshotTree(staging, name, current)
  for (const [rel, entry] of current) {
    if (!sameSnapshot(entry, candidate.get(rel))) throw new Error(`refusing staging cleanup after content change: ${rel}`)
  }
}

function cleanupTrustedStaging(staging: string, identity: EntrySnapshot): void {
  cleanupExact(staging, identity, true)
}

function maybeInjectRollbackConflict(metaDir: string): void {
  if (process.env.NODE_ENV !== 'test') return
  const rel = process.env.KI_BOOTSTRAP_TEST_ROLLBACK_CONFLICT_REL
  if (!rel) return
  const destination = join(metaDir, rel)
  const entry = lstatOrNull(destination)
  if (!entry?.isFile() || entry.isSymbolicLink()) return
  writeFileSync(destination, 'third-party rollback conflict\n')
}

function maybeInjectPrePublicationReplacement(metaDir: string): void {
  if (process.env.NODE_ENV !== 'test') return
  const rel = process.env.KI_BOOTSTRAP_TEST_PREPUBLISH_REPLACE_REL
  if (!rel) return
  const destination = join(metaDir, rel)
  const before = snapshotEntry(destination)
  if (before.kind !== 'file') throw new Error(`test replacement is not a regular file: ${rel}`)
  restoreSnapshot(destination, before)
}

function maybeInjectPruneConflict(metaDir: string, rel: string): void {
  if (process.env.NODE_ENV !== 'test' || process.env.KI_BOOTSTRAP_TEST_PRUNE_CONFLICT_REL !== rel) return
  writeFileSync(join(metaDir, rel), 'third-party prune conflict\n')
}

function maybeInjectStagedMutation(staging: string): void {
  if (process.env.NODE_ENV !== 'test') return
  const rel = process.env.KI_BOOTSTRAP_TEST_MUTATE_STAGED_REL
  if (rel) writeFileSync(join(staging, rel), 'third-party staged mutation\n')
}

function maybeInjectLateDestinationMutation(
  metaDir: string,
  phase: 'pre-manifest' | 'between-validation-manifest' | 'post-manifest'
): void {
  if (process.env.NODE_ENV !== 'test') return
  const phaseKey =
    phase === 'pre-manifest'
      ? 'PRE_MANIFEST'
      : phase === 'between-validation-manifest'
        ? 'BETWEEN_VALIDATION_AND_MANIFEST'
        : 'POST_MANIFEST'
  const rel = process.env[`KI_BOOTSTRAP_TEST_LATE_${phaseKey}_REL`]
  if (!rel) return
  const destination = join(metaDir, rel)
  const before = snapshotEntry(destination)
  if (before.kind !== 'file') throw new Error(`test late mutation is not a regular file: ${rel}`)
  restoreSnapshot(destination, before)
}

interface Quarantine {
  path: string
  next: number
  entries: QuarantinedEntry[]
}

function createPrivateSnapshot(path: string, expected: EntrySnapshot & { kind: 'file' }): string {
  const snapshotPath = `${path}.snapshot`
  const fd = openSync(snapshotPath, 'wx', 0o600)
  try {
    writeFileSync(fd, expected.bytes)
    fsyncSync(fd)
    chmodSync(snapshotPath, expected.mode)
  } finally {
    closeSync(fd)
  }
  const privateSnapshot = snapshotEntry(snapshotPath)
  if (!sameSnapshot(expected, privateSnapshot, false)) throw new Error(`private quarantine snapshot differs: ${snapshotPath}`)
  return snapshotPath
}

function createQuarantine(staging: string): Quarantine {
  const path = join(staging, '.quarantine')
  mkdirSync(path, { mode: 0o700 })
  chmodSync(path, 0o700)
  return { path, next: 0, entries: [] }
}

function quarantineExisting(metaDir: string, rel: string, expected: EntrySnapshot, quarantine: Quarantine): QuarantinedEntry {
  const destination = join(metaDir, rel)
  const movedPath = join(quarantine.path, `${String(quarantine.next++).padStart(6, '0')}-${rel.replaceAll('/', '_')}`)
  renameSync(destination, movedPath)
  const entry: QuarantinedEntry = { rel, expected, path: movedPath, movedPath }
  quarantine.entries.push(entry)
  try {
    if (process.env.NODE_ENV === 'test' && process.env.KI_BOOTSTRAP_TEST_FAIL_QUARANTINE_SNAPSHOT_REL === rel) {
      throw new Error(`injected post-rename snapshot failure for ${rel}`)
    }
    const moved = snapshotEntry(movedPath)
    const changed = !sameSnapshot(expected, moved) || (moved.kind === 'directory' && readdirSync(movedPath).length > 0)
    if (!changed) {
      if (expected.kind === 'file') entry.path = createPrivateSnapshot(movedPath, expected)
      if (
        process.env.NODE_ENV === 'test' &&
        process.env.KI_BOOTSTRAP_TEST_MUTATE_ALIAS_AFTER_QUARANTINE_REL === rel &&
        process.env.KI_BOOTSTRAP_TEST_MUTATE_ALIAS_PATH
      ) {
        writeFileSync(process.env.KI_BOOTSTRAP_TEST_MUTATE_ALIAS_PATH, 'external hard-link mutation\n')
      }
      return entry
    }
  } catch (error) {
    if (expected.kind === 'file') {
      const moved = lstatOrNull(movedPath)
      if (moved?.isFile() && !moved.isSymbolicLink() && moved.dev === expected.dev && moved.ino === expected.ino) {
        try {
          linkSync(movedPath, destination)
        } catch {
          // Preserve both paths and report the conflict below.
        }
      }
    }
    throw new RollbackConflictError(
      `destination could not be validated after quarantine: ${join(VENDOR_DIR, rel)}; preserved at ${movedPath}; ${(error as Error).message}`
    )
  }
  if (expected.kind === 'file') {
    try {
      linkSync(movedPath, destination)
    } catch {
      // Preserve both paths and report the conflict below.
    }
  }
  throw new RollbackConflictError(`destination changed during quarantine: ${join(VENDOR_DIR, rel)}; preserved at ${movedPath}`)
}

function maybeInjectPostQuarantineRecreation(metaDir: string, rel: string): void {
  if (process.env.NODE_ENV !== 'test' || process.env.KI_BOOTSTRAP_TEST_POST_QUARANTINE_RECREATE_REL !== rel) return
  writeFileSync(join(metaDir, rel), 'third-party post-check replacement\n', { flag: 'wx' })
}

function restoreQuarantined(metaDir: string, entry: QuarantinedEntry): void {
  const destination = join(metaDir, entry.rel)
  if (entry.expected.kind === 'file') {
    linkSync(entry.path, destination)
    return
  }
  mkdirSync(destination, { mode: entry.expected.mode })
  chmodSync(destination, entry.expected.mode)
}

function rollbackPublishedDestination(metaDir: string, item: PublishedEntry, quarantine: Quarantine): void {
  quarantineExisting(metaDir, item.rel, item.after, quarantine)
}

function finalizeTransaction(
  metaDir: string,
  lock: { path: string; identity: EntrySnapshot & { kind: 'file' } },
  staging: { path: string; identity: EntrySnapshot & { kind: 'directory' } },
  quarantine?: Quarantine
): void {
  const privateQuarantine = quarantine ?? createQuarantine(staging.path)
  if (process.env.NODE_ENV === 'test' && process.env.KI_BOOTSTRAP_TEST_REPLACE_LOCK_AFTER_CHECK === '1') {
    if (!exactIdentity(lock.path, lock.identity)) throw new RollbackConflictError('bootstrap lock changed before final quarantine')
    restoreSnapshot(lock.path, { ...lock.identity, bytes: Buffer.from('third-party lock replacement\n') })
  }
  quarantineExisting(metaDir, '.bootstrap.lock', lock.identity, privateQuarantine)
  cleanupTrustedStaging(staging.path, staging.identity)
}

function createCleanupStaging(metaDir: string): { path: string; identity: EntrySnapshot & { kind: 'directory' } } {
  const path = mkdtempSync(join(metaDir, '.bootstrap-staging-cleanup-'))
  chmodSync(path, 0o700)
  const identity = snapshotEntry(path)
  if (identity.kind !== 'directory') throw new Error('bootstrap cleanup staging entry is not a directory')
  return { path, identity }
}

function publishCandidate(
  target: string,
  targetIdentity: EntrySnapshot & { kind: 'directory' },
  metaDir: string,
  metaIdentity: EntrySnapshot & { kind: 'directory' },
  lock: { path: string; identity: EntrySnapshot & { kind: 'file' } },
  staging: { path: string; identity: EntrySnapshot & { kind: 'directory' } },
  before: OwnedSnapshot,
  candidate: OwnedSnapshot
): void {
  const published: PublishedEntry[] = []
  const displaced: QuarantinedEntry[] = []
  const createdDirectories: CreatedDirectory[] = []
  const quarantine = createQuarantine(staging.path)
  let publicationCount = 0

  try {
    validateTransactionParents(target, targetIdentity, metaDir, metaIdentity, lock.path, lock.identity)
    if (!sameOwnedSnapshot(before, snapshotOwned(metaDir))) throw new Error('owned bootstrap destinations changed before publication')

    const candidateDirectories = [...candidate.entries()]
      .filter(([, entry]) => entry.kind === 'directory')
      .sort(([a], [b]) => a.split('/').length - b.split('/').length || a.localeCompare(b))
    for (const [rel] of candidateDirectories) {
      const expected = before.get(rel)
      if (expected) {
        if (expected.kind !== 'directory') throw new Error(`owned destination is not a directory: ${join(VENDOR_DIR, rel)}`)
        assertCurrent(metaDir, rel, expected)
        continue
      }
      const destination = join(metaDir, rel)
      mkdirSync(destination, { mode: 0o755 })
      const identity = snapshotEntry(destination)
      if (identity.kind !== 'directory') throw new Error(`failed to create owned directory: ${join(VENDOR_DIR, rel)}`)
      createdDirectories.push({ rel, identity })
    }

    const candidateFiles = [...candidate.entries()]
      .filter(([rel, entry]) => entry.kind === 'file' && rel !== 'manifest.json')
      .sort(([a], [b]) => a.localeCompare(b)) as [string, EntrySnapshot & { kind: 'file' }][]
    for (const [rel, next] of candidateFiles) {
      const old = before.get(rel)
      if (old?.kind === 'directory') throw new Error(`owned destination is not a file: ${join(VENDOR_DIR, rel)}`)
      assertCurrent(metaDir, rel, old)
      const source = join(staging.path, rel)
      const destination = join(metaDir, rel)
      if (old?.kind === 'file' && sameSnapshot(old, next, false)) continue
      let quarantined: QuarantinedEntry | undefined
      if (old) {
        quarantined = quarantineExisting(metaDir, rel, old, quarantine)
        displaced.push(quarantined)
      }
      maybeInjectPostQuarantineRecreation(metaDir, rel)
      linkSync(source, destination)
      published.push({ rel, before: quarantined, after: next })
      assertCurrent(metaDir, rel, next)
      maybeInjectPublicationFailure(++publicationCount)
    }

    const obsoleteFiles = [...before.entries()]
      .filter(([rel, entry]) => entry.kind === 'file' && (rel.startsWith('skills/') || rel.startsWith('bin/')) && !candidate.has(rel))
      .sort(([a], [b]) => a.localeCompare(b))
    for (const [rel, entry] of obsoleteFiles) {
      maybeInjectPruneConflict(metaDir, rel)
      displaced.push(quarantineExisting(metaDir, rel, entry, quarantine))
    }

    const obsoleteDirectories = [...before.entries()]
      .filter(
        ([rel, entry]) =>
          entry.kind === 'directory' &&
          (rel === 'skills' || rel === 'bin' || rel.startsWith('skills/') || rel.startsWith('bin/')) &&
          !candidate.has(rel)
      )
      .sort(([a], [b]) => b.split('/').length - a.split('/').length || b.localeCompare(a))
    for (const [rel, entry] of obsoleteDirectories) {
      displaced.push(quarantineExisting(metaDir, rel, entry, quarantine))
    }

    const beforeManifest = snapshotOwned(metaDir)
    maybeInjectLateDestinationMutation(metaDir, 'pre-manifest')
    if (!sameOwnedSnapshot(beforeManifest, snapshotOwned(metaDir))) {
      throw new Error('owned bootstrap destinations changed before manifest publication')
    }
    validateDestinationShape(metaDir, candidate, false)
    validateTransactionParents(target, targetIdentity, metaDir, metaIdentity, lock.path, lock.identity)
    maybeInjectLateDestinationMutation(metaDir, 'between-validation-manifest')

    const nextManifest = candidate.get('manifest.json')
    if (nextManifest?.kind !== 'file') throw new Error('candidate manifest is not a regular file')
    const oldManifest = before.get('manifest.json')
    if (oldManifest?.kind === 'directory') throw new Error('owned manifest destination is not a file')
    assertCurrent(metaDir, 'manifest.json', oldManifest)
    let finalManifestIdentity = oldManifest
    if (!(oldManifest?.kind === 'file' && sameSnapshot(oldManifest, nextManifest, false))) {
      let quarantined: QuarantinedEntry | undefined
      if (oldManifest) {
        quarantined = quarantineExisting(metaDir, 'manifest.json', oldManifest, quarantine)
        displaced.push(quarantined)
      }
      maybeInjectPostQuarantineRecreation(metaDir, 'manifest.json')
      linkSync(join(staging.path, 'manifest.json'), join(metaDir, 'manifest.json'))
      published.push({ rel: 'manifest.json', before: quarantined, after: nextManifest })
      assertCurrent(metaDir, 'manifest.json', nextManifest)
      finalManifestIdentity = nextManifest
      maybeInjectPublicationFailure(++publicationCount)
    }
    const expectedComplete = new Map(beforeManifest)
    if (finalManifestIdentity) expectedComplete.set('manifest.json', finalManifestIdentity)
    else expectedComplete.delete('manifest.json')
    const complete = validateDestinationShape(metaDir, candidate, true)
    if (!sameOwnedSnapshot(expectedComplete, complete)) {
      throw new Error('owned bootstrap destination identities changed during manifest publication')
    }
    maybeInjectLateDestinationMutation(metaDir, 'post-manifest')
    if (!sameOwnedSnapshot(expectedComplete, snapshotOwned(metaDir))) {
      throw new Error('owned bootstrap destinations changed after manifest publication')
    }
    validateTransactionParents(target, targetIdentity, metaDir, metaIdentity, lock.path, lock.identity)
  } catch (error) {
    maybeInjectRollbackConflict(metaDir)
    const conflicts: string[] = error instanceof RollbackConflictError ? [error.message] : []

    for (const item of [...published].reverse()) {
      try {
        rollbackPublishedDestination(metaDir, item, quarantine)
      } catch {
        conflicts.push(join(VENDOR_DIR, item.rel))
      }
    }

    const directories = displaced.filter((item) => item.expected.kind === 'directory').reverse()
    const files = displaced.filter((item) => item.expected.kind === 'file').reverse()
    for (const item of [...directories, ...files]) {
      try {
        restoreQuarantined(metaDir, item)
      } catch {
        conflicts.push(join(VENDOR_DIR, item.rel))
      }
    }

    for (const item of [...createdDirectories].reverse()) {
      try {
        quarantineExisting(metaDir, item.rel, item.identity, quarantine)
      } catch {
        conflicts.push(join(VENDOR_DIR, item.rel))
      }
    }

    if (conflicts.length > 0) {
      throw new RollbackConflictError(`${(error as Error).message}; rollback conflicts: ${[...new Set(conflicts)].join(', ')}`)
    }
    finalizeTransaction(metaDir, lock, staging, quarantine)
    throw error
  }

  finalizeTransaction(metaDir, lock, staging, quarantine)
}

function runBootstrapTransaction(target: string, targetIdentity: EntrySnapshot & { kind: 'directory' }, set: string[], ref: string): void {
  if (process.env.NODE_ENV === 'test' && process.env.KI_BOOTSTRAP_TEST_REPLACE_BOUND_ROOT_WITH) {
    renameSync(target, process.env.KI_BOOTSTRAP_TEST_REPLACE_BOUND_ROOT_WITH)
    mkdirSync(target)
  }
  const established = establishMeta(target, targetIdentity)
  const metaIdentity = snapshotEntry(established.path)
  if (metaIdentity.kind !== 'directory') throw new Error(`${VENDOR_DIR} is not a directory`)
  let lock: ReturnType<typeof acquireLock> | undefined
  let staging: ReturnType<typeof createStaging> | undefined
  const buildJournal: OwnedSnapshot = new Map()
  try {
    if (process.env.NODE_ENV === 'test' && process.env.KI_BOOTSTRAP_TEST_RACE_META_CLEANUP === '1') {
      writeFileSync(join(established.path, 'third-party-sentinel'), 'preserve me\n')
      writeFileSync(join(established.path, '.bootstrap.lock'), 'third-party lock\n')
    }
    lock = acquireLock(established.path)
    const before = snapshotOwned(established.path)
    staging = createStaging(established.path)
    const { tree } = buildCandidate(staging.path, set, ref, buildJournal)
    maybeInjectPrePublicationReplacement(established.path)
    publishCandidate(target, targetIdentity, established.path, metaIdentity, lock, staging, before, tree)
    lock = undefined
    staging = undefined
  } catch (error) {
    if (error instanceof RollbackConflictError) throw error
    if (staging && exactIdentity(staging.path, staging.identity)) {
      try {
        validateStagingForCleanup(staging.path, staging.identity, buildJournal)
      } catch (cleanupError) {
        throw new RollbackConflictError(`${(error as Error).message}; staging cleanup conflict: ${(cleanupError as Error).message}`)
      }
    }
    if (lock && exactIdentity(lock.path, lock.identity)) {
      const cleanupStaging = staging && exactIdentity(staging.path, staging.identity) ? staging : createCleanupStaging(established.path)
      finalizeTransaction(established.path, lock, cleanupStaging)
    } else if (lock && lstatOrNull(lock.path)) {
      throw new RollbackConflictError(`${(error as Error).message}; bootstrap lock changed before cleanup`)
    }
    throw error
  } finally {
    if (established.created && exactIdentity(established.path, established.created) && readdirSync(established.path).length === 0) {
      rmdirSync(established.path)
    }
  }
}

function publishRuntimeSkillCopies(target: string, dryRun: boolean): void {
  const args = [join(import.meta.dirname, 'copy-skills.ts'), target]
  if (dryRun) args.push('--dry-run')
  try {
    execFileSync('bun', args, { stdio: 'inherit' })
  } catch {
    throw new Error('project runtime skill copy publication failed')
  }
}

function main(): void {
  const argv = process.argv.slice(2)
  if (argv.includes('--help') || argv.includes('-h')) {
    console.log('usage: bootstrap.ts <target-repo> [--seed <skill>] [--ref <ref>] [--dry-run]')
    console.log('  vendors the resolved governance set into an atomic .ki-meta generation')
    return
  }
  // Pull the value-taking flags out first so their values are not mistaken for
  // the positional target: `--seed <skill>` (repeatable — a per-skill delegator
  // passes `--seed <self>`) and `--ref <ref>` (passed by `ki-educate` so a tarball
  // extract with no .git still stamps the manifest with the ref it ran at).
  const seeds: string[] = []
  const rest: string[] = []
  let refOverride: string | undefined
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--seed' && argv[i + 1]) {
      seeds.push(argv[++i])
    } else if (argv[i] === '--ref' && argv[i + 1]) {
      refOverride = argv[++i]
    } else {
      rest.push(argv[i])
    }
  }
  const positional = rest.filter((a) => !a.startsWith('--'))
  const boundTarget = physicalTarget(positional[0] ?? '.')
  const target = boundTarget.path
  const dryRun = rest.includes('--dry-run')

  // No `package.json` is ever required or touched — a repo self-governs through the
  // vendored `.ki-meta/` runner and its `bin/` wrappers alone (dotfiles, KB, tap, or
  // code repo alike). The `ki:*` convenience keys are ki-engineering's to wire, as
  // sugar over these same bins. Vendoring is always coverage-scoped (`.ki-config.toml`
  // + baseline + implies + explicit --seed) — `--all` is a linking concept only, never a
  // vendoring one (ADR-KI-HARNESS-007).
  let set = resolvedSetOrExit(target, seeds)

  // ki-repo owns the file-level contract and foundation-marker scaffold. Once
  // initial resolution proves every declared/seeded root valid, compose that leg
  // before any .ki-meta mutation, then re-resolve against the converged config.
  // Bare bootstrap with no config/seed resolves no ki-repo and remains empty-set.
  if (set.includes('ki-repo')) {
    scaffoldRepoConfig(target, boundTarget.identity, dryRun)
    set = resolvedSetOrExit(target, seeds)
  }
  console.log(`${DIM}bootstrap ${target} — skills: ${set.join(', ')}${RESET}`)

  const ref = resolveRef(refOverride ?? harnessRef())
  const aggRel = join(VENDOR_DIR, 'bin', 'aggregate.ts')
  const auditBinRel = join(VENDOR_DIR, 'bin', 'ki-audit')
  const conformBinRel = join(VENDOR_DIR, 'bin', 'ki-conform')
  const initBinRel = join(VENDOR_DIR, 'bin', 'ki-educate')
  const helpBinRel = join(VENDOR_DIR, 'bin', 'ki-help')
  const manifestRel = join(VENDOR_DIR, 'manifest.json')
  if (dryRun) {
    const manifestFiles: Record<string, string> = {}
    for (const skill of set) vendorSkill(join(target, VENDOR_DIR), skill, true, manifestFiles)
  } else runBootstrapTransaction(target, boundTarget.identity, set, ref)
  // Runtime payloads are separate from `.ki-meta/`: normal bootstrap publishes
  // complete generated copies for the selected runtimes, never development links.
  publishRuntimeSkillCopies(target, dryRun)
  console.log(
    `${GREEN}runner${RESET} ${DIM}→ ${aggRel}, ${auditBinRel}, ${conformBinRel}, ${initBinRel}, ${helpBinRel}, ${manifestRel}${RESET}`
  )
}

main()
