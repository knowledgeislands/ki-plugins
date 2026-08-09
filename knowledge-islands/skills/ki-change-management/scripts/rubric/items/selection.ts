import type { RubricFamily } from '../../shared/rubric.ts'
import type { ChangeManagementRubricContext } from '../types.ts'

export const SELECT: RubricFamily<ChangeManagementRubricContext, ChangeManagementRubricContext['selection']> = {
  code: 'SELECT',
  title: 'adapter selection',
  description: 'One declared supported forward-work adapter, with no implicit fallback.',
  standard: 'standards-change-management-adapters.md',
  selectContext: (context) => context.selection,
  items: [
    {
      code: 'SELECT-1',
      title: 'explicit adapter',
      description: 'The repository selects exactly one supported change-management adapter.',
      sources: ['standards-change-management-adapters.md'],
      mechanical: {
        level: 'FAIL',
        remediation: {
          class: 'diagnostic',
          guidance: 'Declare exactly one supported adapter in the ki-change-management table.'
        },
        audit: { phase: 'INSPECT', run: (context) => context.outcomes }
      }
    }
  ]
}
