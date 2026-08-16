import { afterEach, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { RubricItem } from '../../shared/rubric.ts'
import type { ClaudeContext } from '../contexts/agents.ts'
import catalogue from './index.ts'

const temporary: string[] = []
afterEach(() => {
  temporary.splice(0).forEach((directory) => {
    rmSync(directory, { recursive: true, force: true })
  })
})
const fixture = (): string => {
  const repository = mkdtempSync(join(tmpdir(), 'ki-subagents-claude-'))
  temporary.push(repository)
  mkdirSync(join(repository, 'subagents'), { recursive: true })
  writeFileSync(
    join(repository, 'subagents', 'reviewer.md'),
    '---\nname: reviewer\ndescription: Reviews a bounded change.\n---\n\nRead evidence and return a review.\n'
  )
  return repository
}
const contextFor = (repository: string, name: string): ClaudeContext => {
  const session = catalogue.createSession({ mode: 'audit', repository, userHome: tmpdir(), configuration: {} })
  return session.subjects.find((subject) => subject.subject === `subagents/${name}.md`)?.context() as ClaudeContext
}
const items = catalogue.families.flatMap((family) => family.items as readonly RubricItem<unknown>[])
const item = (code: string) =>
  items.find((candidate) => candidate.code === code) as RubricItem<ClaudeContext> | undefined

test('the Claude adapter owns only native source mechanics and its publication', () => {
  expect(catalogue.name).toBe('ki-subagents-claude')
  expect(items.map((candidate) => candidate.code)).toEqual([
    'CLAUDE-1',
    'CLAUDE-2',
    'CLAUDE-3',
    'CLAUDE-4',
    'CLAUDE-5',
    'RUBRIC-1'
  ])
})

test('malformed YAML fails closed', () => {
  const repository = fixture()
  writeFileSync(join(repository, 'subagents', 'broken.md'), '---\nname: [broken\ndescription: Nope\n---\n\nBody\n')
  const context = contextFor(repository, 'broken')
  expect(item('CLAUDE-1')?.mechanical?.audit.run(context)[0]?.status).toBe('VIOLATION')
  expect(item('CLAUDE-2')?.mechanical?.audit.run(context)[0]?.status).toBe('NOT_APPLICABLE')
})

test('current Claude name grammar rejects digits and unsupported fields', () => {
  const repository = fixture()
  writeFileSync(
    join(repository, 'subagents', 'bad.md'),
    '---\nname: reviewer2\ndescription: Reviews.\nunknown: true\n---\n\nBody\n'
  )
  const context = contextFor(repository, 'bad')
  expect(item('CLAUDE-2')?.mechanical?.audit.run(context)[0]?.status).toBe('VIOLATION')
  expect(item('CLAUDE-3')?.mechanical?.audit.run(context)[0]?.status).toBe('VIOLATION')
})

test('duplicate source names fail without any write proposal', () => {
  const repository = fixture()
  writeFileSync(join(repository, 'subagents', 'other.md'), '---\nname: reviewer\ndescription: Other.\n---\n\nBody\n')
  const session = catalogue.createSession({ mode: 'conform', repository, userHome: tmpdir(), configuration: {} })
  const context = session.subjects
    .find((subject) => subject.subject === 'subagents/reviewer.md')
    ?.context() as ClaudeContext
  expect(item('CLAUDE-5')?.mechanical?.audit.run(context)[0]?.status).toBe('VIOLATION')
  expect(session.proposal().writes).toEqual([])
})
