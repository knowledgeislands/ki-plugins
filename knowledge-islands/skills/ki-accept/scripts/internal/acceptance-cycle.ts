export const REVIEW_PACKET_HEADINGS = [
  'Delivered',
  'Summary of changes',
  'Verification',
  'Outstanding concerns',
  'Post-change review',
  'Mini recap'
] as const

export type AcceptanceAdapter =
  | { kind: 'local'; adapter: 'roadmap' | 'kb-streams'; root: 'docs/roadmap' | 'Streams/Roadmap' }
  | { kind: 'remote-execution-unavailable'; adapter: 'github-issues' | 'linear' }
  | { kind: 'unresolved'; reason: string }

export type ClosureAuthority =
  | { kind: 'human'; explicitApproval: boolean }
  | {
      kind: 'batch'
      approved: boolean
      payloadMatchesApproval: boolean
      runMatchesApproval: boolean
      closureItemIds: readonly string[]
    }

export type HousekeepingCompletion =
  | { kind: 'none' }
  | {
      kind: 'accepted'
      activeRun: string | null
      itemId: string
      templateMatches: boolean
      scheduledFor: string | null
    }
  | {
      kind: 'non-successful'
      outcome: 'failed' | 'abandoned' | 'superseded'
      activeRun: string | null
      itemId: string
    }
  | { kind: 'disposition'; activeRun: string | null; itemId: string }
  | {
      kind: 'replacement'
      activeRun: string | null
      itemId: string
      replacementRun: string
      replacementMatches: boolean
    }

export type AcceptanceCycleInput = {
  adapter: AcceptanceAdapter
  item: {
    id: string
    canonical: boolean
    pathWithinRoot: boolean
    status: 'draft' | 'ready' | 'in-progress' | 'awaiting-review' | 'done'
    stepsComplete: boolean
    deliveryEvidencePresent: boolean
    reviewHeadings: readonly string[]
  }
  authority: ClosureAuthority
  housekeeping: HousekeepingCompletion
}

export type AcceptanceCycleOutcome =
  | { kind: 'accept'; transition: 'awaiting-review-to-done'; templateUpdate: null; writes: false }
  | {
      kind: 'accept'
      transition: 'awaiting-review-to-done'
      templateUpdate: { lastRun: string; activeRun: null }
      writes: false
    }
  | { kind: 'clear-housekeeping-link'; templateUpdate: { activeRun: null; lastRunUnchanged: true }; writes: false }
  | {
      kind: 'replace-housekeeping-link'
      templateUpdate: { activeRun: string; lastRunUnchanged: true }
      writes: false
    }
  | { kind: 'stop'; reason: string; writes: false }

const matchesReviewPacket = (headings: readonly string[]): boolean =>
  headings.length === REVIEW_PACKET_HEADINGS.length &&
  headings.every((heading, index) => heading === REVIEW_PACKET_HEADINGS[index])

const closureAuthorised = (authority: ClosureAuthority, itemId: string): boolean =>
  authority.kind === 'human'
    ? authority.explicitApproval
    : authority.approved &&
      authority.payloadMatchesApproval &&
      authority.runMatchesApproval &&
      authority.closureItemIds.includes(itemId)

export const evaluateAcceptanceCycle = ({
  adapter,
  item,
  authority,
  housekeeping
}: AcceptanceCycleInput): AcceptanceCycleOutcome => {
  if (adapter.kind === 'unresolved')
    return { kind: 'stop', reason: `selected adapter is unresolved: ${adapter.reason}`, writes: false }
  if (adapter.kind === 'remote-execution-unavailable')
    return {
      kind: 'stop',
      reason: `selected ${adapter.adapter} adapter cannot accept pending KI-HARNESS-FND-014`,
      writes: false
    }
  if (!item.canonical || !item.pathWithinRoot)
    return { kind: 'stop', reason: 'work record is not canonical beneath the selected adapter root', writes: false }

  if (housekeeping.kind === 'non-successful')
    return {
      kind: 'stop',
      reason: 'non-successful housekeeping work retains its active link pending explicit disposition or replacement',
      writes: false
    }
  if (housekeeping.kind === 'disposition') {
    if (housekeeping.activeRun !== item.id)
      return { kind: 'stop', reason: 'housekeeping disposition does not name the active run', writes: false }
    return {
      kind: 'clear-housekeeping-link',
      templateUpdate: { activeRun: null, lastRunUnchanged: true },
      writes: false
    }
  }
  if (housekeeping.kind === 'replacement') {
    if (
      housekeeping.activeRun !== item.id ||
      !housekeeping.replacementMatches ||
      housekeeping.replacementRun === item.id
    )
      return { kind: 'stop', reason: 'housekeeping replacement evidence is incomplete', writes: false }
    return {
      kind: 'replace-housekeeping-link',
      templateUpdate: { activeRun: housekeeping.replacementRun, lastRunUnchanged: true },
      writes: false
    }
  }

  if (item.status !== 'awaiting-review')
    return { kind: 'stop', reason: 'work record is not awaiting review', writes: false }
  if (!item.stepsComplete) return { kind: 'stop', reason: 'approved plan steps are incomplete', writes: false }
  if (!item.deliveryEvidencePresent) return { kind: 'stop', reason: 'delivery evidence is incomplete', writes: false }
  if (!matchesReviewPacket(item.reviewHeadings))
    return { kind: 'stop', reason: 'review packet does not match the canonical six-heading schema', writes: false }
  if (!closureAuthorised(authority, item.id))
    return {
      kind: 'stop',
      reason: 'explicit human or approval-bound named batch closure authority is required',
      writes: false
    }

  if (housekeeping.kind === 'accepted') {
    if (
      housekeeping.activeRun !== item.id ||
      !housekeeping.templateMatches ||
      !/^\d{4}-\d{2}-\d{2}$/.test(housekeeping.scheduledFor ?? '')
    )
      return { kind: 'stop', reason: 'linked housekeeping completion evidence is incomplete', writes: false }
    return {
      kind: 'accept',
      transition: 'awaiting-review-to-done',
      templateUpdate: { lastRun: housekeeping.scheduledFor as string, activeRun: null },
      writes: false
    }
  }
  return { kind: 'accept', transition: 'awaiting-review-to-done', templateUpdate: null, writes: false }
}
