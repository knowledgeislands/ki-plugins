import type { AuditOutcome, RubricFamily, RubricItem, RubricOutcomes } from '../../shared/rubric.ts'
import type { McpRubricContext, McpTestingContext } from '../contexts/mcp.ts'

const STANDARD = 'standards-mcp-servers.md#9-tsconfig--vitest--biome'
const outcome = (status: AuditOutcome['status'], message: string, subject?: string): RubricOutcomes<AuditOutcome> => [
  { status, message, ...(subject ? { subject } : {}) } as AuditOutcome
]

const TEST_1: RubricItem<McpTestingContext> = {
  code: 'TEST-1',
  title: 'MCP coverage exclusions',
  description:
    'When a Vitest config exists, coverage excludes mcp-server/index.ts, tools wiring, utils/annotations.ts, and src/generated/.',
  sources: [STANDARD],
  mechanical: {
    level: 'WARN',
    audit: {
      phase: 'INSPECT',
      run: (context) => {
        if (!context.vitestFile || context.source === null) return outcome('NOT_APPLICABLE', 'No regular Vitest configuration is present.')
        return [
          ['mcp-server/index.ts', /mcp-server\/index\.ts/],
          ['tools/**/index.ts', /tools\/\*\*(?:\/index\.ts)?|tools\/\*\/index\.ts/],
          ['utils/annotations.ts', /utils\/annotations\.ts/],
          ['src/generated/**', /generated\/\*\*/]
        ].map(([label, pattern]) => ({
          status: (pattern as RegExp).test(context.source as string) ? ('PASS' as const) : ('VIOLATION' as const),
          message: (pattern as RegExp).test(context.source as string) ? `Coverage excludes ${label}.` : `Coverage should exclude ${label}.`,
          subject: context.vitestFile as string
        }))
      }
    }
  }
}

export const TEST: RubricFamily<McpRubricContext, McpTestingContext> = {
  code: 'TEST',
  title: 'Test wiring',
  description: 'Selected Vitest coverage excludes generated and pure-wiring MCP layers.',
  standard: STANDARD,
  selectContext: (context) => context.testing,
  items: [TEST_1]
}
