import { expect, test } from 'bun:test'
import { evaluatePruneSelection, type PruneSelectionInput } from './internal/prune-selection.ts'

const input = (overrides: Partial<PruneSelectionInput> = {}): PruneSelectionInput => ({
  adapter: 'roadmap',
  root: 'docs/roadmap',
  selectors: ['KI-HARNESS-001-complete.md'],
  completeResolution: true,
  candidates: [
    {
      path: 'KI-HARNESS-001-complete.md',
      regularFile: true,
      symlink: false,
      canonical: true,
      status: 'done',
      retainedByCompletionObservationTrade: false
    }
  ],
  ...overrides
})

test('selects only the complete eligible explicit done-record set without writes', () => {
  expect(evaluatePruneSelection(input())).toEqual({
    kind: 'selected',
    paths: ['KI-HARNESS-001-complete.md'],
    writes: false
  })
})

test('stops without writes for an invalid root, traversal, incomplete resolution, symlink, non-terminal, or retained trade', () => {
  expect(evaluatePruneSelection(input({ root: 'Streams/Roadmap' }))).toMatchObject({
    kind: 'stop',
    reason: 'selected adapter root is invalid',
    writes: false
  })
  expect(evaluatePruneSelection(input({ selectors: ['../outside.md'] }))).toMatchObject({
    kind: 'stop',
    reason: 'prune selection contains an unsafe path or glob',
    writes: false
  })
  expect(evaluatePruneSelection(input({ completeResolution: false }))).toMatchObject({
    kind: 'stop',
    reason: 'prune selection did not resolve a complete non-empty set',
    writes: false
  })
  expect(evaluatePruneSelection(input({ candidates: [{ ...input().candidates[0], symlink: true }] }))).toMatchObject({
    kind: 'stop',
    reason: 'KI-HARNESS-001-complete.md is not a regular canonical work record',
    writes: false
  })
  expect(
    evaluatePruneSelection(input({ candidates: [{ ...input().candidates[0], status: 'awaiting-review' }] }))
  ).toMatchObject({
    kind: 'stop',
    reason: 'KI-HARNESS-001-complete.md is not done',
    writes: false
  })
  expect(
    evaluatePruneSelection(
      input({ candidates: [{ ...input().candidates[0], retainedByCompletionObservationTrade: true }] })
    )
  ).toMatchObject({
    kind: 'stop',
    reason: 'KI-HARNESS-001-complete.md is retained by an unresolved completion-observation trade',
    writes: false
  })
  expect(
    evaluatePruneSelection(
      input({ candidates: [{ ...input().candidates[0], retainedByCompletionObservationTrade: 'unknown' }] })
    )
  ).toMatchObject({
    kind: 'stop',
    reason: 'KI-HARNESS-001-complete.md has uncertain completion-observation trade evidence',
    writes: false
  })
})
