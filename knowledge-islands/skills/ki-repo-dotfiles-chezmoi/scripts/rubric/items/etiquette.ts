import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { ChezmoiRubricContext, ReviewContext } from '../contexts/chezmoi.ts'

const ETIQ_J1: RubricItem<ReviewContext> = {
  code: 'ETIQ-J1',
  title: 'Audit etiquette',
  description: 'Audits report a file, concise problem, and options before any change is applied.',
  sources: ['standards-chezmoi-dotfiles.md'],
  judgment: {
    scope: 'Each audit finding and any subsequent proposed or applied change.',
    prompt: 'Were findings reported with a file, concise problem statement, and options before a change was applied?',
    outcomes: ['conforming', 'reporting correction required', 'change deferral required'],
    guidance:
      'Report the affected file, concise problem, and available options before proposing or applying a change; defer action where that evidence is absent.'
  }
}

export const ETIQ: RubricFamily<ChezmoiRubricContext, ReviewContext> = {
  code: 'ETIQ',
  title: 'Audit etiquette',
  description: 'Judgment criteria for reporting before change.',
  standard: 'standards-chezmoi-dotfiles.md',
  selectContext: (context) => context.review,
  items: [ETIQ_J1]
}
