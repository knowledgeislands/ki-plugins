import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import type { AuditOutcome, RubricContextOptions, RubricSession } from '../../shared/rubric.ts'

type BudgetKey = 'claude_md' | 'skills_surface' | 'mcp_servers' | 'total'

const BUDGETS: Record<BudgetKey, number> = {
  claude_md: 2500,
  skills_surface: 4000,
  mcp_servers: 5,
  total: 30000
}

const outcome = (status: AuditOutcome['status'], message: string, subject?: string, level?: 'FAIL' | 'WARN'): AuditOutcome =>
  status === 'VIOLATION'
    ? { status, message, ...(subject ? { subject } : {}), ...(level ? { level } : {}) }
    : { status, message, ...(subject ? { subject } : {}) }

const one = (value: AuditOutcome): readonly AuditOutcome[] => [value]
const unavailable = (message: string, subject?: string): readonly AuditOutcome[] => one(outcome('NOT_APPLICABLE', message, subject))

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

const readText = (path: string): string | undefined => (physicalFile(path) ? readFileSync(path, 'utf8') : undefined)

const readJson = (path: string): Record<string, unknown> | undefined => {
  const source = readText(path)
  if (source === undefined) return undefined
  try {
    const value: unknown = JSON.parse(source)
    return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined
  } catch {
    return undefined
  }
}

const approxTokens = (source: string): number => Math.ceil(source.length / 4)
const tokens = (value: number): string => `~${value.toLocaleString('en-US')} tok`

const isContained = (root: string, candidate: string): boolean => {
  const remainder = relative(root, candidate)
  return remainder === '' || (!remainder.startsWith('..') && remainder !== '..')
}

const containedPhysicalFile = (root: string, candidate: string): boolean => {
  if (!isContained(root, candidate) || !physicalDirectory(root)) return false
  let cursor = root
  for (const segment of relative(root, candidate).split(sep).filter(Boolean)) {
    cursor = join(cursor, segment)
    if (!existsSync(cursor) || lstatSync(cursor).isSymbolicLink()) return false
  }
  return physicalFile(candidate)
}

const IMPORT_RE = /(?:^|\s)@(~?[./][^\s)]*)/g
const stripCode = (markdown: string): string => markdown.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '')

const instructionTokens = (
  userHome: string,
  root: string,
  path: string,
  seen = new Set<string>()
): { tokens: number; broken: string[] } => {
  const absolute = resolve(path)
  if (!isContained(root, absolute) || seen.has(absolute)) return { tokens: 0, broken: [] }
  seen.add(absolute)
  const source = readText(absolute)
  if (source === undefined) return { tokens: 0, broken: [] }
  let total = approxTokens(source)
  const broken: string[] = []
  for (const match of stripCode(source).matchAll(IMPORT_RE)) {
    const raw = match[1] as string
    const candidate = raw.startsWith('~/') ? resolve(userHome, raw.slice(2)) : isAbsolute(raw) ? raw : resolve(dirname(absolute), raw)
    if (!containedPhysicalFile(root, candidate)) {
      broken.push(raw)
      continue
    }
    const nested = instructionTokens(userHome, root, candidate, seen)
    total += nested.tokens
    broken.push(...nested.broken)
  }
  return { tokens: total, broken }
}

const skillSurface = (skillsDirectory: string): { count: number; tokens: number } => {
  if (!physicalDirectory(skillsDirectory)) return { count: 0, tokens: 0 }
  let count = 0
  let total = 0
  for (const entry of readdirSync(skillsDirectory, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.isSymbolicLink()) continue
    const source = readText(join(skillsDirectory, entry.name, 'SKILL.md'))
    if (source === undefined) continue
    count++
    const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)
    const block = frontmatter?.[1] ?? ''
    const name = block.match(/^name:(.*)$/m)?.[1]?.trim() ?? ''
    const description = block.match(/^description:\s*([\s\S]*?)(?:\n[A-Za-z0-9_-]+:|$)/m)?.[1] ?? block
    total += approxTokens(name) + approxTokens(description)
  }
  return { count, tokens: total }
}

