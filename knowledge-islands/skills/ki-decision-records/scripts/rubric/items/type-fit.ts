import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { DecisionRecordsRubricContext, RecordsRubricContext } from '../contexts/decision-records.ts'

const TYPE_FIT_1: RubricItem<RecordsRubricContext> = {
  code: 'TYPE-FIT-1',
  title: 'Semantic decision classification',
  description:
    'The filename prefix accurately categorises the decision itself; the body makes the type obvious. A mismatch is resolved with a human by choosing the correct canonical record ID or metadata, never by mechanically overwriting either side.',
  sources: ['standards-decision-records.md'],
  judgment: {
    prompt:
      'Assess whether the filename prefix accurately categorises the decision itself without a stretch fit and whether the body makes the type obvious. Resolve a mismatch with a human, never by mechanically overwriting either side.'
  }
}

export const TYPE_FIT: RubricFamily<DecisionRecordsRubricContext, RecordsRubricContext> = {
  code: 'TYPE-FIT',
  title: 'decision classification',
  description: 'Semantic alignment between a decision and its canonical prefix.',
  standard: 'standards-decision-records.md',
  selectContext: (context) => context.typeFit,
  items: [TYPE_FIT_1]
}
