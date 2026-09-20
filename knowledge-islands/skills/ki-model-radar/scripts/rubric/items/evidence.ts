import { judgment, type RubricFamily, type RubricItem } from '../../shared/rubric.ts'
import type { ModelRadarRubricContext, RadarOutcomeContext } from '../contexts/radar.ts'

const SOURCE = 'standards-model-radar.md#evidence'

const EVIDENCE_1: RubricItem<RadarOutcomeContext> = {
  code: 'EVIDENCE-1',
  title: 'evidence records and links are valid',
  description:
    'Every evidence record has a current identity, HTTP(S) source, declared evaluation unit and independence class, while every evidence and counter-evidence reference resolves without duplication.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance:
        'Review the intended source and record linkage, then correct the authored evidence without fabricating a replacement.'
    },
    audit: { phase: 'INSPECT', run: ({ outcomes }) => outcomes }
  }
}

const EVIDENCE_2: RubricItem<RadarOutcomeContext> = {
  code: 'EVIDENCE-2',
  title: 'evidence supports its declared use',
  description:
    'Evidence is assessed within its declared unit and use case; consequential claims retain materially independent corroboration where available, local-fit evidence proportional to recommendation, and visible uncertainty and counter-evidence. Provider performance claims are not decisive independent evidence.',
  sources: ['standards-model-radar.md#evidence-and-movement-review'],
  judgment: judgment(
    'Does each consequential claim have applicable, sufficiently independent evidence with local fit, uncertainty, and counter-evidence preserved?'
  )
}

export const EVIDENCE: RubricFamily<ModelRadarRubricContext, RadarOutcomeContext> = {
  code: 'EVIDENCE',
  title: 'Evidence quality',
  description: 'Evidence is linked, classified, applicable, and proportionate to its use.',
  standard: SOURCE,
  selectContext: (context) => context.evidence,
  items: [EVIDENCE_1, EVIDENCE_2]
}
