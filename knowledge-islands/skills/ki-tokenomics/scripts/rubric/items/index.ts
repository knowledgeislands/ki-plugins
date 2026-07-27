import type { SkillRubricDefinition } from '../../shared/rubric.ts'
import { createTokenomicsSession, type TokenomicsRubricContext } from '../contexts/user.ts'
import { BUDG } from './budgets.ts'
import { COMP } from './composition.ts'
import { CFG } from './config.ts'
import { MCP } from './mcp.ts'
import { RUN } from './runtime.ts'
import { SURF } from './surface.ts'
import { TOOL } from './tooling.ts'

type TokenomicsDefinition = SkillRubricDefinition<TokenomicsRubricContext> & {
  scope: {
    kind: 'user-home'
    paths: readonly string[]
  }
}

export default {
  contract: 1,
  name: 'ki-tokenomics',
  concern: 'Claude context tokenomics',
  scope: { kind: 'user-home', paths: ['.claude', '.claude.json'] },
  createSession: createTokenomicsSession,
  families: [COMP, SURF, MCP, BUDG, RUN, TOOL, CFG]
} satisfies TokenomicsDefinition
