import type { AuditOutcome, RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { McpRubricContext, McpScriptsContext } from '../contexts/mcp.ts'

const STANDARD = 'standards-mcp-servers.md#8-packagejson'

const SCR_1: RubricItem<McpScriptsContext> = {
  code: 'SCR-1',
  title: 'MCP scripts',
  description:
    'MCP server scripts are present, typed-client generation is required, auth-server scripts are paired, and record/replay scripts travel together.',
  sources: [STANDARD],
  mechanical: {
    level: 'FAIL',
    overrideLevels: ['WARN'],
    remediation: {
      class: 'diagnostic',
      guidance: 'Add or correct the declared scripts with the owning runtime and release decision.'
    },
    audit: {
      phase: 'INSPECT',
      run: (context) => {
        if (!context.packageJson)
          return [
            { status: 'VIOLATION', message: 'Package manifest is missing or unparseable.', subject: 'package.json' }
          ]
        const checks: AuditOutcome[] = ['ki:server:mcp:dev', 'ki:server:mcp:inspect', 'ki:server:mcp:start'].map(
          (name) =>
            context.scripts[name]
              ? ({ status: 'PASS', message: `${name} is present.`, subject: 'package.json' } as AuditOutcome)
              : ({
                  status: 'VIOLATION',
                  level: 'WARN',
                  message: `MCP script ${JSON.stringify(name)} is missing.`,
                  subject: 'package.json'
                } as AuditOutcome)
        )
        checks.push({
          status: context.scripts['ki:generate:client'] ? 'PASS' : 'VIOLATION',
          message: context.scripts['ki:generate:client']
            ? 'ki:generate:client is present.'
            : 'MCP script ki:generate:client is missing.',
          subject: 'package.json'
        })
        if (context.authServer)
          for (const name of ['ki:server:auth:dev', 'ki:server:auth:start'])
            checks.push({
              status: context.scripts[name] ? 'PASS' : 'VIOLATION',
              message: context.scripts[name] ? `${name} is present.` : `src/auth-server requires ${name}.`,
              subject: 'package.json'
            })
        const paired = Boolean(context.scripts['ki:test:record']) === Boolean(context.scripts['ki:test:replay'])
        checks.push(
          paired
            ? { status: 'PASS', message: 'Record/replay scripts are paired.', subject: 'package.json' }
            : {
                status: 'VIOLATION',
                level: 'WARN',
                message: 'ki:test:record and ki:test:replay must be defined together.',
                subject: 'package.json'
              }
        )
        return checks
      }
    }
  },
  judgment: {
    scope: 'Generated client outputs and the explicit generation and smoke commands declared by the package.',
    prompt:
      'Verify generated typed-client files are committed and current; where generation is needed, run bun run ki:generate:client explicitly outside hosted conform.',
    outcomes: ['conforming', 'gap', 'exclusion'],
    guidance:
      'Run the explicit command, update reviewed generated outputs, or record a named gap or explicit exclusion.'
  }
}

export const SCR: RubricFamily<McpRubricContext, McpScriptsContext> = {
  code: 'SCR',
  title: 'MCP scripts',
  description: 'Runtime, auth, client-generation, and recording scripts expose the expected explicit commands.',
  standard: STANDARD,
  selectContext: (context) => context.scripts,
  items: [SCR_1]
}
