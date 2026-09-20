import { describe, expect, test } from 'bun:test'
import { createAgenticRadarSession, inspectRadar } from './radar.ts'

const TODAY = new Date('2026-09-14T12:00:00Z')

const emptyRadar = `schema = 1
reviewed_on = "2026-09-14"

[evidence]
[subjects]
`

const populatedRadar = `schema = 1
reviewed_on = "2026-09-14"

[evidence.normative]
id = "normative"
title = "Normative protocol text"
url = "https://example.test/spec"
evidence_class = "normative-text"
source_role = "primary"
reviewed_on = "2026-09-14"
notes = "Versioned protocol text."

[evidence.governance]
id = "governance"
title = "Governance release"
url = "https://example.test/release"
evidence_class = "governance-release"
source_role = "corroborating"
reviewed_on = "2026-09-14"
notes = "Stable release statement."

[evidence.independent-a]
id = "independent-a"
title = "Independent implementation A"
url = "https://example.test/a"
evidence_class = "independent-implementation"
source_role = "corroborating"
reviewed_on = "2026-09-14"
notes = "Independent implementation evidence."

[evidence.independent-b]
id = "independent-b"
title = "Independent implementation B"
url = "https://example.test/b"
evidence_class = "independent-implementation"
source_role = "corroborating"
reviewed_on = "2026-09-14"
notes = "Second independent implementation evidence."

[evidence.interop]
id = "interop"
title = "Interoperability demonstration"
url = "https://example.test/interop"
evidence_class = "interoperability-demonstration"
source_role = "corroborating"
reviewed_on = "2026-09-14"
notes = "Bounded cross-implementation demonstration."

[evidence.local-fit]
id = "local-fit"
title = "Knowledge Islands local evaluation"
url = "https://example.test/local"
evidence_class = "local-evaluation"
source_role = "primary"
reviewed_on = "2026-09-14"
notes = "Public synthetic repository use case."

[evidence.limitation]
id = "limitation"
title = "Known interoperability limitation"
url = "https://example.test/limitation"
evidence_class = "research"
source_role = "counter-evidence"
reviewed_on = "2026-09-14"
notes = "Scope limitation."

[subjects.protocol-a]
id = "protocol-a"
display_name = "Protocol A"
subject_kind = "protocol"
stewardship = "foundation"
specification_maturity = "stable"
implementation_state = "multiple-independent"
interoperability_state = "demonstrated"
ki_stance = "adopt"
movement = "inward"
owner = "ki-example"
uncertainty = "Demonstration covers only one transport."
return_trigger = "New protocol release or conformance suite."
reviewed_on = "2026-09-14"
evidence = ["normative", "governance", "independent-a", "independent-b", "interop", "local-fit"]
counter_evidence = ["limitation"]
`

const violations = (outcomes: readonly { status: string; message: string; level?: string }[]) =>
  outcomes.filter((outcome) => outcome.status === 'VIOLATION')

