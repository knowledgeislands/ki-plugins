import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type {
  AuditOutcome,
  RubricContextOptions,
  RubricPublicationContext,
  RubricSession
} from '../../shared/rubric.ts'

const RADAR_PATH = fileURLToPath(new URL('../../../references/radar.toml', import.meta.url))
const ID = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/
const FRESHNESS_DAYS = 9

const TOP_LEVEL = new Set(['schema', 'reviewed_on', 'evidence', 'subjects'])
const EVIDENCE_FIELDS = new Set(['id', 'title', 'url', 'evidence_class', 'source_role', 'reviewed_on', 'notes'])
const SUBJECT_FIELDS = new Set([
  'id',
  'display_name',
  'subject_kind',
  'stewardship',
  'specification_maturity',
  'implementation_state',
  'interoperability_state',
  'ki_stance',
  'movement',
  'owner',
  'uncertainty',
  'return_trigger',
  'reviewed_on',
  'evidence',
  'counter_evidence'
])

const SUBJECT_KINDS = new Set([
  'protocol',
  'interface-format',
  'organisation',
  'incubation',
  'architecture-pattern',
  'research-claim',
  'vendor-term'
])
const STEWARDSHIP = new Set(['standards-body', 'foundation', 'consortium', 'vendor', 'community', 'project', 'none'])
const MATURITY = new Set(['not-applicable', 'proposal', 'draft', 'incubating', 'versioned', 'stable', 'deprecated'])
const IMPLEMENTATION = new Set(['none', 'reference-only', 'single-implementation', 'multiple-independent'])
const INTEROPERABILITY = new Set(['untested', 'claimed', 'demonstrated', 'conformance-tested'])
const STANCE = new Set(['adopt', 'trial', 'assess', 'hold'])
const MOVEMENT = new Set(['new', 'inward', 'outward', 'unchanged'])
const EVIDENCE_CLASSES = new Set([
  'normative-text',
  'governance-release',
  'reference-implementation',
  'independent-implementation',
  'conformance-demonstration',
  'interoperability-demonstration',
  'operational-adoption',
  'local-evaluation',
  'research',
  'vendor-claim'
])
const SOURCE_ROLES = new Set(['primary', 'corroborating', 'discovery', 'counter-evidence'])

type Table = Record<string, unknown>

export type RadarOutcomeContext = {
  readonly outcomes: readonly AuditOutcome[]
}

export type AgenticRadarRubricContext = {
  readonly rubric: RubricPublicationContext
  readonly schema: RadarOutcomeContext
  readonly evidence: RadarOutcomeContext
  readonly classification: RadarOutcomeContext
  readonly lifecycle: RadarOutcomeContext
}

const table = (value: unknown): Table | undefined =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Table) : undefined

const pass = (message: string): readonly AuditOutcome[] => [{ status: 'PASS', message }]

const violation = (message: string, level?: 'FAIL' | 'WARN'): AuditOutcome => ({
  status: 'VIOLATION',
  message,
  subject: 'references/radar.toml',
  ...(level ? { level } : {})
})

const isCalendarDate = (value: unknown): value is string => {
  if (typeof value !== 'string') return false
  const match = ISO_DATE.exec(value)
  if (!match) return false
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const parsed = new Date(Date.UTC(year, month - 1, day))
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day
}

const checkDate = (outcomes: AuditOutcome[], value: unknown, label: string, today: Date): void => {
  if (!isCalendarDate(value)) {
    outcomes.push(violation(`${label} must be a real YYYY-MM-DD calendar date`))
    return
  }
  const todayValue = today.toISOString().slice(0, 10)
  if (value > todayValue) {
    outcomes.push(violation(`${label} must not be future-dated`))
    return
  }
  const age = Math.floor((today.getTime() - Date.parse(`${value}T00:00:00Z`)) / 86_400_000)
  if (age > FRESHNESS_DAYS) outcomes.push(violation(`${label} is ${age} days old; refresh after 9 days`, 'WARN'))
}

const checkString = (outcomes: AuditOutcome[], value: unknown, label: string): void => {
  if (typeof value !== 'string' || value.trim() === '') outcomes.push(violation(`${label} must be a non-empty string`))
}

