import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { SpecificationsContext } from '../contexts/specifications.ts'

const SYNC_1: RubricItem<SpecificationsContext> = {
  code: 'SYNC-1',
  title: 'Knowledge-chain synchronisation',
  description: 'The standard, rubric, catalogue, tests, and source review agree.',
  sources: ['standards-specifications.md'],
  judgment: { prompt: 'Do the standard, rubric, catalogue, tests, and source review agree?' }
}

export const SYNC: RubricFamily<SpecificationsContext, SpecificationsContext> = {
  code: 'SYNC',
  title: 'Standard synchronisation',
  description: 'Alignment across the knowledge chain.',
  standard: 'standards-specifications.md',
  selectContext: (context: SpecificationsContext) => context,
  items: [SYNC_1]
}
