import type { SkillRubricDefinition } from '../../shared/rubric.ts'
import { type AgenticRadarRubricContext, createAgenticRadarSession } from '../contexts/radar.ts'
import { CLASSIFICATION } from './classification.ts'
import { EVIDENCE } from './evidence.ts'
import { LIFECYCLE } from './lifecycle.ts'
import { RUBRIC } from './publication.ts'
import { SCHEMA } from './schema.ts'

export default {
  contract: 1,
  name: 'ki-agentic-radar',
  concern: 'Evidence-backed agentic standards, structures, and adoption review',
  createSession: createAgenticRadarSession,
  families: [SCHEMA, EVIDENCE, CLASSIFICATION, LIFECYCLE, RUBRIC]
} satisfies SkillRubricDefinition<AgenticRadarRubricContext>
