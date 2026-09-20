import { expect, test } from 'bun:test'
import { approvedPayloadSha256 } from './internal/authorisation.ts'
import { classifyLegacyBatchMigration, type LegacyBatchMigrationEvidence } from './internal/legacy-batch-migration.ts'

const repositoryIdentity = 'https://github.com/example/project'
const old = '2026-09-01T12:00:00Z'
const recent = '2026-09-14T12:00:00Z'
const now = new Date('2026-09-15T12:00:00Z')

const contents = (approvedAt = old, expiresAt = old): string => {
  const unsigned = `---
id: PROJECT-BATCH-001
repository: ${repositoryIdentity}
approved: true
approved_at: ${approvedAt}
approved_payload_sha256: pending
run_id: PROJECT-BATCH-001-RUN-001
timebox_ends_at: ${expiresAt}
item_ids: [PROJECT-001]
completion_target: awaiting-review
mandatory_stops: [unapproved-decision]
---

# Retained batch
`
  const hash = approvedPayloadSha256(unsigned) as string
  return `${unsigned.replace('pending', hash)}
## Run ledger

<!-- ki-batch-run: PROJECT-BATCH-001-RUN-001 ${hash} -->

PROJECT-001 reached awaiting-review.
`
}

const record = (overrides: Partial<Extract<LegacyBatchMigrationEvidence, { kind: 'record' }>> = {}) => ({
  kind: 'record' as const,
  path: '+/_AUTHORISATIONS/PROJECT-BATCH-001.md',
  contents: contents(),
  regularContainedFile: true,
  committedUnchanged: true,
  destinationState: 'absent' as const,
  lastGitChangeAt: old,
  lastRecordedActivityAt: old,
  batchState: 'inactive' as const,
  items: [
    { id: 'PROJECT-001', state: 'inactive' as const, retainedOutcomeEvidence: 'docs/roadmap/PROJECT-001.md#review' }
  ],
  ...overrides
})

const classify = (evidence: LegacyBatchMigrationEvidence, at = now) =>
  classifyLegacyBatchMigration({ repositoryIdentity, now: at, evidence })

test('prunes a completed record as soon as its useful outcome is retained', () => {
  const evidence = record({
    contents: contents(recent, recent),
    lastGitChangeAt: recent,
    lastRecordedActivityAt: recent
  })
  const before = JSON.stringify(evidence)
  expect(classify(evidence)).toMatchObject({
    outcome: 'prune',
    sourcePath: evidence.path,
    destinationPath: null,
    writes: false
  })
  expect(JSON.stringify(evidence)).toBe(before)
})

test('relocates incomplete follow-up evidence for explicit routing before cleanup', () => {
  const unrouted = record({
    contents: contents(recent, recent),
    lastGitChangeAt: recent,
    lastRecordedActivityAt: recent,
    items: [{ id: 'PROJECT-001', state: 'inactive', retainedOutcomeEvidence: null }]
  })

  expect(classify(unrouted)).toMatchObject({
    outcome: 'relocate',
    destinationPath: '+/_BATCHES/PROJECT-BATCH-001.md',
    executable: false,
    writes: false
  })

  expect(classify(record())).toMatchObject({
    outcome: 'prune',
    reason: 'completed record satisfies the canonical batch-retention rule',
    writes: false
  })
})

test('requires fresh lean authority for active legacy work', () => {
  expect(classify(record({ batchState: 'active' }))).toMatchObject({
    outcome: 'reauthorise',
    requiresFreshAuthorisation: true,
    destinationPath: null,
    writes: false
  })
})

test('retains missing outcomes, malformed payloads, unsafe paths, symlinks and uncommitted bytes', () => {
  for (const evidence of [
    record({ items: [] }),
    record({ contents: 'malformed' }),
    record({ path: '+/_AUTHORISATIONS/nested/PROJECT-BATCH-001.md' }),
    record({ path: '+/_BATCHES/PROJECT-BATCH-001.md' }),
    record({ regularContainedFile: false }),
    record({ committedUnchanged: false }),
    record({ batchState: 'unknown' })
  ]) {
    expect(classify(evidence)).toMatchObject({ outcome: 'retain', destinationPath: null, writes: false })
  }
})

test('retains a young record when the canonical destination collides or is unknown', () => {
  const young = {
    contents: contents(recent, recent),
    lastGitChangeAt: recent,
    lastRecordedActivityAt: recent
  }
  expect(classify(record({ ...young, destinationState: 'present' }))).toMatchObject({
    outcome: 'retain',
    reason: 'canonical destination already exists'
  })
  expect(classify(record({ ...young, destinationState: 'unknown' }))).toMatchObject({
    outcome: 'retain',
    reason: 'canonical destination state is unknown'
  })
})

test('classifies only the exact verified empty retired directory as prunable', () => {
  expect(
    classify({ kind: 'empty-directory', path: '+/_AUTHORISATIONS', regularContainedEmptyDirectory: true })
  ).toMatchObject({ outcome: 'prune', destinationPath: null, writes: false })
  expect(
    classify({ kind: 'empty-directory', path: '+/_AUTHORISATIONS', regularContainedEmptyDirectory: false })
  ).toMatchObject({ outcome: 'retain', writes: false })
  expect(
    classify({ kind: 'empty-directory', path: '+/_AUTHORISATIONS/empty', regularContainedEmptyDirectory: true })
  ).toMatchObject({ outcome: 'retain', writes: false })
})
