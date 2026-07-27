import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { HarnessReviewContext, HarnessRubricContext } from '../contexts/harness.ts'

const STANDARD = ['standards-compatible-harness.md#capability-publication'] as const

const CAP_1: RubricItem<HarnessReviewContext> = {
  code: 'CAP-1',
  title: 'Capability inventory and boundaries',
  description:
    'Each populated harness shelf makes its typed capabilities discoverable and routes their content and runtime semantics to the owning kind standard.',
  sources: STANDARD,
  judgment: {
    prompt:
      'Review each populated shelf: are its capabilities discoverable through the compatible payload, and are kind-specific semantics delegated to the appropriate standard?'
  }
}

export const CAP: RubricFamily<HarnessRubricContext, HarnessReviewContext> = {
  code: 'CAP',
  title: 'Capability publication',
  description: 'Typed compatible-harness capability inventory and kind-specific boundaries.',
  standard: 'standards-compatible-harness.md',
  selectContext: (context) => context.review,
  items: [CAP_1]
}
