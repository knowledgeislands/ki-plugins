import type { AuditOutcome, RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { McpConfigurationContext, McpRubricContext } from '../contexts/mcp.ts'

const STANDARD = 'standards-mcp-servers.md#2-config-injection'

const CFG_1: RubricItem<McpConfigurationContext> = {
  code: 'CFG-1',
  title: 'Injected configuration surface',
  description:
    'config/index.ts exports loadConfig, loads .env through process.loadEnvFile, and refers to ACCESS_LEVELS, ACCESS_LEVEL_RANK, and AuditLogMode; ambient process.env reads elsewhere are surfaced.',
  sources: [STANDARD],
  mechanical: {
    level: 'WARN',
    remediation: {
      class: 'diagnostic',
      guidance: 'Correct the configuration surface and ambient reads with the owning implementation decision.'
    },
    audit: {
      phase: 'INSPECT',
      run: (context) => {
        const checks: AuditOutcome[] = []
        if (!context.source)
          checks.push({
            status: 'VIOLATION',
            message: 'src/config/index.ts is missing or unsafe.',
            subject: 'src/config/index.ts'
          })
        else {
          checks.push({
            status: /export\s+(async\s+)?function\s+loadConfig|export\s+const\s+loadConfig/.test(context.source)
              ? 'PASS'
              : 'VIOLATION',
            message: 'config/index.ts must export loadConfig.',
            subject: 'src/config/index.ts'
          })
          checks.push({
            status: context.source.includes('process.loadEnvFile') ? 'PASS' : 'VIOLATION',
            message: 'config/index.ts should call process.loadEnvFile.',
            subject: 'src/config/index.ts'
          })
          if (/loadEnvFile\(\s*[`'"]\.\.?\//.test(context.source))
            checks.push({
              status: 'VIOLATION',
              message: 'loadEnvFile uses a cwd-relative path; resolve from import.meta.url.',
              subject: 'src/config/index.ts'
            })
          for (const symbol of ['ACCESS_LEVELS', 'ACCESS_LEVEL_RANK', 'AuditLogMode'])
            checks.push({
              status: context.source.includes(symbol) ? 'PASS' : 'VIOLATION',
              message: `config/index.ts ${context.source.includes(symbol) ? 'references' : 'is missing'} ${symbol}.`,
              subject: 'src/config/index.ts'
            })
        }
        checks.push({
          status: context.ambientProcessEnvOffenders.length > 0 ? 'VIOLATION' : 'PASS',
          message:
            context.ambientProcessEnvOffenders.length > 0
              ? `process.env read outside config/: ${context.ambientProcessEnvOffenders.join(', ')}.`
              : 'No process.env reads outside config/.',
          subject: 'src'
        })
        return checks
      }
    }
  },
  judgment: {
    scope:
      'Configuration loading, injection boundaries, and configuration-dependent tests across the MCP implementation.',
    prompt:
      'Verify loadConfig(env?) is the only environmental reader, no module-level config singleton exists, config is the first argument of every main/utils entry point, Config contains the standard audit and access fields, and tests use literal config rather than environment mutation.',
    outcomes: ['conforming', 'gap', 'exclusion'],
    guidance:
      'Refactor only with the owning implementation decision, or record a named gap or explicit justified exclusion.'
  }
}

export const CFG: RubricFamily<McpRubricContext, McpConfigurationContext> = {
  code: 'CFG',
  title: 'Configuration',
  description: 'Configuration is loaded once, injected explicitly, and absent from ambient implementation state.',
  standard: STANDARD,
  selectContext: (context) => context.configuration,
  items: [CFG_1]
}
