import type { SkillRubricDefinition } from '../../shared/rubric.ts'
import { createDelegationSession } from '../contexts/delegation.ts'
import type { DelegationRubricContext } from '../types.ts'
import { PACKET } from './delegation.ts'

export default {
  contract: 1,
  name: 'ki-delegation',
  concern: 'delegation packets',
  createSession: createDelegationSession,
  families: [PACKET]
} satisfies SkillRubricDefinition<DelegationRubricContext>
