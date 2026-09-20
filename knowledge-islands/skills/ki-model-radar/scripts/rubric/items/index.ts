import type { SkillRubricDefinition } from '../../shared/rubric.ts'
import { createModelRadarSession, type ModelRadarRubricContext } from '../contexts/radar.ts'
import { EVIDENCE } from './evidence.ts'
import { LIFECYCLE } from './lifecycle.ts'
import { RUBRIC } from './publication.ts'
import { SCHEMA } from './schema.ts'

export default {
  contract: 1,
  name: 'ki-model-radar',
  concern: 'Evidence-backed model and model-agent route review',
  createSession: createModelRadarSession,
  families: [SCHEMA, EVIDENCE, LIFECYCLE, RUBRIC]
} satisfies SkillRubricDefinition<ModelRadarRubricContext>
