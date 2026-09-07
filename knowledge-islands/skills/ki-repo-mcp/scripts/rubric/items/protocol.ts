import type { AuditOutcome, RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { McpProtocolContext, McpRubricContext } from '../contexts/mcp.ts'

const STANDARD = 'standards-mcp-servers.md#12-protocol-profiles'
const LEGACY_PACKAGE = '@modelcontextprotocol/sdk'
const MODERN_PACKAGE = '@modelcontextprotocol/server'

const asTable = (value: unknown): Readonly<Record<string, unknown>> | null =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Readonly<Record<string, unknown>>) : null

const dependencyVersion = (packageJson: Readonly<Record<string, unknown>>, name: string): string | undefined => {
  for (const field of ['dependencies', 'devDependencies', 'peerDependencies']) {
    const value = asTable(packageJson[field])?.[name]
    if (typeof value === 'string') return value
  }
  return undefined
}

const dependencyMajor = (version: string): number | undefined => {
  const match = /^(?:\^|~|>=?|<=?)?\s*(\d+)(?:\.|$)/.exec(version)
  return match?.[1] === undefined ? undefined : Number.parseInt(match[1], 10)
}

const helperDefinitions = (source: string): number =>
  [...source.matchAll(/(?:export\s+)?(?:const|function)\s+(?:jsonResult|errorResult)\b/g)].length

const completeDiscriminators = (source: string): number =>
  [...source.matchAll(/\bresultType\s*:\s*['"]complete['"]/g)].length

const PROTO_1: RubricItem<McpProtocolContext> = {
  code: 'PROTO-1',
  title: 'Protocol profile',
  description:
    'The declared server dependency selects exactly one supported protocol profile: @modelcontextprotocol/sdk major 1 for legacy 2025-11-25, or @modelcontextprotocol/server major 2 for modern 2026-07-28 with complete result discriminators and the SDK-owned stdio boundary.',
  sources: [STANDARD],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance:
        'Use one supported MCP server package family and satisfy only its selected protocol profile; migrate through a separately reviewed receiver-owned work item.'
    },
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

        const legacyVersion = dependencyVersion(context.packageJson, LEGACY_PACKAGE)
        const modernVersion = dependencyVersion(context.packageJson, MODERN_PACKAGE)
        if (legacyVersion && modernVersion)
          return [
            {
              status: 'VIOLATION',
              message: `Mixed MCP server package families are unsupported: ${LEGACY_PACKAGE} ${legacyVersion} and ${MODERN_PACKAGE} ${modernVersion}.`,
              subject: 'package.json'
            }
          ]
        if (!legacyVersion && !modernVersion)
          return [
            {
              status: 'VIOLATION',
              message: `No supported MCP server package selects a protocol profile; expected ${LEGACY_PACKAGE} major 1 or ${MODERN_PACKAGE} major 2.`,
              subject: 'package.json'
            }
          ]

        const source = context.files.map((file) => file.content).join('\n')
        if (legacyVersion) {
          if (dependencyMajor(legacyVersion) !== 1)
            return [
              {
                status: 'VIOLATION',
                message: `${LEGACY_PACKAGE} ${legacyVersion} has an unsupported or unrecognised major; legacy profile requires major 1.`,
                subject: 'package.json'
              }
            ]
          if (/[@'"]modelcontextprotocol\/server|\bserveStdio\b/.test(source))
            return [
              {
                status: 'VIOLATION',
                message:
                  'Modern v2 server markers are present while package.json selects only the legacy v1 SDK profile.',
                subject: 'src'
              }
            ]
          return [
            {
              status: 'PASS',
              message: `${LEGACY_PACKAGE} ${legacyVersion} selects the conformant legacy 2025-11-25 profile; modern-only checks do not apply.`,
              subject: 'package.json'
            }
          ]
        }

        if (!modernVersion || dependencyMajor(modernVersion) !== 2)
          return [
            {
              status: 'VIOLATION',
              message: `${MODERN_PACKAGE} ${modernVersion ?? '(missing)'} has an unsupported or unrecognised major; modern profile requires major 2.`,
              subject: 'package.json'
            }
          ]

        const outcomes: AuditOutcome[] = [
          {
            status: 'PASS',
            message: `${MODERN_PACKAGE} ${modernVersion} selects the modern 2026-07-28 profile.`,
            subject: 'package.json'
          }
        ]
        outcomes.push({
          status: /@modelcontextprotocol\/sdk|\bStdioServerTransport\b/.test(source) ? 'VIOLATION' : 'PASS',
          message: /@modelcontextprotocol\/sdk|\bStdioServerTransport\b/.test(source)
            ? 'Modern profile source retains a legacy SDK import or StdioServerTransport boundary.'
            : 'Modern profile source does not retain the legacy SDK server boundary.',
          subject: 'src'
        })
        outcomes.push({
          status: /\bserveStdio\s*\(/.test(source) ? 'PASS' : 'VIOLATION',
          message: /\bserveStdio\s*\(/.test(source)
            ? 'Modern profile uses the supported SDK-owned serveStdio boundary.'
            : 'Modern profile does not call the supported SDK-owned serveStdio boundary.',
          subject: 'src/mcp-server'
        })
        const resultFiles = context.files.filter((file) => helperDefinitions(file.content) > 0)
        if (resultFiles.length === 0)
          outcomes.push({
            status: 'VIOLATION',
            message: 'Modern profile exposes no inspectable jsonResult or errorResult helper definitions.',
            subject: 'src'
          })
        for (const file of resultFiles) {
          const helpers = helperDefinitions(file.content)
          const discriminators = completeDiscriminators(file.content)
          outcomes.push({
            status: discriminators >= helpers ? 'PASS' : 'VIOLATION',
            message:
              discriminators >= helpers
                ? `Every result helper carries resultType: "complete" (${helpers}).`
                : `Result helpers require ${helpers} complete discriminators; found ${discriminators}.`,
            subject: file.path
          })
        }
        return outcomes
      }
    }
  }
}

export const PROTO: RubricFamily<McpRubricContext, McpProtocolContext> = {
  code: 'PROTO',
  title: 'Protocol profile',
  description: 'The installed MCP server package selects one protocol era and its matching stdio and result contract.',
  standard: STANDARD,
  selectContext: (context) => context.protocol,
  items: [PROTO_1]
}
