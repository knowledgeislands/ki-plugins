import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { ChezmoiRubricContext, ReviewContext } from '../contexts/chezmoi.ts'

const ETIQ_J1: RubricItem<ReviewContext> = {
  code: 'ETIQ-J1',
  title: 'Audit etiquette',
  description: 'Audits report a file, concise problem, and options before any change is applied.',
  sources: ['standards-chezmoi-dotfiles.md'],
  judgment: { prompt: 'Were findings reported with a file, concise problem statement, and options before a change was applied?' }
}

export const ETIQ: RubricFamily<ChezmoiRubricContext, ReviewContext> = {
  code: 'ETIQ',
  title: 'Audit etiquette',
  description: 'Judgment criteria for reporting before change.',
  standard: 'standards-chezmoi-dotfiles.md',
  selectContext: (context) => context.review,
  items: [ETIQ_J1]
}
