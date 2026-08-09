import { afterEach, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createHousekeepingSession } from './housekeeping.ts'

const temporaryDirectories: string[] = []

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

const temporaryDirectory = (): string => {
  const directory = mkdtempSync(join(tmpdir(), 'ki-change-management-housekeeping-'))
  temporaryDirectories.push(directory)
  return directory
}

const options = (repository: string) => ({ mode: 'audit' as const, repository, userHome: tmpdir(), configuration: {} })

const outcomes = (repository: string) => {
  const session = createHousekeepingSession(options(repository))
  const subject = session.subjects.find((candidate) => candidate.families.includes('HOUSE'))
  if (!subject) throw new Error('ki-change-management-housekeeping session did not expose the housekeeping subject')
  return subject.context().templates.outcomes
}

const template = (id = 'KI-HARNESS-HK-001') =>
  [
    '---',
    `id: ${id}`,
    'status: active',
    'cadence: P1M',
    'last-run: null',
    'grace: P7D',
    'spawn-policy: when-due',
    'spawn-horizon: next',
    'active-run: null',
    '---',
    '',
    '# Monthly maintenance',
    ''
  ].join('\n')

test('accepts a valid non-KB housekeeping template', () => {
  const repository = temporaryDirectory()
  const root = join(repository, 'docs', 'housekeeping')
  mkdirSync(root, { recursive: true })
  writeFileSync(join(root, 'KI-HARNESS-HK-001-monthly-maintenance.md'), template())

  expect(outcomes(repository)).toEqual([
    {
      status: 'PASS',
      message: 'Housekeeping template has valid identity and schedule fields.',
      subject: 'docs/housekeeping/KI-HARNESS-HK-001-monthly-maintenance.md'
    }
  ])
})

test('reports an invalid schedule without mutating the template', () => {
  const repository = temporaryDirectory()
  const root = join(repository, 'docs', 'housekeeping')
  mkdirSync(root, { recursive: true })
  writeFileSync(
    join(root, 'KI-HARNESS-HK-001-monthly-maintenance.md'),
    template().replace('cadence: P1M', 'cadence: weekly')
  )

  expect(outcomes(repository)).toEqual([
    {
      status: 'VIOLATION',
      message: 'Housekeeping template has invalid identity, state, scheduling, or spawn fields.',
      subject: 'docs/housekeeping/KI-HARNESS-HK-001-monthly-maintenance.md'
    }
  ])
})

test('uses Streams Housekeeping for a KB configuration', () => {
  const repository = temporaryDirectory()
  const root = join(repository, 'Streams', 'Housekeeping')
  mkdirSync(root, { recursive: true })
  writeFileSync(join(repository, '.ki-config.toml'), '[skills.ki-repo]\nrepo_type = "kb"\n')
  writeFileSync(join(root, 'Housekeeping.md'), '# Housekeeping\n')
  writeFileSync(join(root, 'KI-BASE-HK-001-monthly-maintenance.md'), template('KI-BASE-HK-001'))

  expect(outcomes(repository)[0]?.subject).toBe('Streams/Housekeeping/KI-BASE-HK-001-monthly-maintenance.md')
  expect(outcomes(repository)[0]?.status).toBe('PASS')
})
