import type { AuditOutcome, RubricFamily, RubricItem, RubricOutcomes } from '../../shared/rubric.ts'
import type { McpCiContext, McpRubricContext } from '../contexts/mcp.ts'

const STANDARD = 'standards-mcp-servers.md#8-packagejson'
const outcome = (status: AuditOutcome['status'], message: string, subject?: string): RubricOutcomes<AuditOutcome> => [
  { status, message, ...(subject ? { subject } : {}) } as AuditOutcome
]

const CI_1: RubricItem<McpCiContext> = {
  code: 'CI-1',
  title: 'MCP smoke CI',
  description: 'When ki:test:smoke is defined, ci.yml invokes it after the common engineering gate.',
  sources: [STANDARD],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance: 'Add the smoke invocation to the CI workflow when the declared smoke script exists.'
    },
    audit: {
      phase: 'INSPECT',
      run: (context) =>
        !context.scripts['ki:test:smoke']
          ? outcome('NOT_APPLICABLE', 'No MCP smoke script is defined.')
          : outcome(
              context.workflow?.includes('bun run ki:test:smoke') ? 'PASS' : 'VIOLATION',
              'ci.yml must run bun run ki:test:smoke.',
              '.github/workflows/ci.yml'
            )
    }
  }
}

const CI_2: RubricItem<McpCiContext> = {
  code: 'CI-2',
  title: 'MCP smoke execution',
  description:
    'When ki:test:smoke is defined, its execution remains an explicit verification step outside hosted audit and conform.',
  sources: [STANDARD],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance: 'Run the declared smoke script explicitly and investigate its result outside hosted audit or conform.'
    },
    audit: {
      phase: 'INSPECT',
      run: (context) =>
        !context.scripts['ki:test:smoke']
          ? outcome('NOT_APPLICABLE', 'No MCP smoke script is defined.')
          : outcome(
              'INFO',
              'Run `bun run ki:test:smoke` explicitly; hosted rubric execution does not launch repository scripts.',
              'package.json'
            )
    }
  }
}

export const CI: RubricFamily<McpRubricContext, McpCiContext> = {
  code: 'CI',
  title: 'Smoke CI',
  description: 'Smoke-test wiring is mechanically visible while execution remains an explicit external step.',
  standard: STANDARD,
  selectContext: (context) => context.ci,
  items: [CI_1, CI_2]
}
