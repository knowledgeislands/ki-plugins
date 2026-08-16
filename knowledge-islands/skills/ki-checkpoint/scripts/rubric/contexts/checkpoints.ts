import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs'
import { basename, extname, join, relative, resolve } from 'node:path'
import type {
  AuditOutcome,
  RubricContextOptions,
  RubricPublicationContext,
  RubricSession
} from '../../shared/rubric.ts'

const CONFIG_TABLE = 'ki-checkpoint'
const ACTIVE_FIELDS = ['type', 'thread', 'state', 'created_at', 'updated_at'] as const
const RETIRED_FIELDS = [...ACTIVE_FIELDS, 'retired_at'] as const
const UTC_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const OPAQUE_SESSION_NAME = /^(?:sess(?:ion)?|conversation)[_-][a-z0-9]{12,}$/i
const FORBIDDEN_KEY = /^(?:claude_|codex_)?(?:session|conversation|transcript)(?:_id|_url|_ref)?$/i
const TRANSCRIPT_LINE = /^(?:user|assistant|human|agent):\s+\S/im
const SESSION_CONTINUITY =
  /\b(?:resume|reopen|reattach|reconnect|authenticate|connect)\b[^\n.]{0,60}\b(?:conversation|session)\b/i
const SESSION_LOCATOR =
  /\b(?:https?:\/\/\S*(?:conversation|session)\S*|(?:claude|codex)[_-]?(?:session|conversation)[_-]?[a-z0-9-]{8,})\b/i
const HEADINGS = [
  'Objective',
  'Current state',
  'Decisions made',
  'Files touched',
  'Open questions',
  'Next step'
] as const

type CheckpointState = 'active' | 'retired'

type ParsedCheckpoint = {
  readonly path: string
  readonly location: CheckpointState
  readonly stem: string
  readonly fields: Readonly<Record<string, unknown>> | null
  readonly body: string
}

export type OutcomeContext = { readonly outcomes: readonly AuditOutcome[] }
export type RecordContext = { readonly identity: readonly AuditOutcome[]; readonly schema: readonly AuditOutcome[] }
export type LifecycleContext = { readonly mechanical: readonly AuditOutcome[] }

export type CheckpointsRubricContext = {
  readonly rubric: RubricPublicationContext
  readonly configuration: OutcomeContext
  readonly structure: OutcomeContext
  readonly records: RecordContext
  readonly lifecycle: LifecycleContext
  readonly boundary: OutcomeContext
}

const table = (value: unknown): Readonly<Record<string, unknown>> | null =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Readonly<Record<string, unknown>>) : null

const physicalDirectory = (path: string): boolean =>
  existsSync(path) && !lstatSync(path).isSymbolicLink() && lstatSync(path).isDirectory()

const one = (outcomes: readonly AuditOutcome[], pass: string, absent?: string): readonly AuditOutcome[] => {
  if (absent) return [{ status: 'NOT_APPLICABLE', message: absent }]
  return outcomes.length > 0 ? outcomes : [{ status: 'PASS', message: pass }]
}

const parseCheckpoint = (path: string, location: CheckpointState, root: string): ParsedCheckpoint => {
  const text = readFileSync(path, 'utf8')
  const lines = text.split(/\r?\n/)
  let fields: Readonly<Record<string, unknown>> | null = null
  let body = text
  if (lines[0]?.trim() === '---') {
    const closing = lines.findIndex((line, index) => index > 0 && line.trim() === '---')
    if (closing > 0) {
      try {
        fields = table(Bun.YAML.parse(lines.slice(1, closing).join('\n')))
      } catch {
        fields = null
      }
      body = lines.slice(closing + 1).join('\n')
    }
  }
  return { path: relative(root, path), location, stem: basename(path, '.md'), fields, body }
}

const inspectDirectory = (
  directory: string,
  location: CheckpointState,
  root: string
): { records: ParsedCheckpoint[]; violations: AuditOutcome[] } => {
  const records: ParsedCheckpoint[] = []
  const violations: AuditOutcome[] = []
  for (const entry of readdirSync(directory, { withFileTypes: true }).sort((left, right) =>
    left.name.localeCompare(right.name)
  )) {
    if (location === 'active' && entry.name === '_RETIRED' && entry.isDirectory() && !entry.isSymbolicLink()) continue
    const path = join(directory, entry.name)
    if (!entry.isFile() || entry.isSymbolicLink() || extname(entry.name) !== '.md') {
      violations.push({
        status: 'VIOLATION',
        message: `${location} checkpoint scope permits only flat regular Markdown records${location === 'active' ? ' and the _RETIRED directory' : ''}`,
        subject: relative(root, path)
      })
      continue
    }
    records.push(parseCheckpoint(path, location, root))
  }
  return { records, violations }
}

const validTimestamp = (value: unknown): value is string =>
  typeof value === 'string' && UTC_TIMESTAMP.test(value) && !Number.isNaN(Date.parse(value))

