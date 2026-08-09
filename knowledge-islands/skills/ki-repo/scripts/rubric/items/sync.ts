import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { RepoRubricContext } from '../contexts/repository.ts'

type SynchronisationRubricContext = Record<string, never>

const SYNC_1: RubricItem<SynchronisationRubricContext> = {
  code: 'SYNC-1',
  title: 'Standard synchronisation',
  description: 'The standard, structured rubric, and executable behaviour remain aligned.',
  sources: ['standards-repository.md'],
  judgment: {
    scope: 'The repository standard, structured rubric, generated publication, and checker behaviour.',
    prompt: 'Compare the standard, generated rubric, and checker behaviour for semantic drift.',
    outcomes: ['conforming', 'gap', 'exclusion'],
    guidance: 'Align the affected source, record a named gap, or record an explicit repository-level exclusion.'
  }
}

export const SYNC: RubricFamily<RepoRubricContext, SynchronisationRubricContext> = {
  code: 'SYNC',
  title: 'Standard synchronisation',
  description: 'Alignment across the knowledge chain.',
  standard: 'standards-repository.md',
  selectContext: (context) => context.synchronisation,
  items: [SYNC_1]
}
