import type { SkillRubricDefinition } from '../../shared/rubric.ts'
import { createPortableSession, type PortableContext } from '../contexts/portable.ts'
import { HOST } from './host.ts'
import { PORTABLE } from './portable.ts'
import { RUBRIC } from './publication.ts'

export default {
  contract: 1,
  name: 'ki-subagents',
  concern: 'portable subagent role semantics',
  createSession: createPortableSession,
  families: [PORTABLE, HOST, RUBRIC]
} satisfies SkillRubricDefinition<PortableContext>
