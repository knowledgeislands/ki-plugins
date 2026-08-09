import { existsSync, lstatSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import type { RubricContextOptions, RubricPublicationContext, RubricSession } from '../../shared/rubric.ts'

declare const Bun: { YAML: { parse(input: string): unknown } }

export type ServerEntry = { name?: string; clients?: string[]; url?: string; command?: string }
export type SourceState =
  | { kind: 'absent' }
  | { kind: 'invalid'; message: string }
  | { kind: 'valid'; entries: readonly ServerEntry[] }
export type BindingRubricContext = {
  rubric: RubricPublicationContext
  source: string
  sourceState: SourceState
  mcporterServerKeys: ReadonlySet<string> | null
  mcporterPath: string
}

export const RECOGNISED = new Set(['mcporter', 'claude-code', 'claude-desktop', 'chatgpt-codex'])

const physicalFile = (path: string): boolean =>
  existsSync(path) && lstatSync(path).isFile() && !lstatSync(path).isSymbolicLink()

const readSource = (path: string): SourceState => {
  if (!existsSync(path)) return { kind: 'absent' }
  if (!physicalFile(path)) return { kind: 'invalid', message: 'the source is not a physical regular file' }
  try {
    const parsed = Bun.YAML.parse(readFileSync(path, 'utf8')) as { mcpServers?: unknown }
    if (!parsed || !Array.isArray(parsed.mcpServers)) throw new Error('mcpServers must be a list')
    return {
      kind: 'valid',
      entries: parsed.mcpServers.map((entry): ServerEntry => {
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
    }
  } catch (error) {
    return { kind: 'invalid', message: error instanceof Error ? error.message : 'unknown parse error' }
  }
}

const mcporterKeys = (path: string): ReadonlySet<string> | null => {
  if (!physicalFile(path)) return null
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as { mcpServers?: unknown }
    return parsed.mcpServers && typeof parsed.mcpServers === 'object'
      ? new Set(Object.keys(parsed.mcpServers as Record<string, unknown>))
      : new Set()
  } catch {
    return null
  }
}

export const createBindingSession = ({
  repository,
  userHome,
  publication
}: RubricContextOptions): RubricSession<BindingRubricContext> => {
  const project = resolve(repository)
  const home = resolve(userHome)
  const xdgRoot = home === resolve(homedir()) ? process.env.XDG_CONFIG_HOME : undefined
  const canonicalSource = join(xdgRoot ?? join(home, '.config'), 'ki', 'mcp-servers.yaml')
  const override = process.env.KI_MCP_SOURCE
  const source = override ? resolve(override) : canonicalSource
  const mcporterPath = join(home, '.mcporter', 'mcporter.json')
  const context: BindingRubricContext = {
    rubric: { publication },
    source,
    sourceState: readSource(source),
    mcporterPath,
    mcporterServerKeys: mcporterKeys(mcporterPath)
  }
  return {
    subjects: [
      { families: ['BIND'], context: () => context, subject: project },
      { families: ['RUBRIC'], context: () => context, subject: project }
    ],
    proposal: () => ({ writes: [] })
  }
}
