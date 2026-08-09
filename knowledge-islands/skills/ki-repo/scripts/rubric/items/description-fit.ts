import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { RepoRubricContext } from '../contexts/repository.ts'

type DescriptionFitContext = Record<string, never>

const DESCFIT_1: RubricItem<DescriptionFitContext> = {
  code: 'DESCFIT-1',
  title: 'Description fit',
  description: 'The repository description accurately and concisely describes its purpose.',
  sources: ['standards-repository.md'],
  judgment: {
    scope: 'The repository description and its current public purpose.',
    prompt: 'Read the repository and judge whether its one-sentence description fits its actual purpose.',
    outcomes: ['conforming', 'gap', 'exclusion'],
    guidance: 'Update the description, record a named gap, or record an explicit repository-level exclusion.'
  }
}

export const DESCFIT: RubricFamily<RepoRubricContext, DescriptionFitContext> = {
  code: 'DESCFIT',
  title: 'Description fitness',
  description: 'Human assessment of repository purpose.',
  standard: 'standards-repository.md',
  selectContext: (context) => context.descriptionFit,
  items: [DESCFIT_1]
}
