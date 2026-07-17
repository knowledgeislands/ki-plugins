#!/usr/bin/env bun

import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const scripts = dirname(fileURLToPath(import.meta.url))
const fixture = mkdtempSync(join(tmpdir(), 'ki-dotfiles-chezmoi-'))
let failed = false

function check(label: string, condition: boolean): void {
  if (condition) console.log(`  \x1b[32mok\x1b[0m   ${label}`)
  else {
    failed = true
    console.log(`  \x1b[31mFAIL\x1b[0m ${label}`)
  }
}

function run(script: string, extraArgs: string[] = []): { status: number | null; findings: Array<{ area: string; level: string }> } {
  const result = spawnSync('bun', [join(scripts, script), fixture, ...extraArgs, '--json'], { encoding: 'utf8' })
  let findings: Array<{ area: string; level: string }> = []
  try {
    findings = JSON.parse(result.stdout).findings ?? []
  } catch {
    // The assertions below report the failed invocation and missing finding.
  }
  return { status: result.status, findings }
}

try {
  writeFileSync(join(fixture, '.chezmoiignore'), '')

  const audit = run('audit.ts')
  check('AUDIT exits cleanly', audit.status === 0)
  check(
    'AUDIT surfaces CONFIG-J1 exactly once',
    audit.findings.filter((finding) => finding.area === 'CONFIG-J1' && finding.level === 'ADVISORY').length === 1
  )

  const conform = run('conform.ts', ['--dry-run'])
  check('CONFORM dry-run exits cleanly', conform.status === 0)
  check(
    'CONFORM surfaces CONFIG-J1 exactly once',
    conform.findings.filter((finding) => finding.area === 'CONFIG-J1' && finding.level === 'ADVISORY').length === 1
  )
} finally {
  rmSync(fixture, { recursive: true, force: true })
}

if (failed) process.exit(1)
console.log('\n\x1b[32mjudgment-surface.test.ts: all checks passed\x1b[0m')
