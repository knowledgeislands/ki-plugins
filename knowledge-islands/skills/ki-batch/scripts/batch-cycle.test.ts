import { expect, test } from 'bun:test'
import { type BatchCycleInput, evaluateBatchCycle } from './internal/batch-cycle.ts'

const input = (overrides: Partial<BatchCycleInput> = {}): BatchCycleInput => ({
  authorisation: {
    approved: true,
    repository: 'knowledgeislands/ki-agentic-harness',
    timeboxActive: true,
    itemIds: ['TEST-001']
  },
  repository: { path: 'knowledgeislands/ki-agentic-harness', clean: true, gatesPass: true },
  items: [{ id: 'TEST-001', status: 'ready', dependencySatisfied: true }],
  ...overrides
})

test('coordinates only an approved clean same-repository ready item set without writes', () => {
  expect(evaluateBatchCycle(input())).toEqual({ kind: 'coordinate', itemIds: ['TEST-001'], writes: false })
})

test('stops without writes when authority or repository preflight is invalid', () => {
  expect(evaluateBatchCycle(input({ authorisation: { ...input().authorisation, approved: false } }))).toMatchObject({
    kind: 'stop',
    reason: 'batch authorisation is not approved',
    writes: false
  })
  expect(evaluateBatchCycle(input({ repository: { ...input().repository, clean: false } }))).toMatchObject({
    kind: 'stop',
    reason: 'repository worktree is not clean',
    writes: false
  })
  expect(evaluateBatchCycle(input({ repository: { ...input().repository, gatesPass: false } }))).toMatchObject({
    kind: 'stop',
    reason: 'required read-only gate has failed',
    writes: false
  })
})

test('asks early questions before evaluating an item for delivery', () => {
  expect(
    evaluateBatchCycle(
      input({ items: [{ id: 'TEST-001', status: 'draft', dependencySatisfied: false, question: 'Choose scope' }] })
    )
  ).toEqual({ kind: 'question', questions: ['TEST-001: Choose scope'], writes: false })
})

test('stops without writes for an unready or blocked named item', () => {
  expect(
    evaluateBatchCycle(input({ items: [{ id: 'TEST-001', status: 'draft', dependencySatisfied: true }] }))
  ).toMatchObject({
    kind: 'stop',
    reason: 'TEST-001 is not ready',
    writes: false
  })
  expect(
    evaluateBatchCycle(input({ items: [{ id: 'TEST-001', status: 'ready', dependencySatisfied: false }] }))
  ).toMatchObject({
    kind: 'stop',
    reason: 'TEST-001 has an unsatisfied dependency',
    writes: false
  })
})
