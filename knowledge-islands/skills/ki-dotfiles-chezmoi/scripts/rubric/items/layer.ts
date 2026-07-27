import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { ChezmoiRubricContext, ReviewContext } from '../contexts/chezmoi.ts'

const LAYER_J1: RubricItem<ReviewContext> = {
  code: 'LAYER-J1',
  title: 'Agent-instruction layering',
  description: 'Agent guidance is placed at the correct repository, user, or persistent-memory layer.',
  sources: ['standards-chezmoi-dotfiles.md'],
  judgment: {
    prompt: 'Does each piece of agent guidance sit at the correct repository-local, user-level, or persistent-memory layer?'
  }
}

export const LAYER: RubricFamily<ChezmoiRubricContext, ReviewContext> = {
  code: 'LAYER',
  title: 'Instruction layering',
  description: 'Judgment criteria for repository, user, and memory guidance.',
  standard: 'standards-chezmoi-dotfiles.md',
  selectContext: (context) => context.review,
  items: [LAYER_J1]
}
