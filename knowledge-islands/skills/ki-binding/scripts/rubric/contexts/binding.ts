import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, relative, resolve } from 'node:path'
import type { ConformWrite, RubricContextOptions, RubricSession } from '../../shared/rubric.ts'

declare const Bun: { YAML: { parse(input: string): unknown }; TOML: { parse(input: string): unknown } }

export type ServerEntry = { name?: string; clients?: string[]; url?: string; command?: string }
export type Surface = { token: string; label: string; path: string; format: 'json' | 'toml' }
export type SourceState = { kind: 'absent' } | { kind: 'invalid'; message: string } | { kind: 'valid'; entries: readonly ServerEntry[] }

export type CoworkFileEvidence = {
  path: string
  subject: string
  status: 'already' | 'unreadable' | 'pending' | 'unsafe'
  enable?: () => void
}

export type BindingRubricContext = {
  source: string
  sourceState: SourceState
  surfaces: readonly { surface: Surface; serverKeys: ReadonlySet<string> | null }[]
  repository: {
    path: string
    runtimeRoots: readonly string[]
    declaredSkills: readonly string[]
    missingSkills: readonly string[]
  }
  cowork: {
    base: string
    files: readonly CoworkFileEvidence[]
  }
}

type CoworkDraft = {
  evidence: CoworkFileEvidence
  proposal: () => ConformWrite | undefined
}

export const RECOGNISED = new Set(['mcporter', 'claude-code', 'claude-desktop', 'chatgpt-codex'])

const COWORK_MARKETPLACE = 'ki-plugins'
const COWORK_REPO = 'knowledgeislands/ki-plugins'
const COWORK_PLUGIN = 'knowledge-islands'

const physicalFile = (path: string): boolean => {
  if (!existsSync(path)) return false
  const state = lstatSync(path)
  return state.isFile() && !state.isSymbolicLink()
}

const physicalDirectory = (path: string): boolean => {
  if (!existsSync(path)) return false
  const state = lstatSync(path)
  return state.isDirectory() && !state.isSymbolicLink()
}

const readJson = (path: string): Record<string, unknown> | null => {
  if (!physicalFile(path)) return null
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>
  } catch {
    return null
  }
}

const readToml = (path: string): Record<string, unknown> | null => {
  if (!physicalFile(path)) return null
  try {
    return Bun.TOML.parse(readFileSync(path, 'utf8')) as Record<string, unknown>
  } catch {
    return null
  }
}

const surfaceServerKeys = (surface: Surface): Set<string> | null => {
  const configuration = surface.format === 'toml' ? readToml(surface.path) : readJson(surface.path)
  if (configuration === null) return null
  const servers = surface.format === 'toml' ? configuration.mcp_servers : configuration.mcpServers
  return servers && typeof servers === 'object' ? new Set(Object.keys(servers as Record<string, unknown>)) : new Set()
}

const findCoworkSettings = (directory: string, depth = 0): string[] => {
  if (!physicalDirectory(directory) || depth > 4) return []
  const paths: string[] = []
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.name === 'cowork_settings.json') {
      paths.push(path)
      continue
    }
    if (entry.isDirectory() && !entry.isSymbolicLink() && entry.name !== 'cowork_plugins')
      paths.push(...findCoworkSettings(path, depth + 1))
  }
  return paths.sort()
}

const coworkEnabled = (
  configuration: Record<string, unknown>,
  marketplace = COWORK_MARKETPLACE,
  plugin = COWORK_PLUGIN,
  repo = COWORK_REPO
): boolean => {
  const enabled = (configuration.enabledPlugins ?? {}) as Record<string, unknown>
  const marketplaces = (configuration.extraKnownMarketplaces ?? {}) as Record<string, unknown>
  const registered = (marketplaces[marketplace] as { source?: { repo?: string } } | undefined)?.source?.repo === repo
  return enabled[`${plugin}@${marketplace}`] === true && registered
}

const createCoworkDraft = (path: string, userHome: string, mutable: boolean): CoworkDraft => {
  const subject = relative(userHome, path)
  if (!existsSync(path))
    return {
      evidence: { path, subject, status: 'unreadable' },
      proposal: () => undefined
    }
  const metadata = lstatSync(path)
  if (!metadata.isFile() || metadata.isSymbolicLink())
    return {
      evidence: { path, subject, status: 'unsafe' },
      proposal: () => undefined
    }
  const original = readFileSync(path, 'utf8')
  let configuration: Record<string, unknown>
  try {
    configuration = JSON.parse(original) as Record<string, unknown>
  } catch {
    return {
      evidence: { path, subject, status: 'unreadable' },
      proposal: () => undefined
    }
  }
  let enabled = coworkEnabled(configuration)
  const enable = (): void => {
    if (enabled) return
    const plugins = (configuration.enabledPlugins ?? {}) as Record<string, unknown>
    const marketplaces = (configuration.extraKnownMarketplaces ?? {}) as Record<string, unknown>
    configuration = {
      ...configuration,
      enabledPlugins: { ...plugins, [`${COWORK_PLUGIN}@${COWORK_MARKETPLACE}`]: true },
      extraKnownMarketplaces: {
        ...marketplaces,
        [COWORK_MARKETPLACE]: { source: { source: 'github', repo: COWORK_REPO } }
      }
    }
    enabled = true
  }
  return {
    evidence: {
      path,
      subject,
      status: enabled ? 'already' : 'pending',
      ...(mutable ? { enable } : {})
    },
    proposal: () => {
      if (coworkEnabled(JSON.parse(original) as Record<string, unknown>) || !enabled) return undefined
      return { path: subject, content: `${JSON.stringify(configuration, null, 2)}\n` }
    }
  }
}

