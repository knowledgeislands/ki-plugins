import type { SkillRubricDefinition } from '../../shared/rubric.ts'
import { type ClaudeRubricContext, createClaudeSession } from '../contexts/claude.ts'
import { RUBRIC } from './publication.ts'
import { RUN } from './runtime.ts'
import { SURF } from './surface.ts'
export default {
  contract: 1,
  name: 'ki-tokenomics-claude',
  concern: 'Bounded Claude Code tokenomics evidence',
  createSession: createClaudeSession,
  families: [SURF, RUN, RUBRIC]
} satisfies SkillRubricDefinition<ClaudeRubricContext>
