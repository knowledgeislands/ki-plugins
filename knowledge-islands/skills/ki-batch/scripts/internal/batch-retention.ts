import { parseBatchAuthorisation } from './authorisation.ts'

export type BatchRetentionEvidence = {
  /** Exact repository-relative path; do not normalize paths before selection. */
  path: string
  contents: string
  /** Caller verified a regular file and every ancestor without symlinks, within the physical Git root. */
  regularContainedFile: boolean
  /** Caller verified HEAD, index and working copy contain the same committed bytes. */
  committedUnchanged: boolean
  lastGitChangeAt: string | null
  /** Caller inspected the complete run ledger and verified its latest activity timestamp. */
  lastRecordedActivityAt: string | null
  batchState: 'inactive' | 'active' | 'unknown'
  /** One fresh canonical outcome check for every named work record. */
  items: readonly {
    id: string
    state: 'inactive' | 'running' | 'unknown'
    retainedOutcomeEvidence: string | null
  }[]
}

export type BatchRetentionSelection = {
  selected: string[]
  retained: { path: string; reason: string }[]
  writes: false
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000
const instant = (value: string | null): number | undefined => {
  if (!value || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(value)) return undefined
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value.replace('Z', '.000Z') ? parsed : undefined
}

const retentionReason = (
  record: BatchRetentionEvidence,
  repositoryIdentity: string,
  now: number
): string | undefined => {
  const match = /^\+\/_BATCHES\/([A-Z][A-Z0-9-]*-BATCH-\d{3}\.md)$/.exec(record.path)
  if (!match || match[0] !== record.path || record.regularContainedFile !== true)
    return 'not a canonical contained regular batch file'
  if (record.committedUnchanged !== true) return 'uncommitted or changed batch record'
  const parsed = parseBatchAuthorisation({ contents: record.contents, filename: match[1], repositoryIdentity })
  if (parsed.kind === 'stop') return parsed.reason
  const batch = parsed.authorisation
  if (!batch.runBinding) return 'missing verified run ledger'
  if (record.batchState !== 'inactive') return 'batch is active or its state is unknown'
  if (
    record.items.length !== batch.itemIds.length ||
    new Set(record.items.map((item) => item.id)).size !== batch.itemIds.length ||
    batch.itemIds.some((id) => !record.items.some((item) => item.id === id)) ||
    record.items.some((item) => item.state !== 'inactive')
  )
    return 'running work or incomplete canonical item evidence'
  const activity = [record.lastGitChangeAt, record.lastRecordedActivityAt, batch.approvedAt, batch.expiresAt].map(
    instant
  )
  if (!Number.isFinite(now) || activity.some((time) => time === undefined)) return 'unverifiable activity timestamps'

  if (record.items.some((item) => !item.retainedOutcomeEvidence?.trim())) {
    const overdue = now - Math.max(...(activity as number[])) >= WEEK_MS
    return overdue
      ? 'overdue cleanup: useful outcome or follow-up not yet dispositioned'
      : 'useful outcome or follow-up not yet dispositioned'
  }

  return undefined
}

/** Pure selector shared by regular ki-next and ki-recap housekeeping; never reads or deletes files. */
export const selectRetirableBatches = ({
  repositoryIdentity,
  now,
  records
}: {
  repositoryIdentity: string
  now: Date
  records: readonly BatchRetentionEvidence[]
}): BatchRetentionSelection => {
  const result: BatchRetentionSelection = { selected: [], retained: [], writes: false }
  const counts = new Map<string, number>()
  for (const record of records) counts.set(record.path, (counts.get(record.path) ?? 0) + 1)
  for (const record of records) {
    const reason =
      counts.get(record.path) !== 1
        ? 'duplicate path evidence'
        : retentionReason(record, repositoryIdentity, now.getTime())
    if (reason) result.retained.push({ path: record.path, reason })
    else result.selected.push(record.path)
  }
  return result
}
