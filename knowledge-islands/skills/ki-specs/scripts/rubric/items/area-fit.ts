import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { SpecJudgmentContext, SpecsRubricContext } from '../contexts/specs.ts'

const SOURCE = 'standards-specs.md'

const AREA_FIT_1: RubricItem<SpecJudgmentContext> = {
  code: 'AREA-FIT-1',
  title: 'requirements fit their area file',
  description: 'Each requirement sits in the area file its behaviour belongs to.',
  sources: [SOURCE],
  judgment: {
    scope: 'Every numbered requirement and its containing Specifications area file.',
    prompt:
      'Assess whether each requirement sits in the area its behaviour belongs to; when behaviour changes area, allocate a new ID rather than moving the old number.',
    outcomes: ['conforming', 'gap', 'exclusion'],
    guidance:
      'Record the selected outcome and allocate a new requirement identifier where a behaviour belongs to another area.'
  }
}

export const AREA_FIT: RubricFamily<SpecsRubricContext, SpecJudgmentContext> = {
  code: 'AREA-FIT',
  title: 'area fit',
  description: 'Requirements remain in the area their behaviour belongs to.',
  standard: SOURCE,
  selectContext: (context) => context.judgment,
  items: [AREA_FIT_1]
}
