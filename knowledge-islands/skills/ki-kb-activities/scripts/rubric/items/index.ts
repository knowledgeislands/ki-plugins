import type { SkillRubricDefinition } from '../../shared/rubric.ts'
import { type ActivitiesRubricContext, createActivitiesSession } from '../contexts/activities.ts'
import { ACT } from './activities.ts'

export default {
  contract: 1,
  name: 'ki-kb-activities',
  concern: 'Knowledge Islands activities',
  createSession: createActivitiesSession,
  families: [ACT]
} satisfies SkillRubricDefinition<ActivitiesRubricContext>
