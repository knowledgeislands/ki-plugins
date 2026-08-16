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
  const directory = mkdtempSync(join(tmpdir(), 'ki-work-housekeeping-'))
  temporaryDirectories.push(directory)
  return directory
}

const options = (repository: string) => ({ mode: 'audit' as const, repository, userHome: tmpdir(), configuration: {} })

const outcomes = (repository: string) => {
  const session = createHousekeepingSession(options(repository))
  const subject = session.subjects.find((candidate) => candidate.families.includes('HOUSE'))
  if (!subject) throw new Error('ki-work-housekeeping session did not expose the housekeeping subject')
  return subject.context().templates.outcomes
}

const template = (id = 'KI-HARNESS-HK-001') =>
  [
    '---',
    `id: ${id}`,
    'title: Monthly maintenance',
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
    '',
    '## Goal',
    '',
    'Keep maintenance current.',
    '',
    '## Procedure',
    '',
    'Run the named maintenance check.',
    '',
    '## Successful-run evidence',
    '',
    'Record the completed check.',
    '',
    '## Obsolescence',
    '',
    'Remove this template when it is replaced.',
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
      message: 'Housekeeping template has a complete lifecycle, identity, schedule, body, and linkage contract.',
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
      message: expect.stringContaining('cadence must be a positive one-unit ISO-8601 duration'),
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
  writeFileSync(
    join(root, 'Monthly Maintenance Housekeeping.md'),
    template('KI-BASE-HK-001').replace(
      'title: Monthly maintenance',
      'title: Monthly maintenance\ntype: stream-housekeeping'
    )
  )

  expect(outcomes(repository)[0]?.subject).toBe('Streams/Housekeeping/Monthly Maintenance Housekeeping.md')
  expect(outcomes(repository)[0]?.status).toBe('PASS')
})

test('rejects malformed template identity and missing required body sections', () => {
  const repository = temporaryDirectory()
  const root = join(repository, 'docs', 'housekeeping')
  mkdirSync(root, { recursive: true })
  writeFileSync(
    join(root, 'wrong-name.md'),
    template().replace('## Obsolescence\n\nRemove this template when it is replaced.\n', '')
  )

  expect(outcomes(repository)[0]).toMatchObject({
    status: 'VIOLATION',
    message: expect.stringContaining('filename must repeat the template id')
  })
  expect(outcomes(repository)[0]?.message).toContain("requires a non-empty 'Obsolescence' body section")
})

test('rejects unsafe entries and duplicate or stale active-run linkage', () => {
  const repository = temporaryDirectory()
  const housekeeping = join(repository, 'docs', 'housekeeping')
  const roadmap = join(repository, 'docs', 'roadmap')
  mkdirSync(housekeeping, { recursive: true })
  mkdirSync(roadmap, { recursive: true })
  const active = template().replace('active-run: null', 'active-run: KI-HARNESS-123')
  writeFileSync(join(housekeeping, 'KI-HARNESS-HK-001-monthly-maintenance.md'), active)
  writeFileSync(
    join(housekeeping, 'KI-HARNESS-HK-002-monthly-maintenance.md'),
    active.replace('KI-HARNESS-HK-001', 'KI-HARNESS-HK-002')
  )
  mkdirSync(join(housekeeping, 'unsafe.md'))
  writeFileSync(
    join(roadmap, 'KI-HARNESS-123-stale-run.md'),
    [
      '---',
      'id: KI-HARNESS-123',
      'status: done',
      'housekeeping_template: KI-HARNESS-HK-001',
      'scheduled_for: 2026-08-12',
      '---'
    ].join('\n')
  )

  const results = outcomes(repository)
  expect(results).toContainEqual({
    status: 'VIOLATION',
    message: 'Housekeeping template root contains an unsafe or unexpected entry.',
    subject: 'docs/housekeeping/unsafe.md'
  })
  expect(results.find((outcome) => outcome.subject?.endsWith('HK-001-monthly-maintenance.md'))?.message).toContain(
    'active-run must reference an unfinished lifecycle record'
  )
  expect(results.find((outcome) => outcome.subject?.endsWith('HK-002-monthly-maintenance.md'))?.message).toContain(
    'active-run cannot be linked by more than one housekeeping template'
  )
})
