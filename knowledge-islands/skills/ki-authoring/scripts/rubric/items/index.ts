import type { SkillRubricDefinition } from '../../shared/rubric.ts'
import { type AuthoringRubricContext, createAuthoringSession } from '../contexts/authoring.ts'
import { MARKDOWN } from './markdown.ts'
import { OWNED } from './owned.ts'
import { SYNCHRONISATION } from './sync.ts'
import { TOML } from './toml.ts'

export default {
  contract: 1,
  name: 'ki-authoring',
  concern: 'Knowledge Islands authoring conventions',
  createSession: createAuthoringSession,
  families: [MARKDOWN, OWNED, TOML, SYNCHRONISATION]
} satisfies SkillRubricDefinition<AuthoringRubricContext>
