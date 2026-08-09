import type { AuditOutcome, RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { McpRubricContext, McpToolsContext } from '../contexts/mcp.ts'

const STANDARD = 'standards-mcp-servers.md#3-tool-naming'
const RESULT_STANDARD = 'standards-mcp-servers.md#12-spec-conformance-tool-results-errors--metadata'

const registrations = (source: string): string[] => {
  const callers = new Set(['registerTool'])
  for (const match of source.matchAll(/(?:const|let)\s+(\w+)\s*=\s*(?:[\w.]+\.)?registerTool\b/g))
    callers.add(match[1] as string)
  const expression = new RegExp(`\\b(?:${[...callers].join('|')})\\(\\s*['"]([a-z0-9_]+)['"]`, 'g')
  return [...source.matchAll(expression)].map((match) => match[1] as string)
}

const TOOL_1: RubricItem<McpToolsContext> = {
  code: 'TOOL-1',
  title: 'MCP tool surface',
  description:
    'Registered tool names use snake-case app/resource/action forms; structured output declares outputSchema; and group registration order is stable.',
  sources: [STANDARD, RESULT_STANDARD],
  mechanical: {
    level: 'WARN',
    remediation: {
      class: 'diagnostic',
      guidance: 'Correct the observed tool surface with the owning API and security decisions.'
    },
    audit: {
      phase: 'INSPECT',
      run: (context) => {
        const names = context.files.flatMap((file) => registrations(file.content))
        const checks: AuditOutcome[] = []
        if (names.length === 0)
          checks.push({
            status: 'VIOLATION',
            message: 'No registerTool(...) calls found; verify tool registration.',
            subject: 'src/tools'
          })
        else {
          const invalid = names.filter((name) => !/^[a-z0-9]+(_[a-z0-9]+){1,}$/.test(name))
          checks.push({
            status: 'PASS',
            message: `Registered tools (${names.length}): ${[...names].sort().join(', ')}.`,
            subject: 'src/tools'
          })
          checks.push({
            status: invalid.length > 0 ? 'VIOLATION' : 'PASS',
            message:
              invalid.length > 0
                ? `Names not matching the documented form: ${invalid.join(', ')}.`
                : 'All tool names use the documented form.',
            subject: 'src/tools'
          })
        }
        const source = context.resultFiles.map((file) => file.content).join('\n')
        const structured = /\bstructuredContent\b/.test(source)
        const json = /\bjsonResult\b/.test(source)
        const schema = /\boutputSchema\b/.test(source)
        if (structured)
          checks.push({
            status: schema ? 'PASS' : 'VIOLATION',
            message: schema
              ? 'structuredContent is paired with outputSchema.'
              : 'Tools return structuredContent but declare no outputSchema.',
            subject: 'src/tools'
          })
        if (json && !schema)
          checks.push({
            status: 'VIOLATION',
            message: 'Tools use jsonResult but declare no outputSchema.',
            subject: 'src/tools'
          })
        for (const file of context.files.filter((candidate) => /^src\/tools\/[^/]+\/index\.ts$/.test(candidate.path))) {
          const group = [...file.content.matchAll(/server\.registerTool\(\s*['"]([^'"]+)['"]/g)].map(
            (match) => match[1] as string
          )
          if (group.length <= 1) continue
          const ascending = [...group].sort()
          const descending = [...ascending].reverse()
          const stable =
            JSON.stringify(group) === JSON.stringify(ascending) || JSON.stringify(group) === JSON.stringify(descending)
          checks.push({
            status: stable ? 'PASS' : 'VIOLATION',
            message: `Tool registration order is ${stable ? 'deterministic' : 'not alphabetical; verify intentional stability'} (${group.join(', ')}).`,
            subject: file.path
          })
        }
        return checks
      }
    }
  },
  judgment: {
    scope:
      'The full public MCP tool surface, result envelopes, annotations, documentation, and applicable OAuth requirements.',
    prompt:
      'Review plural/singular resource choices, CLI mirroring and README catalogues; confirm the annotation-driven access gate, annotation presets, dry-run defaults, read default, audit/error envelopes, path and subprocess hardening, bounded schemas, error aggregation, output sanitisation, and the applicable OAuth security requirements. Optional metadata remains opt-in.',
    outcomes: ['conforming', 'gap', 'exclusion'],
    guidance:
      'Make API or security changes only with the owning authority; otherwise record a named gap or explicit justified exclusion.'
  }
}

export const TOOL: RubricFamily<McpRubricContext, McpToolsContext> = {
  code: 'TOOL',
  title: 'Tool surface',
  description: 'Tool names, result envelopes, schemas, and registration order form a stable MCP surface.',
  standard: STANDARD,
  selectContext: (context) => context.tools,
  items: [TOOL_1]
}
