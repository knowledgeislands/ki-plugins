import { expect, test } from 'bun:test'
import {
  type AcceptanceCycleInput,
  evaluateAcceptanceCycle,
  REVIEW_PACKET_HEADINGS
} from './internal/acceptance-cycle.ts'

const input = (overrides: Partial<AcceptanceCycleInput> = {}): AcceptanceCycleInput => ({
  adapter: { kind: 'local', adapter: 'roadmap', root: 'docs/roadmap' },
  item: {
    id: 'KI-HARNESS-001',
    canonical: true,
    pathWithinRoot: true,
    status: 'awaiting-review',
    stepsComplete: true,
    deliveryEvidencePresent: true,
    reviewHeadings: REVIEW_PACKET_HEADINGS
  },
  authority: { kind: 'human', explicitApproval: true },
  housekeeping: { kind: 'none' },
  ...overrides
})

test('accepts one canonical awaiting-review record with explicit human authority without writes', () => {
  expect(evaluateAcceptanceCycle(input())).toEqual({
    kind: 'accept',
    transition: 'awaiting-review-to-done',
    templateUpdate: null,
    writes: false
  })
})

test('accepts an approval-bound named batch closure and reconciles one successful housekeeping run', () => {
  expect(
    evaluateAcceptanceCycle(
      input({
        authority: {
          kind: 'batch',
          approved: true,
          payloadMatchesApproval: true,
          runMatchesApproval: true,
          closureItemIds: ['KI-HARNESS-001']
        },
        housekeeping: {
          kind: 'accepted',
          activeRun: 'KI-HARNESS-001',
          itemId: 'KI-HARNESS-001',
          templateMatches: true,
          scheduledFor: '2026-08-12'
        }
      })
    )
  ).toEqual({
    kind: 'accept',
    transition: 'awaiting-review-to-done',
    templateUpdate: { lastRun: '2026-08-12', activeRun: null },
    writes: false
  })
})

test('stops without writes for unsupported adapters, invalid evidence, and unapproved closure', () => {
  expect(
    evaluateAcceptanceCycle(input({ adapter: { kind: 'unresolved', reason: 'missing declaration' } }))
  ).toMatchObject({
    kind: 'stop',
    reason: 'selected adapter is unresolved: missing declaration',
    writes: false
  })
  expect(
    evaluateAcceptanceCycle(input({ adapter: { kind: 'remote-execution-unavailable', adapter: 'linear' } }))
  ).toMatchObject({
    kind: 'stop',
    reason: 'selected linear adapter cannot accept pending KI-HARNESS-FND-014',
    writes: false
  })
  for (const item of [
    { ...input().item, canonical: false },
    { ...input().item, pathWithinRoot: false },
    { ...input().item, status: 'in-progress' as const },
    { ...input().item, stepsComplete: false },
    { ...input().item, deliveryEvidencePresent: false },
    { ...input().item, reviewHeadings: ['Delivered'] }
  ])
    expect(evaluateAcceptanceCycle(input({ item }))).toMatchObject({ kind: 'stop', writes: false })
  expect(evaluateAcceptanceCycle(input({ authority: { kind: 'human', explicitApproval: false } }))).toMatchObject({
    kind: 'stop',
    reason: 'explicit human or approval-bound named batch closure authority is required',
    writes: false
  })
  expect(
    evaluateAcceptanceCycle(
      input({
        authority: {
          kind: 'batch',
          approved: true,
          payloadMatchesApproval: true,
          runMatchesApproval: false,
          closureItemIds: ['KI-HARNESS-001']
        }
      })
    )
  ).toMatchObject({ kind: 'stop', writes: false })
})

test('advances last-run only for accepted completion and requires an explicit recovery action for a non-successful run', () => {
  const accepted = {
    kind: 'accepted' as const,
    activeRun: 'wrong-id',
    itemId: 'KI-HARNESS-001',
    templateMatches: true,
    scheduledFor: '2026-08-12'
  }
  expect(evaluateAcceptanceCycle(input({ housekeeping: accepted }))).toMatchObject({
    kind: 'stop',
    reason: 'linked housekeeping completion evidence is incomplete',
    writes: false
  })
  for (const outcome of ['failed', 'abandoned', 'superseded'] as const)
    expect(
      evaluateAcceptanceCycle(
        input({
          housekeeping: { kind: 'non-successful', outcome, activeRun: 'KI-HARNESS-001', itemId: 'KI-HARNESS-001' }
        })
      )
    ).toMatchObject({
      kind: 'stop',
      reason: 'non-successful housekeeping work retains its active link pending explicit disposition or replacement',
      writes: false
    })
  expect(
    evaluateAcceptanceCycle(
      input({ housekeeping: { kind: 'disposition', activeRun: 'KI-HARNESS-001', itemId: 'KI-HARNESS-001' } })
    )
  ).toEqual({
    kind: 'clear-housekeeping-link',
    templateUpdate: { activeRun: null, lastRunUnchanged: true },
    writes: false
  })
  expect(
    evaluateAcceptanceCycle(
      input({
        housekeeping: {
          kind: 'replacement',
          activeRun: 'KI-HARNESS-001',
          itemId: 'KI-HARNESS-001',
          replacementRun: 'KI-HARNESS-002',
          replacementMatches: true
        }
      })
    )
  ).toEqual({
    kind: 'replace-housekeeping-link',
    templateUpdate: { activeRun: 'KI-HARNESS-002', lastRunUnchanged: true },
    writes: false
  })
  expect(
    evaluateAcceptanceCycle(
      input({
        housekeeping: {
          kind: 'replacement',
          activeRun: 'KI-HARNESS-001',
          itemId: 'KI-HARNESS-001',
          replacementRun: 'KI-HARNESS-001',
          replacementMatches: true
        }
      })
    )
  ).toMatchObject({ kind: 'stop', reason: 'housekeeping replacement evidence is incomplete', writes: false })
})
