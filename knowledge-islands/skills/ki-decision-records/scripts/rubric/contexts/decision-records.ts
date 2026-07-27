import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import type { ConformWrite, RubricContextOptions, RubricSession } from '../../shared/rubric.ts'

const CODE_DIR = 'docs/decisions'
const KB_DIR = 'Admin/Governance/Decisions'
const PREFIX_TO_TYPE: Record<string, { decisionType: string; type: string; typeUrl: string }> = {
  SDR: {
    decisionType: 'strategy',
    type: 'Strategy Decision Record',
    typeUrl: 'https://knowledgeislands.info/specifications/decision-records/sdr'
  },
  PDR: {
    decisionType: 'product',
    type: 'Product Decision Record',
    typeUrl: 'https://knowledgeislands.info/specifications/decision-records/pdr'
  },
  ADR: {
    decisionType: 'architecture',
    type: 'Architecture Decision Record',
    typeUrl: 'https://knowledgeislands.info/specifications/decision-records/adr'
  },
  DDR: { decisionType: 'data', type: 'Data Decision Record', typeUrl: 'https://knowledgeislands.info/specifications/decision-records/ddr' },
  XDR: {
    decisionType: 'security',
    type: 'Security Decision Record',
    typeUrl: 'https://knowledgeislands.info/specifications/decision-records/xdr'
  },
  ODR: {
    decisionType: 'operations',
    type: 'Operations Decision Record',
    typeUrl: 'https://knowledgeislands.info/specifications/decision-records/odr'
  },
  GDR: {
    decisionType: 'governance',
    type: 'Governance Decision Record',
    typeUrl: 'https://knowledgeislands.info/specifications/decision-records/gdr'
  },
  RDR: {
    decisionType: 'research',
    type: 'Research Decision Record',
    typeUrl: 'https://knowledgeislands.info/specifications/decision-records/rdr'
  },
  KDR: {
    decisionType: 'knowledge',
    type: 'Knowledge Decision Record',
    typeUrl: 'https://knowledgeislands.info/specifications/decision-records/kdr'
  }
}
const ID = /^(SDR|PDR|ADR|DDR|XDR|ODR|GDR|RDR|KDR)-([A-Z][A-Z0-9]*(?:-[A-Z][A-Z0-9]*)*)-(XXX|\d{3,})$/
const INDEX_ID = /^\s*(?:\d+\.|[-*])\s+.*?((?:SDR|PDR|ADR|DDR|XDR|ODR|GDR|RDR|KDR)-[A-Z][A-Z0-9-]+-(?:XXX|\d{3,}))/
const HEADING = /^#\s+((?:SDR|PDR|ADR|DDR|XDR|ODR|GDR|RDR|KDR)-[A-Z][A-Z0-9-]+-(?:XXX|\d{3,})):\s+(.+)$/m

export type DecisionRecord = {
  file: string
  id: string
  prefix: string
  scope: string
  serial: string
  expectedDecisionType: string
  expectedType: string
  expectedTypeUrl: string
  expectedFilename: string
  content: string
  body: string
  frontmatter?: string
  frontmatterId?: string
  title?: string
  date?: string
  status?: string
  type?: string
  typeUrl?: string
  decisionType?: string
  sharedRecord: boolean
  headingId?: string
  headingTitle?: string
  missingSections: readonly string[]
}

export type FilenameRubricContext = {
  invalidFilenames: readonly string[]
  duplicateIds: ReadonlyMap<string, readonly string[]>
  serialGaps: ReadonlyMap<string, readonly number[]>
}

export type RecordsRubricContext = {
  records: readonly DecisionRecord[]
}

export type RootRubricContext = {
  indexFile: string
  adoptionRootRequired: boolean
  indexIds: readonly string[]
  records: readonly DecisionRecord[]
}

export type IndexRubricContext = {
  indexFile: string
  indexExists: boolean
  indexIds: readonly string[]
  indexCounts: ReadonlyMap<string, number>
  records: readonly DecisionRecord[]
  outOfOrderIds: readonly { id: string; previous: number }[]
  appendMissingEntries?: () => void
}

export type DecisionRecordsRubricContext = {
  filename: FilenameRubricContext
  root: RootRubricContext
  frontmatter: RecordsRubricContext
  typeFit: RecordsRubricContext
  body: RecordsRubricContext
  index: IndexRubricContext
}

