import { existsSync, lstatSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

declare const Bun: { YAML: { parse(input: string): unknown } }

export const CLIENTS = ['mcporter', 'claude-code', 'claude-desktop', 'chatgpt-codex'] as const
export type Client = (typeof CLIENTS)[number]
export type Transport = 'stdio' | 'http' | 'sse' | 'streamable_http'
export type EnvValue = string | { op: string }
export type ServerEntry =
  | {
      name: string
      clients: readonly Client[]
      command: string
      args: readonly string[]
      env: Readonly<Record<string, EnvValue>>
    }
  | { name: string; clients: readonly Client[]; url: string; transports: Readonly<Record<Client, Transport>> }
export type SourceState =
  | { kind: 'absent' }
  | { kind: 'invalid'; message: string }
  | { kind: 'valid'; entries: readonly ServerEntry[] }

const CLIENT_TRANSPORTS: Readonly<Record<Client, readonly Transport[]>> = {
  mcporter: ['http', 'sse'],
  'claude-code': ['http', 'sse'],
  'claude-desktop': ['http', 'sse'],
  'chatgpt-codex': ['streamable_http']
}

export const physicalFile = (path: string): boolean =>
  existsSync(path) && lstatSync(path).isFile() && !lstatSync(path).isSymbolicLink()

export const resolveSource = ({
  home,
  override = process.env.KI_MCP_SOURCE,
  xdg = process.env.XDG_CONFIG_HOME
}: {
  home: string
  override?: string
  xdg?: string
}): string => {
  if (override) return resolve(override)
  return join(xdg && /^\//.test(xdg) ? xdg : join(resolve(home), '.config'), 'ki', 'mcp-servers.yaml')
}

const record = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null

const env = (value: unknown): Readonly<Record<string, EnvValue>> | null => {
  if (value === undefined) return {}
  const entries = record(value)
  if (!entries) return null
  const result: Record<string, EnvValue> = {}
  for (const [key, item] of Object.entries(entries)) {
    const secret = record(item)
    if (typeof item === 'string') result[key] = item
    else if (secret && Object.keys(secret).length === 1 && typeof secret.op === 'string' && secret.op)
      result[key] = { op: secret.op }
    else return null
  }
  return result
}

const parseEntry = (value: unknown, index: number): ServerEntry => {
  const entry = record(value)
  if (!entry) throw new Error(`entry ${index + 1} must be a mapping`)
  const keys = Object.keys(entry)
  if (keys.some((key) => !['name', 'clients', 'command', 'args', 'env', 'url', 'transports'].includes(key)))
    throw new Error(`entry ${index + 1} has an unsupported field`)
  if (typeof entry.name !== 'string' || !entry.name) throw new Error(`entry ${index + 1} has no non-empty name`)
  if (
    !Array.isArray(entry.clients) ||
    !entry.clients.length ||
    !entry.clients.every((client) => CLIENTS.includes(client as Client))
  )
    throw new Error(`entry ${index + 1} has invalid clients`)
  const clients = entry.clients as Client[]
  if (new Set(clients).size !== clients.length) throw new Error(`entry ${index + 1} repeats a client`)
  if ((typeof entry.command === 'string') === (typeof entry.url === 'string'))
    throw new Error(`entry ${index + 1} must define exactly one command or url`)
  if (typeof entry.command === 'string') {
    if (!entry.command || entry.transports !== undefined || entry.url !== undefined)
      throw new Error(`entry ${index + 1} has invalid stdio fields`)
    if (entry.args !== undefined && (!Array.isArray(entry.args) || !entry.args.every((arg) => typeof arg === 'string')))
      throw new Error(`entry ${index + 1} has invalid args`)
    const variables = env(entry.env)
    if (!variables) throw new Error(`entry ${index + 1} has invalid env`)
    return {
      name: entry.name,
      clients,
      command: entry.command,
      args: (entry.args as string[] | undefined) ?? [],
      env: variables
    }
  }
  if (!entry.url || entry.args !== undefined || entry.env !== undefined)
    throw new Error(`entry ${index + 1} has invalid URL fields`)
  const transports = record(entry.transports)
  if (
    !transports ||
    Object.keys(transports).length !== clients.length ||
    clients.some(
      (client) =>
        typeof transports[client] !== 'string' || !CLIENT_TRANSPORTS[client].includes(transports[client] as Transport)
    )
  )
    throw new Error(`entry ${index + 1} must declare one supported transport for each URL client`)
  return { name: entry.name, clients, url: entry.url as string, transports: transports as Record<Client, Transport> }
}

export const readSource = (path: string): SourceState => {
  if (!existsSync(path)) return { kind: 'absent' }
  if (!physicalFile(path)) return { kind: 'invalid', message: 'the source is not a physical regular file' }
  try {
    const parsed = record(Bun.YAML.parse(readFileSync(path, 'utf8')))
    if (!parsed || Object.keys(parsed).some((key) => key !== 'mcpServers') || !Array.isArray(parsed.mcpServers))
      throw new Error('mcpServers must be the only top-level list')
    const entries = parsed.mcpServers.map(parseEntry)
    if (new Set(entries.map(({ name }) => name)).size !== entries.length) throw new Error('server names must be unique')
    return { kind: 'valid', entries }
  } catch (error) {
    return { kind: 'invalid', message: error instanceof Error ? error.message : 'unknown parse error' }
  }
}

export const targeted = (entries: readonly ServerEntry[], client: Client): readonly ServerEntry[] =>
  entries.filter((entry) => entry.clients.includes(client))
