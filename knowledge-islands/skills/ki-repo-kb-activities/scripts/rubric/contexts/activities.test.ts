import { afterEach, expect, test } from 'bun:test'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { RubricContextOptions } from '../../shared/rubric.ts'
import { ACT } from '../items/activities.ts'
import { createActivitiesSession } from './activities.ts'

const temporaryDirectories: string[] = []

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

const temporaryDirectory = (prefix: string): string => {
  const directory = mkdtempSync(join(tmpdir(), prefix))
  temporaryDirectories.push(directory)
  return directory
}

const options = (
  repository: string,
  mode: 'audit' | 'conform',
  configuration: Readonly<Record<string, unknown>> = {}
): RubricContextOptions => ({
  mode,
  repository,
  userHome: tmpdir(),
  configuration
})

const activityBase = (): string => {
  const repository = temporaryDirectory('ki-repo-kb-activities-')
  const activities = join(repository, 'Admin', 'Operations', 'Activities')
  mkdirSync(activities, { recursive: true })
  writeFileSync(
    join(activities, 'Morning Briefing.md'),
    [
      '---',
      'status: active',
      'realization: scheduled-task',
      'schedule_name: Morning Briefing',
      'author: Test',
      '---',
      '# Morning Briefing',
      ''
    ].join('\n')
  )
  return repository
}

const activityContext = (session: ReturnType<typeof createActivitiesSession>) => {
  const subject = session.subjects[0]
  if (!subject) throw new Error('ki-repo-kb-activities session did not expose its repository subject')
  return ACT.selectContext(subject.context())
}

const indexItem = () => {
  const item = ACT.items.find((candidate) => candidate.code === 'ACT-S-1')
  if (!item?.mechanical) throw new Error('ACT-S-1 mechanical item is missing')
  return item.mechanical
}

test('audit is read-only and returns one stable prepared context', () => {
  const repository = activityBase()
  const session = createActivitiesSession(options(repository, 'audit'))
  const subject = session.subjects[0]
  const context = activityContext(session)

  expect(subject?.context()).toBe(subject?.context())
  expect(context.ensureIndex).toBeUndefined()
  expect(indexItem().audit.run(context)[0]?.status).toBe('VIOLATION')
  expect(session.proposal()).toEqual({ writes: [] })
  expect(existsSync(join(repository, 'Admin', 'Operations', 'Activities', 'Activities.md'))).toBe(false)
})

test('the index item stages one idempotent create behind the session proposal', () => {
  const repository = activityBase()
  const session = createActivitiesSession(options(repository, 'conform'))
  const context = activityContext(session)

  indexItem().conform?.run(context)
  indexItem().conform?.run(context)

  expect(session.proposal()).toEqual({
    writes: [
      {
        path: 'Admin/Operations/Activities/Activities.md',
        content: '# Activities\n\n- [Morning Briefing](<Morning Briefing.md>)\n',
        create: true
      }
    ]
  })
  expect(existsSync(join(repository, 'Admin', 'Operations', 'Activities', 'Activities.md'))).toBe(false)
})

test('a configured collection path produces one bounded index proposal', () => {
  const repository = temporaryDirectory('ki-repo-kb-activities-alias-')
  const activities = join(repository, 'Operations', 'Activity Register')
  mkdirSync(activities, { recursive: true })
  writeFileSync(join(activities, 'Manual Review.md'), '# Manual Review\n')
  const session = createActivitiesSession(
    options(repository, 'conform', { activities_dir: 'Operations/Activity Register' })
  )

  indexItem().conform?.run(activityContext(session))

  expect(session.proposal().writes.map((write) => write.path)).toEqual(['Operations/Activity Register/Activities.md'])
})

test('an index symlink is neither followed nor proposed for replacement', () => {
  const repository = activityBase()
  const outside = join(temporaryDirectory('ki-repo-kb-activities-outside-'), 'outside.md')
  writeFileSync(outside, 'outside\n')
  symlinkSync(outside, join(repository, 'Admin', 'Operations', 'Activities', 'Activities.md'))
  const session = createActivitiesSession(options(repository, 'conform'))

  indexItem().conform?.run(activityContext(session))

  expect(session.proposal()).toEqual({ writes: [] })
  expect(readFileSync(outside, 'utf8')).toBe('outside\n')
})

test('a configured collection cannot traverse an intermediate symlink', () => {
  const repository = temporaryDirectory('ki-repo-kb-activities-root-')
  const outside = temporaryDirectory('ki-repo-kb-activities-linked-')
  mkdirSync(join(outside, 'Activities'), { recursive: true })
  writeFileSync(join(outside, 'Activities', 'Escaped.md'), '# Escaped\n')
  symlinkSync(outside, join(repository, 'linked'))
  const session = createActivitiesSession(options(repository, 'conform', { activities_dir: 'linked/Activities' }))

  indexItem().conform?.run(activityContext(session))

  expect(session.proposal()).toEqual({ writes: [] })
  expect(existsSync(join(outside, 'Activities', 'Activities.md'))).toBe(false)
})
