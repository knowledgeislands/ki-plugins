import type { SkillRubricDefinition } from '../../shared/rubric.ts'
import { type AgentsRubricContext, createAgentsSession } from '../contexts/agents.ts'
import { COLL } from './collision.ts'
import { DESC } from './description.ts'
import { FM } from './frontmatter.ts'
import { LANE } from './lane.ts'
import { LAY } from './layout.ts'
import { LINK } from './link.ts'
import { LONG } from './longevity.ts'
import { NAME } from './name.ts'
import { PROC } from './process.ts'
import { PROMPT } from './prompt.ts'

export default {
  contract: 1,
  name: 'ki-subagents',
  concern: 'Claude Code subagent definitions',
  createSession: createAgentsSession,
  families: [LAY, NAME, DESC, FM, PROMPT, LANE, LINK, PROC, LONG, COLL]
} satisfies SkillRubricDefinition<AgentsRubricContext>
