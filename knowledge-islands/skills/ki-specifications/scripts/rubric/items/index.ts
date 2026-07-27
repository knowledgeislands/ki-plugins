import type { SkillRubricDefinition } from '../../shared/rubric.ts'
import { createSpecificationsSession, type SpecificationsContext } from '../contexts/specifications.ts'
import { SPEC } from './specifications.ts'
import { SYNC } from './sync.ts'

export default {
  contract: 1,
  name: 'ki-specifications',
  concern: 'KI Specifications repository structure',
  createSession: createSpecificationsSession,
  families: [SPEC, SYNC]
} satisfies SkillRubricDefinition<SpecificationsContext>
