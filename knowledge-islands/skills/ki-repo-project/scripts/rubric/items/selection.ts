import type { RubricFamily } from '../../shared/rubric.ts'
import type { ProjectRubricContext } from '../types.ts'

export const PRIMARY: RubricFamily<ProjectRubricContext, ProjectRubricContext['primary']> = {
  code: 'PRIMARY',
  title: 'primary structure',
  description: 'One explicit, non-KB primary repository structure.',
  standard: 'standards-project-repository.md',
  selectContext: (context) => context.primary,
  items: [
    {
      code: 'PRIMARY-1',
      title: 'Project declaration',
      description: 'Project is declared without the KB primary.',
      sources: ['standards-project-repository.md'],
      mechanical: {
        level: 'FAIL',
        remediation: { class: 'diagnostic', guidance: 'Declare one deliberate primary repository structure.' },
        audit: { phase: 'INSPECT', run: (context) => context.outcomes }
      }
    }
  ]
}
