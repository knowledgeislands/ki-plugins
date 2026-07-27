import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { AuthoringRubricContext, SynchronisationRubricContext } from '../contexts/authoring.ts'

const SYNC_1: RubricItem<SynchronisationRubricContext> = {
  code: 'SYNC-1',
  title: 'conventions, rubric, and source record agree',
  description: 'The convention references, this rubric, and `sources.md` agree; when a convention moves, all three move together.',
  sources: ['standards-authoring.md#synchronisation', 'sources.md'],
  judgment: { prompt: 'Do the convention references, rubric publication, and source record agree?' }
}

export const SYNCHRONISATION: RubricFamily<AuthoringRubricContext, SynchronisationRubricContext> = {
  code: 'SYNC',
  title: 'Convention synchronisation',
  description: 'The generated publication and its convention sources remain coherent.',
  standard: 'standards-authoring.md#synchronisation',
  selectContext: (context: AuthoringRubricContext) => context.synchronisation,
  items: [SYNC_1]
}
