import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { ChezmoiRubricContext, ReviewContext } from '../contexts/chezmoi.ts'

const PATTERN_J1: RubricItem<ReviewContext> = {
  code: 'PATTERN-J1',
  title: 'App-mutated config pattern choice',
  description: 'Pattern A, Pattern B, or Pattern C is chosen correctly for each app-mutated configuration file.',
  sources: ['standards-chezmoi-dotfiles.md'],
  judgment: {
    prompt:
      'For each app-mutated configuration file, does the selected pattern match its template ownership, required native lifecycle visibility, and app-owned scope?'
  }
}

const PATTERN_J2: RubricItem<ReviewContext> = {
  code: 'PATTERN-J2',
  title: 'Native fragment-binding boundary',
  description:
    'Every Pattern C binding declares its ownership, removal, and adoption boundaries without importing secrets or undeclared application state.',
  sources: ['standards-chezmoi-dotfiles.md'],
  judgment: {
    prompt:
      'Does every native fragment binding state its canonical source, target, selector, ownership and removal policy, and explicit safe-adoption boundary?'
  }
}

export const PATTERN: RubricFamily<ChezmoiRubricContext, ReviewContext> = {
  code: 'PATTERN',
  title: 'App-mutated configuration',
  description: 'Judgment criteria for Pattern A, Pattern B, and Pattern C selection.',
  standard: 'standards-chezmoi-dotfiles.md',
  selectContext: (context) => context.review,
  items: [PATTERN_J1, PATTERN_J2]
}
