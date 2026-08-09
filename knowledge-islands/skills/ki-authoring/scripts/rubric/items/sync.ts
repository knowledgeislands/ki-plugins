import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { AuthoringRubricContext, SynchronisationRubricContext } from '../contexts/authoring.ts'

const SYNC_1: RubricItem<SynchronisationRubricContext> = {
  code: 'SYNC-1',
  title: 'conventions, rubric, and source record agree',
  description:
    'The convention references, this rubric, and `sources.md` agree; when a convention moves, all three move together.',
  sources: ['standards-authoring.md#synchronisation', 'sources.md'],
  judgment: {
    scope:
      'The authoring convention references, generated rubric publication, and source record changed by the same concern.',
    prompt: 'Assess whether the convention references, rubric publication, and source record agree.',
    outcomes: ['conforming', 'synchronisation required', 'review required'],
    guidance:
      'Update the affected canonical source and generated publication together, or record the unresolved source-review question before publishing.'
  }
}

export const SYNCHRONISATION: RubricFamily<AuthoringRubricContext, SynchronisationRubricContext> = {
  code: 'SYNC',
  title: 'Convention synchronisation',
  description: 'The generated publication and its convention sources remain coherent.',
  standard: 'standards-authoring.md#synchronisation',
  selectContext: (context: AuthoringRubricContext) => context.synchronisation,
  items: [SYNC_1]
}
