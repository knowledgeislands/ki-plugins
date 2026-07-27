import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { FeatureDefinitionsRubricContext, FeatureJudgmentContext } from '../contexts/feature-definitions.ts'

const SOURCE = 'standards-feature-definitions.md'

const AREA_FIT_1: RubricItem<FeatureJudgmentContext> = {
  code: 'AREA-FIT-1',
  title: 'requirements fit their area file',
  description: 'Each requirement sits in the area file its behaviour belongs to.',
  sources: [SOURCE],
  judgment: {
    prompt:
      'Assess whether each requirement sits in the area its behaviour belongs to; when behaviour changes area, allocate a new ID rather than moving the old number.'
  }
}

export const AREA_FIT: RubricFamily<FeatureDefinitionsRubricContext, FeatureJudgmentContext> = {
  code: 'AREA-FIT',
  title: 'area fit',
  description: 'Requirements remain in the area their behaviour belongs to.',
  standard: SOURCE,
  selectContext: (context) => context.judgment,
  items: [AREA_FIT_1]
}