type McpServer = { readonly name: string; readonly source: string; readonly command: string }

const collectMcp = (source: string, configuration: Record<string, unknown> | undefined): readonly McpServer[] => {
  const servers = configuration?.mcpServers
  if (!servers || typeof servers !== 'object' || Array.isArray(servers)) return []
  return Object.entries(servers as Record<string, unknown>).flatMap(([name, entry]) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return []
    const value = entry as Record<string, unknown>
    const command = [typeof value.command === 'string' ? value.command : '', Array.isArray(value.args) ? value.args.join(' ') : '']
      .join(' ')
      .trim()
    return [{ name, source, command }]
  })
}

const hasHeadroom = (servers: readonly McpServer[], configurations: readonly Record<string, unknown>[]): boolean =>
  servers.some((server) => server.name.toLowerCase() === 'headroom' || /(^|\W)headroom(\W|$)/i.test(server.command)) ||
  configurations.some((configuration) => {
    const env = configuration.env
    return Boolean(env && typeof env === 'object' && !Array.isArray(env) && Object.keys(env).some((key) => key.startsWith('HEADROOM_')))
  })

export type TokenomicsCompositionContext = {
  layers: readonly AuditOutcome[]
  attribution: readonly AuditOutcome[]
}

export type TokenomicsSurfaceContext = {
  instructions: readonly AuditOutcome[]
  memory: readonly AuditOutcome[]
  skills: readonly AuditOutcome[]
}

export type TokenomicsMcpContext = {
  servers: readonly AuditOutcome[]
}

export type TokenomicsBudgetContext = {
  components: readonly AuditOutcome[]
  total: readonly AuditOutcome[]
}

export type TokenomicsRuntimeContext = {
  pinnedModel: readonly AuditOutcome[]
}

export type TokenomicsToolingContext = {
  detected: readonly AuditOutcome[]
  expectation: readonly AuditOutcome[]
  learnedCaptures: readonly AuditOutcome[]
  proxyAttribution: readonly AuditOutcome[]
}

export type TokenomicsConfigContext = {
  validates: readonly AuditOutcome[]
  educationDefaults: readonly AuditOutcome[]
  preferredModelType: readonly AuditOutcome[]
  modelBindings: readonly AuditOutcome[]
}

export type TokenomicsRubricContext = {
  composition: TokenomicsCompositionContext
  surface: TokenomicsSurfaceContext
  mcp: TokenomicsMcpContext
  budgets: TokenomicsBudgetContext
  runtime: TokenomicsRuntimeContext
  tooling: TokenomicsToolingContext
  config: TokenomicsConfigContext
}

