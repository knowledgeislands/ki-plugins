#!/usr/bin/env bun
/**
 * Run-based behavioural test for `recap-grounding.ts`.
 *
 * ki-engineering §6 scopes unit-test coverage to `src/**` and names the harness as the
 * "run, not unit-tested" case for skill `scripts/`. So this spawns the real helper
 * against a throwaway repo + transcript fixture — matching the convention
 * `audit.test.ts` set.
 */
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, utimesSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HELPER = join(dirname(fileURLToPath(import.meta.url)), 'recap-grounding.ts')

let failed = false
function check(label: string, cond: boolean): void {
  if (cond) {
    console.log(`  \x1b[32mok\x1b[0m   ${label}`)
  } else {
    failed = true
    console.log(`  \x1b[31mFAIL\x1b[0m ${label}`)
  }
}

function toolUseLine(name: string, input: unknown): string {
  return JSON.stringify({ message: { content: [{ type: 'tool_use', name, input }] } })
}

const repoDir = mkdtempSync(join(tmpdir(), 'ki-recap-repo-'))
spawnSync('git', ['init', '-q'], { cwd: repoDir })
writeFileSync(join(repoDir, 'tracked.txt'), 'hello\n')
spawnSync('git', ['add', 'tracked.txt'], { cwd: repoDir })
spawnSync('git', ['commit', '-q', '-m', 'educate'], { cwd: repoDir })
writeFileSync(join(repoDir, 'tracked.txt'), 'hello again\n')
writeFileSync(join(repoDir, 'new-file.txt'), 'new\n')

const transcriptsDir = mkdtempSync(join(tmpdir(), 'ki-recap-transcripts-'))
const lines = [
  toolUseLine('Read', { file_path: '/x/big.ts' }),
  toolUseLine('Read', { file_path: '/x/big.ts' }),
  toolUseLine('Edit', { file_path: '/x/big.ts', old_string: 'a', new_string: 'b' }),
  toolUseLine('Bash', { command: 'ls' }),
  toolUseLine('Bash', { command: 'ls' }),
  toolUseLine('Bash', { command: 'ls' })
]
const olderTranscript = join(transcriptsDir, 'session1.jsonl')
const newerTranscript = join(transcriptsDir, 'session2.jsonl')
writeFileSync(olderTranscript, lines.join('\n'))
writeFileSync(newerTranscript, toolUseLine('Task', { description: 'concurrent session' }))
const now = Date.now() / 1000
utimesSync(olderTranscript, now - 10, now - 10)
utimesSync(newerTranscript, now, now)

function run(...args: string[]): { code: number; out: string } {
  const res = spawnSync('bun', [HELPER, repoDir, '--json', '--transcripts-dir', transcriptsDir, ...args], {
    encoding: 'utf8'
  })
  return { code: res.status ?? 1, out: `${res.stdout ?? ''}${res.stderr ?? ''}` }
}

try {
  const { code, out } = run()
  check('exits 0', code === 0)
  const parsed = JSON.parse(out)
  check('defaults to the newest transcript', parsed.transcript === newerTranscript)

  const selected = run('--transcript', 'session1.jsonl')
  check('explicitly selects an older concurrent transcript', selected.code === 0)
  const selectedParsed = JSON.parse(selected.out)
  check('uses the requested transcript basename', selectedParsed.transcript === olderTranscript)
  check('reports files touched', Array.isArray(parsed.filesTouched) && parsed.filesTouched.length >= 2)
  check('tallies selected transcript tool calls', selectedParsed.toolTally.Bash === 3 && selectedParsed.toolTally.Read === 2)
  check(
    'flags repeated identical Bash call',
    selectedParsed.highCostCandidates.some((c: string) => c.includes('repeated identical Bash'))
  )
  check(
    'flags re-read of big.ts',
    selectedParsed.highCostCandidates.some((c: string) => c.includes('re-read of /x/big.ts'))
  )

  mkdirSync(join(transcriptsDir, 'directory.jsonl'))
  symlinkSync(olderTranscript, join(transcriptsDir, 'linked.jsonl'))
  for (const [label, selector] of [
    ['missing selector value', undefined],
    ['path traversal', '../session1.jsonl'],
    ['absolute path', olderTranscript],
    ['wrong extension', 'session1.txt'],
    ['missing file', 'missing.jsonl'],
    ['directory', 'directory.jsonl'],
    ['symlink', 'linked.jsonl']
  ] as const) {
    const rejected = selector === undefined ? run('--transcript') : run('--transcript', selector)
    check(`rejects ${label}`, rejected.code !== 0)
  }
} finally {
  rmSync(repoDir, { recursive: true, force: true })
  rmSync(transcriptsDir, { recursive: true, force: true })
}

// ── No transcript present → still succeeds, transcript null, no crash ──
const emptyTranscriptsDir = mkdtempSync(join(tmpdir(), 'ki-recap-empty-'))
const bareRepo = mkdtempSync(join(tmpdir(), 'ki-recap-bare-'))
spawnSync('git', ['init', '-q'], { cwd: bareRepo })
try {
  const res = spawnSync('bun', [HELPER, bareRepo, '--json', '--transcripts-dir', emptyTranscriptsDir], { encoding: 'utf8' })
  const parsed = JSON.parse(res.stdout ?? '{}')
  check('no transcript → null, exit 0', res.status === 0 && parsed.transcript === null)
} finally {
  rmSync(emptyTranscriptsDir, { recursive: true, force: true })
  rmSync(bareRepo, { recursive: true, force: true })
}

// ── Dotted repo path → resolves Claude's matching project-directory slug ──
const dottedFixtureRoot = mkdtempSync(join(tmpdir(), 'ki.recap-dotted-fixture-'))
const dottedRepo = join(dottedFixtureRoot, '.local', 'share', 'chezmoi')
const fixtureHome = join(dottedFixtureRoot, 'home')
const projectSlug = dottedRepo.replace(/[/.]/g, '-')
const dottedProjectDir = join(fixtureHome, '.claude', 'projects', projectSlug)
const dottedTranscript = join(dottedProjectDir, 'dotted-session.jsonl')
mkdirSync(dottedRepo, { recursive: true })
mkdirSync(dottedProjectDir, { recursive: true })
spawnSync('git', ['init', '-q'], { cwd: dottedRepo })
writeFileSync(dottedTranscript, toolUseLine('Read', { file_path: '/x/dotted.ts' }))
try {
  const res = spawnSync('bun', [HELPER, dottedRepo, '--json'], {
    encoding: 'utf8',
    env: { ...process.env, HOME: fixtureHome }
  })
  const parsed = JSON.parse(res.stdout ?? '{}')
  check('dotted repo path resolves its Claude project transcript', res.status === 0 && parsed.transcript === dottedTranscript)
} finally {
  rmSync(dottedFixtureRoot, { recursive: true, force: true })
}

if (failed) {
  console.log('\n\x1b[31mrecap-grounding.test.ts: failures\x1b[0m')
  process.exit(1)
}
console.log('\n\x1b[32mrecap-grounding.test.ts: all checks passed\x1b[0m')
