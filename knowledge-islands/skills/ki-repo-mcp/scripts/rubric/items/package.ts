import type { AuditOutcome, RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { McpPackageContext, McpRubricContext } from '../contexts/mcp.ts'

const STANDARD = 'standards-mcp-servers.md#8-packagejson'
const MAIN = 'dist/mcp-server/index.js'

const PKG_1: RubricItem<McpPackageContext> = {
  code: 'PKG-1',
  title: 'MCP package entry points',
  description: 'package.json has the MCP main and bin target plus ., ./config, and ./package.json exports.',
  sources: [STANDARD],
  mechanical: {
    level: 'FAIL',
    remediation: { class: 'automatic' },
    audit: {
      phase: 'INSPECT',
      run: (context) => {
        if (!context.packageJson)
          return [
            {
              status: 'VIOLATION',
              message: context.malformed ? 'Package manifest is malformed or unsafe.' : 'Package manifest is missing.',
              subject: 'package.json'
            }
          ]
        const pkg = context.packageJson
        const bin = (pkg.bin ?? {}) as Record<string, string>
        const exports_ = (pkg.exports ?? {}) as Record<string, unknown>
        return [
          {
            status: pkg.main === MAIN ? ('PASS' as const) : ('VIOLATION' as const),
            message:
              pkg.main === MAIN
                ? `main = ${JSON.stringify(MAIN)}.`
                : `main should be ${JSON.stringify(MAIN)}, got ${JSON.stringify(pkg.main)}.`,
            subject: 'package.json'
          },
          {
            status: Object.values(bin).includes(MAIN) ? ('PASS' as const) : ('VIOLATION' as const),
            message: Object.values(bin).includes(MAIN) ? `bin maps to ${MAIN}.` : `bin must map to ${MAIN}.`,
            subject: 'package.json'
          },
          ...['.', './config', './package.json'].map(
            (key) =>
              ({
                status: exports_[key] === undefined ? 'VIOLATION' : 'PASS',
                message:
                  exports_[key] === undefined
                    ? `exports missing ${JSON.stringify(key)}.`
                    : `exports has ${JSON.stringify(key)}.`,
                subject: 'package.json'
              }) as AuditOutcome
          )
        ]
      }
    },
    conform: {
      phase: 'PRIMARY',
      run: (context) => context.conformPackage?.()
    }
  }
}

export const PKG: RubricFamily<McpRubricContext, McpPackageContext> = {
  code: 'PKG',
  title: 'Package entry points',
  description: 'The package exposes the compiled MCP server, configuration, and manifest surfaces.',
  standard: STANDARD,
  selectContext: (context) => context.package,
  items: [PKG_1]
}
