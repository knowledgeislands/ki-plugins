export type BatchItem = {
  id: string
  status: 'draft' | 'ready' | 'in-progress' | 'awaiting-review' | 'done'
  dependencySatisfied: boolean
  question?: string
}

export type BatchCycleInput = {
  authorisation: {
    approved: boolean
    repository: string
    timeboxActive: boolean
    itemIds: readonly string[]
  }
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

export const evaluateBatchCycle = ({ authorisation, repository, items }: BatchCycleInput): BatchCycleOutcome => {
  if (!authorisation.approved) return { kind: 'stop', reason: 'batch authorisation is not approved', writes: false }
  if (authorisation.repository !== repository.path)
    return { kind: 'stop', reason: 'batch authorisation names another repository', writes: false }
  if (!authorisation.timeboxActive)
    return { kind: 'stop', reason: 'batch authorisation timebox has expired', writes: false }
  if (!repository.clean) return { kind: 'stop', reason: 'repository worktree is not clean', writes: false }
  if (!repository.gatesPass) return { kind: 'stop', reason: 'required read-only gate has failed', writes: false }

  const byId = new Map(items.map((item) => [item.id, item]))
  const named = authorisation.itemIds.map((id) => byId.get(id))
  if (named.some((item) => !item))
    return { kind: 'stop', reason: 'batch authorisation names an unknown item', writes: false }

  const resolved = named as BatchItem[]
  const questions = resolved.flatMap((item) => (item.question ? [`${item.id}: ${item.question}`] : []))
  if (questions.length > 0) return { kind: 'question', questions, writes: false }

  const unready = resolved.find((item) => item.status !== 'ready')
  if (unready) return { kind: 'stop', reason: `${unready.id} is not ready`, writes: false }

  const blocked = resolved.find((item) => !item.dependencySatisfied)
  if (blocked) return { kind: 'stop', reason: `${blocked.id} has an unsatisfied dependency`, writes: false }

  return { kind: 'coordinate', itemIds: authorisation.itemIds, writes: false }
}
