import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { McpRubricContext, McpUtilitiesContext } from '../contexts/mcp.ts'

const STANDARD = 'standards-mcp-servers.md#5-audit-logging'

const UTIL_1: RubricItem<McpUtilitiesContext> = {
  code: 'UTIL-1',
  title: 'Shared audit logging helper',
  description: 'utils/audit-log.ts is present as the shared audit-log helper.',
  sources: [STANDARD],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance: 'Restore the required shared utility from the owning implementation and security decision.'
    },
    audit: {
      phase: 'INSPECT',
      run: (context) =>
        context.files.map(({ path, present }) => ({
          status: present ? ('PASS' as const) : ('VIOLATION' as const),
          message: present ? `${path} is present.` : `Shared ${path} is missing or unsafe.`,
          subject: path
        }))
    }
  },
  judgment: {
    scope: 'Audit logging and every tool error envelope in the MCP implementation.',
    prompt:
      'Verify audit logging never captures secrets and tool errors are errorResult envelopes so the audit wrapper sees them.',
    outcomes: ['conforming', 'gap', 'exclusion'],
    guidance:
      'Make security-sensitive changes only with the responsible authority, or record a named gap or explicit exclusion.'
  }
}

export const UTIL: RubricFamily<McpRubricContext, McpUtilitiesContext> = {
  code: 'UTIL',
  title: 'Shared utilities',
  description: 'The shared access, annotation, and audit-log utilities are present.',
  standard: STANDARD,
  selectContext: (context) => context.utilities,
  items: [UTIL_1]
}
