import type { RubricFamily } from '../../shared/rubric.ts'
import type { LinearRubricContext } from '../types.ts'

export const SELECT: RubricFamily<LinearRubricContext, LinearRubricContext['selection']> = {
  code: 'SELECT',
  title: 'Linear configuration',
  description: 'One declared Linear team with matching shared selection.',
  standard: 'standards-linear.md',
  selectContext: (context) => context.selection,
  items: [
    {
      code: 'SELECT-1',
      title: 'explicit Linear adapter',
      description: 'The repository selects and configures one Linear team.',
      sources: ['standards-linear.md'],
      mechanical: {
        level: 'FAIL',
        remediation: {
          class: 'diagnostic',
          guidance: 'Select linear and declare one uppercase Linear team key.'
        },
        audit: { phase: 'INSPECT', run: (context) => context.outcomes }
      }
    }
  ]
}
