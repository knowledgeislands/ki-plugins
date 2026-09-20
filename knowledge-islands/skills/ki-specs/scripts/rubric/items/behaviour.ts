import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { SpecJudgmentContext, SpecsRubricContext } from '../contexts/specs.ts'

const SOURCE = 'standards-specs.md'

const BEHAVIOUR_1: RubricItem<SpecJudgmentContext> = {
  code: 'BEHAVIOUR-1',
  title: 'requirements describe observable behaviour or quality',
  description:
    'A requirement describes a user-observable behaviour or a quality property rather than rationale or procedure.',
  sources: [SOURCE],
  judgment: {
    scope: 'Every numbered requirement, its section, and its linked Decision Records or guides.',
    prompt:
      'Assess whether each requirement is classified and phrased as user-observable behaviour or a quality property; move reasoning to a Decision Record and operational instruction to a guide.',
    outcomes: ['conforming', 'gap', 'exclusion'],
    guidance:
      'Rewrite or reclassify a requirement, move its reasoning or procedure to the appropriate artifact, or record an explicit area-level exclusion.'
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
