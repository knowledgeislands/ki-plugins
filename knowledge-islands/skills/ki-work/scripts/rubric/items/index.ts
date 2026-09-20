import type { SkillRubricDefinition } from '../../shared/rubric.ts'
import { createChangeManagementSession } from '../contexts/change-management.ts'
import type { ChangeManagementRubricContext } from '../types.ts'
import { SCAFFOLD } from './scaffold.ts'
import { SELECT } from './selection.ts'

export default {
  contract: 1,
  name: 'ki-work',
  concern: 'change-management adapter selection',
  createSession: createChangeManagementSession,
  families: [SELECT, SCAFFOLD]
} satisfies SkillRubricDefinition<ChangeManagementRubricContext>
