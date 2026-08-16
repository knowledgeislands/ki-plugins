import { afterEach, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { RubricItem } from '../../shared/rubric.ts'
import { BOUNDARY } from '../items/boundary.ts'
import { LIFECYCLE } from '../items/lifecycle.ts'
import { RECORD } from '../items/records.ts'
import { STRUCTURE } from '../items/structure.ts'
import { type CheckpointsRubricContext, createCheckpointsSession } from './checkpoints.ts'

const temporaryDirectories: string[] = []

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

const fixture = (): { repository: string; checkpointDirectory: string } => {
  const repository = mkdtempSync(join(tmpdir(), 'ki-checkpoint-'))
  temporaryDirectories.push(repository)
  const checkpointDirectory = join(repository, '+', '_CHECKPOINTS')
  mkdirSync(checkpointDirectory, { recursive: true })
  return { repository, checkpointDirectory }
}

const record = ({
  thread = 'release-audit',
  state = 'active',
  retiredAt,
  body = ''
}: {
  thread?: string
  state?: 'active' | 'retired'
  retiredAt?: string
  body?: string
} = {}) =>
  [
    '---',
    'type: ki-checkpoint',
    `thread: ${thread}`,
    `state: ${state}`,
    'created_at: 2026-08-12T10:00:00Z',
    'updated_at: 2026-08-12T11:00:00Z',
    ...(retiredAt ? [`retired_at: ${retiredAt}`] : []),
    '---',
    '',
    `# ${thread}`,
    '',
    '## Objective',
    '',
    'Finish the release audit.',
    '',
    '## Current state',
    '',
    'The audit is ready for review.',
    '',
    '## Decisions made',
    '',
    'None',
    '',
    '## Files touched',
    '',
    'None',
    '',
    '## Open questions',
    '',
    'None',
    '',
    '## Next step',
    '',
    body || 'Ask the reviewer to approve the result.',
    ''
  ].join('\n')

const context = (repository: string): CheckpointsRubricContext => {
  const session = createCheckpointsSession({ mode: 'audit', repository, userHome: tmpdir(), configuration: {} })
  const value = session.subjects[0]?.context()
  if (!value) throw new Error('ki-checkpoint session did not expose its repository subject')
  return value
}

const mechanical = <Context>(family: { items: readonly RubricItem<Context>[] }, code: string) => {
  const item = family.items.find((candidate) => candidate.code === code)
  if (!item?.mechanical) throw new Error(`${code} mechanical item is missing`)
  return item.mechanical
}

test('absence is not applicable and audit never proposes authored writes', () => {
  const repository = mkdtempSync(join(tmpdir(), 'ki-checkpoint-absent-'))
  temporaryDirectories.push(repository)
  const session = createCheckpointsSession({ mode: 'conform', repository, userHome: tmpdir(), configuration: {} })

  expect(
    mechanical(STRUCTURE, 'STRUCTURE-1').audit.run(STRUCTURE.selectContext(session.subjects[0]?.context() as never))[0]
      ?.status
  ).toBe('NOT_APPLICABLE')
  expect(session.proposal()).toEqual({ writes: [] })
})

test('rejects unsafe structure, lifecycle collisions, and session locators', () => {
  const { repository, checkpointDirectory } = fixture()
  const retiredDirectory = join(checkpointDirectory, '_RETIRED')
  mkdirSync(retiredDirectory)
  writeFileSync(
    join(checkpointDirectory, 'release-audit.md'),
    record({ body: 'Resume https://example.test/conversation/abc.' })
  )
  writeFileSync(
    join(retiredDirectory, 'release-audit.md'),
    record({ state: 'retired', retiredAt: '2026-08-12T12:00:00Z' })
  )
  const outside = join(repository, 'outside.md')
  writeFileSync(outside, record())
  symlinkSync(outside, join(checkpointDirectory, 'linked.md'))
  const value = context(repository)

  expect(mechanical(STRUCTURE, 'STRUCTURE-1').audit.run(STRUCTURE.selectContext(value))[0]?.status).toBe('VIOLATION')
  expect(mechanical(LIFECYCLE, 'LIFECYCLE-1').audit.run(LIFECYCLE.selectContext(value))).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ message: expect.stringContaining('simultaneously active and retired') })
    ])
  )
  expect(mechanical(BOUNDARY, 'BOUNDARY-1').audit.run(BOUNDARY.selectContext(value))).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ message: expect.stringContaining('session or conversation locator') })
    ])
  )
})

test('closed schema refuses an unexpected runtime field', () => {
  const { repository, checkpointDirectory } = fixture()
  writeFileSync(
    join(checkpointDirectory, 'release-audit.md'),
    record().replace('updated_at: 2026-08-12T11:00:00Z', 'updated_at: 2026-08-12T11:00:00Z\nsession_id: hidden')
  )
  const value = context(repository)

  expect(mechanical(RECORD, 'RECORD-2').audit.run(RECORD.selectContext(value))[0]?.status).toBe('VIOLATION')
  expect(mechanical(BOUNDARY, 'BOUNDARY-1').audit.run(BOUNDARY.selectContext(value))[0]?.status).toBe('VIOLATION')
})

test('closed schema refuses a checkpoint-selected marker', () => {
  const { repository, checkpointDirectory } = fixture()
  writeFileSync(
    join(checkpointDirectory, 'release-audit.md'),
    record().replace('state: active', 'state: active\nselected: true')
  )
  const value = context(repository)

  expect(mechanical(RECORD, 'RECORD-2').audit.run(RECORD.selectContext(value))[0]?.status).toBe('VIOLATION')
})
