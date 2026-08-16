import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { ProjectRubricContext } from '../types.ts'

const SOURCE = 'standards-project-repository.md'

const PROJECT_1: RubricItem<ProjectRubricContext> = {
  code: 'PROJECT-1',
  title: 'owner-bound Project orientation',
  description: 'Project orientation delegates primary-kind and forward-work selection to their respective owners.',
  sources: [SOURCE],
  judgment: {
    scope:
      'The repository’s declared kind and selected change-management adapter, reviewed through their owner audits.',
    prompt: 'Do the owner-owned kind and adapter declarations support the intended Project orientation?',
    outcomes: ['conforming', 'owner-audit required', 'migration decision required'],
    guidance:
      'Use ki-repo for primary-kind evidence and ki-work for adapter evidence; decide a Project/KB migration explicitly rather than inferring it here.'
  }
}

export const PROJECT: RubricFamily<ProjectRubricContext, ProjectRubricContext> = {
  code: 'PROJECT',
  title: 'Project orientation',
  description: 'A non-duplicating Project baseline and its owner boundaries.',
  standard: SOURCE,
  selectContext: (context) => context,
  items: [PROJECT_1]
}
