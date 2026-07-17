#!/usr/bin/env bun
/**
 * Run-based behavioural test for `audit.ts`.
 *
 * ki-engineering §6 scopes unit-test coverage to `src/**` and names the harness as the
 * "run, not unit-tested" case for skill `scripts/`. So this spawns the real checker
 * against a throwaway project directory and asserts on its output — matching the
 * convention `link-skills.test.ts` set.
 *
 * Covers TOOL-4 cross-repo learned entries and TOOL-5 per-project Headroom URL/header
 * attribution, including conform's byte-preserving and fail-closed boundaries.
 */
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const CHECKER = join(dirname(fileURLToPath(import.meta.url)), 'audit.ts')
const CONFORM = join(dirname(fileURLToPath(import.meta.url)), 'conform.ts')

let failed = false
function check(label: string, cond: boolean): void {
  if (cond) {
    console.log(`  \x1b[32mok\x1b[0m   ${label}`)
  } else {
    failed = true
    console.log(`  \x1b[31mFAIL\x1b[0m ${label}`)
  }
}

/** Build a throwaway project dir named `repoName`, holding a CLAUDE.md learn block. */
function fixture(repoName: string, learnBody: string): { base: string; dir: string } {
  const base = mkdtempSync(join(tmpdir(), 'ki-tok-test-'))
  const dir = join(base, repoName)
  mkdirSync(dir, { recursive: true })
  const md = [
    '# CLAUDE.md',
    '',
    'Some orientation prose.',
    '',
    '<!-- headroom:learn:start -->',
    learnBody,
    '<!-- headroom:learn:end -->',
    ''
  ].join('\n')
  writeFileSync(join(dir, 'CLAUDE.md'), md)
  writeFileSync(join(dir, 'package.json'), `${JSON.stringify({ name: repoName }, null, 2)}\n`)
  return { base, dir }
}

function writeSettings(dir: string, text: string, name = 'settings.json'): string {
  const file = join(dir, '.claude', name)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, text)
  return file
}

function run(dir: string): { code: number; out: string } {
  const res = spawnSync('bun', [CHECKER, dir, '--no-user'], { encoding: 'utf8' })
  return { code: res.status ?? 1, out: `${res.stdout ?? ''}${res.stderr ?? ''}` }
}

function conform(dir: string, dryRun = false): { code: number; out: string } {
  const args = [CONFORM, dir]
  if (dryRun) args.push('--dry-run')
  const res = spawnSync('bun', args, { encoding: 'utf8' })
  return { code: res.status ?? 1, out: `${res.stdout ?? ''}${res.stderr ?? ''}` }
}

// ── Foreign: CLAUDE.md learn block rooted in another KI repo → TOOL-4 WARN + footer ──
{
  const { base, dir } = fixture('ki-agentic-harness', '- `cd /Users/x/kis/knowledgeislands/arcadia-agentic-harness && bun run x` — use Y.')
  try {
    const { out } = run(dir)
    check('foreign root → raises cross-repo learn warn', out.includes('headroom:learn block has'))
    check('foreign root → names the other repo', out.includes('arcadia-agentic-harness'))
    check('foreign root → prints remediation footer', out.includes('/ki-tokenomics CONFORM'))
  } finally {
    rmSync(base, { recursive: true, force: true })
  }
}

// ── TOOL-5: valid path, missing path, mismatch, and remote/custom ignore ──
{
  const { base, dir } = fixture('repo-valid', '')
  try {
    writeFileSync(join(dir, 'package.json'), `${JSON.stringify({ name: '@scope/scoped-name' })}\n`)
    writeSettings(dir, '{"env":{"ANTHROPIC_BASE_URL":"http://localhost:8787/p/repo-valid/"}}\n')
    const { out } = run(dir)
    check('valid repository path → TOOL-5 info', out.includes('scopes the local Headroom proxy to /p/repo-valid'))
    check('package name differs → repository basename wins', !out.includes('scoped-name'))
  } finally {
    rmSync(base, { recursive: true, force: true })
  }
}

{
  const { base, dir } = fixture('repo encoded', '')
  try {
    writeSettings(dir, '{"env":{"ANTHROPIC_BASE_URL":"http://localhost:8787/p/repo%20encoded"}}\n')
    const { out } = run(dir)
    check('URL-encoded repository path → decoded and accepted', out.includes('scopes the local Headroom proxy to /p/repo encoded'))
  } finally {
    rmSync(base, { recursive: true, force: true })
  }
}

{
  const { base, dir } = fixture('repo-missing', '')
  try {
    writeSettings(dir, '{"env":{"ANTHROPIC_BASE_URL":"http://127.0.0.1:8787"}}\n')
    const { out } = run(dir)
    check('bare canonical proxy → missing project scope warn', out.includes('missing /p/repo-missing'))
    check('recognized project proxy → suppresses false TOOL-2 absent warn', !out.includes('no context-compression layer detected'))
  } finally {
    rmSync(base, { recursive: true, force: true })
  }
}

