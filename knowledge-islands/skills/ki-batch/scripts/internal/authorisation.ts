import { createHash } from 'node:crypto'
import { lstatSync, readFileSync } from 'node:fs'
import { relative, resolve } from 'node:path'

const AUTHORISATION_DIRECTORY = '+/_BATCHES'
const CURRENT_AUTHORISATION_FIELDS = new Set([
  'id',
  'repository',
  'approved',
  'approved_at',
  'authority_mode',
  'authority_evidence',
  'approved_payload_sha256',
  'expires_at',
  'item_ids',
  'completion_target',
  'policy'
])
const RETAINED_AUTHORISATION_FIELDS = new Set([
  'id',
  'repository',
  'approved',
  'approved_at',
  'authority_mode',
  'authority_evidence',
  'approved_payload_sha256',
  'run_id',
  'timebox_ends_at',
  'item_ids',
  'completion_target',
  'mandatory_stops',
  'closure_item_ids'
])

export type BatchRunBinding = { id: string; approvedPayloadSha256: string }

export type BatchAuthorisation = {
  id: string
  repository: string
  approved: boolean
  approvedAt: string | null
  authorityMode: 'reviewed-items' | 'outcome'
  authorityEvidence: string | null
  approvedPayloadSha256: string
  runId: string
  runBinding: BatchRunBinding | null
  expiresAt: string
  itemIds: readonly string[]
  completionTarget: 'awaiting-review' | 'done'
  policy: 'safe-local-v1' | 'retained-legacy'
}

export type BatchAuthorisationResolution =
  | { kind: 'resolved'; authorisation: BatchAuthorisation; writes: false }
  | { kind: 'stop'; reason: string; writes: false }

export type ResolveBatchAuthorisationInput = {
  repositoryRoot: string
  authorisationPath: string
  repositoryIdentity: string
  now: Date
}

type ParsedFrontmatter = { fields: Record<string, unknown>; body: string }

const stop = (reason: string): BatchAuthorisationResolution => ({ kind: 'stop', reason, writes: false })

const frontmatter = (contents: string): ParsedFrontmatter | undefined => {
  const match = /^---\n([\s\S]*?)\n---(?:\n|$)/.exec(contents)
  if (!match?.[1]) return undefined
  try {
    const value = Bun.YAML.parse(match[1])
    return value && typeof value === 'object' && !Array.isArray(value)
      ? { fields: value as Record<string, unknown>, body: contents.slice(match[0].length) }
      : undefined
  } catch {
    return undefined
  }
}

const timestamp = (value: unknown): string | undefined =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(value) && !Number.isNaN(Date.parse(value))
    ? value
    : undefined

const identifiers = (value: unknown): readonly string[] | undefined =>
  Array.isArray(value) &&
  value.length > 0 &&
  value.every((item) => typeof item === 'string' && /^[A-Z][A-Z0-9-]*-\d{3}$/.test(item))
    ? (value as readonly string[])
    : undefined

const strings = (value: unknown): readonly string[] | undefined =>
  Array.isArray(value) && value.length > 0 && value.every((item) => typeof item === 'string' && item.trim())
    ? (value as readonly string[])
    : undefined

const RUN_LEDGER_HEADING = /^## Run ledger[ \t]*$/m

const payloadBody = (body: string): string | undefined => {
  const sections = body.split(RUN_LEDGER_HEADING)
  if (sections.length > 2) return undefined
  const protectedBody = sections[0]
  if (sections.length === 1 || !protectedBody.endsWith('\n\n')) return protectedBody
  return protectedBody.slice(0, -1)
}

const canonicalPayload = (fields: Record<string, unknown>, body: string): string | undefined => {
  const protectedBody = payloadBody(body)
  if (protectedBody === undefined) return undefined
  const protectedFields = Object.fromEntries(
    Object.entries(fields)
      .filter(([field]) => field !== 'approved_payload_sha256')
      .sort(([left], [right]) => left.localeCompare(right))
  )
  return JSON.stringify({ frontmatter: protectedFields, body: protectedBody })
}

/** Hashes the immutable approved payload, excluding its self-referential hash and append-only run ledger. */
export const approvedPayloadSha256 = (contents: string): string | undefined => {
  const parsed = frontmatter(contents)
  const payload = parsed && canonicalPayload(parsed.fields, parsed.body)
  return payload === undefined ? undefined : createHash('sha256').update(payload).digest('hex')
}

const runBinding = (body: string): BatchRunBinding | undefined | null => {
  const sections = body.split(RUN_LEDGER_HEADING)
  if (sections.length === 1) return null
  if (sections.length !== 2) return undefined
  const marker = /^<!-- ki-batch-run: ([A-Z][A-Z0-9-]*-RUN-\d{3}) ([0-9a-f]{64}) -->$/m.exec(sections[1])
  return marker ? { id: marker[1], approvedPayloadSha256: marker[2] } : undefined
}

export const resolveBatchAuthorisation = ({
  repositoryRoot,
  authorisationPath,
  repositoryIdentity,
  now
}: ResolveBatchAuthorisationInput): BatchAuthorisationResolution => {
  const root = resolve(repositoryRoot)
  const directory = resolve(root, AUTHORISATION_DIRECTORY)
  const path = resolve(authorisationPath)
  const pathWithinDirectory = relative(directory, path)
  if (
    !pathWithinDirectory ||
    pathWithinDirectory.startsWith('..') ||
    pathWithinDirectory.includes('/') ||
    !path.endsWith('.md')
  )
    return stop('batch authorisation is not a canonical local record')

  let contents: string
  try {
    const state = lstatSync(path)
    if (!state.isFile() || state.isSymbolicLink()) return stop('batch authorisation must be a regular local file')
    contents = readFileSync(path, 'utf8')
  } catch {
    return stop('batch authorisation does not exist')
  }

  const resolution = parseBatchAuthorisation({ contents, filename: pathWithinDirectory, repositoryIdentity })
  if (resolution.kind === 'resolved' && resolution.authorisation.policy === 'retained-legacy')
    return stop('retained pre-change batch authorisation is not executable')
  if (resolution.kind === 'resolved' && Date.parse(resolution.authorisation.expiresAt) <= now.getTime())
    return stop('batch authorisation timebox has expired')
  return resolution
}

