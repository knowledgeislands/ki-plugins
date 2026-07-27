import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { FeatureDefinitionsRubricContext, FeatureJudgmentContext } from '../contexts/feature-definitions.ts'

const SOURCE = 'standards-feature-definitions.md'

const BEHAVIOUR_1: RubricItem<FeatureJudgmentContext> = {
  code: 'BEHAVIOUR-1',
  title: 'requirements describe behaviour',
  description: 'A requirement describes behaviour rather than rationale or procedure.',
  sources: [SOURCE],
  judgment: {
    prompt:
      'Assess whether each requirement describes behaviour rather than rationale or procedure; move reasoning to a Decision Record and operational instruction to a guide.'
  }
}

export const BEHAVIOUR: RubricFamily<FeatureDefinitionsRubricContext, FeatureJudgmentContext> = {
  code: 'BEHAVIOUR',
  title: 'behavioural altitude',
  description: 'Requirements specify behaviour rather than rationale or procedure.',
  standard: SOURCE,
  selectContext: (context) => context.judgment,
  items: [BEHAVIOUR_1]
}
