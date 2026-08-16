import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { HousekeepingRubricContext, HousekeepingRuntimeContext } from '../contexts/housekeeping.ts'

const SOURCE = 'standards-claude-state.md'

const RUNTIME_1: RubricItem<HousekeepingRuntimeContext> = {
  code: 'RUNTIME-1',
  title: 'Server execution evidence is distinct',
  description:
    'This bounded local audit does not infer server registration, access exposure, or an executed server audit from a source payload or inventory declaration. Those runtime facts remain unavailable unless separately presented.',
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    remediation: {
      class: 'diagnostic',
      guidance:
        'Obtain and report server registration, access exposure, and executed-audit evidence separately; do not treat source presence as runtime evidence.'
    },
    audit: { phase: 'PREPARE', run: (context) => context.server }
  }
}

export const RUNTIME: RubricFamily<HousekeepingRubricContext, HousekeepingRuntimeContext> = {
  code: 'RUNTIME',
  title: 'Server-runtime boundary',
  description: 'Unavailable server state remains explicit in the local audit.',
  standard: SOURCE,
  selectContext: (context) => context.runtime,
  items: [RUNTIME_1]
}
