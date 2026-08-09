import type { HousekeepingRubricContext } from '../contexts/housekeeping.ts'
import type { RubricFamily } from '../types.ts'

export const HOUSE: RubricFamily<HousekeepingRubricContext, HousekeepingRubricContext['templates']> = {
  code: 'HOUSE',
  title: 'housekeeping templates',
  description: 'Template placement, stable identity, lifecycle, cadence, and spawn fields.',
  standard: 'standards-housekeeping.md',
  selectContext: (context) => context.templates,
  items: [
    {
      code: 'HOUSE-1',
      title: 'template contract',
      description:
        'Each housekeeping template has a safe location and controlled identity, lifecycle, cadence, and spawn fields.',
      sources: ['standards-housekeeping.md'],
      mechanical: {
        level: 'FAIL',
        remediation: {
          class: 'diagnostic',
          guidance:
            'Correct the template location, identity, schedule, or spawn fields from the declared housekeeping policy; do not create, prioritize, or mark a run complete automatically.'
        },
        audit: { phase: 'INSPECT', run: ({ outcomes }) => outcomes }
      }
    }
  ]
}
