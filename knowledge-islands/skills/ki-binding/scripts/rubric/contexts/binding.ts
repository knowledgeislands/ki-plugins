import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { physicalFile, readSource, resolveSource, type ServerEntry, type SourceState } from '../../shared/binding.ts'
import type { RubricContextOptions, RubricPublicationContext, RubricSession } from '../../shared/rubric.ts'

type McporterDefinition = { command?: string; args?: readonly string[]; url?: string; baseUrl?: string }
export type McporterState =
  | { kind: 'unavailable'; path?: string }
  | { kind: 'invalid'; path: string }
  | { kind: 'valid'; path: string; servers: Readonly<Record<string, McporterDefinition>> }
export type BindingRubricContext = {
  rubric: RubricPublicationContext
  source: string
  sourceState: SourceState
  mcporter: McporterState
}

const mcporter = (): McporterState => {
  const path = process.env.MCPORTER_CONFIG
  if (!path) return { kind: 'unavailable' }
  const resolved = resolve(path)
  if (!physicalFile(resolved)) return { kind: 'unavailable', path: resolved }
  try {
    const parsed = JSON.parse(readFileSync(resolved, 'utf8')) as { mcpServers?: unknown }
    if (!parsed.mcpServers || typeof parsed.mcpServers !== 'object' || Array.isArray(parsed.mcpServers))
      return { kind: 'invalid', path: resolved }
    const servers: Record<string, McporterDefinition> = {}
    for (const [name, value] of Object.entries(parsed.mcpServers as Record<string, unknown>)) {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return { kind: 'invalid', path: resolved }
      const definition = value as Record<string, unknown>
      const url =
        typeof definition.url === 'string'
          ? definition.url
          : typeof definition.baseUrl === 'string'
            ? definition.baseUrl
            : undefined
      if (typeof definition.command === 'string') {
        if (
          url ||
          (definition.args !== undefined &&
            (!Array.isArray(definition.args) || !definition.args.every((arg) => typeof arg === 'string')))
        )
          return { kind: 'invalid', path: resolved }
        servers[name] = { command: definition.command, args: (definition.args as string[] | undefined) ?? [] }
      } else if (url) servers[name] = { url }
      else return { kind: 'invalid', path: resolved }
    }
    return { kind: 'valid', path: resolved, servers }
  } catch {
    return { kind: 'invalid', path: resolved }
  }
}

export const mcporterMatches = (entry: ServerEntry, actual: McporterDefinition | undefined): boolean =>
  'url' in entry
    ? actual?.url === entry.url
    : actual?.command === entry.command && JSON.stringify(actual?.args ?? []) === JSON.stringify(entry.args)

export const createBindingSession = ({
  repository,
  userHome,
  publication
}: RubricContextOptions): RubricSession<BindingRubricContext> => {
  const context: BindingRubricContext = {
    rubric: { publication },
    source: resolveSource({ home: resolve(userHome) }),
    sourceState: readSource(resolveSource({ home: resolve(userHome) })),
    mcporter: mcporter()
  }
  return {
    subjects: [
      { families: ['BIND'], context: () => context, subject: resolve(repository) },
      { families: ['RUBRIC'], context: () => context, subject: resolve(repository) }
    ],
    proposal: () => ({ writes: [] })
  }
}
