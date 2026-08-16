export type PruneCandidate = {
  path: string
  regularFile: boolean
  symlink: boolean
  canonical: boolean
  status: 'draft' | 'ready' | 'in-progress' | 'awaiting-review' | 'done'
  retainedByCompletionObservationTrade: boolean | 'unknown'
}

export type PruneSelectionInput = {
  adapter: 'roadmap' | 'kb-streams'
  root: 'docs/roadmap' | 'Streams/Roadmap'
  selectors: readonly string[]
  completeResolution: boolean
  candidates: readonly PruneCandidate[]
}

export type PruneSelectionOutcome =
  | { kind: 'selected'; paths: readonly string[]; writes: false }
  | { kind: 'stop'; reason: string; writes: false }

const selectorIsSafe = (selector: string): boolean =>
  !!selector && !selector.startsWith('/') && !selector.split('/').includes('..') && !selector.includes('\\')

export const evaluatePruneSelection = ({
  adapter,
  root,
  selectors,
  completeResolution,
  candidates
}: PruneSelectionInput): PruneSelectionOutcome => {
  const expectedRoot = adapter === 'roadmap' ? 'docs/roadmap' : 'Streams/Roadmap'
  if (root !== expectedRoot) return { kind: 'stop', reason: 'selected adapter root is invalid', writes: false }
  if (!selectors.length || selectors.some((selector) => !selectorIsSafe(selector)))
    return { kind: 'stop', reason: 'prune selection contains an unsafe path or glob', writes: false }
  if (!completeResolution || !candidates.length)
    return { kind: 'stop', reason: 'prune selection did not resolve a complete non-empty set', writes: false }
  if (new Set(candidates.map((candidate) => candidate.path)).size !== candidates.length)
    return { kind: 'stop', reason: 'prune selection resolves a duplicate record', writes: false }
  for (const candidate of candidates) {
    if (!candidate.regularFile || candidate.symlink || !candidate.canonical)
      return { kind: 'stop', reason: `${candidate.path} is not a regular canonical work record`, writes: false }
    if (candidate.status !== 'done') return { kind: 'stop', reason: `${candidate.path} is not done`, writes: false }
    if (candidate.retainedByCompletionObservationTrade === true)
      return {
        kind: 'stop',
        reason: `${candidate.path} is retained by an unresolved completion-observation trade`,
        writes: false
      }
    if (candidate.retainedByCompletionObservationTrade === 'unknown')
      return {
        kind: 'stop',
        reason: `${candidate.path} has uncertain completion-observation trade evidence`,
        writes: false
      }
  }
  return { kind: 'selected', paths: candidates.map((candidate) => candidate.path), writes: false }
}
