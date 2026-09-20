import { describe, expect, test } from 'bun:test'

import { type CheckpointHandoffInput, evaluateCheckpointHandoff } from './internal/checkpoint-handoff.ts'

const baseline = 'a'.repeat(40)

const input = (overrides: Partial<CheckpointHandoffInput> = {}): CheckpointHandoffInput => ({
  repository: { expected: '/work/repo', actual: '/work/repo' },
  checkpoint: {
    declared: true,
    valid: true,
    requestedThread: 'remote-agent-proof',
    matchingThreads: ['remote-agent-proof'],
    updateState: 'not-started'
  },
  authority: { explicit: true, scope: 'Deliver the approved roadmap item only.' },
  work: { baselineRef: baseline, currentHead: baseline, dirty: false },
  resultDestination: 'docs/roadmap/ITEM.md review packet',
  verification: ['bun test', 'ki repo audit'],
  ...overrides
})

describe('portable checkpoint hand-off', () => {
  test('projects a complete committed hand-off without transcript or shared-filesystem state', () => {
    expect(evaluateCheckpointHandoff(input())).toEqual({
      kind: 'ready',
      writes: false,
      handoff: {
        repository: '/work/repo',
        thread: 'remote-agent-proof',
        authorityScope: 'Deliver the approved roadmap item only.',
        resultDestination: 'docs/roadmap/ITEM.md review packet',
        verification: ['bun test', 'ki repo audit'],
        workState: { kind: 'commit', ref: baseline }
      }
    })
  })

  test('accepts one complete portable patch against the current immutable baseline', () => {
    expect(
      evaluateCheckpointHandoff(
        input({
          work: {
            baselineRef: baseline,
            currentHead: baseline,
            dirty: true,
            portablePatch: { id: 'patches/remote-agent-proof.diff', baseRef: baseline, complete: true }
          }
        })
      )
    ).toMatchObject({
      kind: 'ready',
      writes: false,
      handoff: {
        workState: { kind: 'portable-patch', ref: 'patches/remote-agent-proof.diff', baseRef: baseline }
      }
    })
  })

  test('refuses undeclared, malformed, missing, or ambiguous checkpoint identity', () => {
    const invalid = [
      input({ checkpoint: { ...input().checkpoint, declared: false } }),
      input({ checkpoint: { ...input().checkpoint, valid: false } }),
      input({ checkpoint: { ...input().checkpoint, requestedThread: null, matchingThreads: [] } }),
      input({
        checkpoint: {
          ...input().checkpoint,
          matchingThreads: ['remote-agent-proof', 'remote-agent-proof-copy']
        }
      })
    ]

    for (const candidate of invalid)
      expect(evaluateCheckpointHandoff(candidate)).toMatchObject({ kind: 'refused', writes: false })
  })

  test('refuses stale, incomplete, unauthorised, mismatched, and interrupted hand-offs', () => {
    const invalid = [
      input({ repository: { expected: '/work/repo', actual: '/work/other' } }),
      input({ work: { baselineRef: baseline, currentHead: 'b'.repeat(40), dirty: false } }),
      input({ work: { baselineRef: baseline, currentHead: baseline, dirty: true } }),
      input({ authority: { explicit: false, scope: '' } }),
      input({ resultDestination: '' }),
      input({ verification: [] }),
      input({ checkpoint: { ...input().checkpoint, updateState: 'interrupted' } })
    ]

    for (const candidate of invalid)
      expect(evaluateCheckpointHandoff(candidate)).toMatchObject({ kind: 'refused', writes: false })
  })
})
