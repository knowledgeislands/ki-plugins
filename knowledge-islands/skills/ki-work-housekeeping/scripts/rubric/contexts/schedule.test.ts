import { afterEach, expect, test } from 'bun:test'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { evaluateHousekeepingSchedule, type HousekeepingSchedule } from './schedule.ts'

const roots: string[] = []
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})
const temp = () => {
  const root = mkdtempSync(join(tmpdir(), 'ki-housekeeping-schedule-'))
  roots.push(root)
  return root
}
const git = (root: string, ...args: string[]) =>
  execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null' }
  }).trim()
const repository = () => {
  const root = temp()
  git(root, 'init', '-b', 'main')
  git(root, 'config', 'user.name', 'Housekeeping fixture')
  git(root, 'config', 'user.email', 'fixture@example.invalid')
  git(root, 'commit', '--allow-empty', '-m', 'baseline')
  return { root, anchor: git(root, 'rev-parse', 'HEAD') }
}
const schedule = (overrides: Partial<HousekeepingSchedule> = {}): HousekeepingSchedule => ({
  status: 'active',
  cadence: 'P1M',
  lastRun: '2026-09-01',
  grace: 'P7D',
  spawnPolicy: 'when-overdue',
  activeRun: null,
  ...overrides
})
const evaluate = (root: string, overrides: Partial<HousekeepingSchedule> = {}, today = '2026-09-15') =>
  evaluateHousekeepingSchedule({ repository: root, schedule: schedule(overrides), today })

test('calendar-only templates retain due, grace, initial-run, and month-end behaviour', () => {
  const root = temp()
  expect(evaluate(root)).toMatchObject({ action: 'ignore', due: false, commits: { kind: 'disabled' }, writes: false })
  expect(evaluate(root, {}, '2026-10-01')).toMatchObject({ action: 'ignore', due: true, triggers: ['calendar'] })
  expect(evaluate(root, {}, '2026-10-08')).toMatchObject({ action: 'spawn', scheduledFor: '2026-10-01' })
  expect(evaluate(root, { spawnPolicy: 'when-due' }, '2026-10-01')).toMatchObject({ action: 'spawn' })
  expect(evaluate(root, { lastRun: null, spawnPolicy: 'when-due' })).toMatchObject({
    action: 'spawn',
    scheduledFor: '2026-09-15'
  })
  expect(evaluate(root, { lastRun: null })).toMatchObject({ action: 'spawn', scheduledFor: '2026-09-15' })
  expect(evaluate(root, { lastRun: null, spawnPolicy: 'manual' })).toMatchObject({ action: 'propose' })
  expect(evaluate(root, { lastRun: '2026-01-31' }, '2026-02-28')).toMatchObject({
    calendarDue: '2026-02-28',
    calendarOverdue: '2026-03-07'
  })
  expect(evaluate(root, { lastRun: '2024-01-31' }, '2024-02-29')).toMatchObject({ calendarDue: '2024-02-29' })
  expect(evaluate(root, { cadence: 'P1W', grace: 'P1D' }, '2026-09-09')).toMatchObject({
    action: 'spawn',
    calendarDue: '2026-09-08'
  })
})

test('counts first-parent integration commits exactly once across merged branch history', () => {
  const { root, anchor } = repository()
  git(root, 'checkout', '-b', 'feature')
  for (let index = 0; index < 3; index++) git(root, 'commit', '--allow-empty', '-m', `feature ${index}`)
  const branchHead = git(root, 'rev-parse', 'HEAD')
  git(root, 'checkout', 'main')
  git(root, 'commit', '--allow-empty', '-m', 'integration')
  git(root, 'merge', '--no-ff', 'feature', '-m', 'merge feature')
  const before = git(root, 'status', '--porcelain=v1')
  const indexBefore = readFileSync(join(root, '.git', 'index'))
  expect(evaluate(root, { commitThreshold: 3, lastRunRef: anchor })).toMatchObject({
    action: 'ignore',
    commits: { kind: 'known', count: 2, reached: false }
  })
  expect(evaluate(root, { commitThreshold: 2, lastRunRef: anchor })).toMatchObject({
    action: 'spawn',
    triggers: ['commits'],
    scheduledFor: '2026-09-15',
    commits: { count: 2, reached: true },
    writes: false
  })
  expect(evaluate(root, { commitThreshold: 1, lastRunRef: branchHead })).toMatchObject({
    action: 'unknown',
    commits: { kind: 'unknown' }
  })
  expect(git(root, 'status', '--porcelain=v1')).toBe(before)
  expect(readFileSync(join(root, '.git', 'index'))).toEqual(indexBefore)
})

