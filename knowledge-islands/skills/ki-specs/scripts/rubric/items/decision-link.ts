import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { SpecJudgmentContext, SpecsRubricContext } from '../contexts/specs.ts'

const SOURCE = 'standards-specs.md'

const DR_LINK_1: RubricItem<SpecJudgmentContext> = {
  code: 'DR-LINK-1',
  title: 'governed requirements cite their Decision Record',
  description: 'A requirement that follows from a recorded decision cites that Decision Record.',
  sources: [SOURCE],
  judgment: {
    scope: 'Requirements that follow from a recorded Decision Record and their cited links.',
    prompt:
      'Assess whether requirements governed by a recorded decision cite it, preserving the audit trail from why to what.',
    outcomes: ['conforming', 'gap', 'exclusion'],
    guidance: 'Add the governing Decision Record link, record a named Gap, or record an explicit area-level exclusion.'
  }
}

export const DR_LINK: RubricFamily<SpecsRubricContext, SpecJudgmentContext> = {
  code: 'DR-LINK',
  title: 'decision traceability',
  description: 'Governed behaviours preserve their link from why to what.',
  standard: SOURCE,
  selectContext: (context) => context.judgment,
  items: [DR_LINK_1]
}