export const createTokenomicsSession = ({ userHome }: RubricContextOptions): RubricSession<TokenomicsRubricContext> => {
  const home = resolve(userHome)
  const claude = join(home, '.claude')
  const claudeAvailable = physicalDirectory(claude)
  const settings = claudeAvailable ? readJson(join(claude, 'settings.json')) : undefined
  const desktop = readJson(join(home, '.claude.json'))
  const configurations = [settings, desktop].filter((value): value is Record<string, unknown> => value !== undefined)
  const servers = configurations.flatMap((configuration, index) =>
    collectMcp(index === 0 ? '.claude/settings.json' : '.claude.json', configuration)
  )

  let total = 0
  const instruction = join(claude, 'CLAUDE.md')
  const measuredInstruction =
    claudeAvailable && containedPhysicalFile(claude, instruction) ? instructionTokens(home, claude, instruction) : undefined
  if (measuredInstruction) total += measuredInstruction.tokens
  const instructionEvidence =
    measuredInstruction === undefined
      ? unavailable('No physical user-wide CLAUDE.md is installed.', '.claude/CLAUDE.md')
      : [
          outcome('PASS', `[user] CLAUDE.md ${tokens(measuredInstruction.tokens)}`, '.claude/CLAUDE.md'),
          ...measuredInstruction.broken.map((path) =>
            outcome('VIOLATION', `user CLAUDE.md has an unresolved or out-of-scope @import → "${path}"`, '.claude/CLAUDE.md', 'FAIL')
          )
        ]

  const skills = claudeAvailable ? skillSurface(join(claude, 'skills')) : { count: 0, tokens: 0 }
  total += skills.tokens
  const skillEvidence = skills.count
    ? one(outcome('PASS', `[user] ${skills.count} skill description(s) ${tokens(skills.tokens)}`, '.claude/skills'))
    : unavailable('No physical user-wide Claude skills are installed.', '.claude/skills')

  const componentOverages: AuditOutcome[] = []
  if (measuredInstruction && measuredInstruction.tokens > BUDGETS.claude_md)
    componentOverages.push(
      outcome(
        'VIOLATION',
        `user CLAUDE.md ${tokens(measuredInstruction.tokens)} > budget ${tokens(BUDGETS.claude_md)}`,
        '.claude/CLAUDE.md'
      )
    )
  if (skills.tokens > BUDGETS.skills_surface)
    componentOverages.push(
      outcome('VIOLATION', `user skill descriptions ${tokens(skills.tokens)} > budget ${tokens(BUDGETS.skills_surface)}`, '.claude/skills')
    )
  if (servers.length > BUDGETS.mcp_servers)
    componentOverages.push(outcome('VIOLATION', `${servers.length} user MCP servers > budget ${BUDGETS.mcp_servers}`))

  const pinned = configurations.map((configuration) => configuration.model).find((model): model is string => typeof model === 'string')
  const compression = hasHeadroom(servers, configurations)
  const repositoryUnavailable = 'Repository-selected evidence is unavailable in the bounded user-home session.'
  const context: TokenomicsRubricContext = {
    composition: {
      layers: one(outcome('PASS', `[user] ${claude}; repository layer reported separately as unavailable.`)),
      attribution: one(outcome('PASS', 'All measured standing costs are attributed to the user-wide layer.'))
    },
    surface: {
      instructions: instructionEvidence,
      memory: unavailable(repositoryUnavailable),
      skills: skillEvidence
    },
    mcp: {
      servers: one(
        outcome(
          'PASS',
          servers.length
            ? `${servers.length} user MCP server(s): ${servers.map((server) => server.name).join(', ')}`
            : 'No user MCP servers configured.'
        )
      )
    },
    budgets: {
      components:
        componentOverages.length > 0
          ? componentOverages
          : one(outcome('PASS', 'Measured user-wide components are within their default budgets.')),
      total: one(
        outcome(
          total > BUDGETS.total ? 'VIOLATION' : 'PASS',
          `user-wide standing surface ${tokens(total)} (budget ${tokens(BUDGETS.total)})`
        )
      )
    },
    runtime: {
      pinnedModel: one(outcome('INFO', pinned ? `default user model pinned: ${pinned}` : 'No default user model pinned in settings.'))
    },
    tooling: {
      detected: one(
        outcome(
          compression ? 'PASS' : 'INFO',
          compression ? 'Headroom compression tooling detected in the user layer.' : 'No user-wide compression tooling detected.'
        )
      ),
      expectation: one(
        outcome(
          compression ? 'PASS' : 'VIOLATION',
          compression
            ? 'User-wide compression tooling is present.'
            : 'No user-wide compression layer detected; Headroom is recommended for tool-heavy work.',
          undefined,
          compression ? undefined : 'WARN'
        )
      ),
      learnedCaptures: unavailable(repositoryUnavailable),
      proxyAttribution: unavailable(repositoryUnavailable)
    },
    config: {
      validates: unavailable(repositoryUnavailable, '.ki-config.toml'),
      educationDefaults: unavailable(repositoryUnavailable, '.ki-config.toml'),
      preferredModelType: unavailable(repositoryUnavailable, '.ki-config.toml'),
      modelBindings: unavailable(repositoryUnavailable, '.ki-config.toml')
    }
  }

  return {
    subjects: [
      {
        families: ['COMP', 'SURF', 'MCP', 'BUDG', 'RUN', 'TOOL', 'CFG'],
        subject: '.claude',
        context: () => context
      }
    ],
    proposal: () => ({ writes: [] })
  }
}
