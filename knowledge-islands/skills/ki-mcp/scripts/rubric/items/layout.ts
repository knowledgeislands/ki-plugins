import type { AuditOutcome, RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { McpLayoutContext, McpRubricContext } from '../contexts/mcp.ts'

const STANDARD = 'standards-mcp-servers.md#1-project-layout'

const LAY_1: RubricItem<McpLayoutContext> = {
  code: 'LAY-1',
  title: 'MCP source layout',
  description: 'src/ contains config/, mcp-server/, tools/, main/, and utils/; an optional cli/ contains cli.ts and index.ts.',
  sources: [STANDARD],
  mechanical: {
    level: 'FAIL',
    audit: {
      phase: 'INSPECT',
      run: (context) => {
        const required: AuditOutcome[] = context.requiredDirectories.map(({ path, state }) => ({
          status: state === 'directory' ? 'PASS' : 'VIOLATION',
          message:
            state === 'directory'
              ? `Required directory is present: ${path}/.`
              : state === 'unsafe'
                ? `Required path is not a regular directory: ${path}/.`
                : `Required directory is missing: ${path}/.`,
          subject: path
        }))
        if (context.cli.state === 'unsafe')
          required.push({ status: 'VIOLATION', message: 'Optional src/cli/ is not a regular directory.', subject: 'src/cli' })
        if (context.cli.state === 'directory')
          required.push(
            ...context.cli.files.map(({ path, state }) => ({
              status: state === 'file' ? ('PASS' as const) : ('VIOLATION' as const),
              message: state === 'file' ? `Required CLI file is present: ${path}.` : `Required CLI file is missing or unsafe: ${path}.`,
              subject: path
            }))
          )
        return required
      }
    }
  },
  judgment: {
    prompt:
      'Review tools/ for thin validation-and-envelope shells, main/ for concern-grouped implementation, no console output in main/utils, and cli/ as a shared-main human shell rather than a second implementation.'
  }
}

export const LAY: RubricFamily<McpRubricContext, McpLayoutContext> = {
  code: 'LAY',
  title: 'Source layout',
  description: 'The repository separates MCP wiring, tool shells, reusable implementation, configuration, and shared utilities.',
  standard: STANDARD,
  selectContext: (context) => context.layout,
  items: [LAY_1]
}
