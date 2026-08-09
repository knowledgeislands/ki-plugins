import type { SkillRubricDefinition } from '../../shared/rubric.ts'
import { createLinearSession } from '../contexts/change-management.ts'
import type { LinearRubricContext } from '../types.ts'
import { SELECT } from './selection.ts'

export default {
  contract: 1,
  name: 'ki-change-management-linear',
  concern: 'Linear change-management adapter',
  createSession: createLinearSession,
  families: [SELECT]
} satisfies SkillRubricDefinition<LinearRubricContext>
