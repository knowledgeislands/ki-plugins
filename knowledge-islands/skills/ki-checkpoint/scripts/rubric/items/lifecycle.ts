import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { CheckpointsRubricContext, LifecycleContext } from '../contexts/checkpoints.ts'

const SOURCE = 'standards-checkpoints.md'

const LIFECYCLE_1: RubricItem<LifecycleContext> = {
  code: 'LIFECYCLE-1',
  title: 'active state, uniqueness, and timestamps agree',
  description:
    'Every checkpoint path carries state active, each thread has at most one active record, and UTC timestamps are chronologically coherent. Removal deletes the active record rather than creating a retired state.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'guarded',
      guidance: 'Correct lifecycle metadata only through an explicit UPDATE request; use REMOVE to delete a record.'
    },
    audit: { phase: 'INSPECT', run: (context) => context.mechanical }
  },
  judgment: {
    scope: 'Every active record location, state, and timestamp.',
    prompt:
      'Does the proposed lifecycle correction preserve explicit user authority and the single active snapshot rule?',
    outcomes: ['conforming', 'explicit update required', 'explicit removal required'],
    guidance: 'Do not change state or timestamps until the user supplies UPDATE direction; REMOVE deletes the record.'
  }
}

const LIFECYCLE_2: RubricItem<LifecycleContext> = {
  code: 'LIFECYCLE-2',
  title: 'snapshot content is current and durable facts are promoted',
  description:
    'The active record is a concise current reconstruction snapshot. Decisions, accepted work state, and reusable knowledge already live with their canonical owners; removal follows explicit direction and does not manufacture completion.',
  sources: [SOURCE],
  judgment: {
    scope: 'Every checkpoint snapshot, its named durable owners, and removal authority.',
    prompt:
      'Is each active snapshot current and concise, with durable facts promoted to their canonical owners and any removal grounded in explicit user direction rather than inferred completion?',
    outcomes: ['conforming', 'explicit update required', 'promote durable fact'],
    guidance:
      'Promote facts through their owning lifecycle and update or remove a checkpoint only with explicit authority.'
  }
}

export const LIFECYCLE: RubricFamily<CheckpointsRubricContext, LifecycleContext> = {
  code: 'LIFECYCLE',
  title: 'Checkpoint lifecycle',
  description: 'Update, resume, and removal preserve one active snapshot without inventing lifecycle state.',
  standard: SOURCE,
  selectContext: (context) => context.lifecycle,
  items: [LIFECYCLE_1, LIFECYCLE_2]
}
