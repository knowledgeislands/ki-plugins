import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { CheckpointsRubricContext, ScaffoldContext } from '../contexts/checkpoints.ts'

const SOURCE = 'standards-checkpoints.md'

const STRUCTURE_1: RubricItem<ScaffoldContext> = {
  code: 'STRUCTURE-1',
  title: 'declared checkpoint scaffold is canonical',
  description:
    'A repository declaring `ki-checkpoint` retains an exact `+/_CHECKPOINTS/README.md` scaffold and permits only flat active Markdown records beside it. Symlinks, unsupported files, retired-record directories, and nested or timestamped layouts are invalid.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: { class: 'automatic' },
    audit: { phase: 'INSPECT', run: ({ outcomes }) => outcomes },
    conform: { phase: 'PRIMARY', run: (context) => context.ensureScaffold?.() }
  }
}

export const STRUCTURE: RubricFamily<CheckpointsRubricContext, ScaffoldContext> = {
  code: 'STRUCTURE',
  title: 'Checkpoint locations',
  description: 'A retained capability scaffold contains one flat active record set; Git supplies history.',
  standard: SOURCE,
  selectContext: (context) => context.structure,
  items: [STRUCTURE_1]
}
