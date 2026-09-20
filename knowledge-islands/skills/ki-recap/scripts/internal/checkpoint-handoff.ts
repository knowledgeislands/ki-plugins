export type CheckpointHandoffInput = {
  repository: { expected: string; actual: string }
  checkpoint: {
    declared: boolean
    valid: boolean
    requestedThread: string | null
    matchingThreads: readonly string[]
    updateState: 'not-started' | 'interrupted'
  }
  authority: { explicit: boolean; scope: string }
  work: {
    baselineRef: string
    currentHead: string
    dirty: boolean
    portablePatch?: { id: string; baseRef: string; complete: boolean }
  }
  resultDestination: string
  verification: readonly string[]
}

export type CheckpointHandoffDecision =
  | {
      kind: 'ready'
      writes: false
      handoff: {
        repository: string
        thread: string
        authorityScope: string
        resultDestination: string
        verification: readonly string[]
        workState: { kind: 'commit'; ref: string } | { kind: 'portable-patch'; ref: string; baseRef: string }
      }
    }
  | { kind: 'refused'; writes: false; reason: string }

const COMMIT = /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/

const refused = (reason: string): CheckpointHandoffDecision => ({ kind: 'refused', writes: false, reason })

/**
 * Models the fail-closed boundary before `ki-recap checkpoint <thread>` may
 * invoke the separately owned `ki-checkpoint` update procedure. It reads no
 * repository or runtime state and performs no write.
 */
export const evaluateCheckpointHandoff = (input: CheckpointHandoffInput): CheckpointHandoffDecision => {
  if (input.repository.actual !== input.repository.expected)
    return refused('repository identity does not match the requested hand-off')
  if (!input.checkpoint.declared) return refused('target repository does not declare ki-checkpoint')
  if (!input.checkpoint.valid) return refused('target ki-checkpoint capability is invalid')

  const thread = input.checkpoint.requestedThread
  if (!thread) return refused('an exact human-selected thread is required')
  if (input.checkpoint.matchingThreads.length !== 1 || input.checkpoint.matchingThreads[0] !== thread)
    return refused('thread identity is missing or ambiguous')

  if (!input.authority.explicit || input.authority.scope.trim().length === 0)
    return refused('explicit checkpoint write authority and scope are required')
  if (input.resultDestination.trim().length === 0) return refused('result destination is required')
  if (input.verification.length === 0 || input.verification.some((gate) => gate.trim().length === 0))
    return refused('expected verification is required')

  if (!COMMIT.test(input.work.baselineRef) || input.work.baselineRef !== input.work.currentHead)
    return refused('immutable baseline is invalid or stale')
  if (input.checkpoint.updateState === 'interrupted')
    return refused('checkpoint update was interrupted; revalidate before retrying')

  const common = {
    repository: input.repository.actual,
    thread,
    authorityScope: input.authority.scope,
    resultDestination: input.resultDestination,
    verification: input.verification
  }

  if (!input.work.dirty)
    return {
      kind: 'ready',
      writes: false,
      handoff: { ...common, workState: { kind: 'commit', ref: input.work.baselineRef } }
    }

  const patch = input.work.portablePatch
  if (!patch?.complete || patch.id.trim().length === 0 || patch.baseRef !== input.work.baselineRef)
    return refused('uncommitted work requires one complete portable patch against the immutable baseline')

  return {
    kind: 'ready',
    writes: false,
    handoff: { ...common, workState: { kind: 'portable-patch', ref: patch.id, baseRef: patch.baseRef } }
  }
}
