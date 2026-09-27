import { existsSync, lstatSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import type {
  ConformWrite,
  RubricContextOptions,
  RubricPublicationContext,
  RubricSession
} from '../../shared/rubric.ts'
import { projectSharedDecisionRecord } from './shared-projection.ts'

const CODE_DIR = 'docs/decisions'
const KB_DIR = 'Admin/Governance/Decisions'
const REPO_CONFIG = 'ki-repo'
const TOML = (globalThis as unknown as { Bun: { TOML: { parse(text: string): unknown } } }).Bun.TOML
const PREFIX_TO_TYPE: Record<string, { decisionType: string; decisionTypeUrl: string }> = {
  SDR: {
    decisionType: 'strategy',
    decisionTypeUrl: 'https://knowledgeislands.info/specifications/decision-records/sdr'
  },
  PDR: {
    decisionType: 'product',
    decisionTypeUrl: 'https://knowledgeislands.info/specifications/decision-records/pdr'
  },
  ADR: {
    decisionType: 'architecture',
    decisionTypeUrl: 'https://knowledgeislands.info/specifications/decision-records/adr'
  },
  DDR: {
    decisionType: 'data',
    decisionTypeUrl: 'https://knowledgeislands.info/specifications/decision-records/ddr'
  },
  XDR: {
    decisionType: 'security',
    decisionTypeUrl: 'https://knowledgeislands.info/specifications/decision-records/xdr'
  },
  ODR: {
    decisionType: 'operations',
    decisionTypeUrl: 'https://knowledgeislands.info/specifications/decision-records/odr'
  },
  GDR: {
    decisionType: 'governance',
    decisionTypeUrl: 'https://knowledgeislands.info/specifications/decision-records/gdr'
  },
  RDR: {
    decisionType: 'research',
    decisionTypeUrl: 'https://knowledgeislands.info/specifications/decision-records/rdr'
  },
  KDR: {
    decisionType: 'knowledge',
    decisionTypeUrl: 'https://knowledgeislands.info/specifications/decision-records/kdr'
  }
}
const ID = /^(SDR|PDR|ADR|DDR|XDR|ODR|GDR|RDR|KDR)-([A-Z0-9]*[A-Z][A-Z0-9]*(?:-[A-Z0-9]*[A-Z][A-Z0-9]*)*)-(XXX|\d{3,})$/
const INDEX_ENTRY =
  /^\s*(\d+)\.\s+\[((?:SDR|PDR|ADR|DDR|XDR|ODR|GDR|RDR|KDR)-[A-Z0-9]*[A-Z][A-Z0-9-]*-(?:XXX|\d{3,}))\]\(([^)]+)\)/
const INDEX_ENTRY_TARGET =
  /^(\s*\d+\.\s+\[((?:SDR|PDR|ADR|DDR|XDR|ODR|GDR|RDR|KDR)-[A-Z0-9]*[A-Z][A-Z0-9-]*-(?:XXX|\d{3,}))\]\()([^)]+)(\).*)$/
const DECISION_LINK = /\[((?:SDR|PDR|ADR|DDR|XDR|ODR|GDR|RDR|KDR)-[A-Z0-9]*[A-Z][A-Z0-9-]*-(?:XXX|\d{3,}))\]\(([^)]+)\)/
const BODY_CITATION =
  /(?:SDR|PDR|ADR|DDR|XDR|ODR|GDR|RDR|KDR)-[A-Z0-9]*[A-Z][A-Z0-9]*(?:-[A-Z0-9]*[A-Z][A-Z0-9]*)*-(?:XXX|\d{3,})/g
const HEADING = /^#\s+((?:SDR|PDR|ADR|DDR|XDR|ODR|GDR|RDR|KDR)-[A-Z0-9]*[A-Z][A-Z0-9-]*-(?:XXX|\d{3,})):\s+(.+)$/m

export type DecisionRecord = {
  file: string
  id: string
  prefix: string
  scope: string
  serial: string
  expectedDecisionType: string
  expectedDecisionTypeUrl: string
  expectedFilename: string
  content: string
  body: string
  frontmatter?: string
  frontmatterId?: string
  title?: string
  date?: string
  status?: string
  decisionTypeUrl?: string
  decisionType?: string
  dependsOn: readonly string[]
  sharedRecord: boolean
  sharedProjection?: string
  sharedProjectionIssue?: string
  headingId?: string
  headingTitle?: string
  missingSections: readonly string[]
  automaticConformEligible: boolean
}

