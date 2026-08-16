import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { HousekeepingRubricContext, HousekeepingSelectionContext } from '../contexts/housekeeping.ts'

const SOURCE = 'standards-auto-memory.md'

const SELECT_1: RubricItem<HousekeepingSelectionContext> = {
  code: 'SELECT-1',
  title: 'Native memory location is established',
  description:
    'The audit establishes the selected native auto-memory directory from a readable local settings record. Missing, malformed, disabled, unsupported, or out-of-bounds override evidence is a FAIL; it never falls back to the default path.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance:
        'Resolve the native auto-memory settings evidence or explicitly keep the runtime unavailable, then rerun the audit.'
    },
    audit: { phase: 'PREPARE', run: (context) => context.selected }
  }
}

export const SELECTION: RubricFamily<HousekeepingRubricContext, HousekeepingSelectionContext> = {
  code: 'SELECT',
  title: 'Native-memory selection',
  description: 'Evidence that bounds the local native-memory inspection.',
  standard: SOURCE,
  selectContext: (context) => context.selection,
  items: [SELECT_1]
}
