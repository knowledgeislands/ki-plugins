import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { HarnessReviewContext, HarnessRubricContext } from '../contexts/harness.ts'

const COLL_1: RubricItem<HarnessReviewContext> = {
  code: 'COLL-1',
  title: 'Capability boundary',
  description:
    'Declared prerequisites, coverage-selected siblings, and contents-governing off-ramps are complete and distinct.',
  sources: ['standards-compatible-harness.md#ownership-boundaries'],
  judgment: {
    scope: 'The harness skill frontmatter, description, dependency declarations, and adjacent owning skills.',
    prompt:
      'Are prerequisite dependencies, coverage-selected siblings, and description off-ramps complete and non-overlapping?',
    outcomes: ['conforming', 'boundary revision', 'route to owner'],
    guidance:
      'Clarify the boundary or route the concern to its owner; do not claim another capability’s execution or content semantics.'
  }
}

export const COLL: RubricFamily<HarnessRubricContext, HarnessReviewContext> = {
  code: 'COLL',
  title: 'Capability boundary',
  description: 'Container ownership, host ownership, and sibling off-ramps.',
  standard: 'standards-compatible-harness.md',
  selectContext: (context) => context.review,
  items: [COLL_1]
}
