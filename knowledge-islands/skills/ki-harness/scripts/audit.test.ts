#!/usr/bin/env bun
/** Run-based regression tests for ki-harness's package-script ownership boundary. */
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, unlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const SCRIPTS_DIR = dirname(fileURLToPath(import.meta.url))
const AUDIT = join(SCRIPTS_DIR, 'audit.ts')
const CONFORM = join(SCRIPTS_DIR, 'conform.ts')
const RETIRED_SCRIPTS = ['ki:lint:check', 'ki:lint:types', 'ki:lint:md', 'ki:lint:md:check']
const AGGREGATE_SCRIPTS = ['ki:audit', 'ki:conform']
const ENGINEERING_SCRIPTS = [...RETIRED_SCRIPTS, ...AGGREGATE_SCRIPTS]
const RETIRED_HARNESS_SCRIPTS = ['ki:codegen']

type Finding = { level: string; area: string; msg: string }
type Run = { status: number | null; findings: Finding[] }

let failed = false
function check(label: string, condition: boolean): void {
  if (condition) console.log(`  \x1b[32mok\x1b[0m   ${label}`)
  else {
    failed = true
    console.log(`  \x1b[31mFAIL\x1b[0m ${label}`)
  }
}

function fixture(pkgScripts: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), 'ki-harness-test-'))
  for (const part of ['skills', 'agents', 'mcp', 'evals', 'hooks']) {
    mkdirSync(join(dir, part))
    writeFileSync(join(dir, part, 'README.md'), `# ${part}\n`)
  }
  writeFileSync(join(dir, 'CLAUDE.md'), '# Fixture\n')
  writeFileSync(join(dir, 'ROADMAP.md'), '# Roadmap\n')
  writeFileSync(join(dir, '.ki-config.toml'), '[ki-harness]\n\n[ki-repo]\n')
  writeFileSync(join(dir, 'package.json'), `${JSON.stringify({ scripts: pkgScripts }, null, 2)}\n`)
  return dir
}

function run(script: string, dir: string, extraArgs: string[] = []): Run {
  const result = spawnSync(process.execPath, [script, dir, ...extraArgs, '--json'], { encoding: 'utf8' })
  let findings: Finding[] = []
  try {
    findings = JSON.parse(result.stdout).findings ?? []
  } catch {
    // The assertions below report the failed invocation and missing findings.
  }
  return { status: result.status, findings }
}

const supportingScripts = {
  'ki:skills:link:project': 'true',
  'ki:skills:audit': 'true',
  'ki:skills:link:global': 'true',
  'ki:skills:status': 'true',
  'ki:skills:unlink': 'true',
  'ki:skills:refresh-status': 'true',
  'ki:eval': 'true'
}

const validFixture = fixture(supportingScripts)
try {
  const result = run(AUDIT, validFixture)
  const pkg3 = result.findings.filter((finding) => finding.area === 'PKG-3')
  check('valid harness audit exits cleanly', result.status === 0)
  check('valid harness without engineering scripts emits zero PKG-3 findings', pkg3.length === 0)

  const conform = run(CONFORM, validFixture, ['--dry-run'])
  check('valid harness conform dry-run exits cleanly', conform.status === 0)
  check(
    'conform never recommends engineering-owned script keys',
    ENGINEERING_SCRIPTS.every((key) => conform.findings.every((finding) => !finding.msg.includes(key)))
  )
  check(
    'conform never recommends retired harness script keys',
    RETIRED_HARNESS_SCRIPTS.every((key) => conform.findings.every((finding) => !finding.msg.includes(key)))
  )
} finally {
  rmSync(validFixture, { recursive: true, force: true })
}

const retiredFixture = fixture({
  ...supportingScripts,
  'ki:lint:check': 'true',
  'ki:lint:types': 'true',
  'ki:lint:md': 'true',
  'ki:lint:md:check': 'true'
})
try {
  const result = run(AUDIT, retiredFixture)
  const pkg3 = result.findings.filter((finding) => finding.area === 'PKG-3')
  check('retired-only fixture audit exits cleanly', result.status === 0)
  check('retired-only fixture emits zero PKG-3 findings', pkg3.length === 0)

  const conform = run(CONFORM, retiredFixture, ['--dry-run'])
  check('retired-only fixture conform dry-run exits cleanly', conform.status === 0)
  check(
    'retired-only conform never recommends engineering-owned script keys',
    ENGINEERING_SCRIPTS.every((key) => conform.findings.every((finding) => !finding.msg.includes(key)))
  )
} finally {
  rmSync(retiredFixture, { recursive: true, force: true })
}

const missingPackageFixture = fixture(supportingScripts)
try {
  unlinkSync(join(missingPackageFixture, 'package.json'))
  const result = run(AUDIT, missingPackageFixture)
  check('missing package.json emits zero PKG-3 findings', result.findings.filter((finding) => finding.area === 'PKG-3').length === 0)
} finally {
  rmSync(missingPackageFixture, { recursive: true, force: true })
}

if (failed) process.exit(1)
console.log('\n\x1b[32maudit.test.ts: all checks passed\x1b[0m')