describe('agentic radar inspection', () => {
  test.each([
    ['2026-09-06', false],
    ['2026-09-05', false],
    ['2026-09-04', true]
  ] as const)('weekly freshness boundary for review date %s', (reviewedOn, warns) => {
    const radar = populatedRadar.replaceAll('2026-09-14', reviewedOn)
    const outcomes = violations(inspectRadar(radar, TODAY).lifecycle.outcomes)
    const stale = outcomes.filter(({ level }) => level === 'WARN')
    expect(stale).toHaveLength(warns ? 9 : 0)
    expect(outcomes).toHaveLength(stale.length)
    for (const outcome of stale) expect(outcome.message).toContain('refresh after 9 days')
  })

  test('accepts the conservative empty snapshot', () => {
    const inspected = inspectRadar(emptyRadar, TODAY)
    expect(violations(inspected.schema.outcomes)).toEqual([])
    expect(violations(inspected.evidence.outcomes)).toEqual([])
    expect(violations(inspected.classification.outcomes)).toEqual([])
    expect(violations(inspected.lifecycle.outcomes)).toEqual([])
  })

  test('accepts a complete evidence-backed subject', () => {
    const inspected = inspectRadar(populatedRadar, TODAY)
    expect(violations(inspected.schema.outcomes)).toEqual([])
    expect(violations(inspected.evidence.outcomes)).toEqual([])
    expect(violations(inspected.classification.outcomes)).toEqual([])
    expect(violations(inspected.lifecycle.outcomes)).toEqual([])
  })

  test('rejects malformed TOML and duplicate tables', () => {
    const duplicate = `${emptyRadar}\n[subjects.protocol-a]\nid = "protocol-a"\n[subjects.protocol-a]\nid = "protocol-a"\n`
    expect(violations(inspectRadar(duplicate, TODAY).schema.outcomes)[0]?.message).toContain('does not parse')
  })

  test('rejects missing owners and future dates', () => {
    const invalid = populatedRadar
      .replace('owner = "ki-example"', 'owner = ""')
      .replace('reviewed_on = "2026-09-14"', 'reviewed_on = "2026-09-15"')
    expect(
      violations(inspectRadar(invalid, TODAY).schema.outcomes).some(({ message }) => message.includes('owner'))
    ).toBeTrue()
    expect(
      violations(inspectRadar(invalid, TODAY).lifecycle.outcomes).some(({ message }) =>
        message.includes('must not be future-dated')
      )
    ).toBeTrue()
  })

  test('rejects broken links and contradictory source roles', () => {
    const invalid = populatedRadar
      .replace('source_role = "corroborating"', 'source_role = "counter-evidence"')
      .replace('"local-fit"]', '"missing"]')
    const outcomes = violations(inspectRadar(invalid, TODAY).evidence.outcomes)
    expect(outcomes.some(({ message }) => message.includes('uses counter-evidence record governance'))).toBeTrue()
    expect(outcomes.some(({ message }) => message.includes('references missing evidence missing'))).toBeTrue()
  })

  test('rejects a primary vendor claim', () => {
    const invalid = populatedRadar.replace('evidence_class = "normative-text"', 'evidence_class = "vendor-claim"')
    expect(
      violations(inspectRadar(invalid, TODAY).evidence.outcomes).some(({ message }) =>
        message.includes('vendor-claim cannot have primary source_role')
      )
    ).toBeTrue()
  })

  test('rejects unsupported maturity and implementation breadth', () => {
    const invalid = populatedRadar
      .replace('subject_kind = "protocol"', 'subject_kind = "vendor-term"')
      .replace('"independent-b", ', '')
    const outcomes = violations(inspectRadar(invalid, TODAY).classification.outcomes)
    expect(
      outcomes.some(({ message }) => message.includes('must use not-applicable specification_maturity'))
    ).toBeTrue()
    expect(
      outcomes.some(({ message }) => message.includes('requires two independent-implementation records'))
    ).toBeTrue()
  })

  test('rejects unsupported interoperability', () => {
    const invalid = populatedRadar.replace(', "interop"', '')
    expect(
      violations(inspectRadar(invalid, TODAY).classification.outcomes).some(({ message }) =>
        message.includes('requires interoperability-demonstration evidence')
      )
    ).toBeTrue()
  })

  test('rejects unsupported stance and contradictory movement', () => {
    const unsupported = populatedRadar.replace(', "local-fit"', '')
    expect(
      violations(inspectRadar(unsupported, TODAY).lifecycle.outcomes).some(({ message }) =>
        message.includes('adopt stance requires local-evaluation evidence')
      )
    ).toBeTrue()

    const contradictory = populatedRadar.replace('ki_stance = "adopt"', 'ki_stance = "hold"')
    expect(
      violations(inspectRadar(contradictory, TODAY).lifecycle.outcomes).some(({ message }) =>
        message.includes('inward movement cannot accompany hold stance')
      )
    ).toBeTrue()
  })

  test('warns on stale dates using a deterministic clock', () => {
    const stale = populatedRadar.replaceAll('2026-09-14', '2026-06-01')
    expect(violations(inspectRadar(stale, TODAY).lifecycle.outcomes)).toContainEqual(
      expect.objectContaining({ level: 'WARN', message: expect.stringContaining('refresh after 9 days') })
    )
  })
})

test('conform proposes no authored radar write', () => {
  const session = createAgenticRadarSession({
    mode: 'conform',
    repository: '/tmp/agentic-radar-test',
    userHome: '/tmp/agentic-radar-user',
    configuration: {},
    packageScriptClaims: []
  })
  expect(session.proposal()).toEqual({ writes: [] })
})
