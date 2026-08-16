import { expect, test } from 'bun:test'
import { type BatchCycleInput, evaluateBatchCycle } from './internal/batch-cycle.ts'

const hash = 'a'.repeat(64)
const input = (overrides: Partial<BatchCycleInput> = {}): BatchCycleInput => ({
  authorisation: {
    approved: true,
    repository: 'knowledgeislands/ki-agentic-harness',
    timeboxActive: true,
    itemIds: ['TEST-001'],
    approvedPayloadSha256: hash,
    runBinding: { id: 'TEST-BATCH-RUN-001', approvedPayloadSha256: hash }
  },
  adapter: { kind: 'local', adapter: 'roadmap' },
  repository: { path: 'knowledgeislands/ki-agentic-harness', clean: true, gatesPass: true },
  items: [
    {
      id: 'TEST-001',
      status: 'ready',
      canonical: true,
      repository: 'knowledgeislands/ki-agentic-harness',
      scopeMatchesAuthorisation: true,
      boundedPlan: true,
      requiredChecksAvailable: true,
      dependencyIds: [],
      externalDependenciesSatisfied: true,
      delegation: 'none'
    }
  ],
  ...overrides
})

test('coordinates only a locally resolved, approved, same-repository canonical ready item set without writes', () => {
  expect(evaluateBatchCycle(input())).toEqual({ kind: 'coordinate', itemIds: ['TEST-001'], writes: false })
})

test('stops without writes when adapter, authority, or repository preflight is invalid', () => {
  expect(
    evaluateBatchCycle(input({ adapter: { kind: 'remote-execution-unavailable', adapter: 'linear' } }))
  ).toMatchObject({
    kind: 'stop',
    reason: 'selected linear adapter cannot execute a batch pending KI-HARNESS-FND-014',
    writes: false
  })
  expect(evaluateBatchCycle(input({ authorisation: { ...input().authorisation, runBinding: null } }))).toMatchObject({
    kind: 'stop',
    reason: 'batch run is not bound to the approved payload',
    writes: false
  })
  expect(evaluateBatchCycle(input({ repository: { ...input().repository, clean: false } }))).toMatchObject({
    kind: 'stop',
    reason: 'repository worktree is not clean',
    writes: false
  })
})

test('asks known questions before evaluating an item for delivery', () => {
  expect(evaluateBatchCycle(input({ items: [{ ...input().items[0], question: 'Choose scope' }] }))).toEqual({
    kind: 'question',
    questions: ['TEST-001: Choose scope'],
    writes: false
  })
})

test('stops without writes for duplicate, non-canonical, out-of-scope, gated, delegated, stopped, or blocked work', () => {
  const one = input().items[0]
  expect(
    evaluateBatchCycle(input({ authorisation: { ...input().authorisation, itemIds: ['TEST-001', 'TEST-001'] } }))
  ).toMatchObject({
    kind: 'stop',
    reason: 'batch authorisation repeats an item identifier',
    writes: false
  })
  expect(evaluateBatchCycle(input({ items: [{ ...one, canonical: false }] }))).toMatchObject({
    kind: 'stop',
    reason: 'TEST-001 is not a canonical adapter record',
    writes: false
  })
  expect(evaluateBatchCycle(input({ items: [{ ...one, scopeMatchesAuthorisation: false }] }))).toMatchObject({
    kind: 'stop',
    reason: 'TEST-001 exceeds the approved file or system scope',
    writes: false
  })
  expect(evaluateBatchCycle(input({ items: [{ ...one, requiredChecksAvailable: false }] }))).toMatchObject({
    kind: 'stop',
    reason: 'TEST-001 has unavailable required verification',
    writes: false
  })
  expect(evaluateBatchCycle(input({ items: [{ ...one, delegation: 'unauthorised' }] }))).toMatchObject({
    kind: 'stop',
    reason: 'TEST-001 has unauthorised delegation',
    writes: false
  })
  expect(evaluateBatchCycle(input({ items: [{ ...one, mandatoryStop: 'scope expansion' }] }))).toMatchObject({
    kind: 'stop',
    reason: 'TEST-001 reached mandatory stop: scope expansion',
    writes: false
  })
  expect(
    evaluateBatchCycle(input({ items: [{ ...one, dependencyIds: [], externalDependenciesSatisfied: false }] }))
  ).toMatchObject({
    kind: 'stop',
    reason: 'TEST-001 has an unsatisfied external dependency',
    writes: false
  })
})

test('admits a named dependent item only after its in-batch dependency', () => {
  const first = { ...input().items[0], id: 'TEST-001' }
  const second = { ...first, id: 'TEST-002', dependencyIds: ['TEST-001'] }
  expect(
    evaluateBatchCycle(
      input({ authorisation: { ...input().authorisation, itemIds: ['TEST-001', 'TEST-002'] }, items: [first, second] })
    )
  ).toEqual({ kind: 'coordinate', itemIds: ['TEST-001', 'TEST-002'], writes: false })
  expect(
    evaluateBatchCycle(
      input({ authorisation: { ...input().authorisation, itemIds: ['TEST-002', 'TEST-001'] }, items: [first, second] })
    )
  ).toMatchObject({
    kind: 'stop',
    reason: 'TEST-002 is not after its in-batch dependency TEST-001',
    writes: false
  })
})
