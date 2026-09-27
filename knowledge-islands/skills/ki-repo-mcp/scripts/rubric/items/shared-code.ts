import type { AuditOutcome, RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { McpRubricContext } from '../contexts/mcp.ts'
import type { McpSharedCodeContext } from '../contexts/shared-code.ts'

const STANDARD = 'standards-mcp-shared-code.md#managed-profile-contract'

const SHARED_1: RubricItem<McpSharedCodeContext> = {
  code: 'SHARED-1',
  title: 'Declared shared-code projection',
  description:
    'An optional declared MCP shared-code profile agrees byte-for-byte with its skill-owned manifest while local extension files remain outside the managed set.',
  sources: [STANDARD],
  mechanical: {
    level: 'FAIL',
    remediation: { class: 'automatic' },
    audit: {
      phase: 'INSPECT',
      run: (context) => {
        if (context.profile === undefined)
          return [
            {
              status: 'NOT_APPLICABLE',
              message: 'No shared-code profile is declared; existing repository-owned utilities remain unmanaged.'
            }
          ]
        if (typeof context.profile !== 'string' || !context.supportedProfiles.includes(context.profile))
          return [
            {
              status: 'VIOLATION',
              message: `profile must be one of: ${context.supportedProfiles.join(', ')}.`,
              subject: '.ki.toml'
            }
          ]
        const outcomes: AuditOutcome[] = context.files.map((file) => ({
          status: file.state === 'exact' ? 'PASS' : 'VIOLATION',
          message:
            file.state === 'exact'
              ? `${file.destination} matches ${context.profile} (${file.sha256}).`
              : `${file.destination} is ${file.state} for ${context.profile}; managed files are whole-file projections.`,
          subject: file.destination
        }))
        outcomes.push(
          ...context.missingRequirements.map((path) => ({
            status: 'VIOLATION' as const,
            message: `Required repository-owned seam is missing or unsafe: ${path}.`,
            subject: path
          })),
          ...context.obsoleteManagedFiles.map((path) => ({
            status: 'VIOLATION' as const,
            message: `Obsolete managed projection is outside ${context.profile}: ${path}.`,
            subject: path
          }))
        )
        if (context.localExtensions.length > 0)
          outcomes.push({
            status: 'INFO',
            message: `Repository-owned utility extensions are preserved: ${context.localExtensions.join(', ')}.`
          })
        return outcomes
      }
    },
    conform: {
      phase: 'PRIMARY',
      run: (context) => context.conformMissing?.()
    }
  }
}

export const SHARED: RubricFamily<McpRubricContext, McpSharedCodeContext> = {
  code: 'SHARED',
  title: 'Shared-code projection',
  description: 'Optional skill-owned vendored MCP utilities and explicit repository-owned seams.',
  standard: STANDARD,
  selectContext: (context) => context.sharedCode,
  items: [SHARED_1]
}
