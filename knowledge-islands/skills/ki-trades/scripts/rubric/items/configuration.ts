import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { OutcomeContext, TradesRubricContext } from '../contexts/trades.ts'

const SOURCE = 'standards-trades.md'

const CONFIG_1: RubricItem<OutcomeContext> = {
  code: 'CONFIG-1',
  title: 'typed routes are canonical',
  description:
    'A participating repository names each trade partner exactly once under its own `[skills.ki-trades.routes]` table, keyed by `owner/name`, as an inline table whose `export` and `import` arrays are duplicate-free and drawn from the closed trade-kind set; a direction carrying no kinds is absent rather than empty, and the repository identity comes only from `ki-repo.repository`.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    overrideLevels: ['WARN'],
    remediation: {
      class: 'diagnostic',
      guidance: 'Correct the local ki-trades route declaration, then rerun the audit.'
    },
    audit: { phase: 'INSPECT', run: ({ outcomes }) => outcomes }
  }
}

export const CONFIG: RubricFamily<TradesRubricContext, OutcomeContext> = {
  code: 'CONFIG',
  title: 'Declared participation',
  description: 'Typed trade routes are explicit, canonical, and owned locally.',
  standard: SOURCE,
  selectContext: (context) => context.configuration,
  items: [CONFIG_1]
}