export type FilenameRubricContext = {
  unparseableFiles: readonly string[]
  invalidFilenames: readonly string[]
  duplicateIds: ReadonlyMap<string, readonly string[]>
  serialGaps: ReadonlyMap<string, readonly number[]>
}

export type DependsRubricContext = {
  records: readonly DecisionRecord[]
  malformedDependencies: readonly { id: string; target: string }[]
  unresolvedDependencies: readonly { id: string; target: string }[]
  dependencyCycles: readonly (readonly string[])[]
  dependencyOrderViolations: readonly { id: string; target: string }[]
  forwardCitations: readonly { id: string; target: string }[]
}

export type RecordsRubricContext = {
  records: readonly DecisionRecord[]
  conformFrontmatter?: () => void
}

export type RootRubricContext = {
  indexFile: string
  indexIds: readonly string[]
  records: readonly DecisionRecord[]
}

export type IndexRubricContext = {
  indexFile: string
  indexExists: boolean
  indexIds: readonly string[]
  indexCounts: ReadonlyMap<string, number>
  indexLinks: readonly { id: string; target: string }[]
  unorderedIndexLinks: readonly string[]
  records: readonly DecisionRecord[]
  outOfOrderIds: readonly { id: string; previous: number }[]
  appendMissingEntries?: () => void
  repairCanonicalLinks?: () => void
}

export type DecisionRecordsRubricContext = {
  rubric: RubricPublicationContext
  filename: FilenameRubricContext
  root: RootRubricContext
  frontmatter: RecordsRubricContext
  typeFit: RecordsRubricContext
  body: RecordsRubricContext
  index: IndexRubricContext
  depends: DependsRubricContext
}

type IndexDraft = {
  appendMissingEntries: (records: readonly DecisionRecord[]) => void
  repairCanonicalLinks: (records: readonly DecisionRecord[]) => void
  proposal: () => ConformWrite | undefined
}

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const findKiConfig = (start: string): string | undefined => {
  let directory = resolve(start)
  for (let depth = 0; depth < 10; depth++) {
    const candidate = join(directory, '.ki.toml')
    if (existsSync(candidate)) return candidate
    const parent = dirname(directory)
    if (parent === directory) return undefined
    directory = parent
  }
  return undefined
}

const isKb = (target: string): boolean => {
  const config = findKiConfig(target)
  if (!config) return false
  try {
    const parsed = TOML.parse(readFileSync(config, 'utf8')) as Record<string, unknown>
    const skills = parsed.skills
    const table = skills && typeof skills === 'object' ? (skills as Record<string, unknown>)[REPO_CONFIG] : undefined
    return (
      typeof table === 'object' &&
      table !== null &&
      !Array.isArray(table) &&
      (table as Record<string, unknown>).repo_type === 'kb'
    )
  } catch {
    return false
  }
}

const isDirectory = (path: string): boolean =>
  existsSync(path) && !lstatSync(path).isSymbolicLink() && statSync(path).isDirectory()

const isRegularFile = (path: string): boolean =>
  existsSync(path) && !lstatSync(path).isSymbolicLink() && statSync(path).isFile()

const resolveDirectory = (target: string, kbMode: boolean): string => {
  const absolute = resolve(target)
  for (const candidate of (kbMode ? [KB_DIR, CODE_DIR] : [CODE_DIR, KB_DIR]).map((path) => join(absolute, path))) {
    if (isDirectory(candidate)) return candidate
  }
  return join(absolute, kbMode ? KB_DIR : CODE_DIR)
}

