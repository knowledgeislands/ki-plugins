import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs'
import { basename, join, relative, resolve } from 'node:path'
import type { AuditOutcome, ConformWrite, RubricContextOptions, RubricSession, ViolationLevel } from '../../shared/rubric.ts'

const FOCI = ['Active', 'Background', 'Dormant', 'Future', 'Settled'] as const
const STATUS = ['draft', 'ready', 'rejected', 'in-progress', 'rolled-out', 'reviewed', 'completed'] as const
const PRIORITY = ['urgent', 'high', 'medium', 'low'] as const
const SUFFIX = ' Proposal'

export type StreamsEvidence = {
  level: 'FAIL' | 'WARN' | 'INFO' | 'NOT_APPLICABLE' | 'PASS'
  message: string
  subject?: string
}

export type StreamRubricContext = {
  focusFolders: readonly StreamsEvidence[]
  focusIndexes: readonly StreamsEvidence[]
  proposalSuffix: readonly StreamsEvidence[]
}

export type EnactmentRubricContext = {
  proposalFrontmatter: readonly StreamsEvidence[]
  lifecycle: readonly StreamsEvidence[]
  normaliseLifecycle?: () => void
}

export type GateRubricContext = {
  anchor: readonly StreamsEvidence[]
}

export type ConfigRubricContext = {
  knownKeys: readonly StreamsEvidence[]
  noteTypeScheme: readonly StreamsEvidence[]
}

export type StreamsRubricContext = {
  stream: StreamRubricContext
  enactment: EnactmentRubricContext
  gate: GateRubricContext
  config: ConfigRubricContext
}

type ParsedFrontmatter = {
  values: Record<string, string>
  closed: boolean
}

type StreamsConfiguration = {
  keys: Record<string, string>
  ownKeys: readonly string[]
  streams: string
}

type MarkdownDocument = {
  absolutePath: string
  relativePath: string
  content: string
  frontmatter: ParsedFrontmatter | null
}

export const auditEvidence = (
  evidence: readonly StreamsEvidence[],
  defaultLevel: ViolationLevel,
  overrideLevels?: readonly ViolationLevel[]
): readonly AuditOutcome[] =>
  evidence.map((finding): AuditOutcome => {
    if (finding.level === 'FAIL' || finding.level === 'WARN') {
      const level = finding.level
      return {
        status: 'VIOLATION',
        message: finding.message,
        ...(finding.subject ? { subject: finding.subject } : {}),
        ...(level !== defaultLevel && overrideLevels?.includes(level) ? { level } : {})
      }
    }
    return {
      status: finding.level,
      message: finding.message,
      ...(finding.subject ? { subject: finding.subject } : {})
    }
  })

const directory = (path: string): boolean => existsSync(path) && lstatSync(path).isDirectory()
const regularFile = (path: string): boolean => existsSync(path) && lstatSync(path).isFile() && !lstatSync(path).isSymbolicLink()

