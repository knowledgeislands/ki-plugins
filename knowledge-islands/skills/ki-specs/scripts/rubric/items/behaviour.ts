import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { SpecJudgmentContext, SpecsRubricContext } from '../contexts/specs.ts'

const SOURCE = 'standards-specs.md'

const BEHAVIOUR_1: RubricItem<SpecJudgmentContext> = {
  code: 'BEHAVIOUR-1',
  title: 'requirements describe behaviour',
  description: 'A requirement describes behaviour rather than rationale or procedure.',
  sources: [SOURCE],
  judgment: {
    scope: 'Every numbered requirement and its linked Decision Records or guides.',
    prompt:
      'Assess whether each requirement describes behaviour rather than rationale or procedure; move reasoning to a Decision Record and operational instruction to a guide.',
    outcomes: ['conforming', 'gap', 'exclusion'],
    guidance:
      'Rewrite a non-behavioural requirement, move its reasoning or procedure to the appropriate artifact, or record an explicit area-level exclusion.'
  }
}

export const BEHAVIOUR: RubricFamily<SpecsRubricContext, SpecJudgmentContext> = {
  code: 'BEHAVIOUR',
  title: 'behavioural altitude',
  description: 'Requirements specify behaviour rather than rationale or procedure.',
  standard: SOURCE,
  selectContext: (context) => context.judgment,
  items: [BEHAVIOUR_1]
}
