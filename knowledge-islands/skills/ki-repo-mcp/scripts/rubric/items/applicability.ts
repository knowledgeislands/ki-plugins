import type { AuditOutcome, RubricFamily, RubricItem, RubricOutcomes } from '../../shared/rubric.ts'
import type { McpApplicabilityContext, McpRubricContext } from '../contexts/mcp.ts'
import { supportedMcpSharedProfiles } from '../contexts/shared-code.ts'

const STANDARD = 'standards-mcp-servers.md#applicability'
const outcome = (status: AuditOutcome['status'], message: string, subject?: string): RubricOutcomes<AuditOutcome> => [
  { status, message, ...(subject ? { subject } : {}) } as AuditOutcome
]

const KI_CONFIG: RubricItem<McpApplicabilityContext> = {
  code: 'KI-CONFIG',
  title: 'MCP applicability and declaration',
  description:
    'Only [skills.ki-repo-mcp] declares this optional standard applicable. Its optional profile selects one supported whole-file shared-code projection; every other key is rejected.',
  sources: [STANDARD],
  mechanical: {
    level: 'WARN',
    overrideLevels: ['FAIL'],
    remediation: {
      class: 'diagnostic',
      guidance: 'Declare the selected standard through the repository configuration owner.'
    },
    audit: {
      phase: 'INSPECT',
      run: (context) => {
        if (!context.rootExists)
          return outcome(
            'VIOLATION',
            `Audit target must be an existing regular directory: ${context.root}.`,
            context.root
          )
        if (!context.applicable)
          return outcome(
            'NOT_APPLICABLE',
            'ki-repo-mcp not applicable: [skills.ki-repo-mcp] is not declared. Detected MCP-shaped source is handled by ki-repo coverage.',
            context.root
          )
        if (context.config === 'missing')
          return outcome('VIOLATION', 'Shared configuration file is missing; ki-repo owns its creation.', '.ki.toml')
        if (context.config === 'unsafe')
          return outcome('VIOLATION', '.ki.toml is not a regular file; marker repair remains report-only.', '.ki.toml')
        if (context.config === 'malformed')
          return outcome(
            'VIOLATION',
            '.ki.toml is malformed; repair it before adding [skills.ki-repo-mcp].',
            '.ki.toml'
          )
        if (context.config === 'absent')
          return outcome(
            'VIOLATION',
            'No [skills.ki-repo-mcp] table; add it to mark this repository as governed.',
            '.ki.toml'
          )
        const unknownKeys = context.configKeys.filter((key) => key !== 'profile')
        if (unknownKeys.length > 0)
          return outcome(
            'VIOLATION',
            `Unknown keys under [skills.ki-repo-mcp]: ${unknownKeys.join(', ')} (validate-down).`,
            '.ki.toml'
          )
        if (
          context.sharedProfile !== undefined &&
          (typeof context.sharedProfile !== 'string' || !supportedMcpSharedProfiles().includes(context.sharedProfile))
        )
          return outcome('VIOLATION', `profile must be one of: ${supportedMcpSharedProfiles().join(', ')}.`, '.ki.toml')
        return context.configKeys.length > 0
          ? outcome('PASS', `Configured MCP governance profile: ${String(context.sharedProfile)}.`, '.ki.toml')
          : outcome('PASS', '[skills.ki-repo-mcp] table is present.', '.ki.toml')
      }
    }
  }
}

export const KI: RubricFamily<McpRubricContext, McpApplicabilityContext> = {
  code: 'KI',
  title: 'Applicability and declaration',
  description: 'Scope activation and the optional shared-code profile declaration.',
  standard: STANDARD,
  selectContext: (context) => context.applicability,
  items: [KI_CONFIG]
}
