import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import type {
  AuditOutcome,
  RubricContextOptions,
  RubricPublicationContext,
  RubricSession
} from '../../shared/rubric.ts'

const physical = (path: string) => existsSync(path) && !lstatSync(path).isSymbolicLink()
const text = (path: string) => (physical(path) && lstatSync(path).isFile() ? readFileSync(path, 'utf8') : undefined)
const directoryEntries = (path: string) =>
  physical(path) && lstatSync(path).isDirectory()
    ? readdirSync(path, { withFileTypes: true })
        .filter((entry) => !entry.isSymbolicLink())
        .map((entry) => entry.name)
    : []
const json = (path: string): Record<string, unknown> | undefined => {
  try {
    const value = text(path)
    const parsed: unknown = value === undefined ? undefined : JSON.parse(value)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : undefined
  } catch {
    return undefined
  }
}
const estimate = (value: string) => Math.ceil(value.length / 4)
const result = (status: AuditOutcome['status'], message: string, subject?: string): AuditOutcome => ({
  status,
  message,
  ...(subject ? { subject } : {})
})
const contained = (root: string, path: string) => {
  const remainder = relative(root, resolve(path))
  return remainder === '' || (!remainder.startsWith('..') && remainder !== '..')
}
const instructions = (root: string, path: string, seen = new Set<string>()): readonly AuditOutcome[] => {
  const absolute = resolve(path)
  if (!contained(root, absolute) || seen.has(absolute) || !physical(absolute))
    return [result('NOT_APPLICABLE', 'Instruction is absent, outside the selected layer, or symlinked.', path)]
  seen.add(absolute)
  const source = text(absolute) ?? ''
  const values: AuditOutcome[] = [result('PASS', `${path} ~${estimate(source)} tok`, path)]
  for (const found of source.matchAll(/(?:^|\s)@([./][^\s)]*)/g)) {
    const next = resolve(root, found[1] as string)
    if (!contained(root, next) || !physical(next))
      values.push(result('VIOLATION', `Unresolved or out-of-scope @import ${found[1]}`, path))
    else values.push(...instructions(root, next, seen))
  }
  return values
}
const serverNames = (configuration: Record<string, unknown> | undefined) =>
  Object.keys((configuration?.mcpServers as Record<string, unknown> | undefined) ?? {})
const skills = (root: string): number => {
  const directory = join(root, 'skills')
  return physical(directory) && lstatSync(directory).isDirectory()
    ? readdirSync(directory, { withFileTypes: true }).filter(
        (entry) =>
          entry.isDirectory() && !entry.isSymbolicLink() && text(join(directory, entry.name, 'SKILL.md')) !== undefined
      ).length
    : 0
}
export type ClaudeContext = {
  readonly surface: readonly AuditOutcome[]
  readonly models: readonly AuditOutcome[]
  readonly headroom: readonly AuditOutcome[]
}
export type ClaudeRubricContext = { readonly rubric: RubricPublicationContext; readonly claude: ClaudeContext }
export const createClaudeSession = ({
  repository,
  userHome,
  publication
}: RubricContextOptions): RubricSession<ClaudeRubricContext> => {
  const repo = resolve(repository)
  const user = join(resolve(userHome), '.claude')
  const userSettings = json(join(user, 'settings.json'))
  const repoSettings = json(join(repo, '.claude', 'settings.json'))
  const userServers = serverNames(json(join(resolve(userHome), '.claude.json'))).concat(serverNames(userSettings))
  const repoServers = serverNames(json(join(repo, '.mcp.json'))).concat(serverNames(repoSettings))
  const defaultModel = typeof userSettings?.model === 'string' ? userSettings.model : undefined
  const effectiveModel = typeof repoSettings?.model === 'string' ? repoSettings.model : defaultModel
  const allServers = [...userServers, ...repoServers]
  const selectedMemory = join(user, 'projects', repo.replace(/[/.]/g, '-'), 'memory')
  const memoryFiles = directoryEntries(selectedMemory)
  const context: ClaudeRubricContext = {
    rubric: { publication },
    claude: {
      surface: [
        ...instructions(user, join(user, 'CLAUDE.md')),
        ...instructions(repo, join(repo, 'CLAUDE.md')),
        result('INFO', `Selected Claude project memory files: ${memoryFiles.length}.`),
        result(
          'INFO',
          `Installed Claude skills: user ${skills(user)}, selected repository ${skills(join(repo, '.claude'))}.`
        ),
        result('INFO', `Configured Claude MCP servers: ${allServers.length ? allServers.join(', ') : 'none'}.`)
      ],
      models: [
        result(
          'INFO',
          defaultModel ? `Configured user default model: ${defaultModel}.` : 'No configured user default model.'
        ),
        result(
          'INFO',
          effectiveModel
            ? `Effective selected-repository model: ${effectiveModel}.`
            : 'Effective selected-repository model is unavailable.'
        )
      ],
      headroom: [
        result(
          allServers.some((name) => name.toLowerCase() === 'headroom') ? 'PASS' : 'INFO',
          allServers.some((name) => name.toLowerCase() === 'headroom')
            ? 'Headroom MCP presence detected; configuration remains report-only.'
            : 'No documented Headroom MCP entry detected.'
        )
      ]
    }
  }
  return {
    subjects: [
      { families: ['SURF', 'RUN'], subject: repo, context: () => context },
      { families: ['RUBRIC'], subject: repo, context: () => context }
    ],
    proposal: () => ({ writes: [] })
  }
}
