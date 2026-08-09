import type { SkillRubricDefinition } from '../../shared/rubric.ts'
import { type ActivitiesRubricContext, createActivitiesSession } from '../contexts/activities.ts'
import { ACT } from './activities.ts'
import { RUBRIC } from './publication.ts'

export default {
  contract: 1,
  name: 'ki-repo-kb-activities',
  concern: 'Knowledge Islands activities',
  createSession: createActivitiesSession,
  families: [RUBRIC, ACT]
} satisfies SkillRubricDefinition<ActivitiesRubricContext>
