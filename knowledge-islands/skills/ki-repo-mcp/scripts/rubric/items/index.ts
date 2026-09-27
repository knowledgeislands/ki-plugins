import type { SkillRubricDefinition } from '../../shared/rubric.ts'
import { createMcpSession, type McpRubricContext } from '../contexts/mcp.ts'
import { KI } from './applicability.ts'
import { CI } from './ci.ts'
import { CFG } from './configuration.ts'
import { DIST } from './distribution.ts'
import { DOC } from './documentation.ts'
import { LAY } from './layout.ts'
import { PKG } from './package.ts'
import { PROTO } from './protocol.ts'
import { RUBRIC } from './publication.ts'
import { SCR } from './scripts.ts'
import { SHARED } from './shared-code.ts'
import { TEST } from './testing.ts'
import { TOOL } from './tools.ts'
import { UTIL } from './utilities.ts'

export default {
  contract: 1,
  name: 'ki-repo-mcp',
  concern: 'Knowledge Islands MCP servers',
  packageScripts: [
    'ki:generate:client',
    'ki:server:auth:dev',
    'ki:server:auth:start',
    'ki:server:mcp:dev',
    'ki:server:mcp:inspect',
    'ki:server:mcp:start',
    'ki:test:record',
    'ki:test:replay',
    'ki:test:smoke'
  ],
  createSession: createMcpSession,
  families: [KI, LAY, DOC, CFG, UTIL, SHARED, TEST, TOOL, PROTO, PKG, SCR, CI, DIST, RUBRIC]
} satisfies SkillRubricDefinition<McpRubricContext>
