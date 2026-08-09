import type { SkillRubricDefinition } from '../../shared/rubric.ts'
import { type CheckpointsRubricContext, createCheckpointsSession } from '../contexts/checkpoints.ts'
import { BOUNDARY } from './boundary.ts'
import { CONFIG } from './configuration.ts'
import { LIFECYCLE } from './lifecycle.ts'
import { RUBRIC } from './publication.ts'
import { RECORD } from './records.ts'
import { STRUCTURE } from './structure.ts'

export default {
  contract: 1,
  name: 'ki-checkpoint',
  concern: 'portable repository checkpoints',
  createSession: createCheckpointsSession,
  families: [RUBRIC, CONFIG, STRUCTURE, RECORD, LIFECYCLE, BOUNDARY]
} satisfies SkillRubricDefinition<CheckpointsRubricContext>
