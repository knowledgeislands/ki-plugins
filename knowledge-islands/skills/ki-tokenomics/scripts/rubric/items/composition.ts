import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { TokenomicsCompositionContext, TokenomicsRubricContext } from '../contexts/user.ts'

const SOURCE = 'standards-tokenomics.md'

const COMP_1: RubricItem<TokenomicsCompositionContext> = {
  code: 'COMP-1',
  title: 'Layers are read and reported',
  description: 'The bounded user-wide layer is read and repository-selected evidence is reported explicitly when unavailable.',
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    audit: { phase: 'INSPECT', run: (context) => context.layers }
  }
}

const COMP_2: RubricItem<TokenomicsCompositionContext> = {
  code: 'COMP-2',
  title: 'Costs are attributed',
  description: 'Every measured standing cost is attributed to its configuration layer.',
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    audit: { phase: 'INSPECT', run: (context) => context.attribution }
  }
}

const COMP_3: RubricItem<TokenomicsCompositionContext> = {
  code: 'COMP-3',
  title: 'Recommendations land in the right layer',
  description: 'Recommendations account for where each cost lives.',
  sources: [SOURCE],
  judgment: { prompt: 'Does each recommendation account for where the cost lives?' }
}

export const COMP: RubricFamily<TokenomicsRubricContext, TokenomicsCompositionContext> = {
  code: 'COMP',
  title: 'Composition and attribution',
  description: 'Layer composition and attribution.',
  standard: SOURCE,
  selectContext: (context) => context.composition,
  items: [COMP_1, COMP_2, COMP_3]
}
