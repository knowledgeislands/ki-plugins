import { expect, test } from 'bun:test'
import {
  adoptionDecision,
  captureDecision,
  deferralDecision,
  housekeepingSpawnDecision,
  issueAllocationDecision,
  promotionDecision,
  rankCandidates,
  resolveSelectedAdapter,
  tradeDisposition
} from './internal/decisions.ts'

const local = (adapter: 'roadmap' | 'kb-streams') => ({
  skills: {
    'ki-work': { adapter },
    [adapter === 'roadmap' ? 'ki-work-roadmap' : 'ki-repo-kb-streams']: {}
  }
})

test('resolves only declared local adapters and refuses remote or incomplete selection', () => {
  expect(resolveSelectedAdapter(local('roadmap'))).toMatchObject({ kind: 'local', recordRoot: 'docs/roadmap' })
  expect(resolveSelectedAdapter(local('kb-streams'))).toMatchObject({ kind: 'local', recordRoot: 'Streams/Roadmap' })
  expect(resolveSelectedAdapter({ skills: { 'ki-work': { adapter: 'linear' } } })).toMatchObject({
    kind: 'refusal'
  })
  expect(
    resolveSelectedAdapter({
      skills: { 'ki-work': { adapter: 'linear' }, 'ki-work-linear': {} }
    })
  ).toMatchObject({ kind: 'remote-refusal' })
})

test('ranks only dependency-ready immediate records and preserves confirmation gates', () => {
  expect(
    rankCandidates([
      { id: 'NOW-1', horizon: 'now', status: 'draft', dependenciesReady: true },
      { id: 'NEXT-1', horizon: 'next', status: 'ready', dependenciesReady: true },
      { id: 'BLOCKED-1', horizon: 'next', status: 'draft', dependenciesReady: false },
      { id: 'SOON-1', horizon: 'soon', status: 'draft', dependenciesReady: true }
    ])
  ).toEqual(['NOW-1', 'NEXT-1'])
  expect(
    promotionDecision({ id: 'FUTURE-1', horizon: 'future', status: 'draft', dependenciesReady: true }, true, true)
  ).toBe('promote-soon')
  expect(
    promotionDecision({ id: 'SOON-1', horizon: 'soon', status: 'draft', dependenciesReady: true }, false, false)
  ).toBe('refuse')
  expect(
    deferralDecision(
      { id: 'NOW-1', horizon: 'now', status: 'draft', dependenciesReady: true },
      'waiting-for',
      true,
      false
    )
  ).toBe('refuse')
})

test('captures only substantive unowned work and gates triage adoption', () => {
  expect(captureDecision({ substantive: true, existingOwner: false, resolvedOrRhetorical: false })).toBe(
    'capture-triage'
  )
  expect(captureDecision({ substantive: true, existingOwner: true, resolvedOrRhetorical: false })).toBe('refuse')
  const triage = { id: 'TRIAGE-1', horizon: 'triage' as const, status: 'draft' as const, dependenciesReady: true }
  expect(adoptionDecision(triage, 'future', false, true)).toBe('refuse')
  expect(adoptionDecision(triage, 'future', true, true)).toBe('adopt')
  expect(adoptionDecision(triage, 'next', true, false)).toBe('refuse')
  expect(deferralDecision(triage, 'future', true, true)).toBe('refuse')
  expect(deferralDecision({ ...triage, horizon: 'future' }, 'triage', true, true)).toBe('refuse')
})

test('re-reads issue-ledger scope immediately before publishing record and ledger atomically', () => {
  expect(
    issueAllocationDecision({
      inspected: { mode: 'repository', lastId: 41 },
      current: { mode: 'repository', lastId: 41 },
      area: null,
      proposedSerial: 42
    })
  ).toEqual({ kind: 'publish-proposed', serial: 42, ledgerHighWater: 42 })
  expect(
    issueAllocationDecision({
      inspected: { mode: 'repository', lastId: 41 },
      current: { mode: 'repository', lastId: 44 },
      area: null,
      proposedSerial: 42
    })
  ).toEqual({ kind: 'reallocate-and-publish', serial: 45, ledgerHighWater: 45 })
  expect(
    issueAllocationDecision({
      inspected: { mode: 'areas', areas: { CORE: 7, OPS: 3 } },
      current: { mode: 'areas', areas: { CORE: 8, OPS: 3 } },
      area: 'CORE',
      proposedSerial: 8
    })
  ).toEqual({ kind: 'reallocate-and-publish', serial: 9, ledgerHighWater: 9 })
  expect(
    issueAllocationDecision({
      inspected: { mode: 'areas', areas: { CORE: 7 } },
      current: { mode: 'areas', areas: { CORE: 7 } },
      area: 'CORE',
      proposedSerial: 8
    })
  ).toEqual({ kind: 'publish-proposed', serial: 8, ledgerHighWater: 8 })
  expect(
    issueAllocationDecision({
      inspected: { mode: 'repository', lastId: 9 },
      current: { mode: 'repository', lastId: 8 },
      area: null,
      proposedSerial: 10
    })
  ).toMatchObject({ kind: 'refuse' })
})

test('spawns only one active housekeeping run and separates direct trade application', () => {
  expect(
    housekeepingSpawnDecision({
      status: 'active',
      due: true,
      overdue: false,
      policy: 'when-due',
      activeRun: null,
      confirmed: false
    })
  ).toBe('spawn-active-run-only')
  expect(
    housekeepingSpawnDecision({
      status: 'active',
      due: true,
      overdue: false,
      policy: 'manual',
      activeRun: null,
      confirmed: false
    })
  ).toBe('refuse')
  expect(
    housekeepingSpawnDecision({
      status: 'active',
      due: true,
      overdue: false,
      policy: 'manual',
      activeRun: null,
      confirmed: true
    })
  ).toBe('spawn-active-run-only')
  expect(
    housekeepingSpawnDecision({
      status: 'active',
      due: true,
      overdue: true,
      policy: 'when-overdue',
      activeRun: 'HK-1',
      confirmed: true
    })
  ).toBe('refuse')
  expect(
    tradeDisposition({
      bounded: true,
      reversible: true,
      independentlyVerifiable: true,
      materialDecision: false,
      confirmed: true
    })
  ).toBe('apply-directly')
  expect(
    tradeDisposition({
      bounded: true,
      reversible: true,
      independentlyVerifiable: true,
      materialDecision: true,
      confirmed: true
    })
  ).toBe('adopt-work-record')
})
