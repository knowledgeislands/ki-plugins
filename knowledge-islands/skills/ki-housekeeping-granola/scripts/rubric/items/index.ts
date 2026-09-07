import type { SkillRubricDefinition } from '../../shared/rubric.ts'
import { createGranolaSession, type GranolaRubricContext } from '../contexts/granola.ts'
import { ACQUIRE } from './acquisition.ts'
import { RUBRIC } from './publication.ts'
import { RETIRE } from './retirement.ts'
import { ROUTING } from './routing.ts'

export default {
  contract: 1,
  name: 'ki-housekeeping-granola',
  concern: 'Safe complete Granola meeting acquisition and later housekeeping',
  createSession: createGranolaSession,
  families: [ACQUIRE, ROUTING, RETIRE, RUBRIC]
} satisfies SkillRubricDefinition<GranolaRubricContext>
