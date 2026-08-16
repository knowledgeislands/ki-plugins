import { afterEach, expect, test } from 'bun:test'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createGitHubIssuesSession } from './change-management.ts'

const temporaryDirectories: string[] = []

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

const sessionFor = (content: string) => {
  const repository = mkdtempSync(join(tmpdir(), 'ki-github-adapter-'))
  temporaryDirectories.push(repository)
  writeFileSync(join(repository, '.ki-config.toml'), content)
  return createGitHubIssuesSession({ mode: 'audit', repository, userHome: tmpdir(), configuration: {} })
}

test('GitHub adapter requires inspectable lifecycle metadata without remote execution', () => {
  const session = sessionFor(`
[skills.ki-work]
adapter = "github-issues"

[skills.ki-work-github-issues]
repository = "knowledgeislands/example"
metadata_owner = "repository-maintainers"
dependencies = "native blocked-by/blocking"
hierarchy = "native sub-issues only"

[skills.ki-work-github-issues.lifecycle]
queue = "queued"
ready = "ready"
review = "awaiting-review"
done = "closed"
`)
  const context = session.subjects[0]?.context()
  expect(context?.mapping.outcomes.every((outcome) => outcome.status === 'PASS')).toBeTrue()
  expect(session.proposal()).toEqual({ writes: [] })
})

test('GitHub adapter fails closed on an incomplete mapping', () => {
  const session = sessionFor(`
[skills.ki-work]
adapter = "github-issues"

[skills.ki-work-github-issues]
repository = "knowledgeislands/example"
dependencies = "relations"
hierarchy = "relations"

[skills.ki-work-github-issues.lifecycle]
queue = "queued"
done = "closed"
`)
  const outcomes = session.subjects[0]?.context().mapping.outcomes ?? []
  expect(outcomes).toEqual(expect.arrayContaining([expect.objectContaining({ status: 'VIOLATION' })]))
  expect(session.proposal()).toEqual({ writes: [] })
})
