#!/usr/bin/env bun
/** Focused applicability tests for the ki-mcp checker. */
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const AUDIT = join(dirname(fileURLToPath(import.meta.url)), 'audit.ts')
let failed = false

function check(label: string, condition: boolean): void {
  console.log(`  ${condition ? 'ok  ' : 'FAIL'} ${label}`)
  if (!condition) failed = true
}

function fixture(): string {
  return mkdtempSync(join(tmpdir(), 'ki-mcp-applicability-'))
}

function run(root: string): { code: number; findings: Array<{ level: string; area: string }>; summary: { fail: number; na: number } } {
  const result = spawnSync(process.execPath, [AUDIT, root, '--json'], { encoding: 'utf8' })
  const json = JSON.parse(result.stdout) as { findings: Array<{ level: string; area: string }>; summary: { fail: number; na: number } }
  return { code: result.status ?? 1, ...json }
}

for (const [label, arrange, assert] of [
  [
    'absent and irrelevant reports one NA',
    (_root: string) => {},
    (r: ReturnType<typeof run>) => r.code === 0 && r.summary.na === 1 && r.findings.length === 1
  ],
  [
    'multiline string lookalike remains irrelevant',
    (root: string) => writeFileSync(join(root, '.ki-config.toml'), '[ki-repo]\nnote = """\n[ki-mcp]\n"""\n'),
    (r: ReturnType<typeof run>) => r.code === 0 && r.summary.na === 1 && r.findings.length === 1
  ],
  [
    'quoted declaration but incomplete runs the full audit',
    (root: string) => writeFileSync(join(root, '.ki-config.toml'), '["ki-mcp"]\n'),
    (r: ReturnType<typeof run>) => r.code !== 0 && r.summary.fail > 0 && r.summary.na === 0
  ],
  [
    'malformed config fails closed into the full audit',
    (root: string) => writeFileSync(join(root, '.ki-config.toml'), '[ki-mcp\n'),
    (r: ReturnType<typeof run>) => r.code !== 0 && r.summary.fail > 0 && r.summary.na === 0
  ],
  [
    'declared but incomplete runs the full audit',
    (root: string) => writeFileSync(join(root, '.ki-config.toml'), '[ki-mcp]\n'),
    (r: ReturnType<typeof run>) => r.code !== 0 && r.summary.fail > 0 && r.summary.na === 0
  ],
  [
    'structural marker without declaration runs the full audit',
    (root: string) => mkdirSync(join(root, 'src', 'mcp-server'), { recursive: true }),
    (r: ReturnType<typeof run>) => r.code !== 0 && r.summary.fail > 0 && r.summary.na === 0
  ],
  [
    'vitest.config.cjs activates the MCP coverage delta',
    (root: string) => {
      writeFileSync(join(root, '.ki-config.toml'), '[ki-mcp]\n')
      writeFileSync(join(root, 'vitest.config.cjs'), 'module.exports = {}\n')
    },
    (r: ReturnType<typeof run>) => r.findings.some((finding) => finding.area === 'TEST-1' && finding.level === 'WARN')
  ]
] as const) {
  const root = fixture()
  try {
    arrange(root)
    check(label, assert(run(root)))
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

if (failed) process.exit(1)
