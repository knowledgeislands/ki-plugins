import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { OutcomeContext, TradesRubricContext } from '../contexts/trades.ts'

const SOURCE = 'standards-trades.md'

const STATUS_1: RubricItem<OutcomeContext> = {
  code: 'STATUS-1',
  title: 'receipt evidence, decision status, and linkage are valid',
  description:
    'Inbound records evidence receipt independently from decision and carry one receiver-owned status: unconsidered, in_progress, parked, clarify, applied, adopted, retained, declined, or superseded, with full commit evidence and decision-appropriate rationale or local linkage.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'guarded',
      guidance:
        'Record a receiver-owned decision only after the responsible human selects it; do not infer receipt, disposition, or local work.'
    },
    audit: { phase: 'INSPECT', run: ({ outcomes }) => outcomes }
  },
  judgment: {
    scope: 'Every inbound trade record whose receipt, decision status, rationale, or local linkage needs correction.',
    prompt:
      'Assess whether the receiver has independently confirmed any status transition and supporting rationale or linkage, without treating sender submission or route visibility as authority to decide.',
    outcomes: ['conforming', 'decision required', 'clarification required'],
    guidance:
      'Record only the chosen receiver decision and its evidence, or leave the trade unconsidered or in clarification until authority is available.'
  }
}

export const STATUS: RubricFamily<TradesRubricContext, OutcomeContext> = {
  code: 'STATUS',
  title: 'Delivery and receiver decision',
  description:
    'Preparation, submission, receipt, receiver decision, and local completion remain separate facts with closed receiver-owned evidence.',
  standard: SOURCE,
  selectContext: (context) => context.status,
  items: [STATUS_1]
}
