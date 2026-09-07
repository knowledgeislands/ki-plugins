import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { OutcomeContext, TradesRubricContext } from '../contexts/trades.ts'

const SOURCE = 'standards-trades.md'

const STANDING_1: RubricItem<OutcomeContext> = {
  code: 'STANDING-1',
  title: 'standing knowledge intake preserves exact authority and provenance',
  description:
    'Every marked STI provenance block is receiver-local, knowledge-only, uniquely identified, anchored to an exact source commit and capture location, and backed by an active or introduction-time reciprocal exact-subtype grant. Revocation blocks new capture while preserving evidence introduced under a former grant.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance:
        'Correct only receiver-owned provenance or route declarations; use an itemized knowledge trade whenever exact standing authority cannot be proven.'
    },
    audit: { phase: 'INSPECT', run: ({ outcomes }) => outcomes }
  }
}

export const STANDING: RubricFamily<TradesRubricContext, OutcomeContext> = {
  code: 'STANDING',
  title: 'Standing knowledge intake',
  description:
    'A narrow two-sided subtype grant permits direct receiver-local knowledge capture without granting peer write or lifecycle authority.',
  standard: SOURCE,
  selectContext: (context) => context.standing,
  items: [STANDING_1]
}
