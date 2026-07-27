import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { FeatureDefinitionsRubricContext, FeatureJudgmentContext } from '../contexts/feature-definitions.ts'

const SOURCE = 'standards-feature-definitions.md'

const SPLIT_1: RubricItem<FeatureJudgmentContext> = {
  code: 'SPLIT-1',
  title: 'unrelated behaviours use separate IDs',
  description: 'Unrelated behaviours have separate IDs so each verifies independently.',
  sources: [SOURCE],
  judgment: {
    prompt: 'Assess whether a requirement bundles unrelated behaviours that should have separate IDs and verification hooks.'
  }
}

export const SPLIT: RubricFamily<FeatureDefinitionsRubricContext, FeatureJudgmentContext> = {
  code: 'SPLIT',
  title: 'requirement focus',
  description: 'Independently verifiable behaviours have independent IDs.',
  standard: SOURCE,
  selectContext: (context) => context.judgment,
  items: [SPLIT_1]
}
