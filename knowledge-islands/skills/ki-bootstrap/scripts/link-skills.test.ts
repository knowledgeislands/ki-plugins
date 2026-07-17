#!/usr/bin/env bun
/**
 * Run-based behavioural test for `link-skills.ts --check`.
 *
 * ki-engineering §6 scopes unit-test coverage to `src/**` and names the harness as
 * the "run, not unit-tested" case for skill `scripts/`. So rather than a vitest suite
 * this spawns the real CLI against throwaway `.ki-config.toml` fixtures and asserts on
 * its exit code and output — matching that convention and sidestepping the script's
 * CLI-on-import shape.
 *
 * Covers the orphaned-table regression: a `[ki-*]` table declared in `.ki-config.toml`
 * that resolves to no skill in the harness (e.g. left behind by a rename) must be a
 * BOOT-1 FAIL with a non-zero exit — while a repo whose tables all resolve stays clean.
 */
import { spawnSync } from 'node:child_process'
import { existsSync, lstatSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const LINKER = join(dirname(fileURLToPath(import.meta.url)), 'link-skills.ts')
const COPIER = join(dirname(fileURLToPath(import.meta.url)), 'copy-skills.ts')

let failed = false
function check(label: string, cond: boolean): void {
  if (cond) {
    console.log(`  \x1b[32mok\x1b[0m   ${label}`)
  } else {
    failed = true
    console.log(`  \x1b[31mFAIL\x1b[0m ${label}`)
  }
}

/**
 * Build a throwaway repo whose `.ki-config.toml` holds the given `[ki-*]` tables,
 * optionally declaring `target_runtimes` (defaults to unset → the ["claude-code"]
 * fallback in package-scripts.ts's `targetRuntimes`).
 */
function fixture(tables: string[], runtimes?: string[]): string {
  // realpath: macOS aliases /tmp → /private/tmp (and /var → /private/var), so a raw
  // mkdtemp path has a different depth-to-root than its resolved one — since the
  // symlinks this creates are relative, that mismatch would make them dangle.
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'ki-boot-linktest-')))
  const runtimeTable = runtimes ? `[ki-repo]\ntarget_runtimes = [${runtimes.map((r) => `"${r}"`).join(', ')}]\n` : ''
  writeFileSync(join(dir, '.ki-config.toml'), `${runtimeTable}${tables.map((t) => `[${t}]`).join('\n')}\n`)
  return dir
}

function runCheck(dir: string): { code: number; out: string } {
  const res = spawnSync('bun', [LINKER, '--check', dir], { encoding: 'utf8' })
  return { code: res.status ?? 1, out: `${res.stdout ?? ''}${res.stderr ?? ''}` }
}

function runLink(dir: string, dryRun = false): { code: number; out: string } {
  const res = spawnSync('bun', [COPIER, dir, ...(dryRun ? ['--dry-run'] : [])], { encoding: 'utf8' })
  return { code: res.status ?? 1, out: `${res.stdout ?? ''}${res.stderr ?? ''}` }
}

// ── Stale: a declared table that resolves to no harness skill → BOOT-1 FAIL ──
const stale = fixture(['ki-kb', 'ki-websites-11ty'])
try {
  const { code, out } = runCheck(stale)
  check('stale table → non-zero exit', code !== 0)
  check('stale table → reports FAIL', /FAIL/.test(out))
  check('stale table → cites BOOT-1', out.includes('BOOT-1'))
  check('stale table → names the orphaned table', out.includes('ki-websites-11ty'))
} finally {
  rmSync(stale, { recursive: true, force: true })
}

// ── Write/dry-run reject dotted + duplicate unknown owners before any mutation ──
for (const dryRun of [false, true]) {
  const invalid = fixture(['ki-zeta-missing', 'ki-alpha-missing.checks', 'ki-zeta-missing.zones'])
  try {
    const before = readFileSync(join(invalid, '.ki-config.toml'), 'utf8')
    const { code, out } = runLink(invalid, dryRun)
    check(`${dryRun ? 'dry-run' : 'write'} unknown roots → non-zero exit`, code !== 0)
    check(`${dryRun ? 'dry-run' : 'write'} unknown roots → sorted names`, out.indexOf('ki-alpha-missing') < out.indexOf('ki-zeta-missing'))
    check(`${dryRun ? 'dry-run' : 'write'} unknown roots → no skills dir`, !existsSync(join(invalid, '.claude', 'skills')))
    check(`${dryRun ? 'dry-run' : 'write'} unknown roots → no .gitignore`, !existsSync(join(invalid, '.gitignore')))
    check(
      `${dryRun ? 'dry-run' : 'write'} unknown roots → config unchanged`,
      readFileSync(join(invalid, '.ki-config.toml'), 'utf8') === before
    )
  } finally {
    rmSync(invalid, { recursive: true, force: true })
  }
}

// ── Control: every declared table resolves → no orphan FAIL, exit 0 ──
const clean = fixture(['ki-kb'])
try {
  const { code, out } = runCheck(clean)
  check('clean tables → exit 0', code === 0)
  check('clean tables → no orphan FAIL line', !out.includes('ki-websites-11ty'))
} finally {
  rmSync(clean, { recursive: true, force: true })
}

