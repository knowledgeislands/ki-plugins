import { expect, test } from 'bun:test'
import {
  deferralDecision,
  housekeepingSpawnDecision,
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
