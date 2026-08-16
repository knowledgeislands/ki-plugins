import type { RubricFamily } from '../../shared/rubric.ts'
import { auditEvidence, type EngineeringRubricContext, type ReviewRubricContext } from '../contexts/engineering.ts'

export const REVIEW: RubricFamily<EngineeringRubricContext, ReviewRubricContext> = {
  code: 'REVIEW',
  title: 'Change-aware consistency review',
  description: 'Advisory evidence for a focused review of accumulated code changes.',
  standard: 'standards-engineering.md',
  selectContext: (context) => context.review,
  items: [
    {
      code: 'REVIEW-1',
      title: 'Change-aware consistency review',
      description:
        'Git trailers may identify the newest usable review boundary, but a reviewer decides whether the change since that boundary warrants a focused consistency review.',
      sources: ['standards-engineering.md#change-aware-consistency-review'],
      mechanical: {
        level: 'WARN',
        remediation: {
          class: 'diagnostic',
          guidance:
            'Treat unavailable trailer evidence as unavailable, not as a freshness signal; inspect the explicit Git range before deciding whether to record a new review.'
        },
        audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.review1, 'WARN') }
      },
      judgment: {
        scope:
          'The newest usable KI-Consistency-Review trailer block, its exclusive-base-to-result Git range, the stated scope, and the affected source, public surfaces, and contract tests.',
        prompt:
          'Does the accumulated change since the explicit boundary warrant a focused review; if it does, do module structure, naming, ownership, duplication, and public-surface treatment remain coherent in the examined range and scope?',
        outcomes: ['not warranted', 'consistent', 'follow-up:<canonical-work-item-id>'],
        guidance:
          'Do not record a review when it is not warranted. When a review completes, put one final Base, Scope, Outcome trailer block on its outcome commit: use consistent, or follow-up:<canonical-work-item-id> and create that ordinary work item.'
      }
    }
  ]
}
