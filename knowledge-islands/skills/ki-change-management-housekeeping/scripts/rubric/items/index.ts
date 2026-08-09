import { createHousekeepingSession, type HousekeepingRubricContext } from '../contexts/housekeeping.ts'
import type { SkillRubricDefinition } from '../types.ts'
import { HOUSE } from './housekeeping.ts'

export default {
  contract: 1,
  name: 'ki-change-management-housekeeping',
  concern: 'recurring housekeeping templates',
  createSession: createHousekeepingSession,
  families: [HOUSE]
} satisfies SkillRubricDefinition<HousekeepingRubricContext>
