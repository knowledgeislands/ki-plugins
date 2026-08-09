import type { SkillRubricDefinition } from '../../shared/rubric.ts'
import { createGuidesSession, type GuidesRubricContext } from '../contexts/guides.ts'
import { GUIDE } from './guides.ts'
import { RUBRIC } from './publication.ts'
import { ROUTE } from './routing.ts'

export default {
  contract: 1,
  name: 'ki-guides',
  concern: 'repository-local practical guides',
  createSession: createGuidesSession,
  families: [RUBRIC, GUIDE, ROUTE]
} satisfies SkillRubricDefinition<GuidesRubricContext>
