import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { TokenomicsRubricContext, TokenomicsSurfaceContext } from '../contexts/user.ts'

const SOURCE = 'standards-tokenomics.md'

const SURF_1: RubricItem<TokenomicsSurfaceContext> = {
  code: 'SURF-1',
  title: 'Instruction files and imports are measured',
  description:
    'The physical user-wide instruction file resolves only contained physical imports and reports its estimated token size; broken or out-of-scope imports are FAIL.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    audit: { phase: 'INSPECT', run: (context) => context.instructions }
  }
}

const SURF_2: RubricItem<TokenomicsSurfaceContext> = {
  code: 'SURF-2',
  title: 'Memory indices are measured',
  description: 'Memory indices and locatable memory files are measured when repository-selected evidence is available.',
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    audit: { phase: 'INSPECT', run: (context) => context.memory }
  }
}

const SURF_3: RubricItem<TokenomicsSurfaceContext> = {
  code: 'SURF-3',
  title: 'Skill descriptions are measured',
  description: 'Physical installed-skill descriptions are counted and summed for the user-wide layer.',
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    audit: { phase: 'INSPECT', run: (context) => context.skills }
  }
}

const SURF_4: RubricItem<TokenomicsSurfaceContext> = {
  code: 'SURF-4',
  title: 'Standing instruction earns its cost',
  description: 'Large instruction and memory entries earn their standing token cost.',
  sources: [SOURCE],
  judgment: { prompt: 'Does each large instruction or memory entry earn its standing token cost?' }
}

export const SURF: RubricFamily<TokenomicsRubricContext, TokenomicsSurfaceContext> = {
  code: 'SURF',
  title: 'Standing-surface inventory',
  description: 'Standing context inventory.',
  standard: SOURCE,
  selectContext: (context) => context.surface,
  items: [SURF_1, SURF_2, SURF_3, SURF_4]
}
