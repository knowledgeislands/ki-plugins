import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import type { RubricContextOptions, RubricPublicationContext, RubricSession } from '../../shared/rubric.ts'

type CoworkFile = {
  path: string
  subject: string
  status: 'already' | 'pending' | 'unsafe'
  enable?: () => void
  proposal: () => { path: string; content: string } | undefined
}
export type ClaudeBindingContext = {
  rubric: RubricPublicationContext
  codePath: string
  desktopPath: string
  codeServers: ReadonlySet<string> | null
  desktopServers: ReadonlySet<string> | null
  expectedCode: ReadonlySet<string>
  expectedDesktop: ReadonlySet<string>
  coworkBase: string
  cowork: readonly CoworkFile[]
}
const COWORK_MARKETPLACE = 'ki-repo-plugins',
  COWORK_PLUGIN = 'knowledge-islands',
  COWORK_REPO = 'knowledgeislands/ki-plugins'
const physicalFile = (path: string) => existsSync(path) && lstatSync(path).isFile() && !lstatSync(path).isSymbolicLink()
const servers = (path: string): ReadonlySet<string> | null => {
  if (!physicalFile(path)) return null
  try {
    const json = JSON.parse(readFileSync(path, 'utf8')) as { mcpServers?: unknown }
    return json.mcpServers && typeof json.mcpServers === 'object'
      ? new Set(Object.keys(json.mcpServers as Record<string, unknown>))
      : new Set()
  } catch {
    return null
  }
}
declare const Bun: { YAML: { parse(input: string): unknown } }
const expected = (path: string, client: string): ReadonlySet<string> => {
  if (!physicalFile(path)) return new Set()
  try {
    const source = Bun.YAML.parse(readFileSync(path, 'utf8')) as { mcpServers?: unknown }
    return new Set(
      Array.isArray(source?.mcpServers)
        ? source.mcpServers.flatMap((entry) => {
            const value = entry as { name?: unknown; clients?: unknown }
            return typeof value?.name === 'string' && Array.isArray(value.clients) && value.clients.includes(client)
              ? [value.name]
              : []
          })
        : []
    )
  } catch {
    return new Set()
  }
}
const enabled = (json: Record<string, unknown>) =>
  ((json.enabledPlugins ?? {}) as Record<string, unknown>)[`${COWORK_PLUGIN}@${COWORK_MARKETPLACE}`] === true &&
  ((json.extraKnownMarketplaces ?? {}) as Record<string, { source?: { repo?: string } }>)[COWORK_MARKETPLACE]?.source
    ?.repo === COWORK_REPO
const coworkFile = (path: string, home: string, mutable: boolean): CoworkFile => {
  const subject = relative(home, path)
  if (!physicalFile(path)) return { path, subject, status: 'unsafe', proposal: () => undefined }
  let json: Record<string, unknown>
  try {
    json = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>
  } catch {
    return { path, subject, status: 'unsafe', proposal: () => undefined }
  }
  const original = JSON.stringify(json)
  let on = enabled(json)
  const enable = () => {
    if (on) return
    json = {
      ...json,
      enabledPlugins: {
        ...((json.enabledPlugins as Record<string, unknown>) ?? {}),
        [`${COWORK_PLUGIN}@${COWORK_MARKETPLACE}`]: true
      },
      extraKnownMarketplaces: {
        ...((json.extraKnownMarketplaces as Record<string, unknown>) ?? {}),
        [COWORK_MARKETPLACE]: { source: { source: 'github', repo: COWORK_REPO } }
      }
    }
    on = true
  }
  return {
    path,
    subject,
    status: on ? 'already' : 'pending',
    ...(mutable ? { enable } : {}),
    proposal: () =>
      on && original !== JSON.stringify(json)
        ? { path: subject, content: `${JSON.stringify(json, null, 2)}\n` }
        : undefined
  }
}
const find = (directory: string, depth = 0): string[] =>
  !existsSync(directory) || depth > 4
    ? []
    : readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const path = join(directory, entry.name)
        return entry.name === 'cowork_settings.json'
          ? [path]
          : entry.isDirectory() && !entry.isSymbolicLink()
            ? find(path, depth + 1)
            : []
      })
export const createClaudeBindingSession = ({
  mode,
  repository,
  userHome,
  publication
}: RubricContextOptions): RubricSession<ClaudeBindingContext> => {
  const home = resolve(userHome),
    base = join(home, 'Library', 'Application Support', 'Claude', 'local-agent-mode-sessions')
  const source = process.env.KI_MCP_SOURCE
    ? resolve(process.env.KI_MCP_SOURCE)
    : join(home, '.config', 'ki', 'mcp-servers.yaml')
  const context: ClaudeBindingContext = {
    rubric: { publication },
    codePath: join(home, '.claude.json'),
    desktopPath: join(home, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json'),
    codeServers: servers(join(home, '.claude.json')),
    desktopServers: servers(join(home, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json')),
    expectedCode: expected(source, 'claude-code'),
    expectedDesktop: expected(source, 'claude-desktop'),
    coworkBase: base,
    cowork: find(base)
      .sort()
      .map((path) => coworkFile(path, home, mode === 'conform'))
  }
  return {
    subjects: [
      { families: ['CLAUDEBIND'], context: () => context, subject: resolve(repository) },
      { families: ['RUBRIC'], context: () => context, subject: resolve(repository) }
    ],
    proposal: () => ({
      writes: context.cowork.flatMap((file) => {
        const write = file.proposal()
        return write ? [write] : []
      })
    })
  }
}
