import { expect, test } from 'bun:test'
import {
  evaluateImplementationCycle,
  type ImplementationCycleInput,
  REVIEW_PACKET_HEADINGS
} from './internal/implementation-cycle.ts'

const baseline = 'a'.repeat(40)
const input = (overrides: Partial<ImplementationCycleInput> = {}): ImplementationCycleInput => ({
  adapter: { kind: 'local', adapter: 'roadmap' },
  item: {
    canonical: true,
    status: 'ready',
    approved: true,
    dependenciesSatisfied: true,
    boundedPlan: true,
    stepsComplete: false,
    scopeHeld: true,
    delegation: 'none'
  },
  gatesPass: true,
  baselineRef: baseline,
  verificationPasses: true,
  reviewHeadings: REVIEW_PACKET_HEADINGS,
  ...overrides
})

test('starts one canonical ready local record only with an immutable baseline', () => {
  expect(evaluateImplementationCycle(input())).toEqual({
    kind: 'start',
    transition: 'ready-to-in-progress',
    baselineRef: baseline,
    writes: false
  })
  expect(evaluateImplementationCycle(input({ baselineRef: 'short' }))).toMatchObject({
    kind: 'stop',
    reason: 'immutable baseline is missing or invalid',
    writes: false
  })
})

test('hands off only a complete verified in-progress record with the canonical six-heading packet', () => {
  expect(
    evaluateImplementationCycle(input({ item: { ...input().item, status: 'in-progress', stepsComplete: true } }))
  ).toEqual({
    kind: 'handoff',
    transition: 'in-progress-to-awaiting-review',
    reviewHeadings: REVIEW_PACKET_HEADINGS,
    writes: false
  })
  expect(
    evaluateImplementationCycle(
      input({ item: { ...input().item, status: 'in-progress', stepsComplete: true }, reviewHeadings: ['Delivered'] })
    )
  ).toMatchObject({
    kind: 'stop',
    reason: 'review packet does not match the canonical six-heading schema',
    writes: false
  })
})

test('stops without writes for unresolved or remote adapters and every authority or execution failure', () => {
  expect(
    evaluateImplementationCycle(input({ adapter: { kind: 'unresolved', reason: 'missing declaration' } }))
  ).toMatchObject({
    kind: 'stop',
    reason: 'selected adapter is unresolved: missing declaration',
    writes: false
  })
  expect(
    evaluateImplementationCycle(input({ adapter: { kind: 'remote-execution-unavailable', adapter: 'github-issues' } }))
  ).toMatchObject({
    kind: 'stop',
    reason: 'selected github-issues adapter cannot execute pending KI-HARNESS-FND-014',
    writes: false
  })
  for (const item of [
    { ...input().item, canonical: false },
    { ...input().item, approved: false },
    { ...input().item, dependenciesSatisfied: false },
    { ...input().item, boundedPlan: false },
    { ...input().item, scopeHeld: false },
    { ...input().item, delegation: 'unauthorised' as const }
  ])
    expect(evaluateImplementationCycle(input({ item }))).toMatchObject({ kind: 'stop', writes: false })
  expect(evaluateImplementationCycle(input({ gatesPass: false }))).toMatchObject({
    kind: 'stop',
    reason: 'required read-only gate has failed',
    writes: false
  })
  expect(
    evaluateImplementationCycle(input({ item: { ...input().item, status: 'in-progress', stepsComplete: false } }))
  ).toMatchObject({ kind: 'stop', reason: 'approved plan steps are incomplete', writes: false })
  expect(
    evaluateImplementationCycle(
      input({ item: { ...input().item, status: 'in-progress', stepsComplete: true }, verificationPasses: false })
    )
  ).toMatchObject({ kind: 'stop', reason: 'required verification has failed', writes: false })
})
