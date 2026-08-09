import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'
import type { RubricContextOptions, RubricPublicationContext, RubricSession } from '../../shared/rubric.ts'

const CONFIG_TABLE = 'ki-repo-plugins'

export type JsonDocument = {
  raw: string
  value: Record<string, unknown> | null
}

export type PluginsContext = {
  rubric: RubricPublicationContext
  target: string
  available: boolean
  applicable: boolean
  malformedConfig: boolean
  configTable: Record<string, unknown> | null
  marketplace: JsonDocument
  marketplaceFile: string
  pluginName: string
  pluginDescription: string
  plugin: JsonDocument
  pluginFile: string
  has: (...parts: string[]) => boolean
  read: (...parts: string[]) => string
  isDir: (...parts: string[]) => boolean
  projectedSkillCount: number
  projectedSkillsWithoutManifest: readonly string[]
  agentCount: number
  nestedAgentDirectories: readonly string[]
  mcpFiles: readonly string[]
}

const jsonDocument = (raw: string): JsonDocument => {
  try {
    const value: unknown = JSON.parse(raw)
    return {
      raw,
      value: value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null
    }
  } catch {
    return { raw, value: null }
  }
}

const table = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null

const physicalDirectory = (path: string): boolean => {
  if (!existsSync(path)) return false
  const state = lstatSync(path)
  return state.isDirectory() && !state.isSymbolicLink()
}

const containedPhysical = (root: string, path: string, kind: 'file' | 'directory'): boolean => {
  const remainder = relative(root, path)
  if (remainder.startsWith('..') || remainder === '..' || !physicalDirectory(root)) return false
  let cursor = root
  for (const segment of remainder.split(sep).filter(Boolean)) {
    cursor = join(cursor, segment)
    if (!existsSync(cursor) || lstatSync(cursor).isSymbolicLink()) return false
  }
  const state = lstatSync(path)
  return kind === 'file' ? state.isFile() : state.isDirectory()
}

export const createPluginsSession = ({
  repository,
  publication
}: RubricContextOptions): RubricSession<PluginsContext> => {
  const root = resolve(repository)
  const available = physicalDirectory(root)
  const at = (...parts: string[]) => join(root, ...parts)
  const has = (...parts: string[]) =>
    available && (containedPhysical(root, at(...parts), 'file') || containedPhysical(root, at(...parts), 'directory'))
  const read = (...parts: string[]) =>
    available && containedPhysical(root, at(...parts), 'file') ? readFileSync(at(...parts), 'utf8') : ''
  const isDir = (...parts: string[]) => available && containedPhysical(root, at(...parts), 'directory')

  const configRaw = read('.ki-config.toml')
  let config: Record<string, unknown> | null = null
  let malformedConfig = false
  try {
    config = configRaw ? (Bun.TOML.parse(configRaw) as Record<string, unknown>) : {}
  } catch {
    malformedConfig = true
  }
  const configTable = table(table(config?.skills)?.[CONFIG_TABLE])
  const marketplaceFile = '.claude-plugin/marketplace.json'
  const marketplacePath = at('.claude-plugin', 'marketplace.json')
  const marketplace = jsonDocument(read('.claude-plugin', 'marketplace.json'))
  const pluginEntries = Array.isArray(marketplace.value?.plugins)
    ? (marketplace.value.plugins as Record<string, unknown>[])
    : []
  const entry = pluginEntries.length === 1 ? pluginEntries[0] : null
  const pluginName = typeof entry?.name === 'string' ? entry.name : ''
  const pluginDescription = typeof entry?.description === 'string' ? entry.description : ''
  const pluginFile = pluginName ? `${pluginName}/.claude-plugin/plugin.json` : ''
  const plugin = jsonDocument(pluginFile ? read(pluginName, '.claude-plugin', 'plugin.json') : '')
  const applicable =
    available && (configTable !== null || malformedConfig || existsSync(marketplacePath) || Boolean(marketplace.raw))

  const skillRoot = pluginName ? at(pluginName, 'skills') : ''
  const projectedSkills =
    skillRoot && isDir(pluginName, 'skills')
      ? readdirSync(skillRoot, { withFileTypes: true }).filter(
          (skill) => skill.isDirectory() && !skill.isSymbolicLink() && !skill.name.startsWith('.')
        )
      : []
  const projectedSkillsWithoutManifest = projectedSkills
    .filter((skill) => !has(pluginName, 'skills', skill.name, 'SKILL.md'))
    .map((skill) => skill.name)

  const agentRoot = pluginName ? at(pluginName, 'agents') : ''
  const agentEntries =
    agentRoot && isDir(pluginName, 'agents')
      ? readdirSync(agentRoot, { withFileTypes: true }).filter(
          (agent) => !agent.isSymbolicLink() && !agent.name.startsWith('.')
        )
      : []
  const nestedAgentDirectories = agentEntries.filter((agent) => agent.isDirectory()).map((agent) => agent.name)

  const mcpFiles: string[] = []
  const walk = (directory: string): void => {
    if (!containedPhysical(root, directory, 'directory')) return
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.git')) continue
      const path = join(directory, entry.name)
      if (entry.name === '.mcp.json') {
        mcpFiles.push(relative(root, path))
        continue
      }
      if (entry.isDirectory() && !entry.isSymbolicLink()) walk(path)
    }
  }
  if (pluginName && isDir(pluginName)) walk(at(pluginName))

  const context: PluginsContext = {
    rubric: { publication },
    target: root,
    available,
    applicable,
    malformedConfig,
    configTable,
    marketplace,
    marketplaceFile,
    pluginName,
    pluginDescription,
    plugin,
    pluginFile,
    has,
    read,
    isDir,
    projectedSkillCount: projectedSkills.length,
    projectedSkillsWithoutManifest,
    agentCount: agentEntries.filter((agent) => agent.isFile() && agent.name.endsWith('.md')).length,
    nestedAgentDirectories,
    mcpFiles
  }

  return {
    subjects: [
      { families: ['PLUG'], subject: root, context: () => context },
      { families: ['RUBRIC'], subject: root, context: () => context }
    ],
    proposal: () => ({ writes: [] })
  }
}
