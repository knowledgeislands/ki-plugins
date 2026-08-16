import { afterEach, expect, test } from 'bun:test'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createLinearSession } from './change-management.ts'

const temporaryDirectories: string[] = []

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

const sessionFor = (content: string) => {
  const repository = mkdtempSync(join(tmpdir(), 'ki-linear-adapter-'))
  temporaryDirectories.push(repository)
  writeFileSync(join(repository, '.ki-config.toml'), content)
  return createLinearSession({ mode: 'audit', repository, userHome: tmpdir(), configuration: {} })
}

test('Linear adapter requires inspectable workflow metadata without remote execution', () => {
  const session = sessionFor(`
[skills.ki-work]
adapter = "linear"

[skills.ki-work-linear]
team = "ENG"
metadata_owner = "team-workflow-owner"
dependencies = "documented relation mapping"
hierarchy = "documented parent/sub-issue mapping"

[skills.ki-work-linear.lifecycle]
queue = "Backlog"
ready = "Todo"
review = "In Review"
done = "Done"
`)
  const context = session.subjects[0]?.context()
  expect(context?.mapping.outcomes.every((outcome) => outcome.status === 'PASS')).toBeTrue()
  expect(session.proposal()).toEqual({ writes: [] })
})

test('Linear adapter fails closed on an incomplete mapping', () => {
  const session = sessionFor(`
[skills.ki-work]
adapter = "linear"

[skills.ki-work-linear]
team = "ENG"
metadata_owner = "team-workflow-owner"
dependencies = "relations"
hierarchy = "relations"

[skills.ki-work-linear.lifecycle]
queue = "Backlog"
done = "Done"
`)
  const outcomes = session.subjects[0]?.context().mapping.outcomes ?? []
  expect(outcomes).toEqual(expect.arrayContaining([expect.objectContaining({ status: 'VIOLATION' })]))
  expect(session.proposal()).toEqual({ writes: [] })
})
