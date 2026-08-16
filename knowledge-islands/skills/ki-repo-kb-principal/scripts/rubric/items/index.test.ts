import { expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import catalogue from './index.ts'

test('the principal catalogue has the expected native contract', () => {
  expect(catalogue.contract).toBe(1)
  expect(catalogue.name).toBe('ki-repo-kb-principal')
  expect(catalogue.families.map((family) => family.code)).toEqual(['RUBRIC', 'PRINCIPAL'])
  expect(catalogue.families[1]?.items.map((item) => item.code)).toEqual(['PRINCIPAL-1', 'PRINCIPAL-2'])
  for (const family of catalogue.families) {
    for (const item of family.items) {
      if (!item.mechanical) continue
      expect(item.mechanical.remediation.class).not.toBe('')
      if (item.mechanical.conform) expect(item.mechanical.remediation.class).toBe('automatic')
    }
  }
})

test('the principal checker distinguishes a missing surface from a complete one', () => {
  const repository = mkdtempSync(join(tmpdir(), 'ki-repo-kb-principal-rubric-'))
  const session = catalogue.createSession({ mode: 'audit', repository, userHome: tmpdir(), configuration: {} })
  const context = session.subjects[1]?.context()
  const family = catalogue.families[1]

  expect(context).toMatchObject({
    missing: expect.arrayContaining(['Admin/MEMORY.md']),
    empty: [],
    enactmentAnchor: false
  })

  for (const path of [
    'Admin/MEMORY.md',
    'Admin/Governance/Charter.md',
    'Admin/Governance/Known Lands.md',
    'Admin/Governance/Conventions/Conventions.md',
    'Admin/Operations/Processes/Enactment Process.md'
  ]) {
    mkdirSync(join(repository, path, '..'), { recursive: true })
    writeFileSync(join(repository, path), '# Record\n\nLocal structural orientation.\n')
  }
  writeFileSync(
    join(repository, 'AGENTS.md'),
    '# Guidance\n\nSubstantive changes to Admin, Pillars, and Resources must use the Enactment Process through Streams/Roadmap.\n'
  )

  const complete = catalogue
    .createSession({ mode: 'audit', repository, userHome: tmpdir(), configuration: {} })
    .subjects[1]?.context()
  const principal = family?.selectContext(complete as never) as {
    missing: readonly string[]
    empty: readonly string[]
    enactmentAnchor: boolean
  }
  expect(principal.missing).toEqual([])
  expect(principal.empty).toEqual([])
  expect(principal.enactmentAnchor).toBe(true)
})

test('empty structural entries and keyword-only orientation do not pass', () => {
  const repository = mkdtempSync(join(tmpdir(), 'ki-repo-kb-principal-empty-'))
  for (const path of [
    'Admin/MEMORY.md',
    'Admin/Governance/Charter.md',
    'Admin/Governance/Known Lands.md',
    'Admin/Governance/Conventions/Conventions.md',
    'Admin/Operations/Processes/Enactment Process.md'
  ]) {
    mkdirSync(join(repository, path, '..'), { recursive: true })
    writeFileSync(join(repository, path), '\n')
  }
  writeFileSync(join(repository, 'AGENTS.md'), 'Use the Enactment Process.\n')
  const context = catalogue
    .createSession({ mode: 'audit', repository, userHome: tmpdir(), configuration: {} })
    .subjects[1]?.context() as { empty: readonly string[]; enactmentAnchor: boolean }

  expect(context.empty).toHaveLength(5)
  expect(context.enactmentAnchor).toBe(false)
})
