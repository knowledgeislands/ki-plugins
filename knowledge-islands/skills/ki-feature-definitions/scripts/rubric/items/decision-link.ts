import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { FeatureDefinitionsRubricContext, FeatureJudgmentContext } from '../contexts/feature-definitions.ts'

const SOURCE = 'standards-feature-definitions.md'

const DR_LINK_1: RubricItem<FeatureJudgmentContext> = {
  code: 'DR-LINK-1',
  title: 'governed requirements cite their Decision Record',
  description: 'A requirement that follows from a recorded decision cites that Decision Record.',
  sources: [SOURCE],
  judgment: {
    prompt: 'Assess whether requirements governed by a recorded decision cite it, preserving the audit trail from why to what.'
  }
}

export const DR_LINK: RubricFamily<FeatureDefinitionsRubricContext, FeatureJudgmentContext> = {
  code: 'DR-LINK',
  title: 'decision traceability',
  description: 'Governed behaviours preserve their link from why to what.',
  standard: SOURCE,
  selectContext: (context) => context.judgment,
  items: [DR_LINK_1]
}
