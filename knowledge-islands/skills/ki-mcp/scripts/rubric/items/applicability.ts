import type { AuditOutcome, RubricFamily, RubricItem, RubricOutcomes } from '../../shared/rubric.ts'
import type { McpApplicabilityContext, McpRubricContext } from '../contexts/mcp.ts'

const STANDARD = 'standards-mcp-servers.md#applicability'
const outcome = (status: AuditOutcome['status'], message: string, subject?: string): RubricOutcomes<AuditOutcome> => [
  { status, message, ...(subject ? { subject } : {}) } as AuditOutcome
]

const KI_CONFIG: RubricItem<McpApplicabilityContext> = {
  code: 'KI-CONFIG',
  title: 'MCP applicability and declaration',
  description:
    'A repository is applicable when it declares [ki-mcp] or contains src/mcp-server/. Otherwise the audit emits one NOT_APPLICABLE finding and stops; declared keys are rejected because this skill has no configuration options.',
  sources: [STANDARD],
  mechanical: {
    level: 'WARN',
    overrideLevels: ['FAIL'],
    audit: {
      phase: 'INSPECT',
      run: (context) => {
        if (!context.rootExists)
          return outcome('VIOLATION', `Audit target must be an existing regular directory: ${context.root}.`, context.root)
        if (!context.applicable)
          return outcome(
            'NOT_APPLICABLE',
            'ki-mcp not applicable: no [ki-mcp] declaration or src/mcp-server/ structural marker.',
            context.root
          )
        if (context.config === 'missing')
          return outcome('VIOLATION', 'Shared configuration file is missing; ki-repo owns its creation.', '.ki-config.toml')
        if (context.config === 'unsafe')
          return outcome('VIOLATION', '.ki-config.toml is not a regular file; marker repair remains report-only.', '.ki-config.toml')
        if (context.config === 'malformed')
          return outcome('VIOLATION', '.ki-config.toml is malformed; repair it before adding [ki-mcp].', '.ki-config.toml')
        if (context.config === 'absent')
          return outcome('VIOLATION', 'No [ki-mcp] table; add it to mark this repository as governed.', '.ki-config.toml')
        return context.configKeys.length > 0
          ? outcome('VIOLATION', `Unknown keys under [ki-mcp]: ${context.configKeys.join(', ')} (validate-down).`, '.ki-config.toml')
          : outcome('PASS', '[ki-mcp] table is present.', '.ki-config.toml')
      }
    },
    conform: {
      phase: 'PRIMARY',
      run: (context) => context.addMarker?.()
    }
  }
}

export const KI: RubricFamily<McpRubricContext, McpApplicabilityContext> = {
  code: 'KI',
  title: 'Applicability and declaration',
  description: 'Scope activation and the keyless ki-mcp governance declaration.',
  standard: STANDARD,
  selectContext: (context) => context.applicability,
  items: [KI_CONFIG]
}
