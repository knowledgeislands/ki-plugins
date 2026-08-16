import type { RubricFamily } from '../../shared/rubric.ts'
import type { LinearRubricContext } from '../types.ts'

export const MAP: RubricFamily<LinearRubricContext, LinearRubricContext['mapping']> = {
  code: 'MAP',
  title: 'Linear lifecycle mapping',
  description: 'Inspectable local workflow metadata, conflict owner, and separate relationship meanings.',
  standard: 'standards-linear.md',
  selectContext: (context) => context.mapping,
  items: [
    {
      code: 'MAP-1',
      title: 'inspectable Linear lifecycle mapping',
      description:
        'The local configuration names exact queue, ready, review, and done values, a metadata conflict owner, and distinct dependency and hierarchy mappings; it does not assert remote verification.',
      sources: ['standards-linear.md'],
      mechanical: {
        level: 'FAIL',
        remediation: {
          class: 'diagnostic',
          guidance:
            'Declare the exact workflow mapping and owner locally, then have an authorised future resolver verify it remotely before any process execution.'
        },
        audit: { phase: 'INSPECT', run: (context) => context.outcomes }
      }
    }
  ]
}
