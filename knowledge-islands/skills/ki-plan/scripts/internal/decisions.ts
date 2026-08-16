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

export type ReadinessInput = {
  readonly id: string
  readonly path: string
  readonly root: string
  readonly horizon: 'now' | 'next' | 'soon' | 'future' | 'waiting-for' | 'parked'
  readonly status: 'draft' | 'ready' | 'in-progress' | 'awaiting-review' | 'done'
  readonly dependenciesReady: boolean
  readonly verificationDefined: boolean
  readonly auditClean: boolean
  readonly approved: boolean
}

export const readinessDecision = (items: readonly ReadinessInput[]): 'ready-atomically' | 'refuse' => {
  if (!items.length) return 'refuse'
  return items.every(
    (item) =>
      item.path.startsWith(`${item.root}/`) &&
      !item.path.slice(item.root.length + 1).includes('../') &&
      (item.horizon === 'now' || item.horizon === 'next') &&
      item.status === 'draft' &&
      item.dependenciesReady &&
      item.verificationDefined &&
      item.auditClean &&
      item.approved
  )
    ? 'ready-atomically'
    : 'refuse'
}

export const delegationDecision = (input: {
  readonly durablePacketRequested: boolean
  readonly mutationRisk: boolean
  readonly crossAgentHandoff: boolean
  readonly laterAuditNeed: boolean
}): 'durable-packet' | 'ordinary-process-delegation' =>
  input.durablePacketRequested && (input.mutationRisk || input.crossAgentHandoff || input.laterAuditNeed)
    ? 'durable-packet'
    : 'ordinary-process-delegation'