/** Validates immutable approval and ledger binding without interpreting execution or retention time. */
export const parseBatchAuthorisation = ({
  contents,
  filename,
  repositoryIdentity
}: {
  contents: string
  filename: string
  repositoryIdentity: string
}): BatchAuthorisationResolution => {
  const parsed = frontmatter(contents)
  if (!parsed) return stop('batch authorisation has invalid frontmatter')
  const { fields, body } = parsed
  const currentShape = fields.policy !== undefined || fields.expires_at !== undefined
  const allowedFields = currentShape ? CURRENT_AUTHORISATION_FIELDS : RETAINED_AUTHORISATION_FIELDS
  if (Object.keys(fields).some((field) => !allowedFields.has(field)))
    return stop('batch authorisation has unsupported fields')

  const id = fields.id
  const repository = fields.repository
  const approved = fields.approved
  const approvedAt = fields.approved_at
  const authorityMode = fields.authority_mode === undefined ? 'reviewed-items' : fields.authority_mode
  const authorityEvidence = fields.authority_evidence
  const payloadHash = fields.approved_payload_sha256
  const runId = currentShape && typeof id === 'string' ? `${id}-RUN-001` : fields.run_id
  const expiresAt = timestamp(currentShape ? fields.expires_at : fields.timebox_ends_at)
  const itemIds = identifiers(fields.item_ids)
  const policy = currentShape ? fields.policy : 'retained-legacy'
  const mandatoryStops = currentShape ? undefined : strings(fields.mandatory_stops)
  const closureItemIds = currentShape
    ? undefined
    : fields.closure_item_ids === undefined
      ? []
      : identifiers(fields.closure_item_ids)
  const actualPayloadHash = approvedPayloadSha256(contents)
  const binding = runBinding(body)

  if (typeof id !== 'string' || !/^[A-Z][A-Z0-9-]*-BATCH-\d{3}$/.test(id) || filename !== `${id}.md`)
    return stop('batch authorisation has an invalid identity or filename')
  if (currentShape && payloadBody(body)?.trim() !== `# ${id}`)
    return stop('batch authorisation body must contain only its matching identity heading before the run ledger')
  if (typeof repository !== 'string' || !repository) return stop('batch authorisation must name one repository')
  if (currentShape && policy !== 'safe-local-v1') return stop('batch authorisation has an invalid policy')
  if (typeof approved !== 'boolean') return stop('batch authorisation must declare approval')
  if (authorityMode !== 'reviewed-items' && authorityMode !== 'outcome')
    return stop('batch authorisation has an invalid authority mode')
  if (authorityMode === 'outcome' && (typeof authorityEvidence !== 'string' || authorityEvidence.trim().length === 0))
    return stop('outcome-authorised batch lacks current human authority evidence')
  if (authorityMode === 'reviewed-items' && authorityEvidence !== undefined && authorityEvidence !== null)
    return stop('reviewed-item batch must not claim outcome authority evidence')
  if (approved ? !timestamp(approvedAt) : approvedAt !== null)
    return stop('batch authorisation has invalid approval evidence')
  if (typeof payloadHash !== 'string' || !/^[0-9a-f]{64}$/.test(payloadHash) || payloadHash !== actualPayloadHash)
    return stop('batch authorisation payload no longer matches its approval')
  if (typeof runId !== 'string' || !new RegExp(`^${id}-RUN-\\d{3}$`).test(runId))
    return stop('batch authorisation has an invalid run identity')
  if (binding === undefined) return stop('batch run ledger lacks an approval binding')
  if (binding && (binding.id !== runId || binding.approvedPayloadSha256 !== payloadHash))
    return stop('batch run ledger binds another approval payload or run')
  if (!expiresAt || !itemIds || (!currentShape && (!mandatoryStops || !closureItemIds)))
    return stop('batch authorisation has invalid required fields')
  if (new Set(itemIds).size !== itemIds.length) return stop('batch authorisation repeats an item identifier')
  if (fields.completion_target !== 'awaiting-review' && fields.completion_target !== 'done')
    return stop('batch authorisation has an invalid completion target')
  if (closureItemIds?.some((item) => !itemIds.includes(item)))
    return stop('batch authorisation grants closure outside its named items')
  if (
    !currentShape &&
    fields.completion_target === 'done' &&
    (closureItemIds?.length !== itemIds.length || itemIds.some((item) => !closureItemIds?.includes(item)))
  )
    return stop('done completion target must grant closure for every named item')
  if (repository !== repositoryIdentity) return stop('batch authorisation names another repository')
  if (!approved) return stop('batch authorisation is not approved')

  return {
    kind: 'resolved',
    authorisation: {
      id,
      repository,
      approved,
      approvedAt: approvedAt as string,
      authorityMode,
      authorityEvidence:
        typeof authorityEvidence === 'string' && authorityEvidence.trim() ? authorityEvidence.trim() : null,
      approvedPayloadSha256: payloadHash,
      runId,
      runBinding: binding,
      expiresAt,
      itemIds,
      completionTarget: fields.completion_target,
      policy: policy as 'safe-local-v1' | 'retained-legacy'
    },
    writes: false
  }
}
