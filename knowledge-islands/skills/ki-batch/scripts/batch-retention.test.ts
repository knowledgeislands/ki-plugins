import { expect, test } from 'bun:test'
import { approvedPayloadSha256 } from './internal/authorisation.ts'
import { type BatchRetentionEvidence, selectRetirableBatches } from './internal/batch-retention.ts'

const repositoryIdentity = 'https://github.com/example/project'
const now = new Date('2026-09-14T12:00:00Z')
const old = '2026-09-01T12:00:00Z'
const threshold = '2026-09-07T12:00:00Z'
const record = (timebox = old, approvedAt = old): BatchRetentionEvidence => {
  const unsigned = `---
id: PROJECT-BATCH-001
repository: ${repositoryIdentity}
approved: true
approved_at: ${approvedAt}
approved_payload_sha256: pending
expires_at: ${timebox}
item_ids: [PROJECT-001]
completion_target: awaiting-review
policy: safe-local-v1
---

# PROJECT-BATCH-001
`
  const hash = approvedPayloadSha256(unsigned)
  const contents = `${unsigned.replace('pending', hash as string)}
## Run ledger

<!-- ki-batch-run: PROJECT-BATCH-001-RUN-001 ${hash} -->

2026-09-01T12:00:00Z: PROJECT-001 reached awaiting-review; retained in docs/roadmap/PROJECT-001.md.
`
  return {
    path: '+/_BATCHES/PROJECT-BATCH-001.md',
    contents,
    regularContainedFile: true,
    committedUnchanged: true,
    lastGitChangeAt: old,
    lastRecordedActivityAt: old,
    batchState: 'inactive',
    items: [{ id: 'PROJECT-001', state: 'inactive', retainedOutcomeEvidence: 'docs/roadmap/PROJECT-001.md#review' }]
  }
}
const select = (records: BatchRetentionEvidence[], at = now) =>
  selectRetirableBatches({ records, repositoryIdentity, now: at })

test('selects only committed inactive batches with verified retained outcomes and never writes', () => {
  const batch = record()
  const before = JSON.stringify(batch)
  expect(select([batch])).toEqual({ selected: [batch.path], retained: [], writes: false })
  expect(JSON.stringify(batch)).toBe(before)
})

test('selects inactive batches as soon as useful outcomes are dispositioned', () => {
  for (const batch of [
    { ...record(), lastGitChangeAt: threshold },
    { ...record(), lastRecordedActivityAt: threshold },
    record(threshold),
    record(old, threshold),
    record('2026-09-15T12:00:00Z')
  ]) {
    expect(select([batch]).selected).toEqual([batch.path])
  }
})

test('retains useful follow-up for routing and marks unresolved cleanup overdue at seven days', () => {
  const unrouted = (activity: string): BatchRetentionEvidence => ({
    ...record(activity, activity),
    lastGitChangeAt: activity,
    lastRecordedActivityAt: activity,
    items: [{ ...record().items[0], retainedOutcomeEvidence: null }]
  })

  expect(select([unrouted('2026-09-08T12:00:01Z')]).retained[0]?.reason).toBe(
    'useful outcome or follow-up not yet dispositioned'
  )
  expect(select([unrouted(threshold)]).retained[0]?.reason).toBe(
    'overdue cleanup: useful outcome or follow-up not yet dispositioned'
  )
})

test('retains unsafe paths, symlinks, dirty records, active work and unknown evidence', () => {
  const batch = record()
  const changes: Partial<BatchRetentionEvidence>[] = [
    { path: '+/_AUTHORISATIONS/PROJECT-BATCH-001.md' },
    { path: '+/_BATCHES/../_BATCHES/PROJECT-BATCH-001.md' },
    { path: '+/_BATCHES/nested/PROJECT-BATCH-001.md' },
    { path: '/repo/+/_BATCHES/PROJECT-BATCH-001.md' },
    { path: '+/_BATCHES/PROJECT-BATCH-002.md' },
    { path: '+/_BATCHES/PROJECT-BATCH-001.md\n' },
    { regularContainedFile: false },
    { committedUnchanged: false },
    { batchState: 'active' },
    { batchState: 'unknown' },
    { items: [] },
    { items: [{ ...batch.items[0], state: 'running' }] },
    { items: [{ ...batch.items[0], state: 'unknown' }] },
    { items: [{ ...batch.items[0], id: 'PROJECT-002' }] },
    { items: [{ ...batch.items[0], retainedOutcomeEvidence: null }] },
    { items: [{ ...batch.items[0], retainedOutcomeEvidence: ' ' }] },
    { lastGitChangeAt: null },
    { lastRecordedActivityAt: null },
    { lastRecordedActivityAt: '2026-02-30T12:00:00Z' }
  ]
  for (const change of changes) {
    const result = select([{ ...batch, ...change }])
    expect(result.selected).toEqual([])
    expect(result.retained).toHaveLength(1)
    expect(result.writes).toBe(false)
  }
  expect(select([batch, batch]).selected).toEqual([])
  expect(select([batch], new Date('invalid')).selected).toEqual([])
})

test('retains malformed records, altered authority, absent ledgers and mismatched bindings', () => {
  const batch = record()
  for (const contents of [
    'invalid',
    batch.contents.replace('PROJECT-BATCH-001', 'PROJECT-BATCH-002'),
    batch.contents.replace('ki-batch-run: PROJECT-BATCH-001-RUN-001', 'ki-batch-run: PROJECT-BATCH-001-RUN-002'),
    batch.contents.split('\n## Run ledger')[0]
  ]) {
    expect(select([{ ...batch, contents }]).selected).toEqual([])
  }
  expect(selectRetirableBatches({ records: [batch], repositoryIdentity: 'foreign', now }).selected).toEqual([])
})
