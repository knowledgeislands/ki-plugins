import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { OutcomeContext, TradesRubricContext } from '../contexts/trades.ts'

const SOURCE = 'standards-trades.md'

const RELEASE_1: RubricItem<OutcomeContext> = {
  code: 'RELEASE-1',
  title: 'release and pruning follow observable lifecycle evidence',
  description:
    'Unattended and receipt policies on itemized knowledge or work wait for evidenced receipt; unattended requests no response but grants no delivery or execution authority. Work may instead wait for decision or completion. Completion remains unavailable without selected-adapter, owner-valid evidence. Receiver pruning becomes eligible only after release is observable.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'guarded',
      guidance:
        'Observe the sender-selected lifecycle evidence and make no release or pruning change until the responsible repository confirms it.'
    },
    audit: { phase: 'INSPECT', run: ({ outcomes }) => outcomes }
  },
  judgment: {
    scope: 'Every submitted trade whose sender release or receiver pruning eligibility is under review.',
    prompt:
      'Assess the observable receipt, terminal decision, and completion evidence against the sender-selected observation policy before any sender release or receiver pruning action.',
    outcomes: ['conforming', 'wait for evidence', 'eligible for human action'],
    guidance:
      'Leave the record in place when evidence is incomplete; when eligible, the owning sender or receiver may make its own confirmed lifecycle change.'
  }
}

export const RELEASE: RubricFamily<TradesRubricContext, OutcomeContext> = {
  code: 'RELEASE',
  title: 'Release and pruning',
  description:
    'Absence is an observable release signal only after the sender-selected receipt, decision, or completion condition is satisfied.',
  standard: SOURCE,
  selectContext: (context) => context.release,
  items: [RELEASE_1]
}
