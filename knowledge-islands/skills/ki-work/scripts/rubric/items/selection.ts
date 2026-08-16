import type { RubricFamily } from '../../shared/rubric.ts'
import type { ChangeManagementRubricContext } from '../types.ts'

export const SELECT: RubricFamily<ChangeManagementRubricContext, ChangeManagementRubricContext['selection']> = {
  code: 'SELECT',
  title: 'adapter selection',
  description: 'One declared, locally resolvable, applicable forward-work adapter, with no implicit fallback.',
  standard: 'standards-change-management-adapters.md',
  selectContext: (context) => context.selection,
  items: [
    {
      code: 'SELECT-1',
      title: 'explicit adapter',
      description:
        'The repository selects exactly one supported adapter, declares its owning skill, and uses it for the declared repository kind.',
      sources: ['standards-change-management-adapters.md'],
      mechanical: {
        level: 'FAIL',
        remediation: {
          class: 'diagnostic',
          guidance: 'Declare one supported adapter, its owning skill table, and a compatible repository kind.'
        },
        audit: { phase: 'INSPECT', run: (context) => context.outcomes }
      }
    }
  ]
}
