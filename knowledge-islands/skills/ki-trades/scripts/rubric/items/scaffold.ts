import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { ScaffoldContext, TradesRubricContext } from '../contexts/trades.ts'

const SOURCE = 'standards-trades.md'

const SCAFFOLD_1: RubricItem<ScaffoldContext> = {
  code: 'SCAFFOLD-1',
  title: 'owned trade scaffold is canonical',
  description:
    'A repository declaring ki-trades carries the two `_TRADES` directories and their canonical README orientation beneath the generic working areas owned by ki-repo.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: { class: 'automatic' },
    audit: { phase: 'INSPECT', run: ({ outcomes }) => outcomes },
    conform: { phase: 'PRIMARY', run: (context) => context.ensureScaffold?.() }
  }
}

export const SCAFFOLD: RubricFamily<TradesRubricContext, ScaffoldContext> = {
  code: 'SCAFFOLD',
  title: 'Trade scaffold',
  description: 'The optional capability owns only its `_TRADES` directories and README files.',
  standard: SOURCE,
  selectContext: (context) => context.scaffold,
  items: [SCAFFOLD_1]
}
