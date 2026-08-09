import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { OutcomeContext, TradesRubricContext } from '../contexts/trades.ts'

const SOURCE = 'standards-trades.md'

const ROUTE_1: RubricItem<OutcomeContext> = {
  code: 'ROUTE-1',
  title: 'trade routes are typed, declared, and activated reciprocally',
  description:
    'A sender-declared export permits local preparation and submission before the receiver participates. Receipt is active only when exactly one locally registered repository declares the canonical GitHub home, the sender exports that kind to it, and the receiver imports that same kind from the sender.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance:
        'Correct the locally owned route declaration or registered repository configuration, then rerun the audit.'
    },
    audit: { phase: 'INSPECT', run: ({ outcomes }) => outcomes }
  }
}

export const ROUTE: RubricFamily<TradesRubricContext, OutcomeContext> = {
  code: 'ROUTE',
  title: 'Typed reciprocal routes',
  description: 'Sender-declared observation and active reciprocal receipt remain distinct typed route facts.',
  standard: SOURCE,
  selectContext: (context) => context.routes,
  items: [ROUTE_1]
}