const recordEvidence = (
  records: readonly ParsedCheckpoint[],
  absent?: string
): {
  identity: readonly AuditOutcome[]
  schema: readonly AuditOutcome[]
  lifecycle: readonly AuditOutcome[]
  boundary: readonly AuditOutcome[]
} => {
  if (absent) {
    const outcome = [{ status: 'NOT_APPLICABLE' as const, message: absent }]
    return { identity: outcome, schema: outcome, lifecycle: outcome, boundary: outcome }
  }
  const identity: AuditOutcome[] = []
  const schema: AuditOutcome[] = []
  const lifecycle: AuditOutcome[] = []
  const boundary: AuditOutcome[] = []
  const activeThreads = new Set<string>()
  const retiredThreads = new Set<string>()

  for (const record of records) {
    const fields = record.fields
    const thread = fields?.thread
    if (!fields) {
      schema.push({
        status: 'VIOLATION',
        message: 'checkpoint frontmatter must be a valid YAML mapping',
        subject: record.path
      })
      continue
    }

    if (!record.stem || record.stem === '.' || record.stem === '..')
      identity.push({
        status: 'VIOLATION',
        message: 'checkpoint filename must provide a non-empty portable thread name',
        subject: record.path
      })
    if (UUID.test(record.stem) || OPAQUE_SESSION_NAME.test(record.stem))
      identity.push({
        status: 'VIOLATION',
        message: 'checkpoint filename appears to encode an opaque runtime-session identifier',
        subject: record.path
      })
    if (typeof thread !== 'string' || thread.length === 0 || thread !== record.stem)
      identity.push({
        status: 'VIOLATION',
        message: 'thread must exactly match the checkpoint filename stem',
        subject: record.path
      })

    const headings = [...record.body.matchAll(/^(#{1,6})\s+(.+?)\s*$/gm)].map((match) => ({
      level: match[1]?.length ?? 0,
      title: match[2] ?? ''
    }))
    const expected = [{ level: 1, title: record.stem }, ...HEADINGS.map((title) => ({ level: 2, title }))]
    if (JSON.stringify(headings) !== JSON.stringify(expected))
      schema.push({
        status: 'VIOLATION',
        message: 'checkpoint headings must be the exact H1 and ordered six-section sequence',
        subject: record.path
      })

    for (const [index, heading] of HEADINGS.entries()) {
      const start = `## ${heading}`
      const sectionStart = record.body.indexOf(start)
      const next = HEADINGS[index + 1]
      const sectionEnd = next ? record.body.indexOf(`## ${next}`, sectionStart + start.length) : record.body.length
      if (
        sectionStart < 0 ||
        sectionEnd < 0 ||
        record.body.slice(sectionStart + start.length, sectionEnd).trim().length === 0
      )
        schema.push({
          status: 'VIOLATION',
          message: `${heading} must contain substantive checkpoint content`,
          subject: record.path
        })
    }

    const expectedFields = record.location === 'active' ? ACTIVE_FIELDS : RETIRED_FIELDS
    const actualFields = Object.keys(fields).sort()
    if (actualFields.join('\n') !== [...expectedFields].sort().join('\n'))
      schema.push({
        status: 'VIOLATION',
        message: `${record.location} checkpoint frontmatter must use only its closed field set`,
        subject: record.path
      })
    if (fields.type !== 'ki-checkpoint')
      schema.push({ status: 'VIOLATION', message: 'type must be ki-checkpoint', subject: record.path })
    if (fields.state !== record.location)
      lifecycle.push({
        status: 'VIOLATION',
        message: `state must be ${record.location} at this location`,
        subject: record.path
      })

    const created = fields.created_at
    const updated = fields.updated_at
    const retired = fields.retired_at
    if (!validTimestamp(created))
      schema.push({ status: 'VIOLATION', message: 'created_at must be a UTC RFC 3339 timestamp', subject: record.path })
    if (!validTimestamp(updated))
      schema.push({ status: 'VIOLATION', message: 'updated_at must be a UTC RFC 3339 timestamp', subject: record.path })
    if (record.location === 'retired' && !validTimestamp(retired))
      schema.push({ status: 'VIOLATION', message: 'retired_at must be a UTC RFC 3339 timestamp', subject: record.path })
    if (validTimestamp(created) && validTimestamp(updated) && Date.parse(created) > Date.parse(updated))
      lifecycle.push({
        status: 'VIOLATION',
        message: 'created_at must not be later than updated_at',
        subject: record.path
      })
    if (
      record.location === 'retired' &&
      validTimestamp(updated) &&
      validTimestamp(retired) &&
      Date.parse(updated) > Date.parse(retired)
    )
      lifecycle.push({
        status: 'VIOLATION',
        message: 'retired_at must not be earlier than updated_at',
        subject: record.path
      })

    if (typeof thread === 'string' && thread.length > 0) {
      const selected = record.location === 'active' ? activeThreads : retiredThreads
      if (selected.has(thread))
        lifecycle.push({
          status: 'VIOLATION',
          message: `thread ${thread} has more than one ${record.location} record`,
          subject: record.path
        })
      selected.add(thread)
    }

    const forbiddenFields = Object.keys(fields).filter((key) => FORBIDDEN_KEY.test(key))
    if (forbiddenFields.length > 0)
      boundary.push({
        status: 'VIOLATION',
        message: `checkpoint carries forbidden session or transcript field(s): ${forbiddenFields.join(', ')}`,
        subject: record.path
      })
    if (TRANSCRIPT_LINE.test(record.body))
      boundary.push({
        status: 'VIOLATION',
        message: 'checkpoint body appears to contain role-by-role transcript content',
        subject: record.path
      })
    if (SESSION_CONTINUITY.test(record.body))
      boundary.push({
        status: 'VIOLATION',
        message: 'checkpoint body appears to claim continuity with the originating session',
        subject: record.path
      })
    if (SESSION_LOCATOR.test(record.body))
      boundary.push({
        status: 'VIOLATION',
        message: 'checkpoint body appears to carry a session or conversation locator',
        subject: record.path
      })
  }

  for (const thread of activeThreads) {
    if (retiredThreads.has(thread))
      lifecycle.push({
        status: 'VIOLATION',
        message: `thread ${thread} is simultaneously active and retired`,
        subject: thread
      })
  }

  return {
    identity: one(identity, 'Every checkpoint has one consistent human-selected thread identity.'),
    schema: one(schema, 'Every checkpoint uses the closed metadata and heading schema.'),
    lifecycle: one(lifecycle, 'Checkpoint states, uniqueness, and timestamps are coherent.'),
    boundary: one(boundary, 'No mechanically recognisable transcript or session-continuity dependency is present.')
  }
}

