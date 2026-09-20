import { execFileSync } from 'node:child_process'
import { existsSync, realpathSync } from 'node:fs'
import { resolve } from 'node:path'

export type HousekeepingSchedule = {
  status: 'active' | 'paused'
  cadence: string
  lastRun: string | null
  grace: string
  spawnPolicy: 'manual' | 'when-due' | 'when-overdue'
  activeRun: string | null
  commitThreshold?: number
  lastRunRef?: string | null
}

export type CommitEvidence =
  | { kind: 'disabled' }
  | { kind: 'unknown'; reason: string }
  | { kind: 'known'; head: string; anchor: string; count: number; reached: boolean }

export type ScheduleEvaluation = {
  action: 'ignore' | 'propose' | 'spawn' | 'blocked' | 'unknown'
  reason: string
  due: boolean
  calendarDue: string | null
  calendarOverdue: string | null
  scheduledFor: string | null
  triggers: readonly ('calendar' | 'commits')[]
  commits: CommitEvidence
  writes: false
}

export const FULL_COMMIT_REF = /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/
export const validScheduleDate = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00.000Z`)
  return Number.isFinite(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value
}

const addDuration = (date: string, duration: string): string => {
  const match = /^P([1-9]\d*)([DWM])$/.exec(duration)
  if (!match) throw new Error('duration must be a positive one-unit ISO-8601 duration')
  const amount = Number(match[1])
  if (!Number.isSafeInteger(amount)) throw new Error('duration exceeds safe integer range')
  const value = new Date(`${date}T00:00:00.000Z`)
  if (match[2] === 'M') {
    const day = value.getUTCDate()
    value.setUTCDate(1)
    value.setUTCMonth(value.getUTCMonth() + amount)
    const end = new Date(value.valueOf())
    end.setUTCMonth(end.getUTCMonth() + 1, 0)
    value.setUTCDate(Math.min(day, end.getUTCDate()))
  } else value.setUTCDate(value.getUTCDate() + amount * (match[2] === 'W' ? 7 : 1))
  const result = value.toISOString().slice(0, 10)
  if (!validScheduleDate(result)) throw new Error('duration exceeds supported date range')
  return result
}

const commitEvidence = (
  repository: string,
  threshold: number | undefined,
  anchor: string | null | undefined
): CommitEvidence => {
  if (threshold === undefined) return { kind: 'disabled' }
  if (!anchor) return { kind: 'unknown', reason: 'No evidenced last-run-ref is recorded.' }
  if (!FULL_COMMIT_REF.test(anchor)) return { kind: 'unknown', reason: 'last-run-ref is not a full commit identity.' }
  const environment = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_')))
  const git = (...args: string[]): string =>
    execFileSync('git', ['--no-replace-objects', ...args], {
      cwd: repository,
      encoding: 'utf8',
      env: { ...environment, GIT_OPTIONAL_LOCKS: '0', GIT_NO_LAZY_FETCH: '1', GIT_TERMINAL_PROMPT: '0' },
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 10000,
      maxBuffer: 16 * 1024 * 1024
    }).trim()
  try {
    if (realpathSync(git('rev-parse', '--show-toplevel')) !== realpathSync(repository))
      return { kind: 'unknown', reason: 'The selected path is not the Git working-copy root.' }
    if (git('rev-parse', '--is-shallow-repository') !== 'false')
      return { kind: 'unknown', reason: 'Shallow history cannot establish the reviewed integration baseline.' }
    if (existsSync(resolve(repository, git('rev-parse', '--git-path', 'info/grafts'))))
      return { kind: 'unknown', reason: 'Grafted history cannot establish the reviewed integration baseline.' }
    const head = git('rev-parse', '--verify', 'HEAD^{commit}')
    if (git('rev-parse', '--verify', `${anchor}^{commit}`) !== anchor)
      return { kind: 'unknown', reason: 'The reviewed identity does not resolve to that exact commit.' }
    const chain = git('rev-list', '--first-parent', head).split('\n')
    const count = chain.indexOf(anchor)
    if (count < 0) return { kind: 'unknown', reason: 'last-run-ref is not on the current first-parent history.' }
    if (git('rev-parse', '--verify', 'HEAD^{commit}') !== head)
      return { kind: 'unknown', reason: 'HEAD changed while collecting schedule evidence.' }
    return { kind: 'known', head, anchor, count, reached: count >= threshold }
  } catch {
    return { kind: 'unknown', reason: 'Git history is unavailable, incomplete, or exceeds the bounded read.' }
  }
}

/** Read-only schedule capability shared by the hosted diagnostic and ki-next's process caller. */
export const evaluateHousekeepingSchedule = ({
  repository,
  schedule,
  today
}: {
  repository: string
  schedule: HousekeepingSchedule
  today: string
}): ScheduleEvaluation => {
  const base: ScheduleEvaluation = {
    action: 'blocked',
    reason: '',
    due: false,
    calendarDue: null,
    calendarOverdue: null,
    scheduledFor: null,
    triggers: [],
    commits: { kind: 'disabled' },
    writes: false
  }
  if (!validScheduleDate(today) || (schedule.lastRun !== null && !validScheduleDate(schedule.lastRun)))
    return { ...base, reason: 'Schedule dates are invalid.' }
  if (schedule.lastRun !== null && schedule.lastRun > today)
    return { ...base, reason: 'last-run cannot claim a successful review after the evaluation date.' }
  if (
    !['active', 'paused'].includes(schedule.status) ||
    !['manual', 'when-due', 'when-overdue'].includes(schedule.spawnPolicy)
  )
    return { ...base, reason: 'Schedule status or spawning policy is invalid.' }
  if (
    schedule.lastRunRef !== undefined &&
    schedule.lastRunRef !== null &&
    (!FULL_COMMIT_REF.test(schedule.lastRunRef) || schedule.lastRun === null)
  )
    return { ...base, reason: 'last-run-ref requires a full commit identity and successful last-run date.' }
  if (
    schedule.commitThreshold !== undefined &&
    (!Number.isSafeInteger(schedule.commitThreshold) || schedule.commitThreshold <= 0)
  )
    return { ...base, reason: 'commit-threshold must be a positive safe integer.' }
  let dueDate: string
  let overdueDate: string
  try {
    dueDate = schedule.lastRun === null ? today : addDuration(schedule.lastRun, schedule.cadence)
    // Validate cadence even when the initial run has no prior date.
    addDuration(today, schedule.cadence)
    overdueDate = addDuration(dueDate, schedule.grace)
  } catch {
    return { ...base, reason: 'Calendar cadence or grace is invalid or outside the supported date range.' }
  }
  const commits = commitEvidence(repository, schedule.commitThreshold, schedule.lastRunRef)
  const calendarDue = today >= dueDate
  const volumeDue = commits.kind === 'known' && commits.reached
  const triggers: ('calendar' | 'commits')[] = []
  if (calendarDue) triggers.push('calendar')
  if (volumeDue) triggers.push('commits')
  const result = {
    ...base,
    due: calendarDue || volumeDue,
    calendarDue: dueDate,
    calendarOverdue: overdueDate,
    scheduledFor: calendarDue ? dueDate : volumeDue ? today : null,
    triggers,
    commits
  }
  if (schedule.status === 'paused') return { ...result, reason: 'The template is paused.' }
  if (schedule.activeRun !== null) return { ...result, reason: 'An active run already reserves this template.' }
  if (schedule.spawnPolicy === 'manual' && result.due)
    return { ...result, action: 'propose', reason: 'The due template requires explicit confirmation.' }
  if (
    volumeDue ||
    (calendarDue && (schedule.lastRun === null || schedule.spawnPolicy === 'when-due' || today >= overdueDate))
  )
    return {
      ...result,
      action: 'spawn',
      reason: volumeDue
        ? 'The commit threshold is reached; no calendar grace applies.'
        : 'The calendar spawning boundary is reached.'
    }
  if (commits.kind === 'unknown') return { ...result, action: 'unknown', reason: commits.reason }
  return {
    ...result,
    action: 'ignore',
    reason: calendarDue ? 'The calendar grace period has not elapsed.' : 'Neither trigger is due.'
  }
}
