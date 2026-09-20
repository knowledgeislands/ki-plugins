import { judgment, type RubricFamily, type RubricItem } from '../../shared/rubric.ts'
import type { AgenticRadarRubricContext, RadarOutcomeContext } from '../contexts/radar.ts'

const SOURCE = 'standards-agentic-radar.md#evidence'

const EVIDENCE_1: RubricItem<RadarOutcomeContext> = {
  code: 'EVIDENCE-1',
  title: 'evidence links and source roles are coherent',
  description:
    'Every evidence record has a current identity, HTTP(S) source, evidence class and source role; all references resolve without duplication or support/counter overlap; provider claims are not primary, and discovery or counter-evidence records are not used as direct support.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance:
        'Review the source claim and intended role before correcting authored evidence or links; do not invent replacements.'
    },
    audit: { phase: 'INSPECT', run: ({ outcomes }) => outcomes }
  }
}

const EVIDENCE_2: RubricItem<RadarOutcomeContext> = {
  code: 'EVIDENCE-2',
  title: 'evidence is applicable and proportionate',
  description:
    'Consequential claims use evidence applicable to the precise subject and claim, distinguish steward from independent evidence, retain uncertainty and counter-evidence, and do not infer interoperability or adoption from package count or vendor assertion.',
  sources: ['standards-agentic-radar.md#evidence-and-movement-review'],
  judgment: judgment(
    'Does each consequential classification or movement have sufficiently applicable and independent evidence, with uncertainty and material counter-evidence preserved?'
  )
}

export const EVIDENCE: RubricFamily<AgenticRadarRubricContext, RadarOutcomeContext> = {
  code: 'EVIDENCE',
  title: 'Evidence quality',
  description: 'Evidence is linked, classified, applicable, and proportionate to how it is used.',
  standard: SOURCE,
  selectContext: (context) => context.evidence,
  items: [EVIDENCE_1, EVIDENCE_2]
}
