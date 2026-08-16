export type AdapterResolution =
  | { kind: 'local'; adapter: 'roadmap' | 'kb-streams' }
  | { kind: 'remote-execution-unavailable'; adapter: string }
  | { kind: 'unresolved'; reason: string }

export type BatchItem = {
  id: string
  status: 'draft' | 'ready' | 'in-progress' | 'awaiting-review' | 'done'
  canonical: boolean
  repository: string
  scopeMatchesAuthorisation: boolean
  boundedPlan: boolean
  requiredChecksAvailable: boolean
  dependencyIds: readonly string[]
  externalDependenciesSatisfied: boolean
  mandatoryStop?: string
  delegation: 'none' | 'authorised' | 'unauthorised'
  question?: string
}

export type BatchCycleInput = {
  authorisation: {
    approved: boolean
    repository: string
    timeboxActive: boolean
    itemIds: readonly string[]
    approvedPayloadSha256: string
    runBinding: { id: string; approvedPayloadSha256: string } | null
  }
  adapter: AdapterResolution
  repository: {
    path: string
    clean: boolean
    gatesPass: boolean
  }
  items: readonly BatchItem[]
}

export type BatchCycleOutcome =
  | { kind: 'coordinate'; itemIds: readonly string[]; writes: false }
  | { kind: 'question'; questions: readonly string[]; writes: false }
  | { kind: 'stop'; reason: string; writes: false }

const stop = (reason: string): BatchCycleOutcome => ({ kind: 'stop', reason, writes: false })

export const evaluateBatchCycle = ({
  authorisation,
  adapter,
  repository,
  items
}: BatchCycleInput): BatchCycleOutcome => {
  if (!authorisation.approved) return stop('batch authorisation is not approved')
  if (authorisation.repository !== repository.path) return stop('batch authorisation names another repository')
  if (!authorisation.timeboxActive) return stop('batch authorisation timebox has expired')
  if (adapter.kind === 'unresolved') return stop(`selected adapter is unresolved: ${adapter.reason}`)
  if (adapter.kind === 'remote-execution-unavailable')
    return stop(`selected ${adapter.adapter} adapter cannot execute a batch pending KI-HARNESS-FND-014`)
  if (
    !authorisation.runBinding ||
    authorisation.runBinding.approvedPayloadSha256 !== authorisation.approvedPayloadSha256
  )
    return stop('batch run is not bound to the approved payload')
  if (new Set(authorisation.itemIds).size !== authorisation.itemIds.length)
    return stop('batch authorisation repeats an item identifier')
  if (new Set(items.map((item) => item.id)).size !== items.length)
    return stop('canonical item resolution repeats an item identifier')
  if (!repository.clean) return stop('repository worktree is not clean')
  if (!repository.gatesPass) return stop('required read-only gate has failed')

  const byId = new Map(items.map((item) => [item.id, item]))
  const named = authorisation.itemIds.map((id) => byId.get(id))
  if (named.some((item) => !item)) return stop('batch authorisation names an unknown canonical item')

  const resolved = named as BatchItem[]
  const questions = resolved.flatMap((item) => (item.question ? [`${item.id}: ${item.question}`] : []))
  if (questions.length > 0) return { kind: 'question', questions, writes: false }

  const positions = new Map(authorisation.itemIds.map((id, index) => [id, index]))
  for (const [index, item] of resolved.entries()) {
    if (!item.canonical) return stop(`${item.id} is not a canonical adapter record`)
    if (item.repository !== repository.path) return stop(`${item.id} names another repository`)
    if (!item.scopeMatchesAuthorisation) return stop(`${item.id} exceeds the approved file or system scope`)
    if (!item.boundedPlan) return stop(`${item.id} has no bounded approved plan`)
    if (!item.requiredChecksAvailable) return stop(`${item.id} has unavailable required verification`)
    if (item.delegation === 'unauthorised') return stop(`${item.id} has unauthorised delegation`)
    if (item.mandatoryStop) return stop(`${item.id} reached mandatory stop: ${item.mandatoryStop}`)
    if (item.status !== 'ready') return stop(`${item.id} is not ready`)
    if (!item.externalDependenciesSatisfied) return stop(`${item.id} has an unsatisfied external dependency`)
    for (const dependency of item.dependencyIds) {
      const dependencyPosition = positions.get(dependency)
      if (dependencyPosition !== undefined && dependencyPosition >= index)
        return stop(`${item.id} is not after its in-batch dependency ${dependency}`)
    }
  }

  return { kind: 'coordinate', itemIds: authorisation.itemIds, writes: false }
}
