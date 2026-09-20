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

const TABLES = ['benchmarks', 'evidence', 'models', 'routes'] as const
const TOP_LEVEL = new Set(['schema', 'reviewed_on', ...TABLES])

const MODEL_FIELDS = new Set([
  'id',
  'display_name',
  'provider',
  'openness',
  'license',
  'retirement',
  'reviewed_on',
  'evidence',
  'counter_evidence'
])
const ROUTE_FIELDS = new Set([
  'id',
  'model',
  'agent',
  'protocol',
  'access',
  'locality',
  'recommendation',
  'support',
  'movement',
  'reviewed_on',
  'evidence',
  'counter_evidence'
])
const BENCHMARK_FIELDS = new Set([
  'id',
  'display_name',
  'owner',
  'unit',
  'domain',
  'metric',
  'constraints',
  'reproducibility',
  'risks',
  'run_cost',
  'applicability',
  'lifecycle',
  'published_on',
  'data_as_of',
  'reviewed_on',
  'evidence',
  'successor'
])
const EVIDENCE_FIELDS = new Set(['id', 'title', 'url', 'unit', 'independence', 'reviewed_on', 'notes'])

const UNITS = new Set(['bare-model', 'provider-endpoint', 'model-agent', 'task-environment'])
const OPENNESS = new Set(['proprietary', 'open-weight', 'open-source-ai-definition'])
const RETIREMENT = new Set(['active', 'retiring', 'retired'])
const ACCESS = new Set(['vendor-api', 'gateway-api', 'subscription-agent', 'self-hosted'])
const LOCALITY = new Set(['laptop', 'workstation', 'server', 'cluster', 'unavailable'])
const RECOMMENDATION = new Set(['adopt', 'trial', 'assess', 'hold'])
const SUPPORT = new Set(['default', 'available', 'evaluation', 'not-integrated'])
const MOVEMENT = new Set(['new', 'inward', 'outward', 'unchanged'])
const APPLICABILITY = new Set(['primary', 'corroborating', 'discovery', 'not-applicable'])
const BENCHMARK_LIFECYCLE = new Set(['current', 'watch', 'retired'])
const INDEPENDENCE = new Set(['provider', 'independent', 'local'])

type Table = Record<string, unknown>

export type RadarOutcomeContext = {
  readonly outcomes: readonly AuditOutcome[]
}

export type RadarLifecycleContext = {
  readonly vocabularyAndDates: readonly AuditOutcome[]
  readonly consistency: readonly AuditOutcome[]
}

