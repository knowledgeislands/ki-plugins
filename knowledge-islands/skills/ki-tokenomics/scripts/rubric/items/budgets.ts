import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { TokenomicsBudgetContext, TokenomicsRubricContext } from '../contexts/user.ts'

const SOURCE = 'standards-tokenomics.md'

const BUDG_1: RubricItem<TokenomicsBudgetContext> = {
  code: 'BUDG-1',
  title: 'Component budgets are compared',
  description: 'Each measured user-wide component is compared with its default budget.',
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    audit: { phase: 'INSPECT', run: (context) => context.components }
  }
}

const BUDG_2: RubricItem<TokenomicsBudgetContext> = {
  code: 'BUDG-2',
  title: 'Total budget is compared',
  description: 'The measured user-wide standing total is compared with the total budget.',
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    audit: { phase: 'INSPECT', run: (context) => context.total }
  }
}

const BUDG_3: RubricItem<TokenomicsBudgetContext> = {
  code: 'BUDG-3',
  title: 'Overages are deliberate',
  description: 'A sustained overage is fixed or deliberately recorded.',
  sources: [SOURCE],
  judgment: { prompt: 'Is a sustained overage fixed or deliberately recorded?' }
}

export const BUDG: RubricFamily<TokenomicsRubricContext, TokenomicsBudgetContext> = {
  code: 'BUDG',
  title: 'Budgets',
  description: 'Budget evidence and review.',
  standard: SOURCE,
  selectContext: (context) => context.budgets,
  items: [BUDG_1, BUDG_2, BUDG_3]
}