// ── Write mode auto-gitignores .claude/skills/ → BOOT-3 clears (no package.json) ──
const linkDir = fixture(['ki-kb'])
try {
  runLink(linkDir)
  const gitignore = readFileSync(join(linkDir, '.gitignore'), 'utf8')
  check('write mode → .gitignore contains .claude/skills/', /^\.claude\/skills\/?$/m.test(gitignore))
  const { out } = runCheck(linkDir)
  check('write mode → BOOT-3 no longer warns', !/WARN.*BOOT-3/.test(out))
} finally {
  rmSync(linkDir, { recursive: true, force: true })
}

// ── Codex-only: copies + gitignore land under .agents/skills, nothing under .claude/skills ──
const codexOnly = fixture(['ki-kb'], ['codex'])
try {
  runLink(codexOnly)
  check(
    'codex-only → .agents/skills/ki-kb regular payload created',
    lstatSync(join(codexOnly, '.agents', 'skills', 'ki-kb')).isDirectory() &&
      !lstatSync(join(codexOnly, '.agents', 'skills', 'ki-kb')).isSymbolicLink()
  )
  check('codex-only → nothing under .claude/skills', !existsSync(join(codexOnly, '.claude', 'skills')))
  const gitignore = readFileSync(join(codexOnly, '.gitignore'), 'utf8')
  check('codex-only → .gitignore contains .agents/skills/', /^\.agents\/skills\/?$/m.test(gitignore))
  const { code, out } = runCheck(codexOnly)
  check('codex-only → --check exit 0', code === 0)
  check('codex-only → --check reports [codex]', out.includes('[codex]'))
} finally {
  rmSync(codexOnly, { recursive: true, force: true })
}

// ── Dual-runtime: copies + gitignore land under both dirs, --check clean for both ──
const dual = fixture(['ki-kb'], ['claude-code', 'codex'])
try {
  runLink(dual)
  check('dual-runtime → .claude/skills/ki-kb copied', lstatSync(join(dual, '.claude', 'skills', 'ki-kb')).isDirectory())
  check('dual-runtime → .agents/skills/ki-kb copied', lstatSync(join(dual, '.agents', 'skills', 'ki-kb')).isDirectory())
  const gitignore = readFileSync(join(dual, '.gitignore'), 'utf8')
  check('dual-runtime → .gitignore contains .claude/skills/', /^\.claude\/skills\/?$/m.test(gitignore))
  check('dual-runtime → .gitignore contains .agents/skills/', /^\.agents\/skills\/?$/m.test(gitignore))
  const { code, out } = runCheck(dual)
  check('dual-runtime → --check exit 0', code === 0)
  check('dual-runtime → --check reports both runtimes', out.includes('[claude-code]') && out.includes('[codex]'))
} finally {
  rmSync(dual, { recursive: true, force: true })
}

// ── Unknown runtime → non-zero exit, fail-loud message (runtimeSkillsDir's throw) ──
const unknown = fixture(['ki-kb'], ['bogus-runtime'])
try {
  const { code, out } = runLink(unknown)
  check('unknown runtime → non-zero exit', code !== 0)
  check('unknown runtime → fail-loud message names the runtime', out.includes('bogus-runtime'))
} finally {
  rmSync(unknown, { recursive: true, force: true })
}

const quotedRuntime = fixture([])
try {
  writeFileSync(join(quotedRuntime, '.ki-config.toml'), '["ki-repo"]\ntarget_runtimes = ["codex"]\n["ki-kb"]\n')
  const { code } = runLink(quotedRuntime)
  check('quoted repo/runtime table → exit 0', code === 0)
  check('quoted repo/runtime table → codex path selected', existsSync(join(quotedRuntime, '.agents', 'skills', 'ki-kb')))
  check('quoted repo/runtime table → default Claude path not selected', !existsSync(join(quotedRuntime, '.claude', 'skills')))
} finally {
  rmSync(quotedRuntime, { recursive: true, force: true })
}

const multilineRuntime = fixture([])
try {
  writeFileSync(join(multilineRuntime, '.ki-config.toml'), '[ki-kb]\nnote = """\ntarget_runtimes = ["codex"]\n"""\n')
  const { code } = runLink(multilineRuntime)
  check('multiline runtime lookalike → exit 0', code === 0)
  check('multiline runtime lookalike → ignored in favour of default', existsSync(join(multilineRuntime, '.claude', 'skills', 'ki-kb')))
  check('multiline runtime lookalike → does not select codex path', !existsSync(join(multilineRuntime, '.agents', 'skills')))
} finally {
  rmSync(multilineRuntime, { recursive: true, force: true })
}

const development = fixture(['ki-kb'])
try {
  const normal = runLink(development)
  const linked = spawnSync('bun', [LINKER, development, '--development'], { encoding: 'utf8' })
  check('normal copy → exits cleanly before local development linking', normal.code === 0)
  check('development link → requires and accepts explicit intent', linked.status === 0)
  check(
    'development link → replaces generated copy with a symlink',
    lstatSync(join(development, '.claude', 'skills', 'ki-kb')).isSymbolicLink()
  )
  const accidental = spawnSync('bun', [LINKER, development], { encoding: 'utf8' })
  check('legacy link entry point → refuses without explicit development intent', accidental.status !== 0)
} finally {
  rmSync(development, { recursive: true, force: true })
}

if (failed) {
  console.log('\n\x1b[31mlink-skills.test.ts: failures\x1b[0m')
  process.exit(1)
}
console.log('\n\x1b[32mlink-skills.test.ts: all checks passed\x1b[0m')
