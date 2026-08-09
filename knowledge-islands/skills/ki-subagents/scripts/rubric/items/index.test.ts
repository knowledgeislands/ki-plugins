import { afterEach, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { AgentFileContext, AgentsRubricContext } from '../contexts/agents.ts'
import catalogue from './index.ts'

const items = catalogue.families.flatMap((family) => family.items as readonly RubricItem<unknown>[])
const temporaryDirectories: string[] = []
const familyModules = readdirSync(import.meta.dir)
  .filter((file) => file.endsWith('.ts') && file !== 'index.ts' && !file.endsWith('.test.ts'))
  .sort()

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

const fixture = (): string => {
  const repository = mkdtempSync(join(tmpdir(), 'ki-subagents-'))
  temporaryDirectories.push(repository)
  mkdirSync(join(repository, 'subagents', 'governance'), { recursive: true })
  writeFileSync(
    join(repository, 'subagents', 'governance', 'reviewer.md'),
    '---\r\nname: old-reviewer\r\ndescription: "Reviews code" when review is requested.\r\nmodel: inherit\r\n---\r\n\r\nReview carefully.\r\n'
  )
  writeFileSync(
    join(repository, 'subagents', 'writer.md'),
    '---\nname: writer\ndescription: Writes documents when authoring is requested.\n---\n\nWrite carefully.\n'
  )
  return repository
}

test('the structured catalogue preserves the complete ki-subagents rule surface', () => {
  expect(catalogue.contract).toBe(1)
  expect(catalogue.createSession).toBeFunction()
  expect(items.map((item) => item.code)).toEqual([
    'LAY-1',
    'LAY-2',
    'LAY-3',
    'NAME-1',
    'NAME-2',
    'NAME-3',
    'NAME-4',
    'NAME-5',
    'NAME-6',
    'DESC-1',
    'DESC-2',
    'DESC-3',
    'DESC-4',
    'DESC-5',
    'DESC-6',
    'DESC-7',
    'FM-1',
    'FM-2',
    'FM-3',
    'FM-4',
    'FM-5',
    'FM-6',
    'FM-7',
    'FM-8',
    'FM-9',
    'FM-10',
    'FM-11',
    'PROMPT-1',
    'PROMPT-2',
    'PROMPT-3',
    'PROMPT-4',
    'PROMPT-5',
    'PROMPT-6',
    'PROMPT-7',
    'LANE-1',
    'LANE-2',
    'LANE-3',
    'LANE-4',
    'LANE-5',
    'LINK-1',
    'LINK-2',
    'LINK-3',
    'PROC-1',
    'PROC-2',
    'LONG-1',
    'COLL-1',
    'COLL-2',
    'RUBRIC-1'
  ])
  expect(
    Object.fromEntries(items.filter((item) => item.mechanical).map((item) => [item.code, item.mechanical?.level]))
  ).toEqual({
    'LAY-1': 'FAIL',
    'LAY-3': 'WARN',
    'NAME-1': 'FAIL',
    'NAME-2': 'FAIL',
    'NAME-3': 'FAIL',
    'NAME-4': 'FAIL',
    'NAME-5': 'FAIL',
    'DESC-1': 'FAIL',
    'DESC-2': 'WARN',
    'DESC-3': 'FAIL',
    'FM-11': 'FAIL',
    'PROMPT-1': 'FAIL',
    'LINK-1': 'FAIL',
    'COLL-1': 'WARN',
    'RUBRIC-1': 'FAIL'
  })
  expect(items.filter((item) => item.judgment)).toHaveLength(33)
  expect(items.filter((item) => item.judgment).every((item) => Boolean(item.judgment?.prompt.trim()))).toBe(true)
  for (const item of items) {
    if (item.mechanical) {
      expect(item.mechanical.remediation.class).toBeDefined()
      if (item.code !== 'RUBRIC-1') expect(item.mechanical.conform).toBeUndefined()
    }
    if (item.judgment) {
      expect(item.judgment.scope).not.toBe('')
      expect(item.judgment.outcomes.length).toBeGreaterThan(0)
      expect(item.judgment.guidance).not.toBe('')
    }
  }
})

test('each family module exports one complete family', async () => {
  expect(familyModules).toHaveLength(11)
  for (const file of familyModules) {
    const module = (await import(`./${file}`)) as Record<string, unknown>
    expect(Object.keys(module)).toHaveLength(1)
    const family = Object.values(module)[0] as { code?: unknown; items?: unknown }
    expect(typeof family.code).toBe('string')
    expect(Array.isArray(family.items)).toBe(true)
  }
})

test('the session creates stable per-agent subjects and one set subject', () => {
  const session = catalogue.createSession({
    mode: 'audit',
    repository: fixture(),
    userHome: tmpdir(),
    configuration: {}
  })
  expect(session.subjects.slice(0, 3).map((subject) => subject.subject)).toEqual([
    'subagents/governance/reviewer.md',
    'subagents/writer.md',
    'subagents'
  ])
  for (const subject of session.subjects) expect(subject.context()).toBe(subject.context())
  expect(session.subjects.at(-2)?.families).toEqual(['COLL'])
  expect(session.subjects.at(-1)?.families).toEqual(['RUBRIC'])
  expect(session.proposal().writes).toEqual([])
})

test('filename alignment remains a diagnostic author decision', () => {
  const repository = fixture()
  const session = catalogue.createSession({ mode: 'conform', repository, userHome: tmpdir(), configuration: {} })
  const subject = session.subjects[0]
  const root = subject?.context() as AgentsRubricContext
  const family = catalogue.families.find((candidate) => candidate.code === 'LAY') as
    | RubricFamily<AgentsRubricContext, AgentFileContext>
    | undefined
  const item = family?.items.find((candidate) => candidate.code === 'LAY-3')
  if (!family || !item) throw new Error('LAY-3 is missing')
  const context = family.selectContext(root)
  expect(item.mechanical?.audit.run(context)[0]?.status).toBe('VIOLATION')
  expect(item.mechanical?.remediation?.class).toBe('diagnostic')
  expect(item.mechanical?.conform).toBeUndefined()
  expect(session.proposal().writes).toEqual([])
})

test('symlinked agent paths are refused without traversal or conform capability', () => {
  const repository = fixture()
  const external = mkdtempSync(join(tmpdir(), 'ki-subagents-external-'))
  temporaryDirectories.push(external)
  writeFileSync(join(external, 'outside.md'), '---\nname: outside\ndescription: Outside.\n---\n')
  symlinkSync(join(external, 'outside.md'), join(repository, 'subagents', 'outside.md'))
  const session = catalogue.createSession({ mode: 'conform', repository, userHome: tmpdir(), configuration: {} })
  const unsafe = session.subjects.find((subject) => subject.subject === 'subagents/outside.md')
  expect(unsafe).toBeDefined()
  const context = unsafe?.context() as AgentsRubricContext
  expect(context.file.agent).toBeNull()
  expect(context.file.requestNameAlignment).toBeUndefined()
  expect(
    session.subjects.some(
      (subject) => subject.subject?.includes('outside.md') && subject.context().file.agent?.name === 'outside'
    )
  ).toBe(false)
  expect(session.proposal().writes).toEqual([])
})
