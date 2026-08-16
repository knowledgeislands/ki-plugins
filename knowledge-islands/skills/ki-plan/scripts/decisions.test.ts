import { expect, test } from 'bun:test'
import { delegationDecision, readinessDecision, resolveSelectedAdapter } from './internal/decisions.ts'

const selected = (adapter: 'roadmap' | 'kb-streams') => ({
  skills: {
    'ki-work': { adapter },
    [adapter === 'roadmap' ? 'ki-work-roadmap' : 'ki-repo-kb-streams']: {}
  }
})

test('uses selected local adapter roots without a shape fallback and refuses remote execution', () => {
  expect(resolveSelectedAdapter(selected('roadmap'))).toMatchObject({ kind: 'local', recordRoot: 'docs/roadmap' })
  expect(resolveSelectedAdapter(selected('kb-streams'))).toMatchObject({ kind: 'local', recordRoot: 'Streams/Roadmap' })
  expect(resolveSelectedAdapter({ skills: { 'ki-work': { adapter: 'roadmap' } } })).toMatchObject({
    kind: 'refusal'
  })
  expect(
    resolveSelectedAdapter({
      skills: { 'ki-work': { adapter: 'github-issues' }, 'ki-work-github-issues': {} }
    })
  ).toMatchObject({ kind: 'remote-refusal' })
})

test('permits readiness only as one approved, contained, dependency-ready transition', () => {
  const ready = {
    id: 'TEST-001',
    path: 'docs/roadmap/TEST-001.md',
    root: 'docs/roadmap',
    horizon: 'next' as const,
    status: 'draft' as const,
    dependenciesReady: true,
    verificationDefined: true,
    auditClean: true,
    approved: true
  }
  expect(readinessDecision([ready, { ...ready, id: 'TEST-002', path: 'docs/roadmap/TEST-002.md' }])).toBe(
    'ready-atomically'
  )
  expect(readinessDecision([ready, { ...ready, id: 'TEST-002', approved: false }])).toBe('refuse')
  expect(readinessDecision([{ ...ready, path: 'docs/roadmap/../outside.md' }])).toBe('refuse')
  expect(readinessDecision([{ ...ready, dependenciesReady: false }])).toBe('refuse')
  expect(readinessDecision([{ ...ready, auditClean: false }])).toBe('refuse')
})

test('uses a durable delegation packet only for its demonstrated threshold', () => {
  expect(
    delegationDecision({
      durablePacketRequested: true,
      mutationRisk: true,
      crossAgentHandoff: false,
      laterAuditNeed: false
    })
  ).toBe('durable-packet')
  expect(
    delegationDecision({
      durablePacketRequested: true,
      mutationRisk: false,
      crossAgentHandoff: false,
      laterAuditNeed: false
    })
  ).toBe('ordinary-process-delegation')
})