const frontmatterValue = (frontmatter: string | undefined, key: string): string | undefined => {
  const value = frontmatter?.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1]?.trim()
  if (!value) return undefined
  if (value.startsWith('"')) {
    try {
      return JSON.parse(value) as string
    } catch {
      return value
    }
  }
  const quoted = value.match(/^(['"])(.*)\1$/)
  return quoted?.[2] ?? value
}

const frontmatterList = (frontmatter: string | undefined, key: string): readonly string[] => {
  if (!frontmatter) return []
  let parsed: unknown
  try {
    parsed = Bun.YAML.parse(frontmatter)
  } catch {
    return []
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return []
  const value = (parsed as Record<string, unknown>)[key]
  if (!Array.isArray(value)) return []
  return value.filter((entry): entry is string => typeof entry === 'string').map((entry) => entry.trim())
}

const readRecords = (directory: string, entries: readonly string[], indexFile: string): DecisionRecord[] => {
  const records: DecisionRecord[] = []
  for (const file of entries.filter((entry) => entry.endsWith('.md') && entry !== indexFile)) {
    const path = join(directory, file)
    if (!isRegularFile(path)) continue
    const content = readFileSync(path, 'utf8')
    const frontmatter = content.match(/^---\n([\s\S]*?)\n---/)?.[1]
    const body = content.replace(/^---\n[\s\S]*?\n---\n?/, '')
    const heading = body.match(HEADING)
    const identity = heading?.[1]?.match(ID)
    if (!identity || !heading?.[2]) continue
    const [, prefix, scope, serial] = identity
    const id = `${prefix}-${scope}-${serial}`
    const headingTitle = heading[2].trim()
    const expected = PREFIX_TO_TYPE[prefix] as { decisionType: string; decisionTypeUrl: string }
    const sharedRecord = frontmatterValue(frontmatter, 'shared_record') === 'true'
    const sharedProjection = sharedRecord ? projectSharedDecisionRecord(content) : undefined
    records.push({
      file,
      id,
      prefix,
      scope,
      serial,
      expectedDecisionType: expected.decisionType,
      expectedDecisionTypeUrl: expected.decisionTypeUrl,
      expectedFilename: `${id}-${slugify(headingTitle)}.md`,
      content,
      body,
      ...(frontmatter ? { frontmatter } : {}),
      ...(frontmatterValue(frontmatter, 'id') ? { frontmatterId: frontmatterValue(frontmatter, 'id') } : {}),
      ...(frontmatterValue(frontmatter, 'title') ? { title: frontmatterValue(frontmatter, 'title') } : {}),
      ...(frontmatterValue(frontmatter, 'date') ? { date: frontmatterValue(frontmatter, 'date') } : {}),
      ...(frontmatterValue(frontmatter, 'status') ? { status: frontmatterValue(frontmatter, 'status') } : {}),
      ...(frontmatterValue(frontmatter, 'decision_type_url')
        ? { decisionTypeUrl: frontmatterValue(frontmatter, 'decision_type_url') }
        : {}),
      ...(frontmatterValue(frontmatter, 'decision_type')
        ? { decisionType: frontmatterValue(frontmatter, 'decision_type') }
        : {}),
      dependsOn: frontmatterList(frontmatter, 'decision_depends_on'),
      sharedRecord,
      ...(sharedProjection?.projection ? { sharedProjection: sharedProjection.projection } : {}),
      ...(sharedProjection?.issue ? { sharedProjectionIssue: sharedProjection.issue } : {}),
      headingId: id,
      headingTitle,
      missingSections: ['## Context', '## Decision', '## Consequences'].filter((section) => !body.includes(section)),
      automaticConformEligible: file === `${id}-${slugify(headingTitle)}.md`
    })
  }
  return records
}

const unparseableRecordFiles = (directory: string, entries: readonly string[], indexFile: string): string[] =>
  entries
    .filter((entry) => entry.endsWith('.md') && entry !== indexFile && isRegularFile(join(directory, entry)))
    .filter((file) => {
      const content = readFileSync(join(directory, file), 'utf8')
      const body = content.replace(/^---\n[\s\S]*?\n---\n?/, '')
      return !HEADING.test(body)
    })

const serialEvidence = (records: readonly DecisionRecord[]) => {
  const idsToFiles = new Map<string, string[]>()
  const serialsBySeries = new Map<string, number[]>()
  const localSerialSeries = new Set(
    records
      .filter((record) => record.serial !== 'XXX' && !record.sharedRecord)
      .map((record) => `${record.prefix}-${record.scope}`)
  )
  for (const record of records) {
    idsToFiles.set(record.id, [...(idsToFiles.get(record.id) ?? []), record.file])
    const key = `${record.prefix}-${record.scope}`
    if (record.serial !== 'XXX' && (!record.sharedRecord || localSerialSeries.has(key)))
      serialsBySeries.set(key, [...(serialsBySeries.get(key) ?? []), Number(record.serial)])
  }
  const serialGaps = new Map<string, number[]>()
  for (const [series, serials] of serialsBySeries) {
    const unique = [...new Set(serials)].sort((left, right) => left - right)
    const maximum = unique.at(-1) ?? 0
    const missing = Array.from({ length: maximum }, (_, index) => index + 1).filter(
      (serial) => !unique.includes(serial)
    )
    if (missing.length > 0) serialGaps.set(series, missing)
  }
  return {
    duplicateIds: new Map([...idsToFiles].filter(([, files]) => files.length > 1)),
    serialGaps
  }
}

const revealOrderEvidence = (indexIds: readonly string[]): readonly { id: string; previous: number }[] => {
  const outOfOrderIds: Array<{ id: string; previous: number }> = []
  const maximumBySeries = new Map<string, number>()
  for (const id of indexIds) {
    const match = id.match(/^(.*)-(\d{3,})$/)
    if (!match) continue
    const series = match[1] as string
    const serial = Number(match[2])
    const previous = maximumBySeries.get(series)
    if (previous !== undefined && serial < previous) outOfOrderIds.push({ id, previous })
    maximumBySeries.set(series, Math.max(previous ?? 0, serial))
  }
  return outOfOrderIds
}

const dependencyCycles = (edges: ReadonlyMap<string, readonly string[]>): string[][] => {
  const visiting = new Set<string>()
  const visited = new Set<string>()
  const stack: string[] = []
  const cycles: string[][] = []
  const reported = new Set<string>()
  const visit = (node: string): void => {
    visiting.add(node)
    stack.push(node)
    for (const next of edges.get(node) ?? []) {
      if (visiting.has(next)) {
        const cycle = stack.slice(stack.indexOf(next))
        const key = [...cycle].sort().join(' ')
        if (!reported.has(key)) {
          reported.add(key)
          cycles.push([...cycle, next])
        }
      } else if (!visited.has(next)) visit(next)
    }
    stack.pop()
    visiting.delete(node)
    visited.add(node)
  }
  for (const node of edges.keys()) if (!visited.has(node)) visit(node)
  return cycles
}

const dependencyEvidence = (
  records: readonly DecisionRecord[],
  indexIds: readonly string[]
): Omit<DependsRubricContext, 'records'> => {
  const known = new Set(records.map((record) => record.id))
  const localScopes = new Set(records.map((record) => record.scope))
  const positions = new Map(indexIds.map((id, position) => [id, position]))
  const malformedDependencies: { id: string; target: string }[] = []
  const unresolvedDependencies: { id: string; target: string }[] = []
  const dependencyOrderViolations: { id: string; target: string }[] = []
  const forwardCitations: { id: string; target: string }[] = []
  const edges = new Map<string, string[]>()
  for (const record of records) {
    const resolved: string[] = []
    for (const target of record.dependsOn) {
      const identity = target.match(ID)
      if (!identity) {
        malformedDependencies.push({ id: record.id, target })
        continue
      }
      if (known.has(target)) {
        resolved.push(target)
        const dependency = positions.get(target)
        const dependent = positions.get(record.id)
        if (dependency !== undefined && dependent !== undefined && dependency > dependent)
          dependencyOrderViolations.push({ id: record.id, target })
        continue
      }
      if (localScopes.has(identity[2] as string)) unresolvedDependencies.push({ id: record.id, target })
    }
    edges.set(record.id, resolved)
    if (record.serial !== 'XXX')
      for (const target of new Set(record.body.match(BODY_CITATION) ?? [])) {
        const identity = target.match(ID)
        if (!identity || identity[3] === 'XXX') continue
        if (identity[1] !== record.prefix || identity[2] !== record.scope) continue
        if (Number(identity[3]) > Number(record.serial)) forwardCitations.push({ id: record.id, target })
      }
  }
  return {
    malformedDependencies,
    unresolvedDependencies,
    dependencyCycles: dependencyCycles(edges),
    dependencyOrderViolations,
    forwardCitations
  }
}

const createIndexDraft = (repository: string, path: string, original: string): IndexDraft => {
  let working = original
  const newline = original.includes('\r\n') ? '\r\n' : '\n'
  return {
    appendMissingEntries: (records) => {
      const currentCounts = new Map<string, number>()
      for (const line of working.split(newline)) {
        const entry = line.match(INDEX_ENTRY)
        if (entry) currentCounts.set(entry[2] as string, (currentCounts.get(entry[2] as string) ?? 0) + 1)
      }
      const missing = records.filter(
        (record) => record.automaticConformEligible && (currentCounts.get(record.id) ?? 0) === 0
      )
      if (missing.length === 0) return
      const existingEntries = working.split(newline).filter((line) => INDEX_ENTRY.test(line)).length
      const additions = missing.map(
        (record, index) =>
          `${existingEntries + index + 1}. [${record.id}](${record.file}) — ${record.headingTitle ?? '(title unknown — see file)'}`
      )
      working = `${working.replace(/(?:\r?\n)*$/, newline)}${additions.join(newline)}${newline}`
    },
    repairCanonicalLinks: (records) => {
      const canonicalFiles = new Map(
        records.filter((record) => record.automaticConformEligible).map((record) => [record.id, record.file])
      )
      working = working
        .split(newline)
        .map((line) => {
          const entry = line.match(INDEX_ENTRY_TARGET)
          if (!entry) return line
          const expected = canonicalFiles.get(entry[2] as string)
          if (!expected || entry[3] === expected) return line
          return `${entry[1]}${expected}${entry[4]}`
        })
        .join(newline)
    },
    proposal: () => (working === original ? undefined : { path: relative(repository, path), content: working })
  }
}

type ScalarField = { line: number; value: string }

const automaticFrontmatterRepair = (record: DecisionRecord): string | undefined => {
  if (!record.automaticConformEligible || !record.frontmatter) return undefined
  let parsed: Record<string, unknown>
  try {
    const value = Bun.YAML.parse(record.frontmatter)
    if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
    parsed = value as Record<string, unknown>
  } catch {
    return undefined
  }

  const lines = record.frontmatter.split(/\r?\n/)
  const newline = record.frontmatter.includes('\r\n') ? '\r\n' : '\n'
  const fields = new Map<string, ScalarField>()
  for (const key of ['type', 'type_url', 'decision_type', 'decision_type_url']) {
    const matches = lines.flatMap((line, index) => {
      const match = line.match(new RegExp(`^${key}:[ \\t]+(.+)$`))
      return match ? [{ line: index, value: match[1] as string }] : []
    })
    if (matches.length > 1 || (Object.hasOwn(parsed, key) && matches.length !== 1)) return undefined
    if (matches.length === 1) {
      if (typeof parsed[key] !== 'string') return undefined
      fields.set(key, matches[0] as ScalarField)
    }
  }

  const legacyTypeUrl = fields.get('type_url')
  if (record.decisionType && record.decisionType !== record.expectedDecisionType) return undefined
  if (record.decisionTypeUrl && record.decisionTypeUrl !== record.expectedDecisionTypeUrl) return undefined
  if (legacyTypeUrl && parsed.type_url !== record.expectedDecisionTypeUrl) return undefined

  const remove = new Set<number>()
  const replace = new Map<number, string>()
  const additions: string[] = []
  const legacyType = fields.get('type')
  if (legacyType) remove.add(legacyType.line)
  if (legacyTypeUrl) {
    if (record.decisionTypeUrl) remove.add(legacyTypeUrl.line)
    else replace.set(legacyTypeUrl.line, lines[legacyTypeUrl.line]?.replace(/^type_url:/, 'decision_type_url:') ?? '')
  } else if (!record.decisionTypeUrl) {
    additions.push(`decision_type_url: ${record.expectedDecisionTypeUrl}`)
  }
  if (!record.decisionType) additions.push(`decision_type: ${record.expectedDecisionType}`)

  if (remove.size === 0 && replace.size === 0 && additions.length === 0) return undefined
  const repaired = [
    ...lines.flatMap((line, index) => (remove.has(index) ? [] : [replace.get(index) ?? line])),
    ...additions
  ].join(newline)
  return `${repaired}${record.frontmatter.endsWith(newline) ? newline : ''}`
}

const replaceFrontmatter = (content: string, frontmatter: string): string | undefined => {
  const match = content.match(/^---(\r?\n)[\s\S]*?\r?\n---/)
  if (!match) return undefined
  return `---${match[1] as string}${frontmatter}${match[1] as string}---${content.slice(match[0].length)}`
}

export const createDecisionRecordsSession = ({
  mode,
  repository,
  publication
}: RubricContextOptions): RubricSession<DecisionRecordsRubricContext> => {
  const kbMode = isKb(repository)
  const directory = resolveDirectory(repository, kbMode)
  const exists = isDirectory(directory)
  const entries = exists ? readdirSync(directory).sort() : []
  const indexFile = kbMode ? 'Decisions.md' : 'README.md'
  const indexExists = entries.includes(indexFile)
  const indexPath = join(directory, indexFile)
  const indexContent = indexExists ? readFileSync(indexPath, 'utf8') : ''
  const indexLinks = indexContent
    .split('\n')
    .map((line) => line.match(INDEX_ENTRY))
    .filter((entry): entry is RegExpMatchArray => Boolean(entry))
    .map((entry) => ({ id: entry[2] as string, target: entry[3] as string }))
  const indexIds = indexLinks.map(({ id }) => id)
  const unorderedIndexLinks = indexContent
    .split('\n')
    .filter((line) => DECISION_LINK.test(line) && !INDEX_ENTRY.test(line))
  const indexCounts = new Map<string, number>()
  for (const id of indexIds) indexCounts.set(id, (indexCounts.get(id) ?? 0) + 1)
  const records = readRecords(directory, entries, indexFile)
  const { duplicateIds, serialGaps } = serialEvidence(records)
  const indexDraft =
    mode === 'conform' && indexExists && isRegularFile(indexPath)
      ? createIndexDraft(repository, indexPath, indexContent)
      : undefined
  const frontmatterWrites = new Map<string, ConformWrite>()

  const context: DecisionRecordsRubricContext = {
    rubric: { publication },
    filename: {
      unparseableFiles: unparseableRecordFiles(directory, entries, indexFile),
      invalidFilenames: records
        .filter((record) => record.file !== record.expectedFilename)
        .map((record) => record.file),
      duplicateIds,
      serialGaps
    },
    root: {
      indexFile,
      indexIds,
      records
    },
    frontmatter: {
      records,
      ...(mode === 'conform'
        ? {
            conformFrontmatter: () => {
              for (const record of records) {
                const frontmatter = automaticFrontmatterRepair(record)
                if (!frontmatter) continue
                const content = replaceFrontmatter(record.content, frontmatter)
                if (!content) continue
                frontmatterWrites.set(record.file, {
                  path: relative(repository, join(directory, record.file)),
                  content
                })
              }
            }
          }
        : {})
    },
    typeFit: { records },
    depends: { records, ...dependencyEvidence(records, indexIds) },
    body: { records },
    index: {
      indexFile,
      indexExists,
      indexIds,
      indexCounts,
      indexLinks,
      unorderedIndexLinks,
      records,
      outOfOrderIds: revealOrderEvidence(indexIds),
      ...(indexDraft
        ? {
            appendMissingEntries: () => {
              indexDraft.appendMissingEntries(records)
            },
            repairCanonicalLinks: () => {
              indexDraft.repairCanonicalLinks(records)
            }
          }
        : {})
    }
  }

  return {
    subjects: [
      { families: ['RUBRIC'], context: () => context },
      { families: ['FILENAME', 'ROOT', 'FM', 'TYPE-FIT', 'BODY', 'INDEX', 'DEPENDS'], context: () => context }
    ],
    proposal: () => {
      const indexWrite = indexDraft?.proposal()
      return { writes: [...frontmatterWrites.values(), ...(indexWrite ? [indexWrite] : [])] }
    }
  }
}