{
  const { base, dir } = fixture('repo-ambiguous', '')
  try {
    const file = writeSettings(
      dir,
      '{"ANTHROPIC_BASE_URL":"http://localhost:8787/p/decoy","env":{"ANTHROPIC_BASE_URL":"http://localhost:8787"}}\n'
    )
    const before = readFileSync(file, 'utf8')
    const result = conform(dir)
    check('duplicate URL key → conform is fail-closed advisory', result.out.includes('could not identify one unambiguous'))
    check('duplicate URL key → conform preserves bytes', readFileSync(file, 'utf8') === before)
  } finally {
    rmSync(base, { recursive: true, force: true })
  }
}

{
  const { base, dir } = fixture('repo-right', '')
  try {
    writeSettings(dir, '{"env":{"ANTHROPIC_BASE_URL":"http://[::1]:8787/p/repo-wrong"}}\n')
    const { out } = run(dir)
    check('wrong loopback project path → mismatch warn', out.includes('scopes repo-wrong; expected /p/repo-right'))
  } finally {
    rmSync(base, { recursive: true, force: true })
  }
}

{
  const { base, dir } = fixture('repo-ignore', '')
  try {
    writeSettings(dir, '{"env":{"ANTHROPIC_BASE_URL":"https://api.anthropic.com/p/wrong"}}\n')
    const remote = run(dir).out
    writeSettings(dir, '{"env":{"ANTHROPIC_BASE_URL":"http://localhost:9999"}}\n')
    const custom = run(dir).out
    check('remote URL → ignored by TOOL-5', !remote.includes('[TOOL-5]'))
    check('unscoped custom-port URL → ignored by TOOL-5', !custom.includes('[TOOL-5]'))
  } finally {
    rmSync(base, { recursive: true, force: true })
  }
}

{
  const { base, dir } = fixture('repo-non-headroom-path', '')
  try {
    const file = writeSettings(dir, '{"env":{"ANTHROPIC_BASE_URL":"http://localhost:8787/not-headroom"}}\n')
    const before = readFileSync(file, 'utf8')
    const audit = run(dir).out
    const result = conform(dir)
    check('canonical port with foreign path → ignored by TOOL-5 audit', !audit.includes('[TOOL-5]'))
    check('canonical port with foreign path → conform preserves bytes', readFileSync(file, 'utf8') === before)
    check('canonical port with foreign path → no conform TOOL-5 finding', !result.out.includes('[TOOL-5]'))
  } finally {
    rmSync(base, { recursive: true, force: true })
  }
}

{
  const { base, dir } = fixture('repo-query-root', '')
  try {
    const file = writeSettings(dir, '{"env":{"ANTHROPIC_BASE_URL":"http://localhost:8787/?mode=other#fragment"}}\n')
    const before = readFileSync(file, 'utf8')
    const audit = run(dir).out
    conform(dir)
    check('root URL with query/hash → conservatively ignored', !audit.includes('[TOOL-5]'))
    check('root URL with query/hash → conform preserves bytes', readFileSync(file, 'utf8') === before)
  } finally {
    rmSync(base, { recursive: true, force: true })
  }
}

// ── Effective settings precedence and the higher-priority project header ──
{
  const { base, dir } = fixture('repo-precedence', '')
  try {
    writeSettings(dir, '{"env":{"ANTHROPIC_BASE_URL":"http://localhost:8787"}}\n')
    writeSettings(dir, '{"env":{"ANTHROPIC_BASE_URL":"http://localhost:8787/p/repo-precedence"}}\n', 'settings.local.json')
    const { out } = run(dir)
    check('settings.local effective URL → base mismatch ignored', !out.includes('missing /p/repo-precedence'))
    check('settings.local effective URL → valid info', out.includes('settings.local.json scopes'))
  } finally {
    rmSync(base, { recursive: true, force: true })
  }
}

{
  const { base, dir } = fixture('repo-header', '')
  try {
    writeSettings(
      dir,
      '{"env":{"ANTHROPIC_BASE_URL":"http://localhost:8787","ANTHROPIC_CUSTOM_HEADERS":"Other: x\\nX-Headroom-Project: repo%2Dheader"}}\n'
    )
    const matching = run(dir).out
    writeSettings(
      dir,
      '{"env":{"ANTHROPIC_BASE_URL":"http://localhost:8787/p/repo-header","ANTHROPIC_CUSTOM_HEADERS":"X-Headroom-Project: wrong"}}\n'
    )
    const mismatch = run(dir).out
    check('percent-encoded matching header → bare URL is attributed', matching.includes('via header'))
    check('mismatched project header → warns despite valid path', mismatch.includes('header overrides the URL path'))
    const file = join(dir, '.claude', 'settings.json')
    const before = readFileSync(file, 'utf8')
    const conformed = conform(dir)
    check('mismatched project header → conform is advisory', conformed.out.includes('header wins over the URL'))
    check('mismatched project header → conform preserves URL bytes', readFileSync(file, 'utf8') === before)
  } finally {
    rmSync(base, { recursive: true, force: true })
  }
}

