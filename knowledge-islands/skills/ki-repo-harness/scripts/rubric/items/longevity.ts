import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { HarnessReviewContext, HarnessRubricContext } from '../contexts/harness.ts'

const LONG_1: RubricItem<HarnessReviewContext> = {
  code: 'LONG-1',
  title: 'Refresh path',
  description: 'The ki-repo-harness skill carries REFRESH and a dated source review record.',
  sources: ['standards-compatible-harness.md'],
  judgment: {
    scope: 'The ki-repo-harness REFRESH procedure, source list, cadence, and current compatible-harness standard.',
    prompt: 'Do the ki-repo-harness REFRESH procedure and sources.md cadence provide a usable current refresh path?',
    outcomes: ['conforming', 'refresh-path revision', 'source review required'],
    guidance:
      'Update the documented refresh path or complete its source review through the canonical harness; do not invent a review result without source evidence.'
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
