import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import {
  physicalFile,
  readSource,
  resolveSource,
  type ServerEntry,
  type SourceState,
  targeted
} from '../../shared/binding.ts'
import type { RubricContextOptions, RubricPublicationContext, RubricSession } from '../../shared/rubric.ts'

type ClaudeTarget =
  | { kind: 'unavailable'; path: string }
  | { kind: 'invalid'; path: string }
  | { kind: 'valid'; path: string; servers: Readonly<Record<string, Record<string, unknown>>> }
type CoworkFile = { path: string; subject: string; status: 'already' | 'pending' | 'unsafe' }
export type ClaudeBindingContext = {
  rubric: RubricPublicationContext
  source: string
  sourceState: SourceState
  code: ClaudeTarget
  desktop: ClaudeTarget
  coworkBase: string
  cowork: readonly CoworkFile[]
}

const COWORK_MARKETPLACE = 'ki-repo-plugins',
  COWORK_PLUGIN = 'knowledge-islands',
  COWORK_REPO = 'knowledgeislands/ki-plugins'
const target = (path: string): ClaudeTarget => {
  if (!physicalFile(path)) return { kind: 'unavailable', path }
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as { mcpServers?: unknown }
    if (!parsed.mcpServers || typeof parsed.mcpServers !== 'object' || Array.isArray(parsed.mcpServers))
      return { kind: 'invalid', path }
    const servers: Record<string, Record<string, unknown>> = {}
    for (const [name, value] of Object.entries(parsed.mcpServers as Record<string, unknown>)) {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return { kind: 'invalid', path }
      servers[name] = value as Record<string, unknown>
    }
    return { kind: 'valid', path, servers }
  } catch {
    return { kind: 'invalid', path }
  }
}
const same = (entry: ServerEntry, actual: Record<string, unknown> | undefined): boolean => {
  if (!actual) return false
  if ('url' in entry) return actual.type === entry.transports['claude-code'] && actual.url === entry.url
  return (
    actual.type === 'stdio' &&
    actual.command === entry.command &&
    JSON.stringify(actual.args ?? []) === JSON.stringify(entry.args) &&
    JSON.stringify(actual.env ?? {}) === JSON.stringify(entry.env)
  )
}
const enabled = (json: Record<string, unknown>) =>
  ((json.enabledPlugins ?? {}) as Record<string, unknown>)[`${COWORK_PLUGIN}@${COWORK_MARKETPLACE}`] === true &&
  ((json.extraKnownMarketplaces ?? {}) as Record<string, { source?: { repo?: string } }>)[COWORK_MARKETPLACE]?.source
    ?.repo === COWORK_REPO
const coworkFile = (path: string, home: string): CoworkFile => {
  const subject = relative(home, path)
  if (!physicalFile(path)) return { path, subject, status: 'unsafe' }
  try {
    return {
      path,
      subject,
      status: enabled(JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>) ? 'already' : 'pending'
    }
  } catch {
    return { path, subject, status: 'unsafe' }
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
  repository,
  userHome,
  publication
}: RubricContextOptions): RubricSession<ClaudeBindingContext> => {
  const home = resolve(userHome),
    source = resolveSource({ home }),
    base = join(home, 'Library', 'Application Support', 'Claude', 'local-agent-mode-sessions')
  const context: ClaudeBindingContext = {
    rubric: { publication },
    source,
    sourceState: readSource(source),
    code: target(join(home, '.claude.json')),
    desktop: target(join(home, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json')),
    coworkBase: base,
    cowork: find(base)
      .sort()
      .map((path) => coworkFile(path, home))
  }
  return {
    subjects: [
      { families: ['CLAUDEBIND'], context: () => context, subject: resolve(repository) },
      { families: ['RUBRIC'], context: () => context, subject: resolve(repository) }
    ],
    proposal: () => ({ writes: [] })
  }
}
export const targetMatches = (
  sourceState: SourceState,
  client: 'claude-code' | 'claude-desktop',
  targetState: ClaudeTarget
): ReturnType<typeof targeted> | null =>
  sourceState.kind === 'valid' && targetState.kind === 'valid'
    ? targeted(sourceState.entries, client).filter((entry) => !same(entry, targetState.servers[entry.name]))
    : null
