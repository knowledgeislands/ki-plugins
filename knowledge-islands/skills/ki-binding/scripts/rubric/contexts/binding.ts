import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  type Lifecycle,
  physicalFile,
  readSource,
  resolveSource,
  type ServerEntry,
  type SourceState
} from '../../shared/binding.ts'
import type { RubricContextOptions, RubricPublicationContext, RubricSession } from '../../shared/rubric.ts'

type McporterDefinition = {
  command?: string
  args?: readonly string[]
  url?: string
  baseUrl?: string
  headers?: Readonly<Record<string, string>>
  lifecycle?: Lifecycle
}
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
      if (definition.lifecycle !== undefined && !['ephemeral', 'keep-alive'].includes(definition.lifecycle as string))
        return { kind: 'invalid', path: resolved }
      const lifecycle = definition.lifecycle as Lifecycle | undefined
      const headers = definition.headers
      if (
        headers !== undefined &&
        (!headers ||
          typeof headers !== 'object' ||
          Array.isArray(headers) ||
          !Object.values(headers).every((value) => typeof value === 'string'))
      )
        return { kind: 'invalid', path: resolved }
      if (typeof definition.command === 'string') {
        if (
          url ||
          (definition.args !== undefined &&
            (!Array.isArray(definition.args) || !definition.args.every((arg) => typeof arg === 'string')))
        )
          return { kind: 'invalid', path: resolved }
        servers[name] = {
          command: definition.command,
          args: (definition.args as string[] | undefined) ?? [],
          ...(lifecycle ? { lifecycle } : {})
        }
      } else if (url)
        servers[name] = {
          url,
          ...(headers ? { headers: headers as Record<string, string> } : {}),
          ...(lifecycle ? { lifecycle } : {})
        }
      else return { kind: 'invalid', path: resolved }
    }
    return { kind: 'valid', path: resolved, servers }
  } catch {
    return { kind: 'invalid', path: resolved }
  }
}

const secretAwareValuesMatch = (
  expected: Readonly<Record<string, string | { op: string }>>,
  actual: Readonly<Record<string, string>> | undefined
): boolean =>
  Object.keys(actual ?? {}).length === Object.keys(expected).length &&
  Object.entries(expected).every(([key, value]) =>
    typeof value === 'string' ? actual?.[key] === value : typeof actual?.[key] === 'string' && Boolean(actual[key])
  )

export const mcporterMatches = (entry: ServerEntry, actual: McporterDefinition | undefined): boolean => {
  const lifecycleMatches = entry.lifecycle === undefined || actual?.lifecycle === entry.lifecycle
  return 'url' in entry
    ? actual?.url === entry.url && lifecycleMatches && secretAwareValuesMatch(entry.headers ?? {}, actual?.headers)
    : actual?.command === entry.command &&
        JSON.stringify(actual?.args ?? []) === JSON.stringify(entry.args) &&
        lifecycleMatches
}

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
