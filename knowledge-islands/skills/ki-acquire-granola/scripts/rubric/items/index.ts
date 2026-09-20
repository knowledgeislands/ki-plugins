import type { SkillRubricDefinition } from '../../shared/rubric.ts'
import { createGranolaSession, type GranolaRubricContext } from '../contexts/granola.ts'
import { ACQUIRE } from './acquisition.ts'
import { RUBRIC } from './publication.ts'
import { RETIRE } from './retirement.ts'
import { ROUTING } from './routing.ts'

export default {
  contract: 1,
  name: 'ki-acquire-granola',
  concern: 'Safe and complete Granola meeting acquisition',
  createSession: createGranolaSession,
  families: [ACQUIRE, ROUTING, RETIRE, RUBRIC]
} satisfies SkillRubricDefinition<GranolaRubricContext>
