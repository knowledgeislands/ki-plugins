import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { HarnessReviewContext, HarnessRubricContext } from '../contexts/harness.ts'

const COLL_1: RubricItem<HarnessReviewContext> = {
  code: 'COLL-1',
  title: 'Composition boundary',
  description: 'AUDIT names its composed sibling checks and the description provides contents-governing off-ramps.',
  sources: ['standards-compatible-harness.md#ownership-boundaries'],
  judgment: {
    prompt: 'Are the AUDIT composition list and description off-ramps complete and non-overlapping?'
  }
}

export const COLL: RubricFamily<HarnessRubricContext, HarnessReviewContext> = {
  code: 'COLL',
  title: 'Composition boundary',
  description: 'Container ownership, host ownership, and sibling off-ramps.',
  standard: 'standards-compatible-harness.md',
  selectContext: (context) => context.review,
  items: [COLL_1]
}
