import { afterEach, expect, test } from 'bun:test'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { collectAuditFindings } from './audit.ts'

const roots: string[] = []

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

test('audit exposes a physical .ki tree even when a stale rule ignores it', async () => {
  const root = mkdtempSync(join(tmpdir(), 'ki-legacy-audit-'))
  roots.push(root)
  execFileSync('git', ['init', '--quiet', root])
  writeFileSync(join(root, '.gitignore'), '.ki/\n')
  mkdirSync(join(root, '.ki', 'audits'), { recursive: true })
  writeFileSync(join(root, '.ki', 'audits', 'report.json'), '{}')

  const findings = (await collectAuditFindings([root])).findings

  expect(findings).toContainEqual(
    expect.objectContaining({
      code: 'FILES-8',
      level: 'FAIL',
      message: expect.stringContaining('retired .ki output exists')
    })
  )
})
