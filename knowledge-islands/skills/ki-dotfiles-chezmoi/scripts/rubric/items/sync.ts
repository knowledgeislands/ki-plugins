import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { ChezmoiRubricContext, ReviewContext } from '../contexts/chezmoi.ts'

const SYNC_1: RubricItem<ReviewContext> = {
  code: 'SYNC-1',
  title: 'Standard and rubric synchronisation',
  description: 'The standard, structured rubric, and mechanical behaviour remain aligned when the standard changes.',
  sources: ['standards-chezmoi-dotfiles.md'],
  judgment: { prompt: 'Do the standard, structured rubric items, and mechanical behaviour still agree?' }
}

export const SYNC: RubricFamily<ChezmoiRubricContext, ReviewContext> = {
  code: 'SYNC',
  title: 'Standard synchronisation',
  description: 'Judgment criteria for keeping the standard and implementation aligned.',
  standard: 'standards-chezmoi-dotfiles.md',
  selectContext: (context) => context.review,
  items: [SYNC_1]
}
