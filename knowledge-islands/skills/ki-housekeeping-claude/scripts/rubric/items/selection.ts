import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { HousekeepingRubricContext, HousekeepingSelectionContext } from '../contexts/housekeeping.ts'

const SOURCE = 'standards-auto-memory.md'

const SELECT_1: RubricItem<HousekeepingSelectionContext> = {
  code: 'SELECT-1',
  title: 'Auto-memory state and project scope established',
  description:
    'An explicit KI lifecycle declaration is required; omission fails even when no memory directory exists. Disabled KI policy skips memory index and file checks. Effective Claude auto-memory must also be disabled unless transition is declared; enabled policy requires a project-scoped Claude opt-in. Malformed or unsupported settings fail closed.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance:
        'Reconcile the KI lifecycle declaration with effective Claude settings and environment overrides, then rerun audit.'
    },
    audit: { phase: 'PREPARE', run: (context) => context.selected }
  }
}

const SELECT_2: RubricItem<HousekeepingSelectionContext> = {
  code: 'SELECT-2',
  title: 'Selected auto-memory directory and transition reconciled',
  description:
    'An existing selected memory directory warns unless KI policy explicitly enables auto-memory. Transition always warns, even without a directory. Review whether to opt in or reconcile existing learning before closing transition; the audit never creates, moves, or deletes memory files.',
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    remediation: {
      class: 'diagnostic',
      guidance:
        'Review whether a project-scoped opt-in is intended; otherwise reconcile existing memory through repository or KB intake and retain files until approved.'
    },
    audit: { phase: 'PREPARE', run: (context) => context.reconciliation }
  }
}

export const SELECTION: RubricFamily<HousekeepingRubricContext, HousekeepingSelectionContext> = {
  code: 'SELECT',
  title: 'Native-memory selection',
  description: 'Evidence that bounds the local native-memory inspection.',
  standard: SOURCE,
  selectContext: (context) => context.selection,
  items: [SELECT_1, SELECT_2]
}
