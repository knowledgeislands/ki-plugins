import type { SkillRubricDefinition } from '../../shared/rubric.ts'
import { createMcpSession, type McpRubricContext } from '../contexts/mcp.ts'
import { KI } from './applicability.ts'
import { CI } from './ci.ts'
import { CFG } from './configuration.ts'
import { DOC } from './documentation.ts'
import { LAY } from './layout.ts'
import { PKG } from './package.ts'
import { RUBRIC } from './publication.ts'
import { SCR } from './scripts.ts'
import { TEST } from './testing.ts'
import { TOOL } from './tools.ts'
import { UTIL } from './utilities.ts'

export default {
  contract: 1,
  name: 'ki-repo-mcp',
  concern: 'Knowledge Islands MCP servers',
  createSession: createMcpSession,
  families: [KI, LAY, DOC, CFG, UTIL, TEST, TOOL, PKG, SCR, CI, RUBRIC]
} satisfies SkillRubricDefinition<McpRubricContext>
