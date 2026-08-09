import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { ChezmoiRubricContext, ReviewContext } from '../contexts/chezmoi.ts'

const CONFIG_J1: RubricItem<ReviewContext> = {
  code: 'CONFIG-J1',
  title: 'Format-preserving editor selection',
  description:
    'Every Pattern A or Pattern C writer uses an appropriate format-preserving edit API with safe absent-file and invalid-input behaviour.',
  sources: ['standards-chezmoi-dotfiles.md'],
  judgment: {
    scope: 'Every Pattern A or Pattern C writer and the files it edits.',
    prompt:
      'Do Pattern A and Pattern C writers use a format-appropriate edit API, define absent-file and path behaviour, fail closed, and demonstrate syntax preservation and idempotence?',
    outcomes: ['conforming', 'writer revision required', 'test evidence required'],
    guidance:
      'Use a format-preserving API, define safe absent-file and path behaviour, fail closed, and add evidence for syntax preservation and idempotence.'
  }
}

export const CONFIG: RubricFamily<ChezmoiRubricContext, ReviewContext> = {
  code: 'CONFIG',
  title: 'Configuration editing',
  description: 'Judgment criteria for format-preserving Pattern A and Pattern C editors.',
  standard: 'standards-chezmoi-dotfiles.md',
  selectContext: (context) => context.review,
  items: [CONFIG_J1]
}
