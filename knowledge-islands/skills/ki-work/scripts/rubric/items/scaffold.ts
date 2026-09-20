import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { ChangeManagementRubricContext } from '../types.ts'

const SOURCE = 'standards-change-management-adapters.md'
type ScaffoldContext = ChangeManagementRubricContext['scaffold']

const SCAFFOLD_1: RubricItem<ScaffoldContext> = {
  code: 'SCAFFOLD-1',
  title: 'owned batch scaffold is canonical',
  description:
    'A repository declaring ki-work retains the exact +/_BATCHES/README.md capability scaffold; ki-batch owns records inside it.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: { class: 'automatic' },
    audit: { phase: 'INSPECT', run: ({ outcomes }) => outcomes },
    conform: { phase: 'PRIMARY', run: (context) => context.ensureScaffold?.() }
  }
}

export const SCAFFOLD: RubricFamily<ChangeManagementRubricContext, ScaffoldContext> = {
  code: 'SCAFFOLD',
  title: 'Batch scaffold',
  description: 'The selected work capability retains its temporary batch-input boundary.',
  standard: SOURCE,
  selectContext: (context) => context.scaffold,
  items: [SCAFFOLD_1]
}
