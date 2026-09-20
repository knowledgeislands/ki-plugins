import { afterEach, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { batchReadme, createChangeManagementSession } from './change-management.ts'

const temporaryDirectories: string[] = []

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

const audit = (config: string) => {
  const repository = mkdtempSync(join(tmpdir(), 'ki-work-'))
  temporaryDirectories.push(repository)
  writeFileSync(join(repository, '.ki.toml'), config)
  return createChangeManagementSession({
    mode: 'audit',
    repository,
    userHome: '/tmp',
    configuration: {}
  }).subjects[0]?.context().selection.outcomes
}

test('requires the selected adapter to be declared and applicable', () => {
  expect(audit('[skills.ki-work]\nadapter = "roadmap"\n')).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ status: 'VIOLATION', message: expect.stringContaining('ki-work-roadmap') })
    ])
  )
  expect(audit('[skills.ki-work]\nadapter = "roadmap"\n')).not.toEqual(
    expect.arrayContaining([expect.objectContaining({ status: 'PASS' })])
  )
  expect(
    audit('[skills.ki-repo]\nrepo_type = "kb"\n\n[skills.ki-work]\nadapter = "roadmap"\n\n[skills.ki-work-roadmap]\n')
  ).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ status: 'VIOLATION', message: expect.stringContaining('not kb') })
    ])
  )
})

test('resolves valid local and remote adapters from declared tables', () => {
  expect(audit('[skills.ki-work]\nadapter = "roadmap"\n\n[skills.ki-work-roadmap]\n')).toEqual([
    expect.objectContaining({ status: 'PASS', message: expect.stringContaining('ki-work-roadmap') })
  ])
  expect(
    audit(
      '[skills.ki-repo]\nrepo_type = "kb"\n\n[skills.ki-work]\nadapter = "kb-streams"\n\n[skills.ki-repo-kb-streams]\n'
    )
  ).toEqual([expect.objectContaining({ status: 'PASS', message: expect.stringContaining('ki-repo-kb-streams') })])
  expect(audit('[skills.ki-work]\nadapter = "linear"\n\n[skills.ki-work-linear]\n')).toEqual([
    expect.objectContaining({ status: 'PASS', message: expect.stringContaining('ki-work-linear') })
  ])
})

test('a declared work capability requires and can restore the retained batch scaffold', () => {
  const repository = mkdtempSync(join(tmpdir(), 'ki-work-scaffold-'))
  temporaryDirectories.push(repository)
  mkdirSync(join(repository, '+'))
  writeFileSync(join(repository, '.ki.toml'), '[skills.ki-work]\nadapter = "roadmap"\n\n[skills.ki-work-roadmap]\n')
  const session = createChangeManagementSession({
    mode: 'conform',
    repository,
    userHome: '/tmp',
    configuration: { skills: { 'ki-work': { adapter: 'roadmap' } } }
  })
  const scaffold = session.subjects[0]?.context().scaffold
  expect(scaffold?.outcomes[0]?.status).toBe('VIOLATION')

  scaffold?.ensureScaffold?.()
  expect(session.proposal()).toEqual({
    writes: [{ path: batchReadme.path, content: batchReadme.content, create: true }]
  })
})
