import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { TradeJudgmentContext, TradesRubricContext } from '../contexts/trades.ts'

const SOURCE = 'standards-trades.md'

const ADOPTION_1: RubricItem<TradeJudgmentContext> = {
  code: 'ADOPTION-1',
  title: 'disposition preserves receiver authority',
  description:
    'A receiver disposition is trade review only. Direct applied work is bounded and commit-verified; adoption does not automatically create, prioritise, implement, or accept a roadmap item; retention does not alter local knowledge authority.',
  sources: [SOURCE],
  judgment: {
    scope:
      'Every receiver disposition and any proposed direct application, local adoption, or knowledge retention following it.',
    prompt:
      'Confirm that applied is limited to one bounded, reversible, independently verifiable local work change with no material design, dependency, migration, public-contract, or cross-repository effect; every other work disposition remains separately confirmed, every retention remains a local knowledge decision, and none grants sender authority.',
    outcomes: ['conforming', 'separate local work required', 'decline or clarify required'],
    guidance:
      'Keep the trade decision separate from local prioritisation and acceptance; create or link local work only through its own confirmed lifecycle.'
  }
}

export const ADOPTION: RubricFamily<TradesRubricContext, TradeJudgmentContext> = {
  code: 'ADOPTION',
  title: 'Receiver local authority',
  description:
    'Human-confirmed disposition remains distinct from local work selection, acceptance, and knowledge stewardship.',
  standard: SOURCE,
  selectContext: (context) => context.judgment,
  items: [ADOPTION_1]
}
