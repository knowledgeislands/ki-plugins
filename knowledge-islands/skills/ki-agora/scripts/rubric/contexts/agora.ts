import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import type {
  AuditOutcome,
  RubricContextOptions,
  RubricPublicationContext,
  RubricSession
} from '../../shared/rubric.ts'

const REPOSITORY = /^https:\/\/github\.com\/[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?\/[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/
const AGORA_ID = /^[a-z][a-z0-9-]*[a-z0-9]$/
const ROLE = /^[a-z][a-z0-9-]*[a-z0-9]$/
const TARGETS = new Set([
  'zed-workspace',
  'vscode-workspace',
  'claude-code-trust',
  'claude-desktop-trust',
  'chatgpt-codex-trust'
])

type AgoraConfiguration = Record<string, unknown>

export type OutcomeContext = {
  readonly outcomes: readonly AuditOutcome[]
}

export type AgoraRubricContext = {
  readonly rubric: RubricPublicationContext
  readonly configuration: OutcomeContext
  readonly memberships: OutcomeContext
}

const table = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null

const pass = (message: string): readonly AuditOutcome[] => [{ status: 'PASS', message }]

const violation = (message: string): AuditOutcome => ({ status: 'VIOLATION', message, subject: '.ki-config.toml' })

const warning = (message: string): AuditOutcome => ({
  status: 'VIOLATION',
  level: 'WARN',
  message,
  subject: '.ki-config.toml'
})

const parsedRepository = (root: string): unknown => {
  const configuration = join(root, '.ki-config.toml')
  if (!existsSync(configuration)) return undefined
  try {
    return table(Bun.TOML.parse(readFileSync(configuration, 'utf8')))?.skills
  } catch {
    return undefined
  }
}

const repositoryIdentity = (root: string): string | undefined => {
  const skills = table(parsedRepository(root))
  const repo = table(skills?.['ki-repo'])
  return typeof repo?.repository === 'string' && REPOSITORY.test(repo.repository) ? repo.repository : undefined
}

const distinctStrings = (value: unknown): value is readonly string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === 'string') && new Set(value).size === value.length

const parseHomes = (value: unknown, local: string | undefined): AuditOutcome[] => {
  const outcomes: AuditOutcome[] = []
  const homes = table(value)
  if (value !== undefined && !homes) return [violation('homes must be a table keyed by Agora identifier')]

  for (const [identifier, rawHome] of Object.entries(homes ?? {})) {
    if (!AGORA_ID.test(identifier))
      outcomes.push(violation(`home ${identifier} must use a stable lower-case hyphenated identifier`))
    const home = table(rawHome)
    if (!home) {
      outcomes.push(violation(`home ${identifier} must be a table`))
      continue
    }
    for (const key of Object.keys(home).filter((key) => !['purpose', 'targets', 'members'].includes(key)))
      outcomes.push(warning(`home ${identifier} has unrecognised key ${key}`))
    if (typeof home.purpose !== 'string' || !home.purpose.trim())
      outcomes.push(violation(`home ${identifier} requires a non-empty purpose`))
    if (!distinctStrings(home.targets) || home.targets.some((target) => !TARGETS.has(target)))
      outcomes.push(
        violation(`home ${identifier} targets must be a duplicate-free array from the target-policy vocabulary`)
      )
    const members = table(home.members)
    if (!members) {
      outcomes.push(violation(`home ${identifier} members must be a repository-to-role table`))
      continue
    }
    for (const [repository, role] of Object.entries(members)) {
      if (!REPOSITORY.test(repository))
        outcomes.push(violation(`home ${identifier} member ${repository} must be a canonical HTTPS GitHub repository`))
      if (repository === local)
        outcomes.push(violation(`home ${identifier} must not list its own repository as a member`))
      if (typeof role !== 'string' || !ROLE.test(role))
        outcomes.push(
          violation(`home ${identifier} member ${repository} role must be a lower-case hyphenated identifier`)
        )
    }
  }
  return outcomes
}

const parseMemberships = (value: unknown): AuditOutcome[] => {
  const outcomes: AuditOutcome[] = []
  const memberships = table(value)
  if (value !== undefined && !memberships) return [violation('memberships must be a table keyed by Agora identifier')]

  for (const [identifier, rawMembership] of Object.entries(memberships ?? {})) {
    if (!AGORA_ID.test(identifier))
      outcomes.push(violation(`membership ${identifier} must use a stable lower-case hyphenated identifier`))
    const membership = table(rawMembership)
    if (!membership) {
      outcomes.push(violation(`membership ${identifier} must be a table`))
      continue
    }
    for (const key of Object.keys(membership).filter((key) => !['home', 'role'].includes(key)))
      outcomes.push(warning(`membership ${identifier} has unrecognised key ${key}`))
    if (typeof membership.home !== 'string' || !REPOSITORY.test(membership.home))
      outcomes.push(violation(`membership ${identifier} home must be a canonical HTTPS GitHub repository`))
    if (typeof membership.role !== 'string' || !ROLE.test(membership.role))
      outcomes.push(violation(`membership ${identifier} role must be a lower-case hyphenated identifier`))
  }
  return outcomes
}

const parseConfiguration = (configuration: Readonly<AgoraConfiguration>, root: string): AgoraRubricContext => {
  const configurationOutcomes: AuditOutcome[] = []
  const membershipsOutcomes: AuditOutcome[] = []
  const local = repositoryIdentity(root)
  if (!local) configurationOutcomes.push(violation('ki-repo repository must be a canonical HTTPS GitHub home'))
  for (const key of Object.keys(configuration).filter((key) => !['homes', 'memberships'].includes(key)))
    configurationOutcomes.push(warning(`unrecognised ki-agora configuration key ${key}`))
  configurationOutcomes.push(...parseHomes(configuration.homes, local))
  membershipsOutcomes.push(...parseMemberships(configuration.memberships))

  return {
    rubric: {},
    configuration: {
      outcomes: configurationOutcomes.length
        ? configurationOutcomes
        : pass('Agora homes use canonical identity, purpose, policy, and approved member shape.')
    },
    memberships: {
      outcomes: membershipsOutcomes.length
        ? membershipsOutcomes
        : pass('Agora memberships use canonical home and role shape.')
    }
  }
}

export const createAgoraSession = ({
  configuration,
  publication,
  repository
}: RubricContextOptions): RubricSession<AgoraRubricContext> => {
  const parsed = parseConfiguration(configuration, resolve(repository))
  const context: AgoraRubricContext = { ...parsed, rubric: { publication } }
  return {
    subjects: [
      { families: ['RUBRIC'], context: () => context },
      { families: ['CONFIG', 'MEMBERSHIP'], context: () => context }
    ],
    proposal: () => ({ writes: [] })
  }
}
