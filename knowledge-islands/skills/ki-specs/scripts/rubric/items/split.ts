import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { SpecJudgmentContext, SpecsRubricContext } from '../contexts/specs.ts'

const SOURCE = 'standards-specs.md'

const SPLIT_1: RubricItem<SpecJudgmentContext> = {
  code: 'SPLIT-1',
  title: 'unrelated behaviours use separate IDs',
  description: 'Unrelated behaviours have separate IDs so each verifies independently.',
  sources: [SOURCE],
  judgment: {
    scope: 'Every numbered requirement and its stated behaviours and verification hooks.',
    prompt:
      'Assess whether a requirement bundles unrelated behaviours that should have separate IDs and verification hooks.',
    outcomes: ['conforming', 'gap', 'exclusion'],
    guidance:
      'Split independently verifiable behaviours into new requirements, record a named Gap, or record an explicit area-level exclusion.'
  }
}

export const SPLIT: RubricFamily<SpecsRubricContext, SpecJudgmentContext> = {
  code: 'SPLIT',
  title: 'requirement focus',
  description: 'Independently verifiable behaviours have independent IDs.',
  standard: SOURCE,
  selectContext: (context) => context.judgment,
  items: [SPLIT_1]
}
