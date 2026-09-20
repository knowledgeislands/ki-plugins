import type { HousekeepingRubricContext } from '../contexts/housekeeping.ts'
import type { RubricFamily } from '../types.ts'

export const HOUSE: RubricFamily<HousekeepingRubricContext, HousekeepingRubricContext['templates']> = {
  code: 'HOUSE',
  title: 'housekeeping templates',
  description: 'Template placement, identity, lifecycle, calendar and change-volume scheduling, and spawn fields.',
  standard: 'standards-housekeeping.md',
  selectContext: (context) => context.templates,
  items: [
    {
      code: 'HOUSE-1',
      title: 'template contract',
      description:
        'Each housekeeping template has a safe location and controlled identity, lifecycle, calendar cadence, optional commit threshold and reviewed revision, and spawn fields.',
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
    },
    {
      code: 'HOUSE-2',
      title: 'schedule evidence',
      description:
        'Report calendar and first-parent change-volume eligibility without creating work. Missing or unverifiable reviewed-history evidence remains unknown, never a clean zero.',
      sources: ['standards-housekeeping.md#due-run-procedure'],
      mechanical: {
        level: 'WARN',
        remediation: {
          class: 'diagnostic',
          guidance:
            'Use retained successful-review evidence to establish the full reviewed revision, or restore complete local history through a separately authorised workflow. Do not guess a baseline, fetch, spawn, or record completion during audit.'
        },
        audit: { phase: 'INSPECT', run: ({ schedules }) => schedules }
      }
    }
  ]
}
