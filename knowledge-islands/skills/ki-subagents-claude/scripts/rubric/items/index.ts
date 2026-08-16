import type { SkillRubricDefinition } from '../../shared/rubric.ts'
import { type ClaudeContext, createAgentsSession } from '../contexts/agents.ts'
import { CLAUDE } from './claude.ts'
import { RUBRIC } from './publication.ts'

export default {
  contract: 1,
  name: 'ki-subagents-claude',
  concern: 'Claude Code Markdown/YAML source projections',
  createSession: createAgentsSession,
  families: [CLAUDE, RUBRIC]
} satisfies SkillRubricDefinition<ClaudeContext>
