#!/usr/bin/env bun
/**
 * Run-based behavioural test for `audit.ts`.
 *
 * ki-engineering §6 scopes unit-test coverage to `src/**` and names the harness as the
 * "run, not unit-tested" case for skill `scripts/`. So this spawns the real checker
 * against a throwaway memory store (via `--memory-dir`) and asserts on its output —
 * matching the convention `link-skills.test.ts` set.
 *
 * Covers IDX-6 (headroom:learn entries rooted in another repo) and the remediation
 * footer from the checker contract: a foreign-repo capture must WARN, cite IDX-6, and
 * print the CONFORM footer; a clean own-repo block must stay silent with no footer.
 */
import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const CHECKER = join(dirname(fileURLToPath(import.meta.url)), 'audit.ts')

let failed = false
function check(label: string, cond: boolean): void {
  if (cond) {
    console.log(`  \x1b[32mok\x1b[0m   ${label}`)
  } else {
    failed = true
    console.log(`  \x1b[31mFAIL\x1b[0m ${label}`)
  }
}

/** Build a throwaway memory store holding a MEMORY.md with the given learn-block body. */
function fixture(learnBody: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'ki-hk-memtest-'))
  const md = [
    '# Memory index',
    '',
    '- [Sample](sample.md) — a hook',
    '',
    '<!-- headroom:learn:start -->',
    learnBody,
    '<!-- headroom:learn:end -->',
    ''
  ].join('\n')
  writeFileSync(join(dir, 'MEMORY.md'), md)
  writeFileSync(
    join(dir, 'sample.md'),
    ['---', 'name: sample', 'description: "a sample memory"', 'metadata:', '  type: reference', '---', '', 'A fact.', ''].join('\n')
  )
  return dir
}

// The repo whose name the checker compares against — the positional path's basename.
const REPO = '/Users/x/kis/knowledgeislands/ki-agentic-harness'

function run(memDir: string): { code: number; out: string } {
  const res = spawnSync('bun', [CHECKER, REPO, '--memory-dir', memDir], { encoding: 'utf8' })
  return { code: res.status ?? 1, out: `${res.stdout ?? ''}${res.stderr ?? ''}` }
}

// ── Foreign: a learn-block line rooted in another KI repo → IDX-6 WARN + footer ──
const foreign = fixture('- Command `cd /Users/x/kis/knowledgeislands/arcadia-agentic-harness && bun run x` fails. Use Y instead.')
try {
  const { out } = run(foreign)
  check('foreign root → cites IDX-6', out.includes('IDX-6'))
  check('foreign root → WARN severity', /WARN\s+IDX-6/.test(out))
  check('foreign root → names the other repo', out.includes('arcadia-agentic-harness'))
  check('foreign root → names source-store remedy', out.includes('headroom memory list/show/delete --db-path'))
  check('foreign root → prints remediation footer', out.includes('/ki-housekeeping CONFORM'))
} finally {
  rmSync(foreign, { recursive: true, force: true })
}

// ── Control: a learn-block referencing only this repo → no IDX-6, no footer ──
const clean = fixture(
  '- Command `bun skills/repo-structure/ki-mcp/scripts/audit.ts ../mcp-gsuite` from knowledgeislands/ki-agentic-harness works.'
)
try {
  const { code, out } = run(clean)
  check('own-repo block → exit 0', code === 0)
  check('own-repo block → no IDX-6', !out.includes('IDX-6'))
  check('own-repo block → no footer', !out.includes('to address'))
} finally {
  rmSync(clean, { recursive: true, force: true })
}

if (failed) {
  console.log('\n\x1b[31maudit.test.ts: failures\x1b[0m')
  process.exit(1)
}
console.log('\n\x1b[32maudit.test.ts: all checks passed\x1b[0m')