const checkVocabulary = (
  outcomes: AuditOutcome[],
  value: unknown,
  label: string,
  vocabulary: ReadonlySet<string>
): void => {
  if (typeof value !== 'string' || !vocabulary.has(value)) {
    outcomes.push(violation(`${label} must be one of ${[...vocabulary].join(', ')}`))
  }
}

const checkShape = (
  outcomes: AuditOutcome[],
  collection: string,
  id: string,
  value: unknown,
  required: readonly string[],
  allowed: ReadonlySet<string>
): Table | undefined => {
  if (!ID.test(id)) outcomes.push(violation(`${collection} identity ${id} must be lower-case hyphenated`))
  const record = table(value)
  if (!record) {
    outcomes.push(violation(`${collection}.${id} must be a TOML table`))
    return undefined
  }
  if (record.id !== id) outcomes.push(violation(`${collection}.${id}.id must exactly match its table identity`))
  for (const field of required) {
    if (!(field in record)) outcomes.push(violation(`${collection}.${id} is missing required field ${field}`))
  }
  for (const field of Object.keys(record)) {
    if (!allowed.has(field)) outcomes.push(violation(`${collection}.${id} has unrecognised field ${field}`))
  }
  return record
}

const stringArray = (outcomes: AuditOutcome[], value: unknown, label: string): readonly string[] => {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string')) {
    outcomes.push(violation(`${label} must be an array of evidence identities`))
    return []
  }
  if (new Set(value).size !== value.length) outcomes.push(violation(`${label} must not repeat evidence identities`))
  return value as string[]
}

const classesFor = (ids: readonly string[], evidence: Table): readonly string[] =>
  ids.flatMap((id) => {
    const record = table(evidence[id])
    return typeof record?.evidence_class === 'string' ? [record.evidence_class] : []
  })

const hasClass = (classes: readonly string[], value: string): boolean => classes.includes(value)

