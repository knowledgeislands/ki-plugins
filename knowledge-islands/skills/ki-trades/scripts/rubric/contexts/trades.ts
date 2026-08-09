import { existsSync, lstatSync, readdirSync, readFileSync, realpathSync } from 'node:fs'
import { isAbsolute, join, relative, resolve, sep } from 'node:path'
import type {
  AuditOutcome,
  ConformWrite,
  RubricContextOptions,
  RubricPublicationContext,
  RubricSession
} from '../../shared/rubric.ts'

const CONFIG_TABLE = 'ki-trades'
const REPOSITORY_TABLE = 'ki-repo'
const IDENTITY = /^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?\/[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/
const REPOSITORY = /^https:\/\/github\.com\/([a-z0-9](?:[a-z0-9._-]*[a-z0-9])?)\/([a-z0-9](?:[a-z0-9._-]*[a-z0-9])?)$/
const PARTNER = /^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?\/[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/
const TRADE_ID = /^TRD-[0-9a-f]{8}$/
const UTC_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
const FULL_COMMIT = /^[0-9a-f]{40}$/
const TRADE_KINDS = ['work', 'knowledge'] as const
const OBSERVATION_POLICIES = ['unattended', 'receipt', 'decision', 'completion'] as const
const DECISION_STATUSES = [
  'unconsidered',
  'in_progress',
  'parked',
  'clarify',
  'applied',
  'adopted',
  'retained',
  'declined',
  'superseded'
] as const
const TERMINAL_DECISION_STATUSES = new Set<DecisionStatus>(['applied', 'adopted', 'retained', 'declined', 'superseded'])
const SENDER_FIELDS = ['id', 'title', 'created_at', 'sender', 'receiver', 'kind', 'source_ref', 'observation'] as const
const RECEIVER_FIELDS = [
  'decision_status',
  'received_from_ref',
  'reviewed_at',
  'rationale',
  'applied_commit',
  'adopted_as',
  'retained_as',
  'superseded_by'
] as const
const PHASES = ['preparing', 'submitted', 'received'] as const
const ALLOWED_SENDER_FIELDS = new Set<string>([...SENDER_FIELDS, 'phase'])
const ALLOWED_INBOUND_FIELDS = new Set<string>([...SENDER_FIELDS, 'phase', ...RECEIVER_FIELDS])
const PREPARATIONS_DIRECTORY = '-/_TRADES/_PREPARATIONS'
// Looser than ki-change-management-roadmap's four: a trade lands alone in another repository, where the title
// carries the whole meaning to a reader with none of the surrounding item context.
const TITLE_WORD_LIMIT = 6

const TRADE_READMES = [
  {
    path: '+/_TRADES/README.md',
    content: `# Incoming trades

This directory holds receiver-owned copies of active cross-repository work and knowledge trades, grouped by the sender's canonical \`owner/repo\` identity.

Only this repository may change receiver-local receipt evidence, decision status, rationale, or disposition linkage. The raw sender projection remains unchanged. An inbound copy records receipt only; prune it only after an observation-policy-eligible sender release is observable.
`
  },
  {
    path: '-/_TRADES/README.md',
    content: `# Outgoing trades

This directory holds sender-owned cross-repository work and knowledge preparations and submitted trades, grouped by the receiver's canonical \`owner/repo\` identity. A record's own \`phase\` field carries its state: a mutable preparation declares \`phase: preparing\`, and submission rewrites that field to \`phase: submitted\` in place and freezes the record.

Only this repository writes or removes these records. A submitted trade's observation policy determines whether receipt, a terminal decision, or completion of adopted local work permits release.

An outbound record may await the receiver's \`ki-trades\` participation and matching import declaration. It remains sender-owned until an inbound copy is observable.
`
  }
] as const

type DecisionStatus = (typeof DECISION_STATUSES)[number]
type TradeKind = (typeof TRADE_KINDS)[number]
type ObservationPolicy = (typeof OBSERVATION_POLICIES)[number]
type Direction = 'preparation' | 'inbound' | 'outbound'

type TradeConfiguration = {
  readonly repository?: string
  readonly identity?: string
  readonly exportsTo: Readonly<Record<TradeKind, readonly string[]>>
  readonly importsFrom: Readonly<Record<TradeKind, readonly string[]>>
  readonly participates: boolean
  readonly valid: boolean
}

type TradeRecord = {
  readonly direction: Direction
  readonly path: string
  readonly peer?: string
  readonly id?: string
  readonly decisionStatus?: DecisionStatus
  readonly observation?: ObservationPolicy
  readonly kind?: TradeKind
  readonly fields: Readonly<Record<string, unknown>>
  readonly body: string
  readonly rawSenderProjection: string
}

type RegisteredRepository = {
  readonly root: string
  readonly configuration: TradeConfiguration
}

export type OutcomeContext = {
  readonly outcomes: readonly AuditOutcome[]
}

export type RecordsContext = OutcomeContext & {
  readonly phaseOutcomes: readonly AuditOutcome[]
  readonly titleOutcomes: readonly AuditOutcome[]
}

export type ScaffoldContext = OutcomeContext & {
  readonly ensureScaffold?: () => void
}

export type TradeJudgmentContext = Record<never, never>

export type TradesRubricContext = {
  readonly rubric: RubricPublicationContext
  readonly configuration: OutcomeContext
  readonly routes: OutcomeContext
  readonly scaffold: ScaffoldContext
  readonly records: RecordsContext
  readonly authority: OutcomeContext
  readonly status: OutcomeContext
  readonly release: OutcomeContext
  readonly judgment: TradeJudgmentContext
}

const table = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null

const physicalDirectory = (path: string): boolean => {
  if (!existsSync(path)) return false
  const state = lstatSync(path)
  return state.isDirectory() && !state.isSymbolicLink()
}

const physicalFile = (path: string): boolean => {
  if (!existsSync(path)) return false
  const state = lstatSync(path)
  return state.isFile() && !state.isSymbolicLink()
}

const containedPhysical = (root: string, path: string, kind: 'file' | 'directory'): boolean => {
  const remainder = relative(root, path)
  if (isAbsolute(remainder) || remainder === '..' || remainder.startsWith('../') || !physicalDirectory(root))
    return false
  let cursor = root
  for (const segment of remainder.split(sep).filter(Boolean)) {
    cursor = join(cursor, segment)
    if (!existsSync(cursor) || lstatSync(cursor).isSymbolicLink()) return false
  }
  return kind === 'file' ? physicalFile(path) : physicalDirectory(path)
}

const pass = (message: string): readonly AuditOutcome[] => [{ status: 'PASS', message }]

const repositoryIdentity = (repository: unknown): { repository?: string; identity?: string } => {
  if (typeof repository !== 'string') return {}
  const match = repository.match(REPOSITORY)
  return match ? { repository, identity: `${match[1]}/${match[2]}` } : {}
}

const parseConfiguration = (
  value: Readonly<Record<string, unknown>>,
  repository: unknown,
  subject: string
): { configuration: TradeConfiguration; outcomes: AuditOutcome[] } => {
  const outcomes: AuditOutcome[] = []
  const unknown = Object.keys(value).filter((key) => key !== 'routes')
  for (const key of unknown)
    outcomes.push({
      status: 'VIOLATION',
      level: 'WARN',
      message: `unrecognised ki-trades configuration key ${key}`,
      subject
    })

  const local = repositoryIdentity(repository)
  if (!local.repository || !local.identity)
    outcomes.push({ status: 'VIOLATION', message: 'ki-repo repository must be a canonical HTTPS GitHub home', subject })

  // Routes are declared partner-first — one table per peer, keyed by `owner/name` — while the
  // rest of this skill reasons kind-first. Partner keys are unique by TOML's own prohibition on
  // defining a key twice, and ordering is immaterial to a map, so neither is re-checked here; both
  // were hand-written requirements the old direction-first arrays needed and this shape supersedes.
  const partnerRepository = (partner: string): string | undefined => {
    if (REPOSITORY.test(partner)) return partner
    const home = `https://github.com/${partner}`
    return PARTNER.test(partner) && REPOSITORY.test(home) ? home : undefined
  }

  const exportsTo: Record<TradeKind, string[]> = { work: [], knowledge: [] }
  const importsFrom: Record<TradeKind, string[]> = { work: [], knowledge: [] }
  const declared = table(value.routes)
  if (value.routes !== undefined && !declared)
    outcomes.push({ status: 'VIOLATION', message: 'routes must be a table of trade partners', subject })

  for (const [partner, route] of Object.entries(declared ?? {})) {
    const home = partnerRepository(partner)
    if (!home) {
      outcomes.push({
        status: 'VIOLATION',
        message: `route ${partner} must be keyed by owner/name or a canonical HTTPS GitHub repository URL`,
        subject
      })
      continue
    }
    if (home === local.repository)
      outcomes.push({ status: 'VIOLATION', message: `route ${partner} must not name the local repository`, subject })

    const directions = table(route)
    if (!directions) {
      outcomes.push({
        status: 'VIOLATION',
        message: `route ${partner} must be a table declaring export and import kinds`,
        subject
      })
      continue
    }
    for (const key of Object.keys(directions).filter((key) => key !== 'export' && key !== 'import'))
      outcomes.push({
        status: 'VIOLATION',
        level: 'WARN',
        message: `unrecognised route direction ${key} for ${partner}`,
        subject
      })

    for (const [direction, target] of [
      ['export', exportsTo],
      ['import', importsFrom]
    ] as const) {
      const values = directions[direction]
      if (values === undefined) continue
      if (!Array.isArray(values) || values.some((kind) => typeof kind !== 'string')) {
        outcomes.push({
          status: 'VIOLATION',
          message: `route ${partner} ${direction} must be an array of trade kinds`,
          subject
        })
        continue
      }
      const kinds = values as string[]
      if (kinds.length === 0)
        outcomes.push({
          status: 'VIOLATION',
          message: `route ${partner} ${direction} carries no kinds and must be omitted rather than empty`,
          subject
        })
      if (new Set(kinds).size !== kinds.length)
        outcomes.push({ status: 'VIOLATION', message: `route ${partner} ${direction} must not repeat a kind`, subject })
      for (const kind of kinds) {
        if (!TRADE_KINDS.includes(kind as TradeKind)) {
          outcomes.push({
            status: 'VIOLATION',
            message: `route ${partner} ${direction} kind ${kind} is not a declared trade kind`,
            subject
          })
          continue
        }
        target[kind as TradeKind].push(home)
      }
    }
  }
  for (const kind of TRADE_KINDS) {
    exportsTo[kind].sort((left, right) => left.localeCompare(right))
    importsFrom[kind].sort((left, right) => left.localeCompare(right))
  }

  return {
    configuration: {
      ...local,
      exportsTo,
      importsFrom,
      participates: true,
      valid: outcomes.every((outcome) => outcome.status !== 'VIOLATION' || outcome.level === 'WARN')
    },
    outcomes
  }
}

const parseRepositoryConfiguration = (root: string): TradeConfiguration => {
  const path = join(root, '.ki-config.toml')
  if (!containedPhysical(root, path, 'file'))
    return {
      exportsTo: { work: [], knowledge: [] },
      importsFrom: { work: [], knowledge: [] },
      participates: false,
      valid: false
    }
  try {
    const document = Bun.TOML.parse(readFileSync(path, 'utf8')) as Record<string, unknown>
    const skills = table(document.skills) ?? {}
    const owned = table(skills[CONFIG_TABLE])
    const repository = table(skills[REPOSITORY_TABLE])?.repository
    if (!owned)
      return {
        ...repositoryIdentity(repository),
        exportsTo: { work: [], knowledge: [] },
        importsFrom: { work: [], knowledge: [] },
        participates: false,
        valid: false
      }
    return parseConfiguration(owned, repository, path).configuration
  } catch {
    return {
      exportsTo: { work: [], knowledge: [] },
      importsFrom: { work: [], knowledge: [] },
      participates: true,
      valid: false
    }
  }
}

const registryPath = (userHome: string): string => {
  const conventional = join(userHome, '.config', 'ki', 'config.toml')
  if (physicalFile(conventional)) return conventional
  if (process.env.KI_CONFIG_HOME) return join(resolve(process.env.KI_CONFIG_HOME), 'config.toml')
  if (process.env.XDG_CONFIG_HOME) return join(resolve(process.env.XDG_CONFIG_HOME), 'ki', 'config.toml')
  return conventional
}

const registeredRepositories = (userHome: string): readonly RegisteredRepository[] => {
  const path = registryPath(userHome)
  if (!physicalFile(path)) return []
  try {
    const document = Bun.TOML.parse(readFileSync(path, 'utf8')) as Record<string, unknown>
    const repositories = table(document.repositories)
    const paths = Array.isArray(repositories?.paths) ? repositories.paths : []
    return paths
      .filter((entry): entry is string => typeof entry === 'string' && isAbsolute(entry) && physicalDirectory(entry))
      .map((root) => ({ root: realpathSync(root), configuration: parseRepositoryConfiguration(realpathSync(root)) }))
  } catch {
    return []
  }
}

const routeEvidence = (
  root: string,
  userHome: string,
  local: TradeConfiguration
): { outcomes: readonly AuditOutcome[]; active: ReadonlyMap<string, RegisteredRepository> } => {
  if (!local.valid || !local.identity || !local.repository)
    return {
      outcomes: [
        { status: 'NOT_APPLICABLE', message: 'trade routes require a valid local ki-repo repository identity' }
      ],
      active: new Map()
    }
  if (TRADE_KINDS.every((kind) => local.exportsTo[kind].length === 0 && local.importsFrom[kind].length === 0))
    return { outcomes: pass('No trade routes are declared.'), active: new Map() }

  const registered = registeredRepositories(userHome)
  const active = new Map<string, RegisteredRepository>()
  const outcomes: AuditOutcome[] = []
  const physicalRoot = realpathSync(root)
  if (!registered.some((candidate) => candidate.root === physicalRoot)) {
    outcomes.push({
      status: 'VIOLATION',
      message: `local repository ${local.identity} is not present in the KI repository registry`,
      subject: local.identity
    })
  }

  const validateRoute = (peer: string, direction: 'export' | 'import', kind: TradeKind): void => {
    const matches = registered.filter((candidate) => candidate.configuration.repository === peer)
    const otherParty = direction === 'export' ? 'receiver' : 'sender'
    if (matches.length === 0) {
      outcomes.push({
        status: 'INFO',
        message: `declared ${direction} route ${peer} awaits ${otherParty} registration`,
        subject: peer
      })
      return
    }
    if (matches.length > 1) {
      outcomes.push({
        status: 'VIOLATION',
        message: `declared ${direction} route ${peer} is ambiguous across ${matches.length} registered repositories`,
        subject: peer
      })
      return
    }
    const [candidate] = matches
    if (!candidate?.configuration.participates) {
      outcomes.push({
        status: 'INFO',
        message: `declared ${direction} route ${peer} awaits ${otherParty} ki-trades participation`,
        subject: peer
      })
      return
    }
    if (!candidate.configuration.valid) {
      outcomes.push({
        status: 'VIOLATION',
        message: `registered route endpoint ${peer} has malformed ki-trades configuration`,
        subject: peer
      })
      return
    }
    const reciprocal =
      direction === 'export' ? candidate.configuration.importsFrom[kind] : candidate.configuration.exportsTo[kind]
    if (!reciprocal.includes(local.repository ?? '')) {
      outcomes.push({
        status: 'INFO',
        message: `declared ${direction} route ${peer} awaits matching ${otherParty} declaration`,
        subject: peer
      })
      return
    }
    if (candidate.configuration.identity) active.set(`${kind}:${candidate.configuration.identity}`, candidate)
    outcomes.push({
      status: 'PASS',
      message: `${kind} ${direction} trade route ${local.repository} ${direction === 'export' ? '→' : '←'} ${peer} is active`,
      subject: peer
    })
  }
  for (const kind of TRADE_KINDS) {
    for (const peer of local.exportsTo[kind]) validateRoute(peer, 'export', kind)
    for (const peer of local.importsFrom[kind]) validateRoute(peer, 'import', kind)
  }
  return { outcomes, active }
}

const readMarkdownFiles = (root: string, directory: string): readonly string[] => {
  const path = join(root, directory)
  if (!containedPhysical(root, path, 'directory')) return []
  const files: string[] = []
  const visit = (current: string): void => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const path = join(current, entry.name)
      if (entry.isSymbolicLink()) continue
      if (entry.isDirectory()) visit(path)
      else if (entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'README.md')
        files.push(relative(root, path))
    }
  }
  visit(path)
  return files.sort((left, right) => left.localeCompare(right))
}

