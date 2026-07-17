#!/usr/bin/env bun
/**
 * Run-based behavioural test for the global skills linker (`sync-skills.ts`), spawning
 * the real CLI against a scratch `$HOME` (ki-engineering §6 — no mocking).
 *
 * Covers the runtime-loop precedence added alongside the project linker: an explicit
 * `--target` runs once, standalone; otherwise the repo's declared `target_runtimes`
 * (`.ki-config.toml` [ki-repo]) are looped, each landing under its own `~/<runtime-dir>`.
 */
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const SYNC = join(HERE, 'sync-skills.ts')

let failed = false
function check(label: string, cond: boolean): void {
  if (cond) {
    console.log(`  \x1b[32mok\x1b[0m   ${label}`)
  } else {
    failed = true
    console.log(`  \x1b[31mFAIL\x1b[0m ${label}`)
  }
}

// sync-skills.ts is vendored standalone into `.ki-meta/bin/` (no `skills/` sibling), so
// unlike the self-locating project linker it discovers skills via `--root`'s `skills/`
// dir — the fixture must supply one, symlinked to the real harness skills root.
const REAL_SKILLS_ROOT = join(HERE, '..', '..', '..', '..', 'skills')

function repoFixture(runtimes: string[]): string {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'ki-boot-synctest-repo-')))
  writeFileSync(join(dir, '.ki-config.toml'), `[ki-repo]\ntarget_runtimes = [${runtimes.map((r) => `"${r}"`).join(', ')}]\n`)
  symlinkSync(REAL_SKILLS_ROOT, join(dir, 'skills'))
  return dir
}

function run(args: string[], home: string): { code: number; out: string } {
  const res = spawnSync('bun', [SYNC, ...args], { encoding: 'utf8', env: { ...process.env, HOME: home } })
  return { code: res.status ?? 1, out: `${res.stdout ?? ''}${res.stderr ?? ''}` }
}

// ── Global no-flag form loops the repo's declared runtimes ──
const dualRepo = repoFixture(['claude-code', 'codex'])
const home1 = realpathSync(mkdtempSync(join(tmpdir(), 'ki-boot-synctest-home-')))
try {
  const link1 = run(['link', '--only', 'ki-bootstrap', '--root', dualRepo], home1)
  check('global link (no flags, dual runtimes) → exit 0', link1.code === 0)
  check('global link → [claude-code] header printed', link1.out.includes('[claude-code]'))
  check('global link → [codex] header printed', link1.out.includes('[codex]'))
  check('global link → ~/.claude/skills/ki-bootstrap created', existsSync(join(home1, '.claude', 'skills', 'ki-bootstrap')))
  check('global link → ~/.agents/skills/ki-bootstrap created', existsSync(join(home1, '.agents', 'skills', 'ki-bootstrap')))

  const status1 = run(['status', '--only', 'ki-bootstrap', '--root', dualRepo], home1)
  check('global status → exit 0', status1.code === 0)
  check('global status → both linked', (status1.out.match(/linked/g) ?? []).length >= 2)

  const link1b = run(['link', '--only', 'ki-bootstrap', '--root', dualRepo], home1)
  check('global link → idempotent re-run exit 0', link1b.code === 0)

  const unlink1 = run(['unlink', '--only', 'ki-bootstrap', '--root', dualRepo], home1)
  check('global unlink → exit 0', unlink1.code === 0)
  check('global unlink → ~/.claude/skills/ki-bootstrap removed', !existsSync(join(home1, '.claude', 'skills', 'ki-bootstrap')))
  check('global unlink → ~/.agents/skills/ki-bootstrap removed', !existsSync(join(home1, '.agents', 'skills', 'ki-bootstrap')))
} finally {
  rmSync(dualRepo, { recursive: true, force: true })
  rmSync(home1, { recursive: true, force: true })
}

// ── Explicit --target pins a single directory; no runtime loop/header ──
const singleRepo = repoFixture(['claude-code', 'codex'])
const home2 = realpathSync(mkdtempSync(join(tmpdir(), 'ki-boot-synctest-home2-')))
const pinnedTarget = join(home2, 'pinned')
try {
  const linked = run(['link', '--only', 'ki-bootstrap', '--root', singleRepo, '--target', pinnedTarget], home2)
  check('explicit --target → exit 0', linked.code === 0)
  check('explicit --target → no runtime loop header', !linked.out.includes('[claude-code]') && !linked.out.includes('[codex]'))
  check('explicit --target → lands only at the pinned dir', existsSync(join(pinnedTarget, 'ki-bootstrap')))
  check('explicit --target → does not also land at ~/.claude/skills', !existsSync(join(home2, '.claude', 'skills', 'ki-bootstrap')))

  const clobber = run(['link', '--only', 'ki-bootstrap', '--root', singleRepo, '--target', pinnedTarget], home2)
  check('explicit --target → clobber-refusing re-run exit 0', clobber.code === 0)
} finally {
  rmSync(singleRepo, { recursive: true, force: true })
  rmSync(home2, { recursive: true, force: true })
}

// ── Codex-only declared repo, --target for a Codex-shaped scratch dir ──
const codexRepo = repoFixture(['codex'])
const home3 = realpathSync(mkdtempSync(join(tmpdir(), 'ki-boot-synctest-home3-')))
try {
  const link3 = run(['link', '--only', 'ki-bootstrap', '--root', codexRepo], home3)
  check('codex-only global link → exit 0', link3.code === 0)
  check('codex-only global link → ~/.agents/skills/ki-bootstrap created', existsSync(join(home3, '.agents', 'skills', 'ki-bootstrap')))
  check('codex-only global link → nothing under ~/.claude/skills', !existsSync(join(home3, '.claude', 'skills')))
} finally {
  rmSync(codexRepo, { recursive: true, force: true })
  rmSync(home3, { recursive: true, force: true })
}

if (failed) {
  console.log('\n\x1b[31msync-skills.test.ts: failures\x1b[0m')
  process.exit(1)
}
console.log('\n\x1b[32msync-skills.test.ts: all checks passed\x1b[0m')
