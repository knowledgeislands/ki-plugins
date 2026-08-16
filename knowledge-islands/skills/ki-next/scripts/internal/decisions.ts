type SkillTables = Record<string, unknown>

export type AdapterDecision =
  | {
      readonly kind: 'local'
      readonly adapter: 'roadmap' | 'kb-streams'
      readonly owner: string
      readonly recordRoot: string
    }
  | { readonly kind: 'remote-refusal'; readonly adapter: 'github-issues' | 'linear'; readonly reason: string }
  | { readonly kind: 'refusal'; readonly reason: string }

const tableAt = (configuration: unknown, name: string): Record<string, unknown> | undefined => {
  const skills = (configuration as { skills?: SkillTables } | undefined)?.skills
  const table = skills?.[name]
  return typeof table === 'object' && table !== null && !Array.isArray(table)
    ? (table as Record<string, unknown>)
    : undefined
}

export const resolveSelectedAdapter = (configuration: unknown): AdapterDecision => {
  const selection = tableAt(configuration, 'ki-work')
  const adapter = selection?.adapter
  const owners = {
    roadmap: { owner: 'ki-work-roadmap', recordRoot: 'docs/roadmap' },
    'kb-streams': { owner: 'ki-repo-kb-streams', recordRoot: 'Streams/Roadmap' },
    'github-issues': { owner: 'ki-work-github-issues' },
    linear: { owner: 'ki-work-linear' }
  } as const
  if (adapter !== 'roadmap' && adapter !== 'kb-streams' && adapter !== 'github-issues' && adapter !== 'linear')
    return { kind: 'refusal', reason: 'No supported configured change-management adapter is available.' }
  if (adapter === 'github-issues' || adapter === 'linear')
    return !tableAt(configuration, owners[adapter].owner)
      ? { kind: 'refusal', reason: `Selected ${adapter} adapter lacks its required ${owners[adapter].owner} table.` }
      : {
          kind: 'remote-refusal',
          adapter,
          reason: `${adapter} process execution is not implemented; stop without writes.`
        }
  const definition = owners[adapter]
  if (!tableAt(configuration, definition.owner))
    return { kind: 'refusal', reason: `Selected ${adapter} adapter lacks its required ${definition.owner} table.` }
  return { kind: 'local', adapter, owner: definition.owner, recordRoot: definition.recordRoot }
}

export type Candidate = {
  readonly id: string
  readonly horizon: 'now' | 'next' | 'soon' | 'future' | 'waiting-for' | 'parked'
  readonly status: 'draft' | 'ready' | 'in-progress' | 'awaiting-review' | 'done'
  readonly dependenciesReady: boolean
}

export const rankCandidates = (candidates: readonly Candidate[]): readonly string[] =>
  candidates
    .filter((candidate) => (candidate.horizon === 'now' || candidate.horizon === 'next') && candidate.dependenciesReady)
    .filter((candidate) => candidate.status === 'draft' || candidate.status === 'ready')
    .map((candidate) => candidate.id)

export const promotionDecision = (
  candidate: Candidate,
  confirmed: boolean,
  soonAddsValue: boolean
): 'promote-next' | 'promote-soon' | 'refuse' => {
  if (!confirmed || !candidate.dependenciesReady) return 'refuse'
  if (candidate.horizon === 'soon') return 'promote-next'
  if (candidate.horizon === 'future') return soonAddsValue ? 'promote-soon' : 'promote-next'
  return 'refuse'
}

export const deferralDecision = (
  candidate: Candidate,
  destination: Candidate['horizon'],
  confirmed: boolean,
  hasRequiredCondition: boolean
): 'defer' | 'refuse' =>
  confirmed &&
  candidate.status !== 'done' &&
  ((destination !== 'waiting-for' && destination !== 'parked') || hasRequiredCondition)
    ? 'defer'
    : 'refuse'

export const housekeepingSpawnDecision = (input: {
  readonly status: 'active' | 'paused'
  readonly due: boolean
  readonly overdue: boolean
  readonly policy: 'manual' | 'when-due' | 'when-overdue'
  readonly activeRun: string | null
  readonly confirmed: boolean
}): 'spawn-active-run-only' | 'refuse' => {
  if (input.status !== 'active' || input.activeRun) return 'refuse'
  if (input.policy === 'manual') return input.due && input.confirmed ? 'spawn-active-run-only' : 'refuse'
  if (input.policy === 'when-due') return input.due ? 'spawn-active-run-only' : 'refuse'
  return input.overdue ? 'spawn-active-run-only' : 'refuse'
}

export const tradeDisposition = (input: {
  readonly bounded: boolean
  readonly reversible: boolean
  readonly independentlyVerifiable: boolean
  readonly materialDecision: boolean
  readonly confirmed: boolean
}): 'apply-directly' | 'adopt-work-record' | 'refuse' => {
  if (!input.confirmed) return 'refuse'
  return input.bounded && input.reversible && input.independentlyVerifiable && !input.materialDecision
    ? 'apply-directly'
    : 'adopt-work-record'
}