/** `phase` states the copy's own lifecycle, so both copies drop it before the immutable sender projection is compared. */
/**
 * Compare sender projections by meaning rather than by byte, so a formatter run over a
 * record is not reported as tampering while any change to its words still is. A formatter
 * may rewrap prose, reindent, and requote a scalar without altering what the record says,
 * so frontmatter values are unquoted and all whitespace is collapsed before comparing.
 */
const comparableProjection = (projection: string): string => {
  const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/u.exec(projection)
  if (!match) return projection.replace(/\s+/gu, ' ').trim()
  const frontmatter = (match[1] as string)
    .split('\n')
    .map((line) => {
      const field = /^([A-Za-z][A-Za-z0-9_]*):\s*(.*)$/u.exec(line)
      if (!field) return line.trim()
      const value = (field[2] as string).trim().replace(/^(['"])([\s\S]*)\1$/u, '$2')
      return `${field[1]}: ${value}`
    })
    .join('\n')
  return `${frontmatter}\n${match[2] as string}`.replace(/\s+/gu, ' ').trim()
}

const stripCopyLocalFields = (frontmatter: string, inbound: boolean): string =>
  frontmatter
    .split('\n')
    .filter((line) => {
      const key = line.match(/^([A-Za-z][A-Za-z0-9_]*):/)?.[1]
      if (!key) return true
      if (key === 'phase') return false
      return !inbound || !RECEIVER_FIELDS.includes(key as (typeof RECEIVER_FIELDS)[number])
    })
    .join('\n')

const declaredPhase = (root: string, path: string): string | undefined => {
  const absolute = join(root, path)
  if (!containedPhysical(root, absolute, 'file')) return undefined
  const frontmatter = readFileSync(absolute, 'utf8').match(/^---\n([\s\S]*?)\n---\n/)?.[1]
  if (!frontmatter) return undefined
  try {
    const phase = table(Bun.YAML.parse(frontmatter))?.phase
    return typeof phase === 'string' ? phase : undefined
  } catch {
    return undefined
  }
}

type RecordChannels = {
  readonly records: AuditOutcome[]
  readonly phase: AuditOutcome[]
  readonly title: AuditOutcome[]
}

const emptyChannels = (): RecordChannels => ({ records: [], phase: [], title: [] })

const parseRecord = (root: string, path: string, direction: Direction, channels: RecordChannels): TradeRecord => {
  const outcomes = channels.records
  const absolute = join(root, path)
  const source = containedPhysical(root, absolute, 'file') ? readFileSync(absolute, 'utf8') : ''
  const match = source.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) {
    outcomes.push({
      status: 'VIOLATION',
      message: 'trade record must have YAML frontmatter and a Markdown payload',
      subject: path
    })
    return { direction, path, fields: {}, body: '', rawSenderProjection: source }
  }

  let fields: Record<string, unknown> = {}
  try {
    fields = table(Bun.YAML.parse(match[1] ?? '')) ?? {}
  } catch {
    outcomes.push({ status: 'VIOLATION', message: 'trade frontmatter must be valid YAML', subject: path })
  }
  const frontmatter = match[1] ?? ''
  const body = match[2] ?? ''
  const relativeTrades = path.replace(/^.*?_TRADES\//, '')
  const segments = relativeTrades.split('/')
  const peer = segments.length === 3 ? `${segments[0]}/${segments[1]}` : undefined
  const filename = segments.at(-1) ?? ''
  const id = typeof fields.id === 'string' ? fields.id : undefined

  if (!peer || !IDENTITY.test(peer))
    outcomes.push({
      status: 'VIOLATION',
      message: 'record path must use exactly two canonical owner/repo peer directories',
      subject: path
    })
  if (!id || !TRADE_ID.test(id))
    outcomes.push({
      status: 'VIOLATION',
      message: 'id must use canonical TRD plus eight lower-case hexadecimal characters',
      subject: path
    })
  if (id && filename !== `${id}.md`)
    outcomes.push({
      status: 'VIOLATION',
      message: 'filename must exactly repeat the frontmatter trade id',
      subject: path
    })
  const allowedFields = direction === 'inbound' ? ALLOWED_INBOUND_FIELDS : ALLOWED_SENDER_FIELDS
  for (const key of Object.keys(fields).filter((key) => !allowedFields.has(key)))
    outcomes.push({
      status: 'VIOLATION',
      message: `frontmatter key ${key} is outside the trade record contract`,
      subject: path
    })
  for (const key of SENDER_FIELDS)
    if (typeof fields[key] !== 'string' || !fields[key])
      outcomes.push({ status: 'VIOLATION', message: `${key} must be a non-empty sender field`, subject: path })

  const expectedPhase = direction === 'preparation' ? 'preparing' : direction === 'outbound' ? 'submitted' : 'received'
  if (typeof fields.phase !== 'string' || !PHASES.includes(fields.phase as (typeof PHASES)[number]))
    channels.phase.push({
      status: 'VIOLATION',
      message: `phase must be one of ${PHASES.join(', ')}`,
      subject: path
    })
  else if (fields.phase !== expectedPhase)
    channels.phase.push({
      status: 'VIOLATION',
      message: `${direction === 'preparation' ? 'a' : 'an'} ${direction} record must declare phase: ${expectedPhase}`,
      subject: path
    })
  // The cap binds only while the record is still the sender's to change. A submitted or
  // received copy is immutable evidence, so enforcing it there would demand the very
  // rewrite AUTH-1 exists to detect.
  if (direction === 'preparation' && typeof fields.title === 'string') {
    const words = fields.title.trim().split(/\s+/u).filter(Boolean).length
    if (words > TITLE_WORD_LIMIT)
      channels.title.push({
        status: 'VIOLATION',
        message: `title must be at most ${TITLE_WORD_LIMIT} words; this one has ${words}`,
        subject: path
      })
  }
  if (typeof fields.created_at === 'string' && !UTC_TIMESTAMP.test(fields.created_at))
    outcomes.push({
      status: 'VIOLATION',
      message: 'created_at must be a UTC YYYY-MM-DDTHH:MM:SSZ timestamp',
      subject: path
    })
  if (typeof fields.sender === 'string' && !IDENTITY.test(fields.sender))
    outcomes.push({ status: 'VIOLATION', message: 'sender must be a canonical owner/repo identity', subject: path })
  if (typeof fields.receiver === 'string' && !IDENTITY.test(fields.receiver))
    outcomes.push({ status: 'VIOLATION', message: 'receiver must be a canonical owner/repo identity', subject: path })
  if (typeof fields.kind !== 'string' || !TRADE_KINDS.includes(fields.kind as TradeKind))
    outcomes.push({ status: 'VIOLATION', message: `kind must be one of ${TRADE_KINDS.join(', ')}`, subject: path })
  if (
    fields.observation !== undefined &&
    (typeof fields.observation !== 'string' || !OBSERVATION_POLICIES.includes(fields.observation as ObservationPolicy))
  )
    outcomes.push({
      status: 'VIOLATION',
      message: `observation must be one of ${OBSERVATION_POLICIES.join(', ')}`,
      subject: path
    })

  const expectedH1 = id && typeof fields.title === 'string' ? `# ${id}: ${fields.title}` : ''
  const content = body.replace(/^(?:\r?\n)+/, '')
  if (!expectedH1 || content.split('\n')[0] !== expectedH1)
    outcomes.push({ status: 'VIOLATION', message: 'H1 must exactly repeat the trade id and title', subject: path })
  for (const heading of ['Context', 'Submission', 'Constraints']) {
    const section = body.match(new RegExp(`(?:^|\\n)## ${heading}\\n\\n([\\s\\S]*?)(?=\\n## |$)`))
    if (!section?.[1]?.trim())
      outcomes.push({
        status: 'VIOLATION',
        message: `payload section ${heading} is required and non-empty`,
        subject: path
      })
  }

  const rawDecisionStatus = fields.decision_status
  const decisionStatus =
    typeof rawDecisionStatus === 'string' && DECISION_STATUSES.includes(rawDecisionStatus as DecisionStatus)
      ? (rawDecisionStatus as DecisionStatus)
      : undefined
  const rawObservation = fields.observation
  const observation =
    typeof rawObservation === 'string' && OBSERVATION_POLICIES.includes(rawObservation as ObservationPolicy)
      ? (rawObservation as ObservationPolicy)
      : undefined
  const rawKind = fields.kind
  const kind =
    typeof rawKind === 'string' && TRADE_KINDS.includes(rawKind as TradeKind) ? (rawKind as TradeKind) : undefined
  const senderFrontmatter = stripCopyLocalFields(frontmatter, direction === 'inbound')
  return {
    direction,
    path,
    ...(peer ? { peer } : {}),
    ...(id ? { id } : {}),
    ...(decisionStatus ? { decisionStatus } : {}),
    ...(observation ? { observation } : {}),
    ...(kind ? { kind } : {}),
    fields,
    body,
    rawSenderProjection: `---\n${senderFrontmatter}\n---\n${body}`
  }
}

const remoteRecord = (root: string, path: string, direction: Direction): TradeRecord | undefined => {
  if (!containedPhysical(root, join(root, path), 'file')) return undefined
  return parseRecord(root, path, direction, emptyChannels())
}

const linkedWorkIsDone = (root: string, identity: unknown): boolean => {
  if (typeof identity !== 'string' || !identity) return false
  for (const directory of ['docs/roadmap', 'Streams']) {
    for (const path of readMarkdownFiles(root, directory)) {
      const source = readFileSync(join(root, path), 'utf8')
      const frontmatter = source.match(/^---\n([\s\S]*?)\n---\n/)?.[1]
      if (!frontmatter) continue
      try {
        const fields = table(Bun.YAML.parse(frontmatter))
        if (fields?.id === identity && fields.status === 'done') return true
      } catch {}
    }
  }
  return false
}

const releaseEligible = (record: TradeRecord, receiptVisible: boolean, receiverRoot: string): boolean => {
  if (!record.observation) return false
  if (record.observation === 'unattended' || record.observation === 'receipt') return receiptVisible
  if (!record.decisionStatus || !TERMINAL_DECISION_STATUSES.has(record.decisionStatus)) return false
  if (record.observation === 'decision') return true
  if (record.decisionStatus === 'applied' || record.decisionStatus === 'retained') return true
  if (record.decisionStatus === 'declined' || record.decisionStatus === 'superseded') return true
  return record.decisionStatus === 'adopted' && linkedWorkIsDone(receiverRoot, record.fields.adopted_as)
}

const recordEvidence = (
  root: string,
  local: TradeConfiguration,
  active: ReadonlyMap<string, RegisteredRepository>
): {
  records: AuditOutcome[]
  phase: AuditOutcome[]
  title: AuditOutcome[]
  authority: AuditOutcome[]
  status: AuditOutcome[]
  release: AuditOutcome[]
} => {
  const channels = emptyChannels()
  const records = channels.records
  const authority: AuditOutcome[] = []
  const status: AuditOutcome[] = []
  const release: AuditOutcome[] = []
  if (containedPhysical(root, join(root, PREPARATIONS_DIRECTORY), 'directory'))
    channels.phase.push({
      status: 'VIOLATION',
      message: `the reserved ${PREPARATIONS_DIRECTORY}/ directory is retired; a preparation shares the submitted record peer path and declares phase: preparing`,
      subject: `${PREPARATIONS_DIRECTORY}/`
    })
  const parsed = [
    ...readMarkdownFiles(root, '+/_TRADES').map((path) => parseRecord(root, path, 'inbound', channels)),
    ...readMarkdownFiles(root, '-/_TRADES').map((path) =>
      parseRecord(root, path, declaredPhase(root, path) === 'preparing' ? 'preparation' : 'outbound', channels)
    )
  ]
  const seen = new Map<string, string>()

  for (const record of parsed) {
    if (record.id) {
      const previous = seen.get(record.id)
      if (previous)
        records.push({
          status: 'VIOLATION',
          message: `${record.id} repeats the record identity already used by ${previous}`,
          subject: record.path
        })
      else seen.set(record.id, record.path)
    }
    if (!local.identity || !record.peer || !record.id || !record.kind) continue
    const expectedLocal = record.direction === 'inbound' ? record.fields.receiver : record.fields.sender
    const expectedPeer = record.direction === 'inbound' ? record.fields.sender : record.fields.receiver
    if (expectedLocal !== local.identity)
      authority.push({
        status: 'VIOLATION',
        message: `${record.direction} record local identity does not match ${local.identity}`,
        subject: record.path
      })
    if (expectedPeer !== record.peer)
      authority.push({
        status: 'VIOLATION',
        message: `${record.direction} record peer identity does not match its two-level path`,
        subject: record.path
      })
    const permitted = record.direction === 'inbound' ? local.importsFrom[record.kind] : local.exportsTo[record.kind]
    const peerRepository = `https://github.com/${record.peer}`
    if (!permitted.includes(peerRepository)) {
      authority.push({
        status: 'VIOLATION',
        message: `${record.kind} ${record.direction} record has no declared local directional trade route to ${record.peer}`,
        subject: record.path
      })
      continue
    }

    const peer = active.get(`${record.kind}:${record.peer}`)
    if (record.direction === 'inbound' && !peer) {
      authority.push({
        status: 'VIOLATION',
        message: `inbound record has no active reciprocal route to ${record.peer}`,
        subject: record.path
      })
      continue
    }

    if (record.direction === 'preparation') {
      for (const field of RECEIVER_FIELDS)
        if (record.fields[field] !== undefined)
          authority.push({
            status: 'VIOLATION',
            message: `sender-owned preparation must not set receiver-local field ${field}`,
            subject: record.path
          })
      continue
    }

    if (record.direction === 'outbound') {
      for (const field of RECEIVER_FIELDS)
        if (record.fields[field] !== undefined)
          authority.push({
            status: 'VIOLATION',
            message: `sender-owned outbound record must not set receiver-local field ${field}`,
            subject: record.path
          })
    } else {
      if (!record.decisionStatus)
        status.push({
          status: 'VIOLATION',
          message: `decision_status must be one of ${DECISION_STATUSES.join(', ')}`,
          subject: record.path
        })
      if (
        record.fields.received_from_ref !== undefined &&
        (typeof record.fields.received_from_ref !== 'string' || !FULL_COMMIT.test(record.fields.received_from_ref))
      )
        status.push({
          status: 'VIOLATION',
          message: 'received_from_ref must be a full 40-character lower-case hexadecimal commit',
          subject: record.path
        })
      if (typeof record.fields.reviewed_at === 'string' && !UTC_TIMESTAMP.test(record.fields.reviewed_at))
        status.push({
          status: 'VIOLATION',
          message: 'reviewed_at must be a UTC YYYY-MM-DDTHH:MM:SSZ timestamp',
          subject: record.path
        })
      if (
        record.decisionStatus &&
        ['parked', 'clarify', 'declined', 'superseded'].includes(record.decisionStatus) &&
        typeof record.fields.rationale !== 'string'
      )
        status.push({
          status: 'VIOLATION',
          message: `${record.decisionStatus} requires receiver-local rationale`,
          subject: record.path
        })
      if (record.decisionStatus === 'adopted' && typeof record.fields.adopted_as !== 'string')
        status.push({
          status: 'VIOLATION',
          message: 'adopted requires receiver-local adopted_as linkage',
          subject: record.path
        })
      if (
        record.decisionStatus === 'applied' &&
        (typeof record.fields.applied_commit !== 'string' || !FULL_COMMIT.test(record.fields.applied_commit))
      )
        status.push({
          status: 'VIOLATION',
          message: 'applied requires a full verified local applied_commit',
          subject: record.path
        })
      if (record.decisionStatus === 'applied' && record.kind !== 'work')
        status.push({ status: 'VIOLATION', message: 'applied is valid only for work trades', subject: record.path })
      if (record.decisionStatus === 'adopted' && record.kind !== 'work')
        status.push({ status: 'VIOLATION', message: 'adopted is valid only for work trades', subject: record.path })
      if (record.decisionStatus === 'retained' && record.kind !== 'knowledge')
        status.push({
          status: 'VIOLATION',
          message: 'retained is valid only for knowledge trades',
          subject: record.path
        })
      if (record.decisionStatus === 'retained' && typeof record.fields.retained_as !== 'string')
        status.push({
          status: 'VIOLATION',
          message: 'retained requires receiver-local retained_as linkage',
          subject: record.path
        })
      if (record.decisionStatus !== 'adopted' && record.fields.adopted_as !== undefined)
        status.push({
          status: 'VIOLATION',
          message: 'adopted_as is valid only for adopted status',
          subject: record.path
        })
      if (record.decisionStatus !== 'applied' && record.fields.applied_commit !== undefined)
        status.push({
          status: 'VIOLATION',
          message: 'applied_commit is valid only for applied status',
          subject: record.path
        })
      if (record.decisionStatus !== 'retained' && record.fields.retained_as !== undefined)
        status.push({
          status: 'VIOLATION',
          message: 'retained_as is valid only for retained status',
          subject: record.path
        })
      if (record.decisionStatus === 'superseded' && typeof record.fields.superseded_by !== 'string')
        status.push({
          status: 'VIOLATION',
          message: 'superseded requires receiver-local superseded_by linkage',
          subject: record.path
        })
      if (record.decisionStatus !== 'superseded' && record.fields.superseded_by !== undefined)
        status.push({
          status: 'VIOLATION',
          message: 'superseded_by is valid only for superseded status',
          subject: record.path
        })
    }

    const counterpartPath =
      record.direction === 'inbound'
        ? join('-/_TRADES', ...local.identity.split('/'), `${record.id}.md`)
        : join('+/_TRADES', ...local.identity.split('/'), `${record.id}.md`)
    const counterpart = peer
      ? remoteRecord(peer.root, counterpartPath, record.direction === 'inbound' ? 'outbound' : 'inbound')
      : undefined
    // Only an inbound copy makes a claim about someone else's bytes. An outbound record
    // without a counterpart is simply awaiting receipt, which RELEASE already reports.
    if (record.direction === 'inbound' && !counterpart)
      authority.push({
        status: 'INFO',
        message: peer
          ? 'sender projection is unverifiable: the counterpart copy is gone, as after a sender release'
          : 'sender projection is unverifiable: no registered peer holds the counterpart copy',
        subject: record.path
      })
    else if (
      counterpart &&
      comparableProjection(counterpart.rawSenderProjection) !== comparableProjection(record.rawSenderProjection)
    )
      authority.push({
        status: 'VIOLATION',
        message: 'sender projection differs in meaning between outbound and inbound copies',
        subject: record.path
      })

    if (record.direction === 'inbound') {
      if (counterpart) {
        if (releaseEligible(record, true, root))
          release.push({
            status: 'INFO',
            message: `${record.observation} observation policy permits sender release`,
            subject: record.path
          })
        else
          release.push({
            status: 'PASS',
            message: `${record.observation ?? 'invalid'} observation policy requires sender retention`,
            subject: record.path
          })
      } else if (releaseEligible(record, true, root)) {
        release.push({
          status: 'INFO',
          message: 'eligible sender release is observable; receiver may prune this inbound copy',
          subject: record.path
        })
      } else {
        release.push({
          status: 'VIOLATION',
          message: `sender released its outbound copy before satisfying the ${record.observation ?? 'invalid'} observation policy`,
          subject: record.path
        })
      }
    } else if (!counterpart) {
      release.push({
        status: 'PASS',
        message: 'receiver has not created an inbound copy; sender retains the outbound record',
        subject: record.path
      })
    } else if (releaseEligible(counterpart, true, peer?.root ?? root)) {
      release.push({
        status: 'INFO',
        message: `${counterpart.observation} observation policy permits sender release`,
        subject: record.path
      })
    } else {
      release.push({
        status: 'PASS',
        message: `${counterpart.observation ?? 'invalid'} observation policy requires sender retention`,
        subject: record.path
      })
    }
  }

  return { records, phase: channels.phase, title: channels.title, authority, status, release }
}

const scaffoldEvidence = (root: string): readonly AuditOutcome[] => {
  const outcomes: AuditOutcome[] = []
  for (const readme of TRADE_READMES) {
    const directory = join(root, readme.path, '..')
    const path = join(root, readme.path)
    if (!containedPhysical(root, directory, 'directory'))
      outcomes.push({
        status: 'VIOLATION',
        message: `${relative(root, directory)}/ is absent or unsafe`,
        subject: readme.path
      })
    else if (!containedPhysical(root, path, 'file'))
      outcomes.push({ status: 'VIOLATION', message: `${readme.path} is absent or unsafe`, subject: readme.path })
    else if (readFileSync(path, 'utf8') !== readme.content)
      outcomes.push({
        status: 'VIOLATION',
        message: `${readme.path} differs from the canonical ki-trades orientation`,
        subject: readme.path
      })
  }
  return outcomes
}

const canConformScaffold = (root: string): boolean =>
  ['+', '-'].every((directory) => containedPhysical(root, join(root, directory), 'directory')) &&
  TRADE_READMES.every((readme) => {
    const directory = join(root, readme.path, '..')
    const path = join(root, readme.path)
    return (!existsSync(directory) || physicalDirectory(directory)) && (!existsSync(path) || physicalFile(path))
  })

export const createTradesSession = ({
  mode,
  repository,
  userHome,
  configuration,
  publication
}: RubricContextOptions): RubricSession<TradesRubricContext> => {
  const root = resolve(repository)
  const parsedConfiguration = parseConfiguration(
    configuration,
    parseRepositoryConfiguration(root).repository,
    '.ki-config.toml'
  )
  const routes = routeEvidence(root, userHome, parsedConfiguration.configuration)
  const evidence = recordEvidence(root, parsedConfiguration.configuration, routes.active)
  let scaffoldRequested = false
  const context: TradesRubricContext = {
    rubric: { publication },
    configuration: {
      outcomes: parsedConfiguration.outcomes.length
        ? parsedConfiguration.outcomes
        : pass('Trade route declarations are canonical.')
    },
    routes: { outcomes: routes.outcomes },
    scaffold: {
      outcomes: scaffoldEvidence(root).length
        ? scaffoldEvidence(root)
        : pass('Owned trade scaffold is present and conformed.'),
      ...(mode === 'conform' && canConformScaffold(root) ? { ensureScaffold: () => (scaffoldRequested = true) } : {})
    },
    records: {
      outcomes: evidence.records.length ? evidence.records : pass('Trade record identity and payload shape are valid.'),
      phaseOutcomes: evidence.phase.length
        ? evidence.phase
        : pass('Every trade record declares the phase its copy holds.'),
      titleOutcomes: evidence.title.length ? evidence.title : pass('Every preparation title is within the word limit.')
    },
    authority: {
      outcomes: evidence.authority.length
        ? evidence.authority
        : pass('Trade records preserve sender and receiver write boundaries.')
    },
    status: {
      outcomes: evidence.status.length
        ? evidence.status
        : pass('Receiver decision statuses and local linkage are valid.')
    },
    release: {
      outcomes: evidence.release.length
        ? evidence.release
        : pass('No trade release or pruning violation is observable.')
    },
    judgment: {}
  }

  return {
    subjects: [
      { families: ['RUBRIC'], context: () => context },
      {
        families: ['CONFIG', 'ROUTE', 'SCAFFOLD', 'RECORD', 'AUTH', 'STATUS', 'RELEASE', 'ADOPTION'],
        context: () => context
      }
    ],
    proposal: () => {
      const writes: ConformWrite[] = []
      if (scaffoldRequested) {
        for (const readme of TRADE_READMES) {
          const path = join(root, readme.path)
          if (containedPhysical(root, path, 'file') && readFileSync(path, 'utf8') === readme.content) continue
          writes.push({ path: readme.path, content: readme.content, ...(!existsSync(path) ? { create: true } : {}) })
        }
      }
      return { writes }
    }
  }
}

export const tradeReadmes = TRADE_READMES
