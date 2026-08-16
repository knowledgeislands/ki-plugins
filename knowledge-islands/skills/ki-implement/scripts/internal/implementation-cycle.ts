export const REVIEW_PACKET_HEADINGS = [
  'Delivered',
  'Summary of changes',
  'Verification',
  'Outstanding concerns',
  'Post-change review',
  'Mini recap'
] as const

export type ImplementationAdapter =
  | { kind: 'local'; adapter: 'roadmap' | 'kb-streams' }
  | { kind: 'remote-execution-unavailable'; adapter: 'github-issues' | 'linear' }
  | { kind: 'unresolved'; reason: string }

export type ImplementationCycleInput = {
  adapter: ImplementationAdapter
  item: {
    canonical: boolean
    status: 'draft' | 'ready' | 'in-progress' | 'awaiting-review' | 'done'
    approved: boolean
    dependenciesSatisfied: boolean
    boundedPlan: boolean
    stepsComplete: boolean
    scopeHeld: boolean
    delegation: 'none' | 'authorised' | 'unauthorised'
  }
  gatesPass: boolean
  baselineRef: string | null
  verificationPasses: boolean
  reviewHeadings: readonly string[]
}

export type ImplementationCycleOutcome =
  | { kind: 'start'; transition: 'ready-to-in-progress'; baselineRef: string; writes: false }
  | { kind: 'handoff'; transition: 'in-progress-to-awaiting-review'; reviewHeadings: readonly string[]; writes: false }
  | { kind: 'stop'; reason: string; writes: false }

const commit = (value: string | null): value is string =>
  value !== null && /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(value)

const reviewPacketMatches = (headings: readonly string[]): boolean =>
  headings.length === REVIEW_PACKET_HEADINGS.length &&
  headings.every((heading, index) => heading === REVIEW_PACKET_HEADINGS[index])

export const evaluateImplementationCycle = ({
  adapter,
  item,
  gatesPass,
  baselineRef,
  verificationPasses,
  reviewHeadings
}: ImplementationCycleInput): ImplementationCycleOutcome => {
  if (adapter.kind === 'unresolved')
    return { kind: 'stop', reason: `selected adapter is unresolved: ${adapter.reason}`, writes: false }
  if (adapter.kind === 'remote-execution-unavailable')
    return {
      kind: 'stop',
      reason: `selected ${adapter.adapter} adapter cannot execute pending KI-HARNESS-FND-014`,
      writes: false
    }
  if (!item.canonical)
    return { kind: 'stop', reason: 'work record is not canonical for the selected adapter', writes: false }
  if (!item.approved) return { kind: 'stop', reason: 'work record is not approved for implementation', writes: false }
  if (!item.dependenciesSatisfied)
    return { kind: 'stop', reason: 'work record has unsatisfied dependencies', writes: false }
  if (!item.boundedPlan) return { kind: 'stop', reason: 'work record has no bounded plan', writes: false }
  if (!gatesPass) return { kind: 'stop', reason: 'required read-only gate has failed', writes: false }
  if (!item.scopeHeld) return { kind: 'stop', reason: 'execution exceeds the approved scope', writes: false }
  if (item.delegation === 'unauthorised')
    return { kind: 'stop', reason: 'delegated work lacks explicit authority', writes: false }

  if (item.status === 'ready') {
    if (!commit(baselineRef)) return { kind: 'stop', reason: 'immutable baseline is missing or invalid', writes: false }
    return { kind: 'start', transition: 'ready-to-in-progress', baselineRef, writes: false }
  }
  if (item.status === 'in-progress') {
    if (!commit(baselineRef)) return { kind: 'stop', reason: 'immutable baseline is missing or invalid', writes: false }
    if (!item.stepsComplete) return { kind: 'stop', reason: 'approved plan steps are incomplete', writes: false }
    if (!verificationPasses) return { kind: 'stop', reason: 'required verification has failed', writes: false }
    if (!reviewPacketMatches(reviewHeadings))
      return { kind: 'stop', reason: 'review packet does not match the canonical six-heading schema', writes: false }
    return { kind: 'handoff', transition: 'in-progress-to-awaiting-review', reviewHeadings, writes: false }
  }
  return { kind: 'stop', reason: `work record is not implementable from ${item.status}`, writes: false }
}
