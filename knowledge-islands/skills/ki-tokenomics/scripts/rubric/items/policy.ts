import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { TokenomicsConfigContext, TokenomicsRubricContext } from '../contexts/tokenomics.ts'

const SOURCE = 'standards-tokenomics.md'
const POL_1: RubricItem<TokenomicsConfigContext> = {
  code: 'POL-1',
  title: 'Budgets remain guide-rails',
  description: 'A token budget overage is always WARN, never FAIL.',
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    remediation: {
      class: 'diagnostic',
      guidance: 'Revise the selected budget guide-rail or record its intended overage, then rerun the audit.'
    },
    audit: { phase: 'INSPECT', run: (context) => context.budgetPolicy }
  }
}
const POL_2: RubricItem<TokenomicsConfigContext> = {
  code: 'POL-2',
  title: 'Model purpose is portable',
  description: 'Model choice uses the portable frontier, reasoning, standard, and fast purpose taxonomy.',
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    remediation: {
      class: 'diagnostic',
      guidance:
        'Use a declared portable model purpose rather than a provider-specific model choice, then rerun the audit.'
    },
    audit: { phase: 'INSPECT', run: (context) => context.modelPurpose }
  }
}
const POL_3: RubricItem<TokenomicsConfigContext> = {
  code: 'POL-3',
  title: 'Standing-surface findings have an owner',
  description:
    'Selected-repository standing surfaces are attributed and routed to their artifact owner or runtime adapter.',
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    remediation: {
      class: 'diagnostic',
      guidance: 'Route the standing-surface finding to its owning artifact or runtime adapter, then rerun the audit.'
    },
    audit: { phase: 'INSPECT', run: (context) => context.routing }
  }
}
export const POL: RubricFamily<TokenomicsRubricContext, TokenomicsConfigContext> = {
  code: 'POL',
  title: 'Portable policy and attribution',
  description: 'Budget semantics, purpose taxonomy, and owner routing.',
  standard: SOURCE,
  selectContext: (context) => context.config,
  items: [POL_1, POL_2, POL_3]
}
