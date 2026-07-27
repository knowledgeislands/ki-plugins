import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { HarnessReviewContext, HarnessRubricContext } from '../contexts/harness.ts'

const LONG_1: RubricItem<HarnessReviewContext> = {
  code: 'LONG-1',
  title: 'Refresh path',
  description: 'The ki-harness skill carries REFRESH and a dated source review record.',
  sources: ['standards-compatible-harness.md'],
  judgment: {
    prompt: 'Do the ki-harness REFRESH procedure and sources.md cadence provide a usable current refresh path?'
  }
}

export const LONG: RubricFamily<HarnessRubricContext, HarnessReviewContext> = {
  code: 'LONG',
  title: 'Longevity',
  description: 'Refresh discipline for the compatible-harness standard.',
  standard: 'standards-compatible-harness.md',
  selectContext: (context) => context.review,
  items: [LONG_1]
}
