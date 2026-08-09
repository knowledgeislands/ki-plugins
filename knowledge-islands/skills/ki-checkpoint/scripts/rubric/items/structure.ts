import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { CheckpointsRubricContext, OutcomeContext } from '../contexts/checkpoints.ts'

const SOURCE = 'standards-checkpoints.md'

const STRUCTURE_1: RubricItem<OutcomeContext> = {
  code: 'STRUCTURE-1',
  title: 'active and retired locations are canonical',
  description:
    'When present, `+/_CHECKPOINTS/` is a physical directory containing only flat active Markdown records and the optional physical `_RETIRED/` directory, which contains only flat retired Markdown records. Symlinks, unsupported files, and nested or timestamped layouts are invalid; an absent subarea is not applicable.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance: 'Repair the checkpoint directory structure without creating or moving records, then rerun the audit.'
    },
    audit: { phase: 'INSPECT', run: ({ outcomes }) => outcomes }
  }
}

export const STRUCTURE: RubricFamily<CheckpointsRubricContext, OutcomeContext> = {
  code: 'STRUCTURE',
  title: 'Checkpoint locations',
  description: 'One optional subarea has a flat active set and one explicitly retired set.',
  standard: SOURCE,
  selectContext: (context) => context.structure,
  items: [STRUCTURE_1]
}
