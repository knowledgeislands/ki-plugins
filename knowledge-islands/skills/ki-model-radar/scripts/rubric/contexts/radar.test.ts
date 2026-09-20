import { describe, expect, test } from 'bun:test'
import { createModelRadarSession, inspectRadar } from './radar.ts'

const TODAY = new Date('2026-09-14T12:00:00Z')

const emptyRadar = `schema = 1
reviewed_on = "2026-09-14"

[benchmarks]
[evidence]
[models]
[routes]
`

const populatedRadar = `schema = 1
reviewed_on = "2026-09-14"

[evidence.source-a]
id = "source-a"
title = "Independent route evaluation"
url = "https://example.test/evaluation"
unit = "model-agent"
independence = "independent"
reviewed_on = "2026-09-14"

[models.model-a]
id = "model-a"
display_name = "Model A"
provider = "Provider A"
openness = "proprietary"
license = "Provider terms"
retirement = "active"
reviewed_on = "2026-09-14"
evidence = ["source-a"]
counter_evidence = []

[routes.model-a-agent]
id = "model-a-agent"
model = "model-a"
agent = "Agent"
protocol = "portable-test"
access = "subscription-agent"
locality = "unavailable"
recommendation = "adopt"
support = "default"
movement = "unchanged"
reviewed_on = "2026-09-14"
evidence = ["source-a"]
counter_evidence = []

[benchmarks.benchmark-a]
id = "benchmark-a"
display_name = "Benchmark A"
owner = "Independent owner"
unit = "model-agent"
domain = "repository work"
metric = "task completion"
constraints = "public synthetic fixture"
reproducibility = "versioned fixture"
risks = "limited scope"
run_cost = "bounded local run"
applicability = "corroborating"
lifecycle = "current"
published_on = "2026-09-01"
data_as_of = "2026-09-01"
reviewed_on = "2026-09-14"
evidence = ["source-a"]
`

const violations = (outcomes: readonly { status: string; message: string; level?: string }[]) =>
  outcomes.filter((outcome) => outcome.status === 'VIOLATION')

describe('model radar inspection', () => {
  test.each([
    ['2026-09-06', false],
    ['2026-09-05', false],
    ['2026-09-04', true]
  ] as const)('weekly freshness boundary for review date %s', (reviewedOn, warns) => {
    const radar = populatedRadar.replaceAll('2026-09-14', reviewedOn)
    const outcomes = violations(inspectRadar(radar, TODAY).lifecycle.vocabularyAndDates)
    const stale = outcomes.filter(({ level }) => level === 'WARN')
    expect(stale).toHaveLength(warns ? 5 : 0)
    expect(outcomes).toHaveLength(stale.length)
    for (const outcome of stale) expect(outcome.message).toContain('refresh after 9 days')
  })

  test('accepts the intentionally empty initial snapshot', () => {
    const inspected = inspectRadar(emptyRadar, TODAY)
    expect(violations(inspected.schema.outcomes)).toEqual([])
    expect(violations(inspected.evidence.outcomes)).toEqual([])
    expect(violations(inspected.lifecycle.vocabularyAndDates)).toEqual([])
    expect(violations(inspected.lifecycle.consistency)).toEqual([])
  })

  test('accepts a complete linked model, route, benchmark, and evidence set', () => {
    const inspected = inspectRadar(populatedRadar, TODAY)
    expect(violations(inspected.schema.outcomes)).toEqual([])
    expect(violations(inspected.evidence.outcomes)).toEqual([])
    expect(violations(inspected.lifecycle.vocabularyAndDates)).toEqual([])
    expect(violations(inspected.lifecycle.consistency)).toEqual([])
  })

  test('rejects duplicate identities through TOML parsing', () => {
    const duplicate = `${emptyRadar}\n[models.model-a]\nid = "model-a"\n[models.model-a]\nid = "model-a"\n`
    expect(violations(inspectRadar(duplicate, TODAY).schema.outcomes)[0]?.message).toContain('does not parse')
  })

  test('rejects invalid closed-vocabulary values', () => {
    const invalid = populatedRadar.replace('recommendation = "adopt"', 'recommendation = "promote"')
    expect(
      violations(inspectRadar(invalid, TODAY).lifecycle.vocabularyAndDates).some(({ message }) =>
        message.includes('recommendation must be one of')
      )
    ).toBeTrue()
  })

  test('warns on stale review dates using a deterministic clock', () => {
    const stale = populatedRadar.replace('reviewed_on = "2026-09-14"', 'reviewed_on = "2026-06-01"')
    expect(violations(inspectRadar(stale, TODAY).lifecycle.vocabularyAndDates)).toContainEqual(
      expect.objectContaining({ level: 'WARN', message: expect.stringContaining('refresh after 9 days') })
    )
  })

  test('rejects broken evidence references', () => {
    const broken = populatedRadar.replace('evidence = ["source-a"]', 'evidence = ["missing-source"]')
    expect(violations(inspectRadar(broken, TODAY).evidence.outcomes)[0]?.message).toContain(
      'references missing evidence missing-source'
    )
  })

  test('reports contradictory lifecycle combinations', () => {
    const contradictory = populatedRadar.replace('recommendation = "adopt"', 'recommendation = "assess"')
    expect(violations(inspectRadar(contradictory, TODAY).lifecycle.consistency)[0]?.message).toContain(
      'default support requires adopt recommendation'
    )
  })
})

test('conform proposes no authored radar write', () => {
  const session = createModelRadarSession({
    mode: 'conform',
    repository: '/tmp/model-radar-test',
    userHome: '/tmp/model-radar-user',
    configuration: {},
    packageScriptClaims: []
  })
  expect(session.proposal()).toEqual({ writes: [] })
})