test('active-run, paused, and manual boundaries apply even at a reached threshold', () => {
  const { root, anchor } = repository()
  git(root, 'commit', '--allow-empty', '-m', 'change')
  const volume = { commitThreshold: 1, lastRunRef: anchor }
  expect(evaluate(root, { ...volume, activeRun: 'KI-HARNESS-REV-001' })).toMatchObject({ action: 'blocked', due: true })
  expect(evaluate(root, { ...volume, status: 'paused' })).toMatchObject({ action: 'blocked', due: true })
  expect(evaluate(root, { ...volume, spawnPolicy: 'manual' })).toMatchObject({ action: 'propose', due: true })
})

test('future successful-run dates block postponement and volume-based spawning', () => {
  const { root, anchor } = repository()
  git(root, 'commit', '--allow-empty', '-m', 'change')
  for (const extra of [{}, { commitThreshold: 1, lastRunRef: anchor }])
    expect(evaluate(root, { lastRun: '2026-10-14', ...extra }, '2026-09-15')).toMatchObject({
      action: 'blocked',
      due: false,
      scheduledFor: null,
      writes: false,
      reason: 'last-run cannot claim a successful review after the evaluation date.'
    })
})

test('missing and rewritten anchors remain unknown while independently due calendar work is visible', () => {
  const { root, anchor } = repository()
  for (const lastRunRef of [null, undefined, 'f'.repeat(40)]) {
    expect(evaluate(root, { commitThreshold: 100, lastRunRef })).toMatchObject({
      action: 'unknown',
      commits: { kind: 'unknown' }
    })
    expect(evaluate(root, { commitThreshold: 100, lastRunRef }, '2026-10-08')).toMatchObject({
      action: 'spawn',
      triggers: ['calendar'],
      commits: { kind: 'unknown' }
    })
  }
  git(root, 'commit', '--amend', '--allow-empty', '-m', 'rewritten baseline')
  expect(evaluate(root, { commitThreshold: 100, lastRunRef: anchor })).toMatchObject({
    action: 'unknown',
    commits: { kind: 'unknown' }
  })
  expect(evaluate(temp(), { commitThreshold: 100, lastRunRef: anchor })).toMatchObject({ action: 'unknown' })
  const nested = join(root, 'nested')
  mkdirSync(nested)
  expect(evaluate(nested, { commitThreshold: 100, lastRunRef: anchor })).toMatchObject({ action: 'unknown' })
})

test('shallow history cannot produce a clean volume result, even if the anchor is visible', () => {
  const { root } = repository()
  git(root, 'commit', '--allow-empty', '-m', 'tip')
  const clone = temp()
  git(clone, 'clone', '--depth=1', `file://${root}`, '.')
  const anchor = git(clone, 'rev-parse', 'HEAD')
  expect(evaluate(clone, { commitThreshold: 1, lastRunRef: anchor })).toMatchObject({
    action: 'unknown',
    commits: { kind: 'unknown', reason: expect.stringContaining('Shallow') }
  })
})

test('rejects unsafe thresholds, abbreviated refs, invalid dates and durations without writes', () => {
  const root = temp()
  for (const commitThreshold of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1])
    expect(evaluate(root, { commitThreshold })).toMatchObject({ action: 'blocked', writes: false })
  for (const cadence of ['weekly', 'P9999999999999999999M'])
    expect(evaluate(root, { cadence })).toMatchObject({ action: 'blocked' })
  expect(evaluate(root, { lastRun: '2026-02-30' })).toMatchObject({ action: 'blocked' })
  expect(evaluate(root, { commitThreshold: 1, lastRunRef: 'abcdef0' })).toMatchObject({ action: 'blocked' })
  expect(evaluate(root, { lastRunRef: 'HEAD' })).toMatchObject({ action: 'blocked' })
  expect(evaluate(root, { lastRun: null, lastRunRef: 'a'.repeat(40) })).toMatchObject({ action: 'blocked' })
})
