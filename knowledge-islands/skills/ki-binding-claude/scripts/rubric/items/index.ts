import type { SkillRubricDefinition } from '../../shared/rubric.ts'
import { type ClaudeBindingContext, createClaudeBindingSession } from '../contexts/claude.ts'
import { CLAUDEBIND } from './claudebind.ts'
import { RUBRIC } from './publication.ts'
export default {
  contract: 1,
  name: 'ki-binding-claude',
  concern: 'Knowledge Islands Claude MCP binding',
  packageScripts: ['ki:binding:claude:build-plugin'],
  createSession: createClaudeBindingSession,
  families: [CLAUDEBIND, RUBRIC]
} satisfies SkillRubricDefinition<ClaudeBindingContext>
