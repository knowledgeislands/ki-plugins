import type { AuditOutcome, RubricFamily, RubricItem, ViolationLevel } from '../../shared/rubric.ts'
import type { PluginsContext } from '../contexts/plugins.ts'

const SOURCE = 'standards-plugin-marketplace.md'
const ORG = 'Knowledge Islands'

const unavailable = (context: PluginsContext): readonly AuditOutcome[] | null =>
  !context.available
    ? [{ status: 'VIOLATION', message: `target path is not a physical directory: ${context.target}` }]
    : !context.applicable
      ? [{ status: 'NOT_APPLICABLE', message: 'ki-plugins is not applicable to this repository' }]
      : null

const result = (condition: boolean, pass: string, violation: string, subject?: string): readonly AuditOutcome[] => [
  { status: condition ? 'PASS' : 'VIOLATION', message: condition ? pass : violation, ...(subject ? { subject } : {}) }
]

const active = (context: PluginsContext, inspect: () => readonly AuditOutcome[]): readonly AuditOutcome[] =>
  unavailable(context) ?? inspect()

const mechanical = (
  code: string,
  title: string,
  description: string,
  level: ViolationLevel,
  audit: (context: PluginsContext) => readonly AuditOutcome[]
): RubricItem<PluginsContext> => ({
  code,
  title,
  description,
  sources: [SOURCE],
  mechanical: {
    level,
    audit: { phase: 'INSPECT', run: audit }
  }
})

const judgment = (code: string, title: string, description: string, prompt: string): RubricItem<PluginsContext> => ({
  code,
  title,
  description,
  sources: [SOURCE],
  judgment: { prompt }
})

const formatted = (raw: string, value: Record<string, unknown> | null): boolean =>
  Boolean(value) && raw === `${JSON.stringify(value, null, 2)}\n`

const PLUG_1 = mechanical('PLUG-1', 'Marketplace manifest', '`.claude-plugin/marketplace.json` exists and parses.', 'FAIL', (context) =>
  active(context, () =>
    result(
      Boolean(context.marketplace.raw && context.marketplace.value),
      'marketplace manifest parses',
      'marketplace manifest is missing, unsafe, or invalid JSON',
      context.marketplaceFile
    )
  )
)

const PLUG_2 = mechanical(
  'PLUG-2',
  'Marketplace ownership',
  '`owner.name` is `Knowledge Islands`; `plugins` lists exactly one entry.',
  'FAIL',
  (context) =>
    active(context, () => {
      const entries = Array.isArray(context.marketplace.value?.plugins) ? context.marketplace.value.plugins : []
      return result(
        (context.marketplace.value?.owner as { name?: unknown } | undefined)?.name === ORG && entries.length === 1,
        'marketplace ownership and single-plugin shape are canonical',
        'marketplace owner or plugin count is invalid',
        context.marketplaceFile
      )
    })
)

const PLUG_3 = mechanical(
  'PLUG-3',
  'Plugin entry',
  'The plugin entry has `name`, `source = ./<name>`, and a description; the physical source directory exists.',
  'FAIL',
  (context) =>
    active(context, () => {
      const entries = Array.isArray(context.marketplace.value?.plugins)
        ? (context.marketplace.value.plugins as Record<string, unknown>[])
        : []
      const entry = entries.length === 1 ? entries[0] : null
      return result(
        Boolean(
          entry &&
            context.pluginName &&
            entry.source === `./${context.pluginName}` &&
            context.pluginDescription &&
            context.isDir(context.pluginName)
        ),
        'plugin entry and source directory agree',
        'plugin entry is incomplete or its physical source directory is absent',
        context.marketplaceFile
      )
    })
)

const PLUG_4 = mechanical(
  'PLUG-4',
  'Manifest formatting',
  'Plugin JSON manifests use two spaces and a trailing newline.',
  'WARN',
  (context) =>
    active(context, () => {
      const documents = [
        [context.marketplaceFile, context.marketplace],
        [context.pluginFile, context.plugin]
      ] as const
      const invalid = documents
        .filter(([file, document]) => file && document.raw && !formatted(document.raw, document.value))
        .map(([file]) => file)
      return result(
        invalid.length === 0,
        'plugin manifests use canonical JSON formatting',
        `non-canonical JSON formatting: ${invalid.join(', ')}`,
        invalid[0]
      )
    })
)

const PLUG_5 = mechanical(
  'PLUG-5',
  'Plugin manifest',
  '`<plugin>/.claude-plugin/plugin.json` exists, parses, and its name matches the source directory.',
  'FAIL',
  (context) =>
    active(context, () =>
      result(
        Boolean(context.pluginFile && context.plugin.value && context.plugin.value.name === context.pluginName),
        'plugin manifest parses and matches its directory',
        'plugin manifest is missing, unsafe, invalid, or names another plugin',
        context.pluginFile || context.marketplaceFile
      )
    )
)

const PLUG_6 = mechanical('PLUG-6', 'Plugin author', '`author.name` is `Knowledge Islands`.', 'FAIL', (context) =>
  active(context, () =>
    result(
      (context.plugin.value?.author as { name?: unknown } | undefined)?.name === ORG,
      'plugin author is canonical',
      'plugin author must be Knowledge Islands',
      context.pluginFile
    )
  )
)