type IndexDraft = {
  appendMissingEntries: (records: readonly DecisionRecord[], indexCounts: ReadonlyMap<string, number>) => void
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
    const candidate = join(directory, '.ki-config.toml')
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
  const content = readFileSync(config, 'utf8')
  return /^\s*repo_type\s*=\s*["']kb["']/m.test(content) || /^\[ki-kb\]/m.test(content)
}

const isDirectory = (path: string): boolean => existsSync(path) && statSync(path).isDirectory()

const resolveDirectory = (target: string, kbMode: boolean): string => {
  const absolute = resolve(target)
  for (const candidate of (kbMode ? [KB_DIR, CODE_DIR] : [CODE_DIR, KB_DIR]).map((path) => join(absolute, path))) {
    if (isDirectory(candidate)) return candidate
  }
  if (
    isDirectory(absolute) &&
    (['README.md', 'Decisions.md'].some((name) => existsSync(join(absolute, name))) ||
      readdirSync(absolute).some((name) => name.endsWith('.md')))
  )
    return absolute
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

const readRecords = (directory: string, entries: readonly string[], indexFile: string): DecisionRecord[] => {
  const records: DecisionRecord[] = []
  for (const file of entries.filter((entry) => entry.endsWith('.md') && entry !== indexFile)) {
    const content = readFileSync(join(directory, file), 'utf8')
    const frontmatter = content.match(/^---\n([\s\S]*?)\n---/)?.[1]
    const body = content.replace(/^---\n[\s\S]*?\n---\n?/, '')
    const heading = body.match(HEADING)
    const identity = heading?.[1]?.match(ID)
    if (!identity || !heading?.[2]) continue
    const [, prefix, scope, serial] = identity
    const id = `${prefix}-${scope}-${serial}`
    const headingTitle = heading[2].trim()
    const expected = PREFIX_TO_TYPE[prefix] as { decisionType: string; type: string; typeUrl: string }
    records.push({
      file,
      id,
      prefix,
      scope,
      serial,
      expectedDecisionType: expected.decisionType,
      expectedType: expected.type,
      expectedTypeUrl: expected.typeUrl,
      expectedFilename: `${id}-${slugify(headingTitle)}.md`,
      content,
      body,
      ...(frontmatter ? { frontmatter } : {}),
      ...(frontmatterValue(frontmatter, 'id') ? { frontmatterId: frontmatterValue(frontmatter, 'id') } : {}),
      ...(frontmatterValue(frontmatter, 'title') ? { title: frontmatterValue(frontmatter, 'title') } : {}),
      ...(frontmatterValue(frontmatter, 'date') ? { date: frontmatterValue(frontmatter, 'date') } : {}),
      ...(frontmatterValue(frontmatter, 'status') ? { status: frontmatterValue(frontmatter, 'status') } : {}),
      ...(frontmatterValue(frontmatter, 'type') ? { type: frontmatterValue(frontmatter, 'type') } : {}),
      ...(frontmatterValue(frontmatter, 'type_url') ? { typeUrl: frontmatterValue(frontmatter, 'type_url') } : {}),
      ...(frontmatterValue(frontmatter, 'decision_type') ? { decisionType: frontmatterValue(frontmatter, 'decision_type') } : {}),
      sharedRecord: frontmatterValue(frontmatter, 'shared_record') === 'true',
      headingId: id,
      headingTitle,
      missingSections: ['## Context', '## Decision', '## Consequences'].filter((section) => !body.includes(section))
    })
  }
  return records
}

const serialEvidence = (records: readonly DecisionRecord[]) => {
  const idsToFiles = new Map<string, string[]>()
  const serialsBySeries = new Map<string, number[]>()
  const localSerialSeries = new Set(
    records.filter((record) => record.serial !== 'XXX' && !record.sharedRecord).map((record) => `${record.prefix}-${record.scope}`)
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
    const missing = Array.from({ length: maximum }, (_, index) => index + 1).filter((serial) => !unique.includes(serial))
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

const createIndexDraft = (repository: string, path: string, original: string): IndexDraft => {
  let working = original
  return {
    appendMissingEntries: (records, indexCounts) => {
      const missing = records.filter((record) => (indexCounts.get(record.id) ?? 0) === 0)
      if (missing.length === 0) return
      const additions = missing.map((record) => `- [${record.id}](${record.file}) — ${record.headingTitle ?? '(title unknown — see file)'}`)
      working = `${working.replace(/\n*$/, '\n')}${additions.join('\n')}\n`
    },
    proposal: () => (working === original ? undefined : { path: relative(repository, path), content: working })
  }
}

export const createDecisionRecordsSession = ({ mode, repository }: RubricContextOptions): RubricSession<DecisionRecordsRubricContext> => {
  const kbMode = isKb(repository)
  const directory = resolveDirectory(repository, kbMode)
  const exists = isDirectory(directory)
  const entries = exists ? readdirSync(directory).sort() : []
  const indexFile = kbMode ? 'Decisions.md' : 'README.md'
  const indexExists = entries.includes(indexFile)
  const indexPath = join(directory, indexFile)
  const indexContent = indexExists ? readFileSync(indexPath, 'utf8') : ''
  const indexIds = indexContent
    .split('\n')
    .map((line) => line.match(INDEX_ID)?.[1])
    .filter((id): id is string => Boolean(id))
  const indexCounts = new Map<string, number>()
  for (const id of indexIds) indexCounts.set(id, (indexCounts.get(id) ?? 0) + 1)
  const records = readRecords(directory, entries, indexFile)
  const { duplicateIds, serialGaps } = serialEvidence(records)
  const indexDraft = mode === 'conform' && indexExists ? createIndexDraft(repository, indexPath, indexContent) : undefined

  const context: DecisionRecordsRubricContext = {
    filename: {
      invalidFilenames: records.filter((record) => record.file !== record.expectedFilename).map((record) => record.file),
      duplicateIds,
      serialGaps
    },
    root: {
      indexFile,
      adoptionRootRequired: indexContent.includes('<!-- ki-decision-records: adoption-root -->'),
      indexIds,
      records
    },
    frontmatter: { records },
    typeFit: { records },
    body: { records },
    index: {
      indexFile,
      indexExists,
      indexIds,
      indexCounts,
      records,
      outOfOrderIds: revealOrderEvidence(indexIds),
      ...(indexDraft
        ? {
            appendMissingEntries: () => {
              indexDraft.appendMissingEntries(records, indexCounts)
            }
          }
        : {})
    }
  }

  return {
    subjects: [{ families: ['FILENAME', 'ROOT', 'FM', 'TYPE-FIT', 'BODY', 'INDEX'], context: () => context }],
    proposal: () => {
      const indexWrite = indexDraft?.proposal()
      return { writes: indexWrite ? [indexWrite] : [] }
    }
  }
}
