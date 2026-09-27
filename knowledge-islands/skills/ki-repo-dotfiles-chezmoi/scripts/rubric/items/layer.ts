import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { ChezmoiRubricContext, ReviewContext } from '../contexts/chezmoi.ts'

const LAYER_J1: RubricItem<ReviewContext> = {
  code: 'LAYER-J1',
  title: 'Agent-instruction layering',
  description: 'Reusable doctrine belongs in skills; repository and personal guidance use their own layers.',
  sources: ['standards-chezmoi-dotfiles.md'],
  judgment: {
    scope:
      'Managed agent guidance, its reusable-skill or repository or personal audience, and available portability evidence.',
    prompt:
      'Is reusable doctrine owned by a skill, shared repository guidance in root AGENTS.md, and personal runtime guidance free of hidden skill prerequisites?',
    outcomes: ['conforming', 'relocation required', 'scope decision required'],
    guidance:
      'Move guidance to its skill, repository, or personal owner; remove duplicates and report when unavailable personal evidence prevents a portability conclusion.'
  }
}

export const LAYER: RubricFamily<ChezmoiRubricContext, ReviewContext> = {
  code: 'LAYER',
  title: 'Instruction layering',
  description: 'Judgment criteria for skill, repository, user, and memory guidance.',
  standard: 'standards-chezmoi-dotfiles.md',
  selectContext: (context) => context.review,
  items: [LAYER_J1]
}