const PLUG_7 = mechanical(
  'PLUG-7',
  'Plugin version and description',
  '`version` is semver and `description` matches the marketplace entry.',
  'WARN',
  (context) =>
    active(context, () =>
      result(
        typeof context.plugin.value?.version === 'string' &&
          /^\d+\.\d+\.\d+/.test(context.plugin.value.version) &&
          context.plugin.value.description === context.pluginDescription,
        'plugin version and description agree',
        'plugin version is invalid or description has drifted',
        context.pluginFile
      )
    )
)

const PLUG_8 = mechanical('PLUG-8', 'Projected skills', '`<plugin>/skills/*` each carries a physical `SKILL.md`.', 'FAIL', (context) =>
  active(context, () =>
    result(
      context.projectedSkillCount > 0 && context.projectedSkillsWithoutManifest.length === 0,
      `${context.projectedSkillCount} projected skills carry SKILL.md`,
      context.projectedSkillCount === 0
        ? 'projected skills are absent'
        : `skills without physical SKILL.md: ${context.projectedSkillsWithoutManifest.join(', ')}`,
      context.pluginName ? `${context.pluginName}/skills` : undefined
    )
  )
)

const PLUG_9 = mechanical('PLUG-9', 'Flattened agents', '`<plugin>/agents/*.md` are physical flat files.', 'FAIL', (context) =>
  active(context, () =>
    result(
      context.agentCount > 0 && context.nestedAgentDirectories.length === 0,
      `${context.agentCount} flattened agents present`,
      context.nestedAgentDirectories.length
        ? `nested agent directories: ${context.nestedAgentDirectories.join(', ')}`
        : 'projected agents are absent',
      context.pluginName ? `${context.pluginName}/agents` : undefined
    )
  )
)

const PLUG_10 = mechanical('PLUG-10', 'MCP deferral', 'No `.mcp.json` appears in the plugin.', 'WARN', (context) =>
  active(context, () =>
    result(context.mcpFiles.length === 0, 'MCP payload remains deferred', `unexpected MCP payloads: ${context.mcpFiles.join(', ')}`)
  )
)

const PLUG_11 = judgment(
  'PLUG-11',
  'Projection freshness',
  'The projected skill and agent set matches the current harness.',
  'Does the projected skill and agent set match the current harness without stale or missing entries?'
)

const PLUG_12 = judgment(
  'PLUG-12',
  'Projection reproducibility',
  'Running the canonical `ki-binding` generator leaves no diff.',
  'Is the complete projection byte-for-byte reproducible from the current harness?'
)

const PLUG_13 = mechanical(
  'PLUG-13',
  'Repository scaffold',
  '`LICENSE`, `README.md`, `.gitignore`, and `CLAUDE.md` are physical files.',
  'FAIL',
  (context) =>
    active(context, () => {
      const missing = ['LICENSE', 'README.md', '.gitignore', 'CLAUDE.md'].filter((file) => !context.has(file))
      return result(
        missing.length === 0,
        'repository scaffold is complete',
        `missing or unsafe scaffold files: ${missing.join(', ')}`,
        missing[0]
      )
    })
)

const PLUG_14 = mechanical(
  'PLUG-14',
  'Generated-content warning',
  '`CLAUDE.md` states the generated-not-hand-edited invariant.',
  'WARN',
  (context) =>
    active(context, () => {
      const content = context.read('CLAUDE.md')
      return result(
        /generated/i.test(content) && /hand-?edit|hand-?maintain/i.test(content),
        'CLAUDE.md states the generated-content invariant',
        'CLAUDE.md does not clearly forbid hand-editing generated content',
        'CLAUDE.md'
      )
    })
)

const PLUG_15 = mechanical(
  'PLUG-15',
  'Governance declaration',
  'Applicable repositories declare `[ki-plugins]` and no unknown keys.',
  'WARN',
  (context) =>
    active(context, () =>
      result(
        Boolean(context.configTable) && Object.keys(context.configTable ?? {}).length === 0,
        '[ki-plugins] declaration is canonical',
        context.malformedConfig
          ? '.ki-config.toml is malformed'
          : !context.configTable
            ? '[ki-plugins] declaration is absent'
            : `unknown [ki-plugins] keys: ${Object.keys(context.configTable).join(', ')}`,
        '.ki-config.toml'
      )
    )
)

const PLUG_16 = judgment(
  'PLUG-16',
  'Projection documentation',
  '`README.md` and `CLAUDE.md` describe the projection model without drift and the licence exception remains deliberate.',
  'Do the repository documents accurately describe the projection, generated-content boundary, and deliberate licence exception?'
)

export const PLUG: RubricFamily<PluginsContext, PluginsContext> = {
  code: 'PLUG',
  title: 'Plugin marketplace projection',
  description: 'The marketplace manifest, generated plugin projection, and repository scaffold.',
  standard: SOURCE,
  selectContext: (context) => context,
  items: [
    PLUG_1,
    PLUG_2,
    PLUG_3,
    PLUG_4,
    PLUG_5,
    PLUG_6,
    PLUG_7,
    PLUG_8,
    PLUG_9,
    PLUG_10,
    PLUG_11,
    PLUG_12,
    PLUG_13,
    PLUG_14,
    PLUG_15,
    PLUG_16
  ]
}
