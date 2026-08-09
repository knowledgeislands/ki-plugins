import type { SkillRubricDefinition } from '../../shared/rubric.ts'
import { type BindingRubricContext, createBindingSession } from '../contexts/binding.ts'
import { BIND } from './bind.ts'
import { RUBRIC } from './publication.ts'

type BindingDefinition = SkillRubricDefinition<BindingRubricContext> & {
  scope: {
    kind: 'user-home'
    paths: readonly string[]
  }
}

export default {
  contract: 1,
  name: 'ki-binding',
  concern: 'Knowledge Islands cross-surface binding',
  scope: {
    kind: 'user-home',
    paths: ['Library/Application Support/Claude/local-agent-mode-sessions']
  },
  createSession: createBindingSession,
  families: [BIND, RUBRIC]
} satisfies BindingDefinition