const readSource = (path: string): SourceState => {
  if (!existsSync(path)) return { kind: 'absent' }
  if (!physicalFile(path)) return { kind: 'invalid', message: 'the source is not a physical regular file' }
  try {
    const parsed = Bun.YAML.parse(readFileSync(path, 'utf8')) as { mcpServers?: unknown }
    if (!parsed || !Array.isArray(parsed.mcpServers)) throw new Error('mcpServers must be a list')
    const entries = parsed.mcpServers.map((entry): ServerEntry => {
      if (!entry || typeof entry !== 'object') return {}
      const value = entry as Record<string, unknown>
      return {
        ...(typeof value.name === 'string' ? { name: value.name } : {}),
        ...(Array.isArray(value.clients)
          ? { clients: value.clients.filter((client): client is string => typeof client === 'string') }
          : {}),
        ...(typeof value.url === 'string' ? { url: value.url } : {}),
        ...(typeof value.command === 'string' ? { command: value.command } : {})
      }
    })
    return { kind: 'valid', entries }
  } catch (error) {
    return { kind: 'invalid', message: error instanceof Error ? error.message : 'unknown parse error' }
  }
}

const parseDeclaredSkills = (configuration: string): string[] => [
  ...new Set([...configuration.matchAll(/^\[(ki-[a-z0-9-]+)]\s*$/gm)].map((match) => match[1] as string))
]

const configuredRuntimes = (configuration: string): string[] => {
  const marker = configuration.search(/^\[ki-repo]\s*$/m)
  if (marker < 0) return []
  const remainder = configuration.slice(marker).replace(/^[^\n]*(?:\n|$)/, '')
  const nextTable = remainder.search(/^\[/m)
  const repoTable = nextTable < 0 ? remainder : remainder.slice(0, nextTable)
  const values = repoTable.match(/^\s*supported_runtimes\s*=\s*\[([^\]]*)]/m)?.[1] ?? ''
  return [...values.matchAll(/["']([^"']+)["']/g)].map((match) => match[1] as string)
}

const repositoryEvidence = (repository: string): BindingRubricContext['repository'] => {
  const path = join(repository, '.ki-config.toml')
  const configuration = physicalFile(path) ? readFileSync(path, 'utf8') : ''
  const declaredSkills = parseDeclaredSkills(configuration)
  const configured = configuredRuntimes(configuration)
  const candidates = [
    { runtime: 'claude-code', root: join(repository, '.claude', 'skills') },
    { runtime: 'codex', root: join(repository, '.agents', 'skills') }
  ]
  const selected = candidates.filter(
    ({ runtime, root }) => configured.includes(runtime) || (configured.length === 0 && physicalDirectory(root))
  )
  const missingSkills = selected.flatMap(({ runtime, root }) =>
    declaredSkills.flatMap((skill) => (existsSync(join(root, skill)) ? [] : [`${runtime}:${skill}`]))
  )
  return {
    path: repository,
    runtimeRoots: selected.map(({ root }) => root),
    declaredSkills,
    missingSkills
  }
}

export const createBindingSession = ({ mode, repository, userHome }: RubricContextOptions): RubricSession<BindingRubricContext> => {
  const project = resolve(repository)
  const home = resolve(userHome)
  const xdgRoot = home === resolve(homedir()) ? process.env.XDG_CONFIG_HOME : undefined
  const canonicalSource = join(xdgRoot ?? join(home, '.config'), 'ki', 'mcp-servers.yaml')
  const projectSource = join(project, '.ki', 'mcps.yaml')
  const sourceOverride = process.env.KI_MCP_SOURCE
  const source = sourceOverride ? resolve(sourceOverride) : ([canonicalSource, projectSource].find(existsSync) ?? canonicalSource)
  const coworkBase = join(home, 'Library', 'Application Support', 'Claude', 'local-agent-mode-sessions')
  const coworkDrafts = findCoworkSettings(coworkBase).map((path) => createCoworkDraft(path, home, mode === 'conform'))
  const surfaces: Surface[] = [
    { token: 'claude-code', label: 'Claude Code', path: join(home, '.claude.json'), format: 'json' },
    {
      token: 'claude-desktop',
      label: 'Claude Desktop',
      path: join(home, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json'),
      format: 'json'
    },
    { token: 'mcporter', label: 'mcporter', path: join(home, '.mcporter', 'mcporter.json'), format: 'json' },
    { token: 'chatgpt-codex', label: 'Codex CLI', path: join(home, '.codex', 'config.toml'), format: 'toml' }
  ]
  const context: BindingRubricContext = {
    source,
    sourceState: readSource(source),
    surfaces: surfaces.map((surface) => ({ surface, serverKeys: surfaceServerKeys(surface) })),
    repository: repositoryEvidence(project),
    cowork: { base: coworkBase, files: coworkDrafts.map((draft) => draft.evidence) }
  }

  return {
    subjects: [{ families: ['BIND'], context: () => context, subject: project }],
    proposal: () => ({
      writes: coworkDrafts.flatMap((draft) => {
        const write = draft.proposal()
        return write ? [write] : []
      })
    })
  }
}
