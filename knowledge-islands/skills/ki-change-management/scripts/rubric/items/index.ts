import type { SkillRubricDefinition } from '../../shared/rubric.ts'
import { createChangeManagementSession } from '../contexts/change-management.ts'
import type { ChangeManagementRubricContext } from '../types.ts'
import { SELECT } from './selection.ts'

export default {
  contract: 1,
  name: 'ki-change-management',
  concern: 'change-management adapter selection',
  createSession: createChangeManagementSession,
  families: [SELECT]
} satisfies SkillRubricDefinition<ChangeManagementRubricContext>