export type ModelRadarRubricContext = {
  readonly rubric: RubricPublicationContext
  readonly schema: RadarOutcomeContext
  readonly evidence: RadarOutcomeContext
  readonly lifecycle: RadarLifecycleContext
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

const todayString = (today: Date): string => today.toISOString().slice(0, 10)

const checkDate = (outcomes: AuditOutcome[], value: unknown, label: string, today: Date, stale = true): void => {
  if (!isCalendarDate(value)) {
    outcomes.push(violation(`${label} must be a real YYYY-MM-DD calendar date`))
    return
  }
  if (value > todayString(today)) {
    outcomes.push(violation(`${label} must not be future-dated`))
    return
  }
  const age = Math.floor((today.getTime() - Date.parse(`${value}T00:00:00Z`)) / 86_400_000)
  if (stale && age > FRESHNESS_DAYS)
    outcomes.push(violation(`${label} is ${age} days old; refresh after 9 days`, 'WARN'))
}

const checkRecordShape = (
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

const stringArray = (outcomes: AuditOutcome[], value: unknown, label: string): readonly string[] => {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string')) {
    outcomes.push(violation(`${label} must be an array of evidence identities`))
    return []
  }
  if (new Set(value).size !== value.length) outcomes.push(violation(`${label} must not repeat evidence identities`))
  return value as string[]
}

export const inspectRadar = (source: string, today = new Date()): ModelRadarRubricContext => {
  const schemaOutcomes: AuditOutcome[] = []
  const evidenceOutcomes: AuditOutcome[] = []
  const vocabularyOutcomes: AuditOutcome[] = []
  const consistencyOutcomes: AuditOutcome[] = []

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
      lifecycle: { vocabularyAndDates: unavailable, consistency: unavailable }
    }
  }

  if (root.schema !== 1) schemaOutcomes.push(violation('schema must equal 1'))
  checkDate(vocabularyOutcomes, root.reviewed_on, 'snapshot reviewed_on', today)
  for (const key of Object.keys(root)) {
    if (!TOP_LEVEL.has(key)) schemaOutcomes.push(violation(`radar root has unrecognised field ${key}`))
  }

  const collections: Record<(typeof TABLES)[number], Table> = {
    benchmarks: {},
    evidence: {},
    models: {},
    routes: {}
  }
  for (const name of TABLES) {
    const records = table(root[name])
    if (!records) schemaOutcomes.push(violation(`${name} must be a TOML map table`))
    else collections[name] = records
  }

  const evidenceIds = new Set(Object.keys(collections.evidence))
  const modelIds = new Set(Object.keys(collections.models))
  const benchmarkIds = new Set(Object.keys(collections.benchmarks))

  for (const [id, value] of Object.entries(collections.evidence)) {
    const record = checkRecordShape(
      schemaOutcomes,
      'evidence',
      id,
      value,
      ['id', 'title', 'url', 'unit', 'independence', 'reviewed_on'],
      EVIDENCE_FIELDS
    )
    if (!record) continue
    checkString(evidenceOutcomes, record.title, `evidence.${id}.title`)
    if (typeof record.url !== 'string' || !/^https?:\/\/[^\s]+$/.test(record.url)) {
      evidenceOutcomes.push(violation(`evidence.${id}.url must be an HTTP(S) URL`))
    }
    checkVocabulary(evidenceOutcomes, record.unit, `evidence.${id}.unit`, UNITS)
    checkVocabulary(evidenceOutcomes, record.independence, `evidence.${id}.independence`, INDEPENDENCE)
    checkDate(vocabularyOutcomes, record.reviewed_on, `evidence.${id}.reviewed_on`, today)
  }

  const checkLinks = (record: Table, prefix: string, includeCounter = true): void => {
    const fields = includeCounter ? ['evidence', 'counter_evidence'] : ['evidence']
    for (const field of fields) {
      for (const reference of stringArray(evidenceOutcomes, record[field], `${prefix}.${field}`)) {
        if (!evidenceIds.has(reference))
          evidenceOutcomes.push(violation(`${prefix}.${field} references missing evidence ${reference}`))
      }
    }
  }

  for (const [id, value] of Object.entries(collections.models)) {
    const record = checkRecordShape(
      schemaOutcomes,
      'models',
      id,
      value,
      [
        'id',
        'display_name',
        'provider',
        'openness',
        'license',
        'retirement',
        'reviewed_on',
        'evidence',
        'counter_evidence'
      ],
      MODEL_FIELDS
    )
    if (!record) continue
    for (const field of ['display_name', 'provider', 'license'])
      checkString(schemaOutcomes, record[field], `models.${id}.${field}`)
    checkVocabulary(vocabularyOutcomes, record.openness, `models.${id}.openness`, OPENNESS)
    checkVocabulary(vocabularyOutcomes, record.retirement, `models.${id}.retirement`, RETIREMENT)
    checkDate(vocabularyOutcomes, record.reviewed_on, `models.${id}.reviewed_on`, today)
    checkLinks(record, `models.${id}`)
  }

  for (const [id, value] of Object.entries(collections.routes)) {
    const record = checkRecordShape(
      schemaOutcomes,
      'routes',
      id,
      value,
      [
        'id',
        'model',
        'agent',
        'protocol',
        'access',
        'locality',
        'recommendation',
        'support',
        'movement',
        'reviewed_on',
        'evidence',
        'counter_evidence'
      ],
      ROUTE_FIELDS
    )
    if (!record) continue
    checkString(schemaOutcomes, record.agent, `routes.${id}.agent`)
    checkString(schemaOutcomes, record.protocol, `routes.${id}.protocol`)
    if (typeof record.model !== 'string' || !modelIds.has(record.model)) {
      schemaOutcomes.push(violation(`routes.${id}.model must reference an existing model`))
    }
    checkVocabulary(vocabularyOutcomes, record.access, `routes.${id}.access`, ACCESS)
    checkVocabulary(vocabularyOutcomes, record.locality, `routes.${id}.locality`, LOCALITY)
    checkVocabulary(vocabularyOutcomes, record.recommendation, `routes.${id}.recommendation`, RECOMMENDATION)
    checkVocabulary(vocabularyOutcomes, record.support, `routes.${id}.support`, SUPPORT)
    checkVocabulary(vocabularyOutcomes, record.movement, `routes.${id}.movement`, MOVEMENT)
    checkDate(vocabularyOutcomes, record.reviewed_on, `routes.${id}.reviewed_on`, today)
    checkLinks(record, `routes.${id}`)

    const model = typeof record.model === 'string' ? table(collections.models[record.model]) : undefined
    if (record.support === 'default' && record.recommendation !== 'adopt') {
      consistencyOutcomes.push(violation(`routes.${id} default support requires adopt recommendation`))
    }
    if (record.support === 'default' && model?.retirement !== 'active') {
      consistencyOutcomes.push(violation(`routes.${id} default support requires an active model`))
    }
    if (model?.retirement === 'retired' && (record.support !== 'not-integrated' || record.recommendation !== 'hold')) {
      consistencyOutcomes.push(violation(`routes.${id} for a retired model must be hold and not-integrated`))
    }
  }

  for (const [id, value] of Object.entries(collections.benchmarks)) {
    const record = checkRecordShape(
      schemaOutcomes,
      'benchmarks',
      id,
      value,
      [
        'id',
        'display_name',
        'owner',
        'unit',
        'domain',
        'metric',
        'constraints',
        'reproducibility',
        'risks',
        'run_cost',
        'applicability',
        'lifecycle',
        'published_on',
        'data_as_of',
        'reviewed_on',
        'evidence'
      ],
      BENCHMARK_FIELDS
    )
    if (!record) continue
    for (const field of [
      'display_name',
      'owner',
      'domain',
      'metric',
      'constraints',
      'reproducibility',
      'risks',
      'run_cost'
    ]) {
      checkString(schemaOutcomes, record[field], `benchmarks.${id}.${field}`)
    }
    checkVocabulary(evidenceOutcomes, record.unit, `benchmarks.${id}.unit`, UNITS)
    checkVocabulary(vocabularyOutcomes, record.applicability, `benchmarks.${id}.applicability`, APPLICABILITY)
    checkVocabulary(vocabularyOutcomes, record.lifecycle, `benchmarks.${id}.lifecycle`, BENCHMARK_LIFECYCLE)
    checkDate(vocabularyOutcomes, record.published_on, `benchmarks.${id}.published_on`, today, false)
    checkDate(vocabularyOutcomes, record.data_as_of, `benchmarks.${id}.data_as_of`, today, false)
    checkDate(vocabularyOutcomes, record.reviewed_on, `benchmarks.${id}.reviewed_on`, today)
    checkLinks(record, `benchmarks.${id}`, false)
    if (
      record.successor !== undefined &&
      (typeof record.successor !== 'string' || !benchmarkIds.has(record.successor))
    ) {
      consistencyOutcomes.push(violation(`benchmarks.${id}.successor must reference an existing benchmark`))
    }
    if (record.lifecycle === 'retired' && record.applicability !== 'not-applicable') {
      consistencyOutcomes.push(violation(`benchmarks.${id} retired lifecycle requires not-applicable status`))
    }
    if (record.lifecycle === 'current' && record.applicability === 'not-applicable') {
      consistencyOutcomes.push(violation(`benchmarks.${id} current lifecycle cannot be not-applicable`))
    }
  }

  return {
    rubric: {},
    schema: {
      outcomes: schemaOutcomes.length ? schemaOutcomes : pass('Radar schema and record identities are valid.')
    },
    evidence: {
      outcomes: evidenceOutcomes.length
        ? evidenceOutcomes
        : pass('Evidence records and references are structurally valid.')
    },
    lifecycle: {
      vocabularyAndDates: vocabularyOutcomes.length
        ? vocabularyOutcomes
        : pass('Radar vocabulary and review dates are valid.'),
      consistency: consistencyOutcomes.length
        ? consistencyOutcomes
        : pass('Radar support and lifecycle combinations are coherent.')
    }
  }
}

export const createModelRadarSession = ({
  publication
}: RubricContextOptions): RubricSession<ModelRadarRubricContext> => {
  const inspected = inspectRadar(readFileSync(RADAR_PATH, 'utf8'))
  const context: ModelRadarRubricContext = { ...inspected, rubric: { publication } }
  return {
    subjects: [
      { subject: 'references/radar.toml', families: ['SCHEMA', 'EVIDENCE', 'LIFECYCLE'], context: () => context },
      { subject: 'references/rubric.md', families: ['RUBRIC'], context: () => context }
    ],
    proposal: () => ({ writes: [] })
  }
}
