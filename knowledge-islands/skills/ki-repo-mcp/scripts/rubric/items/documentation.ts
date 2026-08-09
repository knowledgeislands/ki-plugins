import type { AuditOutcome, RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { McpDocumentationContext, McpRubricContext } from '../contexts/mcp.ts'

const STANDARD = 'standards-mcp-servers.md#11-docs'

const DOC_1: RubricItem<McpDocumentationContext> = {
  code: 'DOC-1',
  title: 'MCP root documents',
  description:
    'ROADMAP.md is present; CONTRIBUTING.md and SECURITY.md are present; CHANGELOG.md is present and non-empty.',
  sources: [STANDARD],
  mechanical: {
    level: 'FAIL',
    overrideLevels: ['WARN'],
    remediation: {
      class: 'diagnostic',
      guidance: 'Add or repair the required root documentation using current repository evidence.'
    },
    audit: {
      phase: 'INSPECT',
      run: (context) => {
        const documents: AuditOutcome[] = context.documents['ROADMAP.md']
          ? [{ status: 'PASS', message: 'MCP roadmap is present.', subject: 'ROADMAP.md' }]
          : [{ status: 'VIOLATION', level: 'WARN', message: 'MCP roadmap is absent or unsafe.', subject: 'ROADMAP.md' }]
        for (const file of ['CONTRIBUTING.md', 'SECURITY.md'] as const)
          documents.push({
            status: context.documents[file] !== null ? 'PASS' : 'VIOLATION',
            message:
              context.documents[file] !== null
                ? 'Required MCP root document is present.'
                : 'Required MCP root document is missing or unsafe.',
            subject: file
          })
        const changelog = context.documents['CHANGELOG.md']
        documents.push({
          status: changelog?.trim() ? 'PASS' : 'VIOLATION',
          message: changelog?.trim()
            ? 'Release history is present and non-empty.'
            : changelog === null
              ? 'Release history is missing or unsafe.'
              : 'Release history is an empty stub; add a release entry or remove it.',
          subject: 'CHANGELOG.md'
        })
        return documents
      }
    }
  },
  judgment: {
    scope: 'CLAUDE.md, README setup instructions, and the current MCP implementation.',
    prompt:
      'Review CLAUDE.md for drift against the code and README setup documentation for current client and configuration instructions.',
    outcomes: ['conforming', 'gap', 'exclusion'],
    guidance:
      'Update the affected documentation from verified implementation evidence, or record a gap or explicit exclusion.'
  }
}

export const DOC: RubricFamily<McpRubricContext, McpDocumentationContext> = {
  code: 'DOC',
  title: 'MCP documentation',
  description: 'MCP-specific root documentation exists and remains substantive.',
  standard: STANDARD,
  selectContext: (context) => context.documentation,
  items: [DOC_1]
}
