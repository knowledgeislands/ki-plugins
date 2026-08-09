import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { SpecJudgmentContext, SpecsRubricContext } from '../contexts/specs.ts'

const SOURCE = 'standards-specs.md'

const AS_BUILT_1: RubricItem<SpecJudgmentContext> = {
  code: 'AS-BUILT-1',
  title: 'numbered requirements describe the system today',
  description: 'Numbered requirements are true of the system today; aspirational behaviour belongs in `## Gaps`.',
  sources: [SOURCE],
  judgment: {
    scope: 'Every numbered requirement and the current system behaviour it claims.',
    prompt:
      'Assess whether each numbered requirement is true of the system today and move aspirational or not-yet-built behaviour to `## Gaps`.',
    outcomes: ['conforming', 'gap', 'exclusion'],
    guidance: 'Move unbuilt behaviour to a named Gap or record why the area is explicitly excluded from the review.'
  }
}

export const AS_BUILT: RubricFamily<SpecsRubricContext, SpecJudgmentContext> = {
  code: 'AS-BUILT',
  title: 'as-built truth',
  description: 'The numbered contract describes current system behaviour.',
  standard: SOURCE,
  selectContext: (context) => context.judgment,
  items: [AS_BUILT_1]
}
