import { createHash } from 'node:crypto'
import { parseBatchAuthorisation } from './authorisation.ts'
import { type BatchRetentionEvidence, selectRetirableBatches } from './batch-retention.ts'

const LEGACY_DIRECTORY = '+/_AUTHORISATIONS'
const CANONICAL_DIRECTORY = '+/_BATCHES'

type CanonicalItemEvidence = BatchRetentionEvidence['items'][number]

export type LegacyBatchMigrationEvidence =
  | {
      kind: 'empty-directory'
      path: string
      /** Caller verified the exact retired directory is contained, regular, and empty. */
      regularContainedEmptyDirectory: boolean
    }
  | {
      kind: 'record'
      /** Exact repository-relative source path; do not normalize before classification. */
      path: string
      contents: string
      /** Caller verified a regular file and every ancestor without symlinks, within the physical Git root. */
      regularContainedFile: boolean
      /** Caller verified HEAD, index, and working copy contain the same committed bytes. */
      committedUnchanged: boolean
      /** Caller checked the exact canonical destination immediately before classification. */
      destinationState: 'absent' | 'present' | 'unknown'
      lastGitChangeAt: string | null
      lastRecordedActivityAt: string | null
      batchState: 'inactive' | 'active' | 'unknown'
      items: readonly CanonicalItemEvidence[]
    }

type DecisionBase = {
  sourcePath: string
  reason: string
  writes: false
}

export type LegacyBatchMigrationDecision =
  | (DecisionBase & {
      outcome: 'relocate'
      destinationPath: string
      /** Native tooling must verify this whole-file hash before and after its byte-preserving move. */
      expectedContentsSha256: string
      executable: false
    })
  | (DecisionBase & { outcome: 'prune'; destinationPath: null })
  | (DecisionBase & { outcome: 'reauthorise'; destinationPath: null; requiresFreshAuthorisation: true })
  | (DecisionBase & { outcome: 'retain'; destinationPath: null })

const retain = (sourcePath: string, reason: string): LegacyBatchMigrationDecision => ({
  outcome: 'retain',
  sourcePath,
  destinationPath: null,
  reason,
  writes: false
})

/**
 * Classifies one caller-observed legacy batch entry without reading, moving, deleting, or authorising anything.
 * Native filesystem tooling remains responsible for revalidation and any separately authorised mutation.
 */
export const classifyLegacyBatchMigration = ({
  repositoryIdentity,
  now,
  evidence
}: {
  repositoryIdentity: string
  now: Date
  evidence: LegacyBatchMigrationEvidence
}): LegacyBatchMigrationDecision => {
  if (evidence.kind === 'empty-directory') {
    if (evidence.path !== LEGACY_DIRECTORY || !evidence.regularContainedEmptyDirectory)
      return retain(evidence.path, 'not the verified empty retired batch directory')
    return {
      outcome: 'prune',
      sourcePath: evidence.path,
      destinationPath: null,
      reason: 'verified empty retired batch directory has no evidence to retain',
      writes: false
    }
  }

  const sourceMatch = /^\+\/_AUTHORISATIONS\/([A-Z][A-Z0-9-]*-BATCH-\d{3}\.md)$/.exec(evidence.path)
  if (!sourceMatch || sourceMatch[0] !== evidence.path || !evidence.regularContainedFile)
    return retain(evidence.path, 'not a contained regular legacy batch record')
  if (!evidence.committedUnchanged) return retain(evidence.path, 'uncommitted or changed legacy batch record')

  const filename = sourceMatch[1]
  const parsed = parseBatchAuthorisation({
    contents: evidence.contents,
    filename,
    repositoryIdentity
  })
  if (parsed.kind === 'stop') return retain(evidence.path, parsed.reason)
  if (parsed.authorisation.policy !== 'retained-legacy')
    return retain(evidence.path, 'current authorisation shape is misplaced in retired batch storage')

  if (evidence.batchState === 'active') {
    return {
      outcome: 'reauthorise',
      sourcePath: evidence.path,
      destinationPath: null,
      requiresFreshAuthorisation: true,
      reason: 'active legacy work requires a newly approved lean exact-set authorisation',
      writes: false
    }
  }
  if (evidence.batchState === 'unknown') return retain(evidence.path, 'legacy batch activity is unknown')

  const destinationPath = `${CANONICAL_DIRECTORY}/${filename}`
  const retentionEvidence: BatchRetentionEvidence = {
    path: destinationPath,
    contents: evidence.contents,
    regularContainedFile: evidence.regularContainedFile,
    committedUnchanged: evidence.committedUnchanged,
    lastGitChangeAt: evidence.lastGitChangeAt,
    lastRecordedActivityAt: evidence.lastRecordedActivityAt,
    batchState: evidence.batchState,
    items: evidence.items
  }
  const retention = selectRetirableBatches({ repositoryIdentity, now, records: [retentionEvidence] })
  if (retention.selected.length === 1 && evidence.destinationState === 'absent') {
    return {
      outcome: 'prune',
      sourcePath: evidence.path,
      destinationPath: null,
      reason: 'completed record satisfies the canonical batch-retention rule',
      writes: false
    }
  }

  const retentionReason = retention.retained[0]?.reason
  if (
    retention.selected.length === 0 &&
    !retentionReason?.includes('useful outcome or follow-up not yet dispositioned')
  )
    return retain(evidence.path, retentionReason ?? 'legacy batch retention evidence is incomplete')
  if (evidence.destinationState !== 'absent')
    return retain(
      evidence.path,
      evidence.destinationState === 'present'
        ? 'canonical destination already exists'
        : 'canonical destination state is unknown'
    )

  // The exact same bytes and filename must remain valid only as retained, non-executable evidence.
  const relocated = parseBatchAuthorisation({ contents: evidence.contents, filename, repositoryIdentity })
  if (relocated.kind === 'stop' || relocated.authorisation.policy !== 'retained-legacy')
    return retain(evidence.path, 'byte-preserving relocation would not remain retained legacy evidence')

  return {
    outcome: 'relocate',
    sourcePath: evidence.path,
    destinationPath,
    expectedContentsSha256: createHash('sha256').update(evidence.contents).digest('hex'),
    executable: false,
    reason: 'completed record is too young to prune and may move byte-for-byte into canonical storage',
    writes: false
  }
}