const directories = (path: string): string[] =>
  directory(path)
    ? readdirSync(path, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
    : []

const markdownPaths = (path: string, values: string[] = []): string[] => {
  for (const entry of directory(path) ? readdirSync(path, { withFileTypes: true }) : []) {
    if (entry.name.startsWith('.')) continue
    const child = join(path, entry.name)
    if (entry.isDirectory()) markdownPaths(child, values)
    else if (entry.isFile() && entry.name.endsWith('.md')) values.push(child)
  }
  return values
}

const parseConfiguration = (text: string): StreamsConfiguration => {
  try {
    const document = Bun.TOML.parse(text) as Record<string, unknown>
    const own = document['ki-kb-streams'] as Record<string, unknown> | undefined
    const kb = document['ki-kb'] as Record<string, unknown> | undefined
    const zones = kb?.zones as Record<string, unknown> | undefined
    return {
      keys: Object.fromEntries(
        Object.entries(own ?? {})
          .filter(([key]) => ['process_note', 'note_type_scheme'].includes(key))
          .map(([key, value]) => [key, String(value)])
      ),
      ownKeys: Object.keys(own ?? {}),
      streams: typeof zones?.Streams === 'string' ? zones.Streams : 'Streams'
    }
  } catch {
    return { keys: {}, ownKeys: [], streams: 'Streams' }
  }
}

const parseFrontmatter = (text: string): ParsedFrontmatter | null => {
  const lines = text.split(/\r?\n/)
  if (lines[0]?.trim() !== '---') return null
  const values: Record<string, string> = {}
  for (let index = 1; index < lines.length; index++) {
    const line = lines[index] as string
    if (line.trim() === '---') return { values, closed: true }
    if (/^\s/.test(line)) continue
    const separator = line.indexOf(':')
    if (separator > 0)
      values[line.slice(0, separator).trim()] = line
        .slice(separator + 1)
        .trim()
        .replace(/^['"]|['"]$/g, '')
  }
  return { values, closed: false }
}

const sample = (values: readonly string[]): string => values.slice(0, 10).join('; ')
const escapeRegularExpression = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const bareToken = (value: string, vocabulary: readonly string[]): string | undefined =>
  vocabulary.includes(value)
    ? undefined
    : vocabulary.find((token) => value.startsWith(token) && /[\s,;.()-]/.test(value.charAt(token.length)))

const proposalDocument = (document: MarkdownDocument): boolean => {
  const values = document.frontmatter?.values
  return (
    basename(document.absolutePath, '.md').endsWith(SUFFIX) ||
    values?.type === 'stream-proposal' ||
    (Boolean(values?.status) && Boolean(values?.priority) && Boolean(values?.dependencies))
  )
}

const normalisedContent = (content: string): string => {
  const lines = content.split('\n')
  let inside = false
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index] as string
    if (index === 0 && line.trim() === '---') {
      inside = true
      continue
    }
    if (inside && line.trim() === '---') break
    const match = inside ? line.match(/^(status|priority):\s*(.+)$/) : null
    if (!match) continue
    const vocabulary = match[1] === 'status' ? STATUS : PRIORITY
    const value = bareToken(match[2] as string, vocabulary)
    if (value) lines[index] = `${match[1]}: ${value}`
  }
  return lines.join('\n')
}

const unavailableContext = (level: 'FAIL' | 'NOT_APPLICABLE', message: string, subject?: string): StreamsRubricContext => {
  const evidence: StreamsEvidence = { level, message, ...(subject ? { subject } : {}) }
  const notApplicable: StreamsEvidence[] = [{ level: 'NOT_APPLICABLE', message: 'Streams evidence is unavailable.' }]
  return {
    stream: { focusFolders: [evidence], focusIndexes: notApplicable, proposalSuffix: notApplicable },
    enactment: { proposalFrontmatter: notApplicable, lifecycle: notApplicable },
    gate: { anchor: notApplicable },
    config: { knownKeys: notApplicable, noteTypeScheme: notApplicable }
  }
}

export const createStreamsSession = ({ mode, repository }: RubricContextOptions): RubricSession<StreamsRubricContext> => {
  const root = resolve(repository)
  if (!directory(root)) {
    const context = unavailableContext('FAIL', 'Target is not a directory.', root)
    return {
      subjects: [{ families: ['STREAM', 'ENACT', 'GATE', 'CONFIG'], context: () => context }],
      proposal: () => ({ writes: [] })
    }
  }

  const configPath = join(root, '.ki-config.toml')
  const configuration = parseConfiguration(regularFile(configPath) ? readFileSync(configPath, 'utf8') : '')
  const streamsPath = join(root, configuration.streams)
  if (!directory(streamsPath)) {
    const context = unavailableContext('NOT_APPLICABLE', `No ${configuration.streams}/ zone; its presence is owned by ki-kb.`)
    return {
      subjects: [{ families: ['STREAM', 'ENACT', 'GATE', 'CONFIG'], context: () => context }],
      proposal: () => ({ writes: [] })
    }
  }

  const documents: MarkdownDocument[] = markdownPaths(streamsPath).map((absolutePath) => {
    const content = readFileSync(absolutePath, 'utf8')
    return {
      absolutePath,
      relativePath: relative(root, absolutePath),
      content,
      frontmatter: parseFrontmatter(content)
    }
  })
  const proposals = documents.filter(proposalDocument)
  const originals = new Map(proposals.map((document) => [document.relativePath, document.content]))
  const drafts = new Map(originals)
  const present = directories(streamsPath)
  const foci = FOCI.filter((focus) => present.includes(focus))
  const stray = present.filter((name) => !FOCI.includes(name as (typeof FOCI)[number]))
  const focusFolders: StreamsEvidence[] = [
    {
      level: stray.length ? 'WARN' : 'PASS',
      message: stray.length ? `Non-Focus folders: ${sample(stray)}.` : 'All direct folders are Focus folders.',
      subject: configuration.streams
    }
  ]
  const focusIndexes: StreamsEvidence[] =
    foci.length === 0
      ? [{ level: 'NOT_APPLICABLE', message: 'No Focus folders are present.' }]
      : foci.map((focus) => {
          const path = join(streamsPath, focus, `${focus}.md`)
          return {
            level: regularFile(path) ? 'PASS' : 'WARN',
            message: regularFile(path) ? 'Focus index is present.' : 'Focus index is missing.',
            subject: `${configuration.streams}/${focus}/${focus}.md`
          }
        })
  const suffixDrift = proposals.flatMap((document) => {
    const expected = basename(document.absolutePath, '.md')
    const values = document.frontmatter?.values
    const problems = [
      expected.endsWith(SUFFIX) ? '' : 'filename',
      new RegExp(`^#\\s+${escapeRegularExpression(expected)}\\s*$`, 'm').test(document.content) ? '' : 'H1',
      values?.title === expected ? '' : 'title'
    ].filter(Boolean)
    return problems.length ? [`${document.relativePath} (${problems.join(', ')})`] : []
  })
  const proposalSuffix: StreamsEvidence[] = [
    {
      level: suffixDrift.length ? 'WARN' : proposals.length ? 'PASS' : 'NOT_APPLICABLE',
      message: suffixDrift.length
        ? `Proposal suffix drift: ${sample(suffixDrift)}.`
        : proposals.length
          ? 'Proposal filenames, headings, and titles carry the Proposal suffix.'
          : 'No full proposals are present.'
    }
  ]
  const malformed: string[] = []
  const missing: string[] = []
  const badStatus: string[] = []
  const badPriority: string[] = []
  for (const document of proposals) {
    const frontmatter = document.frontmatter
    if (!frontmatter?.closed) {
      malformed.push(document.relativePath)
      continue
    }
    for (const key of ['status', 'priority', 'dependencies'])
      if (!(key in frontmatter.values)) missing.push(`${document.relativePath} (${key})`)
    if (frontmatter.values.status && !STATUS.includes(frontmatter.values.status as (typeof STATUS)[number]))
      badStatus.push(document.relativePath)
    if (frontmatter.values.priority && !PRIORITY.includes(frontmatter.values.priority as (typeof PRIORITY)[number]))
      badPriority.push(document.relativePath)
  }
  const proposalFrontmatter: StreamsEvidence[] = [
    {
      level: malformed.length ? 'FAIL' : missing.length ? 'WARN' : proposals.length ? 'PASS' : 'NOT_APPLICABLE',
      message: malformed.length
        ? `Malformed proposal frontmatter: ${sample(malformed)}.`
        : missing.length
          ? `Missing proposal frontmatter: ${sample(missing)}.`
          : proposals.length
            ? 'Proposal frontmatter is complete.'
            : 'No full proposals are present.'
    }
  ]
  const lifecycle: StreamsEvidence[] = [
    {
      level: badStatus.length || badPriority.length ? 'WARN' : proposals.length ? 'PASS' : 'NOT_APPLICABLE',
      message:
        badStatus.length || badPriority.length
          ? `Non-lifecycle status or priority: ${sample([...badStatus, ...badPriority])}.`
          : proposals.length
            ? 'Proposal status and priority use bare lifecycle tokens.'
            : 'No full proposals are present.'
    }
  ]
  const anchorFiles = ['CLAUDE.md', 'AGENTS.md'].filter((name) => regularFile(join(root, name)))
  const anchored = anchorFiles.some((name) => {
    const content = readFileSync(join(root, name), 'utf8')
    return /Enactment Process|ki-kb-streams/i.test(content) && /proposal|canonical/i.test(content)
  })
  const anchor: StreamsEvidence[] = [
    {
      level: proposals.length === 0 ? 'NOT_APPLICABLE' : anchored ? 'PASS' : 'WARN',
      message:
        proposals.length === 0
          ? 'No proposals yet; the gate is not required.'
          : anchored
            ? 'Enactment gate is anchored.'
            : 'Enactment gate is not anchored in root CLAUDE.md or AGENTS.md.',
      ...(anchorFiles.length ? { subject: anchorFiles.join(', ') } : {})
    }
  ]
  const unknownKeys = configuration.ownKeys.filter((key) => !['process_note', 'note_type_scheme'].includes(key))
  const knownKeys: StreamsEvidence[] = [
    {
      level: unknownKeys.length ? 'WARN' : 'PASS',
      message: unknownKeys.length
        ? `Unrecognised ki-kb-streams key(s): ${unknownKeys.join(', ')}.`
        : 'Only recognised ki-kb-streams keys are present.',
      subject: '.ki-config.toml'
    }
  ]
  const scheme = configuration.keys.note_type_scheme
  const noteTypeScheme: StreamsEvidence[] = [
    {
      level: scheme && !['type', 'tags'].includes(scheme) ? 'WARN' : 'PASS',
      message:
        scheme && !['type', 'tags'].includes(scheme) ? `Invalid note_type_scheme: ${scheme}.` : 'Note type scheme is canonical or absent.',
      subject: '.ki-config.toml'
    }
  ]
  const mutable = mode === 'conform'
  const context: StreamsRubricContext = {
    stream: { focusFolders, focusIndexes, proposalSuffix },
    enactment: {
      proposalFrontmatter,
      lifecycle,
      ...(mutable
        ? {
            normaliseLifecycle: () => {
              for (const [path, content] of drafts) drafts.set(path, normalisedContent(content))
            }
          }
        : {})
    },
    gate: { anchor },
    config: { knownKeys, noteTypeScheme }
  }

  return {
    subjects: [{ families: ['STREAM', 'ENACT', 'GATE', 'CONFIG'], context: () => context }],
    proposal: () => {
      const writes: ConformWrite[] = []
      for (const [path, content] of drafts) {
        if (content !== originals.get(path)) writes.push({ path, content })
      }
      return { writes }
    }
  }
}