export const createCheckpointsSession = ({
  repository,
  configuration,
  publication
}: RubricContextOptions): RubricSession<CheckpointsRubricContext> => {
  const root = resolve(repository)
  const checkpointDirectory = join(root, '+', '_CHECKPOINTS')
  const retiredDirectory = join(checkpointDirectory, '_RETIRED')
  const checkpointExists = existsSync(checkpointDirectory)
  const checkpointSafe = physicalDirectory(checkpointDirectory)
  const absent = !checkpointExists ? 'The optional +/_CHECKPOINTS/ subarea is absent.' : undefined
  const structureViolations: AuditOutcome[] = []
  const records: ParsedCheckpoint[] = []

  if (checkpointExists && !checkpointSafe)
    structureViolations.push({
      status: 'VIOLATION',
      message: '+/_CHECKPOINTS/ must be a physical directory',
      subject: relative(root, checkpointDirectory)
    })
  if (checkpointSafe) {
    const active = inspectDirectory(checkpointDirectory, 'active', root)
    records.push(...active.records)
    structureViolations.push(...active.violations)
    if (existsSync(retiredDirectory)) {
      if (!physicalDirectory(retiredDirectory))
        structureViolations.push({
          status: 'VIOLATION',
          message: '_RETIRED must be a physical directory',
          subject: relative(root, retiredDirectory)
        })
      else {
        const retired = inspectDirectory(retiredDirectory, 'retired', root)
        records.push(...retired.records)
        structureViolations.push(...retired.violations)
      }
    }
  }

  const configured = table(table(configuration.skills)?.[CONFIG_TABLE])
  const configOutcomes: AuditOutcome[] = configured
    ? Object.keys(configured).map((key) => ({
        status: 'VIOLATION' as const,
        level: 'WARN' as const,
        message: `unrecognised ki-checkpoint configuration key ${key}`,
        subject: '.ki-config.toml'
      }))
    : []
  const evidence = recordEvidence(
    records,
    absent ??
      (checkpointExists && !checkpointSafe
        ? 'Checkpoint records are unavailable until the subarea is safe.'
        : undefined)
  )
  const context: CheckpointsRubricContext = {
    rubric: { publication },
    configuration: {
      outcomes: one(
        configOutcomes,
        configured
          ? 'The ki-checkpoint declaration is an empty capability marker.'
          : 'No ki-checkpoint declaration is active.'
      )
    },
    structure: {
      outcomes: one(structureViolations, 'The active and retired checkpoint locations are canonical.', absent)
    },
    records: { identity: evidence.identity, schema: evidence.schema },
    lifecycle: { mechanical: evidence.lifecycle },
    boundary: { outcomes: evidence.boundary }
  }

  return {
    subjects: [
      {
        subject: relative(root, checkpointDirectory),
        families: ['RUBRIC', 'CONFIG', 'STRUCTURE', 'RECORD', 'LIFECYCLE', 'BOUNDARY'],
        context: () => context
      }
    ],
    proposal: () => ({ writes: [] })
  }
}
