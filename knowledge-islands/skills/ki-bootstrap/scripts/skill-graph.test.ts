#!/usr/bin/env bun

import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const script = join(dirname(fileURLToPath(import.meta.url)), 'skill-graph.ts')
const vendored = '.ki-meta/bin/skill-graph.ts'
const guide = 'docs/guides/user-guide/skills.md'
const source = readFileSync(guide, 'utf8')
const start = '<!-- BEGIN GENERATED SKILL GRAPH -->'
const temp = mkdtempSync(join(tmpdir(), 'ki-skill-graph-'))
let failed = false

function check(label: string, condition: boolean): void {
  if (condition) console.log(`  \x1b[32mok\x1b[0m   ${label}`)
  else {
    failed = true
    console.log(`  \x1b[31mFAIL\x1b[0m ${label}`)
  }
}

try {
  check('canonical command → matches vendored command byte-for-byte', readFileSync(script).equals(readFileSync(vendored)))

  const clean = spawnSync('bun', [script, '--check', '--check-doc', guide], { encoding: 'utf8' })
  check('current guide → passes generated-tree comparison', clean.status === 0)

  const stalePath = join(temp, 'stale.md')
  writeFileSync(stalePath, source.replace(`${start}\n\n\`\`\`text\nki-bootstrap`, `${start}\n\n\`\`\`text\nki-bootstrap-stale`))
  const stale = spawnSync('bun', [script, '--check', '--check-doc', stalePath], { encoding: 'utf8' })
  check('stale tree → fails', (stale.status ?? 0) !== 0)
  check('stale tree → explains regeneration', stale.stderr.includes('generated skill-graph block is stale'))

  const unmarkedPath = join(temp, 'unmarked.md')
  writeFileSync(unmarkedPath, source.replace(start, ''))
  const unmarked = spawnSync('bun', [script, '--check', '--check-doc', unmarkedPath], { encoding: 'utf8' })
  check('missing marker → fails', (unmarked.status ?? 0) !== 0)
  check('missing marker → names marker problem', unmarked.stderr.includes('missing or misordered generated skill-graph markers'))

  const duplicatePath = join(temp, 'duplicate.md')
  writeFileSync(duplicatePath, `${source}\n${start}\n`)
  const duplicate = spawnSync('bun', [script, '--check', '--check-doc', duplicatePath], { encoding: 'utf8' })
  check('duplicate marker → fails', (duplicate.status ?? 0) !== 0)
  check('duplicate marker → requires one region', duplicate.stderr.includes('markers must occur exactly once'))

  const absent = spawnSync('bun', [script, '--check', '--check-doc', join(temp, 'absent.md')], { encoding: 'utf8' })
  check('missing document → fails', (absent.status ?? 0) !== 0)
  check('missing document → names missing path', absent.stderr.includes('documentation path does not exist'))

  const missingArgument = spawnSync('bun', [script, '--check-doc'], { encoding: 'utf8' })
  check('missing --check-doc argument → usage error', missingArgument.status === 2)

  const conflict = spawnSync('bun', [script, '--check', '--tree', '--check-doc', guide], { encoding: 'utf8' })
  check('conflicting modes → usage error', conflict.status === 2)

  const unknown = spawnSync('bun', [script, '--check', '--chek-doc', guide], { encoding: 'utf8' })
  check('unknown flag → usage error', unknown.status === 2)
} finally {
  rmSync(temp, { recursive: true, force: true })
}

if (failed) process.exit(1)
console.log('\n\x1b[32mskill-graph.test.ts: all checks passed\x1b[0m')
