import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { FeatureDefinitionsRubricContext, FeatureJudgmentContext } from '../contexts/feature-definitions.ts'

const SOURCE = 'standards-feature-definitions.md'

const AS_BUILT_1: RubricItem<FeatureJudgmentContext> = {
  code: 'AS-BUILT-1',
  title: 'numbered requirements describe the system today',
  description: 'Numbered requirements are true of the system today; aspirational behaviour belongs in `## Gaps`.',
  sources: [SOURCE],
  judgment: {
    prompt:
      'Assess whether each numbered requirement is true of the system today and move aspirational or not-yet-built behaviour to `## Gaps`.'
  }
}

export const AS_BUILT: RubricFamily<FeatureDefinitionsRubricContext, FeatureJudgmentContext> = {
  code: 'AS-BUILT',
  title: 'as-built truth',
  description: 'The numbered contract describes current system behaviour.',
  standard: SOURCE,
  selectContext: (context) => context.judgment,
  items: [AS_BUILT_1]
}