// ── Malformed files are preserved and surgical conform changes no unrelated byte ──
{
  const { base, dir } = fixture('repo-malformed', '')
  try {
    const file = writeSettings(dir, '{"env": {"ANTHROPIC_BASE_URL": "http://localhost:8787"}\n')
    const before = readFileSync(file, 'utf8')
    const audit = run(dir).out
    const result = conform(dir)
    check(
      'malformed settings → audit warns inspection unavailable',
      audit.includes('malformed — Headroom project scope cannot be inspected')
    )
    check('malformed settings → conform is advisory', result.out.includes('preserve it and inspect Headroom project scope manually'))
    check('malformed settings → conform preserves bytes', readFileSync(file, 'utf8') === before)
  } finally {
    rmSync(base, { recursive: true, force: true })
  }
}

{
  const { base, dir } = fixture('repo-malformed-local', '')
  try {
    const file = writeSettings(dir, '{"env":{"ANTHROPIC_BASE_URL":"http://localhost:8787"}}\n')
    writeSettings(dir, '{"env":', 'settings.local.json')
    const before = readFileSync(file, 'utf8')
    conform(dir)
    check('malformed local override → base settings preserved', readFileSync(file, 'utf8') === before)
  } finally {
    rmSync(base, { recursive: true, force: true })
  }
}

{
  const { base, dir } = fixture('repo-preserve', '')
  try {
    const before = [
      '{',
      '  "env" : {',
      '    "UNCHANGED": "alpha",',
      '    "ANTHROPIC_BASE_URL" : "http://127.0.0.1:8787"',
      '  },',
      '  "permissions": { "allow": ["Read"] }',
      '}',
      ''
    ].join('\n')
    const file = writeSettings(dir, before)
    const result = conform(dir)
    const expected = before.replace('"http://127.0.0.1:8787"', '"http://127.0.0.1:8787/p/repo-preserve"')
    check('conform scoped URL → POLISH', result.out.includes('scoped local Headroom URL to /p/repo-preserve'))
    check('conform scoped URL → preserves every unrelated byte', readFileSync(file, 'utf8') === expected)
    const once = readFileSync(file, 'utf8')
    const second = conform(dir)
    check('conform second run → already-valid PASS', second.out.includes('already scopes /p/repo-preserve'))
    check('conform second run → idempotent bytes', readFileSync(file, 'utf8') === once)
  } finally {
    rmSync(base, { recursive: true, force: true })
  }
}

{
  const { base, dir } = fixture('repo-dry-run', '')
  try {
    const file = writeSettings(dir, '{"env":{"ANTHROPIC_BASE_URL":"http://localhost:8787/p/wrong"}}\n')
    const before = readFileSync(file, 'utf8')
    const result = conform(dir, true)
    check('dry-run → reports would-change POLISH', result.out.includes('would scope local Headroom URL to /p/repo-dry-run'))
    check('dry-run → writes nothing', readFileSync(file, 'utf8') === before)
  } finally {
    rmSync(base, { recursive: true, force: true })
  }
}

{
  const { base, dir } = fixture('repo-local', '')
  try {
    const file = writeSettings(dir, '{"env":{"ANTHROPIC_BASE_URL":"http://localhost:8787"}}\n', 'settings.local.json')
    const before = readFileSync(file, 'utf8')
    const result = conform(dir)
    check('settings.local URL → fail-closed advisory', result.out.includes('may be runtime-owned; correct it manually'))
    check('settings.local URL → not rewritten', readFileSync(file, 'utf8') === before)
  } finally {
    rmSync(base, { recursive: true, force: true })
  }
}

// ── Control: CLAUDE.md learn block referencing only this repo → no TOOL-4 ──
{
  const { base, dir } = fixture(
    'ki-agentic-harness',
    '- `bun skills/repo-structure/ki-mcp/scripts/audit.ts ../mcp-gsuite` from knowledgeislands/ki-agentic-harness.'
  )
  try {
    const { out } = run(dir)
    check('own-repo block → no cross-repo learn warn', !out.includes('headroom:learn block has'))
  } finally {
    rmSync(base, { recursive: true, force: true })
  }
}

if (failed) {
  console.log('\n\x1b[31maudit.test.ts: failures\x1b[0m')
  process.exit(1)
}
console.log('\n\x1b[32maudit.test.ts: all checks passed\x1b[0m')
