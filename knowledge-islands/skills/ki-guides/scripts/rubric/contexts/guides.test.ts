import { expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createGuidesSession } from './guides.ts'

const temporaryRepository = (): string => mkdtempSync(join(tmpdir(), 'ki-guides-'))

test('the session identifies the controlled root, guides, and retired roots', () => {
  const repository = temporaryRepository()
  mkdirSync(join(repository, 'docs/guides/developer'), { recursive: true })
  mkdirSync(join(repository, 'docs/spec'), { recursive: true })
  writeFileSync(join(repository, 'docs/guides/README.md'), '# Guides\n')
  writeFileSync(join(repository, 'docs/guides/developer/workflow.md'), '# Workflow\n')
  writeFileSync(
    join(repository, 'docs/guides/developer/example.md'),
    '# Example\n\n```sh\n# A shell comment, not an H1.\n```\n'
  )
  writeFileSync(join(repository, 'docs/guides/developer/broken.md'), 'No H1\n')

  const session = createGuidesSession({ mode: 'audit', repository, userHome: tmpdir(), configuration: {} })
  const context = session.subjects[1]?.context()
  if (!context) throw new Error('ki-guides session did not expose its repository subject')

  expect(context.layout).toEqual({
    directoryExists: true,
    indexExists: true,
    headingIssues: ['docs/guides/developer/broken.md']
  })
  expect(context.boundary.retiredRoots).toEqual(['docs/spec'])
  expect(session.proposal()).toEqual({ writes: [] })
})

test('a docs/logs path is left to its specialised owner', () => {
  const repository = temporaryRepository()
  mkdirSync(join(repository, 'docs/guides'), { recursive: true })
  mkdirSync(join(repository, 'docs/logs'), { recursive: true })
  writeFileSync(join(repository, 'docs/guides/README.md'), '# Guides\n')
  const session = createGuidesSession({ mode: 'audit', repository, userHome: tmpdir(), configuration: {} })
  const context = session.subjects[1]?.context()
  if (!context) throw new Error('ki-guides session did not expose its repository subject')

  expect(context.boundary.retiredRoots).toEqual([])
})
