import type { SkillRubricDefinition } from '../../shared/rubric.ts'
import { createLinearSession } from '../contexts/change-management.ts'
import type { LinearRubricContext } from '../types.ts'
import { MAP } from './mapping.ts'
import { SELECT } from './selection.ts'

export default {
  contract: 1,
  name: 'ki-work-linear',
  concern: 'Linear change-management adapter',
  createSession: createLinearSession,
  families: [SELECT, MAP]
} satisfies SkillRubricDefinition<LinearRubricContext>