export const inspectRadar = (source: string, today = new Date()): AgenticRadarRubricContext => {
  const schemaOutcomes: AuditOutcome[] = []
  const evidenceOutcomes: AuditOutcome[] = []
  const classificationOutcomes: AuditOutcome[] = []
  const lifecycleOutcomes: AuditOutcome[] = []

  let root: Table | undefined
  try {
    root = table(Bun.TOML.parse(source))
  } catch (error) {
    schemaOutcomes.push(
      violation(`radar TOML does not parse: ${error instanceof Error ? error.message : String(error)}`)
    )
  }

  if (!root) {
    if (schemaOutcomes.length === 0) schemaOutcomes.push(violation('radar root must be a TOML table'))
    const unavailable: readonly AuditOutcome[] = [
      { status: 'NOT_APPLICABLE', message: 'radar evidence is unavailable until schema parsing succeeds' }
    ]
    return {
      rubric: {},
      schema: { outcomes: schemaOutcomes },
      evidence: { outcomes: unavailable },
      classification: { outcomes: unavailable },
      lifecycle: { outcomes: unavailable }
    }
  }

  if (root.schema !== 1) schemaOutcomes.push(violation('schema must equal 1'))
  checkDate(lifecycleOutcomes, root.reviewed_on, 'snapshot reviewed_on', today)
  for (const key of Object.keys(root)) {
    if (!TOP_LEVEL.has(key)) schemaOutcomes.push(violation(`radar root has unrecognised field ${key}`))
  }

  const evidence = table(root.evidence)
  const subjects = table(root.subjects)
  if (!evidence) schemaOutcomes.push(violation('evidence must be a TOML map table'))
  if (!subjects) schemaOutcomes.push(violation('subjects must be a TOML map table'))
  const evidenceRecords = evidence ?? {}
  const subjectRecords = subjects ?? {}
  const evidenceIds = new Set(Object.keys(evidenceRecords))

  for (const [id, value] of Object.entries(evidenceRecords)) {
    const record = checkShape(
      schemaOutcomes,
      'evidence',
      id,
      value,
      ['id', 'title', 'url', 'evidence_class', 'source_role', 'reviewed_on', 'notes'],
      EVIDENCE_FIELDS
    )
    if (!record) continue
    checkString(schemaOutcomes, record.title, `evidence.${id}.title`)
    checkString(schemaOutcomes, record.notes, `evidence.${id}.notes`)
    if (typeof record.url !== 'string' || !/^https?:\/\/[^\s]+$/.test(record.url)) {
      evidenceOutcomes.push(violation(`evidence.${id}.url must be an HTTP(S) URL`))
    }
    checkVocabulary(evidenceOutcomes, record.evidence_class, `evidence.${id}.evidence_class`, EVIDENCE_CLASSES)
    checkVocabulary(evidenceOutcomes, record.source_role, `evidence.${id}.source_role`, SOURCE_ROLES)
    checkDate(lifecycleOutcomes, record.reviewed_on, `evidence.${id}.reviewed_on`, today)
    if (record.evidence_class === 'vendor-claim' && record.source_role === 'primary') {
      evidenceOutcomes.push(violation(`evidence.${id} vendor-claim cannot have primary source_role`))
    }
    if (record.evidence_class === 'local-evaluation' && record.source_role === 'discovery') {
      evidenceOutcomes.push(violation(`evidence.${id} local-evaluation cannot have discovery source_role`))
    }
  }

  for (const [id, value] of Object.entries(subjectRecords)) {
    const record = checkShape(
      schemaOutcomes,
      'subjects',
      id,
      value,
      [
        'id',
        'display_name',
        'subject_kind',
        'stewardship',
        'specification_maturity',
        'implementation_state',
        'interoperability_state',
        'ki_stance',
        'movement',
        'owner',
        'uncertainty',
        'return_trigger',
        'reviewed_on',
        'evidence',
        'counter_evidence'
      ],
      SUBJECT_FIELDS
    )
    if (!record) continue

    for (const field of ['display_name', 'owner', 'uncertainty', 'return_trigger']) {
      checkString(schemaOutcomes, record[field], `subjects.${id}.${field}`)
    }
    checkVocabulary(classificationOutcomes, record.subject_kind, `subjects.${id}.subject_kind`, SUBJECT_KINDS)
    checkVocabulary(classificationOutcomes, record.stewardship, `subjects.${id}.stewardship`, STEWARDSHIP)
    checkVocabulary(
      classificationOutcomes,
      record.specification_maturity,
      `subjects.${id}.specification_maturity`,
      MATURITY
    )
    checkVocabulary(
      classificationOutcomes,
      record.implementation_state,
      `subjects.${id}.implementation_state`,
      IMPLEMENTATION
    )
    checkVocabulary(
      classificationOutcomes,
      record.interoperability_state,
      `subjects.${id}.interoperability_state`,
      INTEROPERABILITY
    )
    checkVocabulary(lifecycleOutcomes, record.ki_stance, `subjects.${id}.ki_stance`, STANCE)
    checkVocabulary(lifecycleOutcomes, record.movement, `subjects.${id}.movement`, MOVEMENT)
    checkDate(lifecycleOutcomes, record.reviewed_on, `subjects.${id}.reviewed_on`, today)

    const supporting = stringArray(evidenceOutcomes, record.evidence, `subjects.${id}.evidence`)
    const counter = stringArray(evidenceOutcomes, record.counter_evidence, `subjects.${id}.counter_evidence`)
    for (const reference of [...supporting, ...counter]) {
      if (!evidenceIds.has(reference)) {
        evidenceOutcomes.push(violation(`subjects.${id} references missing evidence ${reference}`))
      }
    }
    for (const reference of supporting) {
      const source = table(evidenceRecords[reference])
      if (source?.source_role === 'counter-evidence') {
        evidenceOutcomes.push(violation(`subjects.${id}.evidence uses counter-evidence record ${reference}`))
      }
      if (source?.source_role === 'discovery') {
        evidenceOutcomes.push(violation(`subjects.${id}.evidence uses discovery-only record ${reference}`))
      }
    }
    for (const reference of counter) {
      const source = table(evidenceRecords[reference])
      if (source && source.source_role !== 'counter-evidence') {
        evidenceOutcomes.push(violation(`subjects.${id}.counter_evidence uses non-counter record ${reference}`))
      }
    }
    const overlap = supporting.filter((reference) => counter.includes(reference))
    if (overlap.length > 0)
      evidenceOutcomes.push(violation(`subjects.${id} repeats evidence across support and counter lists`))

    const classes = classesFor(supporting, evidenceRecords)
    const primaryClasses = supporting.flatMap((reference) => {
      const source = table(evidenceRecords[reference])
      return source?.source_role === 'primary' && typeof source.evidence_class === 'string'
        ? [source.evidence_class]
        : []
    })
    const kind = record.subject_kind
    const maturity = record.specification_maturity
    if (
      ['architecture-pattern', 'research-claim', 'vendor-term', 'organisation'].includes(String(kind)) &&
      maturity !== 'not-applicable'
    ) {
      classificationOutcomes.push(
        violation(`subjects.${id} ${String(kind)} must use not-applicable specification_maturity`)
      )
    }
    if (
      ['versioned', 'stable', 'deprecated'].includes(String(maturity)) &&
      !hasClass(primaryClasses, 'normative-text')
    ) {
      classificationOutcomes.push(
        violation(`subjects.${id} ${String(maturity)} maturity requires primary normative-text evidence`)
      )
    }
    if (maturity === 'stable' && !hasClass(classes, 'governance-release')) {
      classificationOutcomes.push(violation(`subjects.${id} stable maturity requires governance-release evidence`))
    }
    if (record.implementation_state === 'reference-only' && !hasClass(classes, 'reference-implementation')) {
      classificationOutcomes.push(
        violation(`subjects.${id} reference-only state requires reference-implementation evidence`)
      )
    }
    if (
      record.implementation_state === 'single-implementation' &&
      !hasClass(classes, 'reference-implementation') &&
      !hasClass(classes, 'independent-implementation')
    ) {
      classificationOutcomes.push(
        violation(`subjects.${id} single-implementation state requires implementation evidence`)
      )
    }
    if (
      record.implementation_state === 'multiple-independent' &&
      classes.filter((entry) => entry === 'independent-implementation').length < 2
    ) {
      classificationOutcomes.push(
        violation(`subjects.${id} multiple-independent state requires two independent-implementation records`)
      )
    }
    if (record.interoperability_state === 'demonstrated' && !hasClass(classes, 'interoperability-demonstration')) {
      classificationOutcomes.push(
        violation(`subjects.${id} demonstrated interoperability requires interoperability-demonstration evidence`)
      )
    }
    if (record.interoperability_state === 'conformance-tested' && !hasClass(classes, 'conformance-demonstration')) {
      classificationOutcomes.push(
        violation(`subjects.${id} conformance-tested interoperability requires conformance-demonstration evidence`)
      )
    }
    if (['adopt', 'trial'].includes(String(record.ki_stance)) && !hasClass(classes, 'local-evaluation')) {
      lifecycleOutcomes.push(
        violation(`subjects.${id} ${String(record.ki_stance)} stance requires local-evaluation evidence`)
      )
    }
    if (record.movement === 'inward' && record.ki_stance === 'hold') {
      lifecycleOutcomes.push(violation(`subjects.${id} inward movement cannot accompany hold stance`))
    }
    if (record.movement === 'outward' && record.ki_stance === 'adopt') {
      lifecycleOutcomes.push(violation(`subjects.${id} outward movement cannot accompany adopt stance`))
    }
  }

  return {
    rubric: {},
    schema: {
      outcomes: schemaOutcomes.length ? schemaOutcomes : pass('Radar schema, identities, and owners are valid.')
    },
    evidence: {
      outcomes: evidenceOutcomes.length ? evidenceOutcomes : pass('Evidence records, roles, and references are valid.')
    },
    classification: {
      outcomes: classificationOutcomes.length
        ? classificationOutcomes
        : pass('Subject classifications have the required evidence support.')
    },
    lifecycle: {
      outcomes: lifecycleOutcomes.length
        ? lifecycleOutcomes
        : pass('Review dates, stances, and movements are coherent.')
    }
  }
}

export const createAgenticRadarSession = ({
  publication
}: RubricContextOptions): RubricSession<AgenticRadarRubricContext> => {
  const inspected = inspectRadar(readFileSync(RADAR_PATH, 'utf8'))
  const context: AgenticRadarRubricContext = { ...inspected, rubric: { publication } }
  return {
    subjects: [
      {
        subject: 'references/radar.toml',
        families: ['SCHEMA', 'EVIDENCE', 'CLASSIFICATION', 'LIFECYCLE'],
        context: () => context
      },
      { subject: 'references/rubric.md', families: ['RUBRIC'], context: () => context }
    ],
    proposal: () => ({ writes: [] })
  }
}
