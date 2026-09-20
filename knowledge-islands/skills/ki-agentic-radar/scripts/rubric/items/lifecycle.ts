import { judgment, type RubricFamily, type RubricItem } from '../../shared/rubric.ts'
import type { AgenticRadarRubricContext, RadarOutcomeContext } from '../contexts/radar.ts'

const SOURCE = 'standards-agentic-radar.md#dates-and-refresh'

const LIFECYCLE_1: RubricItem<RadarOutcomeContext> = {
  code: 'LIFECYCLE-1',
  title: 'dates, stances, and movements are coherent',
  description:
    'Review dates are real non-future ISO calendar dates and warn after 9 days; stance and movement use closed vocabularies; inward movement cannot accompany Hold, outward movement cannot accompany Adopt, and Trial or Adopt requires local-evaluation evidence.',
  sources: [SOURCE, 'standards-agentic-radar.md#subjects'],
  mechanical: {
    level: 'FAIL',
    overrideLevels: ['WARN'],
    remediation: {
      class: 'guarded',
      guidance:
        'Refresh evidence and decide the authoritative stance, movement, or date; do not infer a recommendation from mechanical consistency.'
    },
    audit: { phase: 'INSPECT', run: ({ outcomes }) => outcomes }
  },
  judgment: judgment(
    'Does each stance and movement express a defensible Knowledge Islands decision, concrete use case, explicit uncertainty, owner, and actionable return trigger?'
  )
}

export const LIFECYCLE: RubricFamily<AgenticRadarRubricContext, RadarOutcomeContext> = {
  code: 'LIFECYCLE',
  title: 'Review lifecycle',
  description: 'Dates, Knowledge Islands stance, movement, ownership, and return triggers remain current and coherent.',
  standard: SOURCE,
  selectContext: (context) => context.lifecycle,
  items: [LIFECYCLE_1]
}
