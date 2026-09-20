import { judgment, type RubricFamily } from '../../shared/rubric.ts'
import type { GranolaRubricContext } from '../contexts/granola.ts'

export const RETIRE = {
  code: 'RETIRE',
  title: 'Granola source retirement',
  standard: 'standards-granola-retirement.md',
  description: 'Separate release authority, complete evidence gate, manual fallback.',
  selectContext: (context) => context,
  items: [
    {
      code: 'RETIRE-1',
      title: 'retirement separately authorised',
      description:
        'Acquisition remains read-only and retirement requires every evidence gate, a current exact manifest, and immediate human approval.',
      sources: ['standards-granola-retirement.md#retirement-evidence-gate'],
      judgment: judgment(
        'Does the proposed retirement refuse every missing or stale gate and fall back to a manual manifest when no safe API exists?'
      )
    }
  ]
} satisfies RubricFamily<GranolaRubricContext, GranolaRubricContext>
