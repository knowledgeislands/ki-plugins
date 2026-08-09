import type { SkillRubricDefinition } from '../../shared/rubric.ts'
import { type AgoraRubricContext, createAgoraSession } from '../contexts/agora.ts'
import { CONFIG } from './configuration.ts'
import { MEMBERSHIP } from './memberships.ts'
import { RUBRIC } from './publication.ts'

export default {
  contract: 1,
  name: 'ki-agora',
  concern: 'Portable reciprocal Agora membership',
  createSession: createAgoraSession,
  families: [RUBRIC, CONFIG, MEMBERSHIP]
} satisfies SkillRubricDefinition<AgoraRubricContext>
