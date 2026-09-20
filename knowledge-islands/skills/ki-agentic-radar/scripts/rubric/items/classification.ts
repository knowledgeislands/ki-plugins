import { judgment, type RubricFamily, type RubricItem } from '../../shared/rubric.ts'
import type { AgenticRadarRubricContext, RadarOutcomeContext } from '../contexts/radar.ts'

const SOURCE = 'standards-agentic-radar.md#subjects'

const CLASSIFICATION_1: RubricItem<RadarOutcomeContext> = {
  code: 'CLASSIFICATION-1',
  title: 'maturity and implementation claims are supported',
  description:
    'Closed subject, stewardship, maturity, implementation, and interoperability vocabularies are used; non-specification subjects remain not-applicable; versioned or stable maturity, implementation breadth, conformance, and demonstrated interoperability each have their required evidence class.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'guarded',
      guidance:
        'Review primary evidence and decide whether the classification or supporting record is authoritative before editing.'
    },
    audit: { phase: 'INSPECT', run: ({ outcomes }) => outcomes }
  },
  judgment: judgment(
    'Do maturity, implementation, and interoperability labels accurately describe the bounded evidence without promoting patterns, research, or vendor terms into formal standards?'
  )
}

const CLASSIFICATION_2: RubricItem<RadarOutcomeContext> = {
  code: 'CLASSIFICATION-2',
  title: 'structural terms remain meaningfully distinct',
  description:
    'Agent loops, branching supervisor trees, graph-orchestrated control flow, knowledge graphs, and provenance graphs are classified by the aspect being observed rather than collapsed by shared graph terminology.',
  sources: ['standards-agentic-radar.md#structural-distinctions'],
  judgment: judgment(
    'Are control loops, delegation hierarchy, executable control flow, semantic knowledge, and evidence lineage kept distinct wherever structural subjects are described?'
  )
}

export const CLASSIFICATION: RubricFamily<AgenticRadarRubricContext, RadarOutcomeContext> = {
  code: 'CLASSIFICATION',
  title: 'Subject classification',
  description:
    'Maturity, implementation, interoperability, and structural terms retain precise evidence-backed meaning.',
  standard: SOURCE,
  selectContext: (context) => context.classification,
  items: [CLASSIFICATION_1, CLASSIFICATION_2]
}
