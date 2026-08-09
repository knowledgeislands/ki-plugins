import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { CheckpointsRubricContext, OutcomeContext } from '../contexts/checkpoints.ts'

const SOURCE = 'standards-checkpoints.md'

const CONFIG_1: RubricItem<OutcomeContext> = {
  code: 'CONFIG-1',
  title: 'checkpoint declaration has no private options',
  description:
    'The optional `ki-checkpoint` declaration is an empty capability marker. It carries no runtime, session, retention, or lifecycle options; repository policy and optional adapters remain separate owners.',
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    remediation: { class: 'diagnostic', guidance: 'Remove unsupported declaration options, then rerun the audit.' },
    audit: { phase: 'PREPARE', run: ({ outcomes }) => outcomes }
  }
}

export const CONFIG: RubricFamily<CheckpointsRubricContext, OutcomeContext> = {
  code: 'CONFIG',
  title: 'Capability declaration',
  description: 'The repository opts into one portable contract without embedding runtime or retention policy.',
  standard: SOURCE,
  selectContext: (context) => context.configuration,
  items: [CONFIG_1]
}
