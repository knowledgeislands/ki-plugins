import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { SpecificationsContext } from '../contexts/specifications.ts'

const SYNC_1: RubricItem<SpecificationsContext> = {
  code: 'SYNC-1',
  title: 'Knowledge-chain synchronisation',
  description: 'The standard, rubric, catalogue, tests, and source review agree.',
  sources: ['standards-specifications.md'],
  judgment: {
    scope:
      'The standard, structured catalogue, generated rubric, focused tests, and source-review record for this skill.',
    prompt: 'Do the standard, rubric, catalogue, tests, and source review agree?',
    outcomes: ['conforming', 'synchronisation required', 'source review required'],
    guidance:
      'Update the affected canonical source, catalogue, tests, generated publication, and source record together, or record the outstanding source-review question.'
  }
}

export const SYNC: RubricFamily<SpecificationsContext, SpecificationsContext> = {
  code: 'SYNC',
  title: 'Standard synchronisation',
  description: 'Alignment across the knowledge chain.',
  standard: 'standards-specifications.md',
  selectContext: (context: SpecificationsContext) => context,
  items: [SYNC_1]
}
