import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, isAbsolute, join, relative, resolve } from 'node:path'
import type {
  AuditOutcome,
  ConformProposal,
  RubricContextOptions,
  RubricOutcomes,
  RubricPublicationContext,
  RubricSession
} from '../../shared/rubric.ts'

export const ZONES = ['Calendar', 'Pillars', 'Resources', 'Streams', 'Admin'] as const
export const STAGING = ['+', '-'] as const
const CONFIG = '.ki-config.toml'
const CONFIG_TABLE = 'ki-repo-kb'
const SNAKE_CASE = /^[a-z][a-z0-9_]*$/

type KiKbConfig = {
  keys: Record<string, string>
  zones: Record<string, string>
  templates: Record<string, string>
  requiredFrontmatter: string[]
  preflight: string[]
}
export type KbEvidenceFinding = {
  level: 'FAIL' | 'WARN' | 'INFO' | 'NOT_APPLICABLE' | 'PASS'
  code: string
  message: string
  subject?: string
}

const isDirectory = (path: string): boolean =>
  existsSync(path) && !lstatSync(path).isSymbolicLink() && lstatSync(path).isDirectory()
const isFile = (path: string): boolean =>
  existsSync(path) && !lstatSync(path).isSymbolicLink() && lstatSync(path).isFile()
const sample = (values: readonly string[], maximum = 10): string =>
  `${values.slice(0, maximum).join('; ')}${values.length > maximum ? `; …+${values.length - maximum} more` : ''}`

const parseConfig = (text: string): { value: KiKbConfig | null; malformed: boolean } => {
  try {
    const document = (Bun.TOML.parse(text) ?? {}) as Record<string, unknown>
    const table = (document.skills as Record<string, unknown> | undefined)?.[CONFIG_TABLE]
    if (!table || typeof table !== 'object' || Array.isArray(table)) return { value: null, malformed: false }
    const record = table as Record<string, unknown>
    const zones =
      record.zones && typeof record.zones === 'object' && !Array.isArray(record.zones)
        ? Object.fromEntries<string>(
            Object.entries(record.zones as Record<string, unknown>).filter(
              (entry): entry is [string, string] => typeof entry[1] === 'string'
            )
          )
        : {}
    const templates =
      record.templates && typeof record.templates === 'object' && !Array.isArray(record.templates)
        ? Object.fromEntries<string>(
            Object.entries(record.templates as Record<string, unknown>).filter(
              (entry): entry is [string, string] => typeof entry[1] === 'string'
            )
          )
        : {}
    return {
      value: {
        keys: Object.fromEntries<string>(
          Object.entries(record)
            .filter(([key]) => !['zones', 'templates', 'required_frontmatter', 'preflight'].includes(key))
            .map(([key, value]) => [key, String(value)] as const)
        ),
        zones,
        templates,
        requiredFrontmatter: Array.isArray(record.required_frontmatter)
          ? record.required_frontmatter.filter((value): value is string => typeof value === 'string')
          : [],
        preflight: Array.isArray(record.preflight)
          ? record.preflight.filter((value): value is string => typeof value === 'string')
          : []
      },
      malformed: false
    }
  } catch {
    return { value: null, malformed: true }
  }
}

const markdownFiles = (directory: string, files: string[] = []): string[] => {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue
    const path = join(directory, entry.name)
    if (entry.isDirectory()) markdownFiles(path, files)
    else if (entry.name.endsWith('.md')) files.push(path)
  }
  return files
}

const frontmatter = (
  text: string
): { keys: string[]; terminated: boolean; valid: boolean; noteType: string | null } | null => {
  const lines = text.split(/\r?\n/)
  if (lines[0]?.trim() !== '---') return null
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)
  if (!match) return { keys: [], terminated: false, valid: false, noteType: null }
  try {
    const parsed = Bun.YAML.parse(match[1] ?? '')
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
      return { keys: [], terminated: true, valid: false, noteType: null }
    const fields = parsed as Record<string, unknown>
    return {
      keys: Object.keys(fields),
      terminated: true,
      valid: true,
      noteType: typeof fields.note_type === 'string' ? fields.note_type : null
    }
  } catch {
    return { keys: [], terminated: true, valid: false, noteType: null }
  }
}

type KbCheck = RubricOutcomes<AuditOutcome>

export type KbZoneContext = {
  readonly requiredLayout: KbCheck
  readonly zoneIndexes: KbCheck
  readonly memoryIndex: KbCheck
  readonly stagingAreas: KbCheck
  readonly outboundPlacement: KbCheck
  readonly scaffoldZoneIndexes?: () => void
  readonly scaffoldMemoryIndex?: () => void
}

export type KbConfigContext = {
  readonly parseable: KbCheck
  readonly knownKeys: KbCheck
  readonly nonRedundantAliases: KbCheck
  readonly canonicalAliasKeys: KbCheck
  readonly boundary: KbCheck
  readonly preflightPaths: KbCheck
}

export type KbAdminContext = {
  readonly subdivisions: KbCheck
  readonly charter: KbCheck
  readonly conformance: KbCheck
}

export type KbRoutingContext = Record<never, never>

export type KbNoteContext = {
  readonly requiredFrontmatter: KbCheck
  readonly frontmatterFences: KbCheck
  readonly frontmatterKeys: KbCheck
  readonly noteType: KbCheck
}

export type KbMemoryContext = {
  readonly anchor: KbCheck
}

export type KbLinkContext = Record<never, never>

export type KbRubricContext = {
  readonly rubric: RubricPublicationContext
  readonly zones: KbZoneContext
  readonly config: KbConfigContext
  readonly admin: KbAdminContext
  readonly routing: KbRoutingContext
  readonly notes: KbNoteContext
  readonly memory: KbMemoryContext
  readonly links: KbLinkContext
}

export const collectKbAuditEvidence = (target: string): readonly KbEvidenceFinding[] => {
  const root = resolve(target)
  const findings: KbEvidenceFinding[] = []
  const add = (level: KbEvidenceFinding['level'], code: string, message: string, subject?: string): void =>
    void findings.push({ level, code, message, ...(subject ? { subject } : {}) })
  if (!isDirectory(root)) {
    add('FAIL', 'ZONE-1', 'Target is not a directory.', root)
    return findings
  }
  const configPath = join(root, CONFIG)
  const parsed = isFile(configPath) ? parseConfig(readFileSync(configPath, 'utf8')) : { value: null, malformed: false }
  const hasCanonicalZone = ZONES.some((zone) => isDirectory(join(root, zone)))
  if (!parsed.value && !parsed.malformed && !hasCanonicalZone) {
    add(
      'NOT_APPLICABLE',
      'ZONE-1',
      'ki-repo-kb is not applicable: no [skills.ki-repo-kb] declaration or canonical KB zone structural marker.'
    )
    return findings
  }
  const config = parsed.value
  const zoneOf = (zone: string): string => config?.zones[zone] ?? zone
  if (!config) {
    add(
      parsed.malformed ? 'FAIL' : 'NOT_APPLICABLE',
      'CONFIG-0',
      parsed.malformed ? 'Cannot parse .ki-config.toml.' : '[skills.ki-repo-kb] is not declared.',
      CONFIG
    )
    for (const code of ['CONFIG-1', 'CONFIG-2', 'CONFIG-3', 'CONFIG-4', 'CONFIG-5'])
      add(
        'NOT_APPLICABLE',
        code,
        parsed.malformed
          ? 'Configuration is malformed; the table cannot be inspected.'
          : '[skills.ki-repo-kb] is not declared.'
      )
  } else {
    add('PASS', 'CONFIG-0', 'The ki-repo-kb configuration table is parseable.', CONFIG)
    for (const key of Object.keys(config.keys))
      add('WARN', 'CONFIG-1', `Unrecognised scalar [skills.ki-repo-kb] key: ${key}.`, CONFIG)
    if (Object.keys(config.keys).length === 0)
      add('PASS', 'CONFIG-1', 'No unrecognised scalar [skills.ki-repo-kb] keys.', CONFIG)
    const aliasable = new Set<string>([...ZONES, ...STAGING])
    for (const [zone, folder] of Object.entries(config.zones)) {
      if (!aliasable.has(zone))
        add('WARN', 'CONFIG-3', `Zone alias ${zone} is not a canonical zone or staging area.`, CONFIG)
      else if (zone === folder)
        add('INFO', 'CONFIG-2', `Zone alias ${zone} restates its canonical folder name.`, CONFIG)
      else add('PASS', 'CONFIG-4', `Zone alias resolves ${zone} to ${folder}/.`, CONFIG)
    }
    if (Object.keys(config.zones).length === 0) {
      add('PASS', 'CONFIG-2', 'No redundant zone aliases.', CONFIG)
      add('PASS', 'CONFIG-3', 'All zone aliases are canonical.', CONFIG)
      add('PASS', 'CONFIG-4', 'Only the ki-repo-kb table was inspected.', CONFIG)
    }
    const missing = config.preflight.filter((path) => !/[*?[\]]/.test(path) && !existsSync(join(root, path)))
    if (missing.length) add('WARN', 'CONFIG-5', `Declared preflight paths are missing: ${sample(missing)}.`, CONFIG)
    else
      add(
        'PASS',
        'CONFIG-5',
        config.preflight.length ? 'Declared literal preflight paths resolve.' : 'No preflight paths are declared.',
        CONFIG
      )
  }
  for (const zone of ZONES) {
    const folder = zoneOf(zone)
    if (!isDirectory(join(root, folder))) {
      add('FAIL', 'ZONE-1', `Required zone ${zone} is missing.`, `${folder}/`)
      continue
    }
    add('PASS', 'ZONE-1', `Required zone ${zone} is present.`, `${folder}/`)
    const index = join(root, folder, `${folder}.md`)
    add(
      isFile(index) ? 'PASS' : 'WARN',
      'ZONE-2',
      isFile(index) ? 'Same-name zone index is present.' : 'Same-name zone index is missing.',
      `${folder}/${folder}.md`
    )
  }
  const admin = zoneOf('Admin')
  if (isDirectory(join(root, admin))) {
    const memory = join(root, admin, 'MEMORY.md')
    add(
      isFile(memory) ? 'PASS' : 'FAIL',
      'ZONE-3',
      isFile(memory) ? 'Root memory index is present.' : 'Root memory index is missing.',
      `${admin}/MEMORY.md`
    )
    for (const subdivision of ['Governance', 'Operations']) {
      const directory = join(root, admin, subdivision)
      const index = join(directory, `${subdivision}.md`)
      add(
        isDirectory(directory) && isFile(index) ? 'PASS' : 'WARN',
        'ADMIN-1',
        isDirectory(directory) ? 'Admin subdivision index is present.' : 'Admin subdivision is absent.',
        `${admin}/${subdivision}/`
      )
    }
    const governance = join(root, admin, 'Governance')
    for (const [code, name, message] of [
      ['ADMIN-2', 'Charter.md', 'Governance charter is present.'],
      ['ADMIN-3', 'Conformance.md', 'Governance conformance record is present.']
    ] as const) {
      const path = join(governance, name)
      add(
        !isDirectory(governance) ? 'NOT_APPLICABLE' : isFile(path) ? 'PASS' : 'WARN',
        code,
        isFile(path) ? message : `${name} is absent.`,
        `${admin}/Governance/${name}`
      )
    }
  } else add('NOT_APPLICABLE', 'ZONE-3', 'Admin zone is absent.')
  for (const staging of STAGING) {
    const folder = zoneOf(staging)
    add(
      'INFO',
      'ZONE-4',
      `${folder}/ is ${isDirectory(join(root, folder)) ? 'present' : 'absent'} staging, not a zone.`,
      `${folder}/`
    )
  }
  const anchor = ['CLAUDE.md', 'AGENTS.md'].find((name) => isFile(join(root, name)))
  if (!anchor) add('WARN', 'MEM-2', 'No root CLAUDE.md or AGENTS.md anchors the memory cascade.')
  else {
    const text = readFileSync(join(root, anchor), 'utf8')
    add(
      /memory|ki-repo-kb/i.test(text) ? 'PASS' : 'WARN',
      'MEM-2',
      /memory|ki-repo-kb/i.test(text)
        ? 'Memory cascade has an always-loaded anchor.'
        : 'Root orientation does not anchor the memory cascade.',
      anchor
    )
  }
  const required = config?.requiredFrontmatter ?? []
  const malformedFrontmatter: string[] = []
  const badKeys: string[] = []
  const missingRequired: string[] = []
  const missingNoteType: string[] = []
  const legacyType: string[] = []
  const misplacedOutputs: string[] = []
  const outbound = `${zoneOf('-')}/`
  for (const path of markdownFiles(root)) {
    const value = frontmatter(readFileSync(path, 'utf8'))
    if (!value) continue
    const relative = path.slice(root.length + 1)
    if (!value.terminated || !value.valid) {
      malformedFrontmatter.push(relative)
      continue
    }
    for (const key of value.keys) if (!SNAKE_CASE.test(key)) badKeys.push(`${relative}: ${key}`)
    for (const key of required) if (!value.keys.includes(key)) missingRequired.push(`${relative} (${key})`)
    if (!value.noteType) missingNoteType.push(relative)
    if (value.keys.includes('type')) legacyType.push(relative)
    if ((value.noteType === 'session-digest' || value.noteType === 'handoff') && !relative.startsWith(outbound))
      misplacedOutputs.push(relative)
  }
  add(
    malformedFrontmatter.length ? 'FAIL' : 'PASS',
    'NOTE-1a',
    malformedFrontmatter.length
      ? `Malformed or unterminated frontmatter: ${sample(malformedFrontmatter)}.`
      : 'Frontmatter fences and YAML are well formed.'
  )
  add(
    missingRequired.length ? 'FAIL' : 'PASS',
    'NOTE-1',
    missingRequired.length
      ? `Required frontmatter is missing: ${sample(missingRequired)}.`
      : required.length
        ? 'Declared required frontmatter is present.'
        : 'No required frontmatter is declared.'
  )
  add(
    badKeys.length ? 'WARN' : 'PASS',
    'NOTE-1b',
    badKeys.length ? `Non-snake_case frontmatter keys: ${sample(badKeys)}.` : 'Frontmatter keys use snake_case.'
  )
  add(
    missingNoteType.length || legacyType.length ? 'FAIL' : 'PASS',
    'NOTE-1c',
    missingNoteType.length || legacyType.length
      ? `Invalid note-type metadata: ${[
          missingNoteType.length ? `missing note_type: ${sample(missingNoteType)}` : '',
          legacyType.length ? `legacy type: ${sample(legacyType)}` : ''
        ]
          .filter(Boolean)
          .join('; ')}.`
      : 'Frontmatter uses note_type and does not use the legacy type field.'
  )
  add(
    misplacedOutputs.length ? 'FAIL' : 'PASS',
    'ZONE-5',
    misplacedOutputs.length
      ? `Produced outputs outside ${outbound}: ${sample(misplacedOutputs)}.`
      : 'Produced outputs are routed to outbound staging.'
  )
  return findings
}

const auditOutcome = (finding: KbEvidenceFinding): AuditOutcome => {
  const evidence = { message: finding.message, ...(finding.subject ? { subject: finding.subject } : {}) }
  if (finding.level === 'FAIL' || finding.level === 'WARN') return { status: 'VIOLATION', ...evidence }
  if (finding.level === 'NOT_APPLICABLE') return { status: 'NOT_APPLICABLE', ...evidence }
  if (finding.level === 'PASS') return { status: 'PASS', ...evidence }
  return { status: 'INFO', ...evidence }
}

const outcomesFor = (findings: readonly KbEvidenceFinding[], code: string): RubricOutcomes<AuditOutcome> => {
  const outcomes = findings.filter((finding) => finding.code === code).map(auditOutcome)
  return outcomes.length > 0
    ? outcomes
    : [{ status: 'NOT_APPLICABLE', message: `${code} did not apply to this target.` }]
}

type KbDraft = {
  scaffoldZoneIndexes: () => void
  scaffoldMemoryIndex: () => void
  proposal: () => ConformProposal
}

const createKbDraft = (repository: string): KbDraft | undefined => {
  const root = resolve(repository)
  if (!isDirectory(root)) return undefined
  const configPath = join(root, CONFIG)
  const parsed = isFile(configPath) ? parseConfig(readFileSync(configPath, 'utf8')) : { value: null, malformed: false }
  const zoneOf = (zone: string): string => parsed.value?.zones[zone] ?? zone
  const creates = new Map<string, string>()
  const contained = (path: string): string | undefined => {
    const value = relative(root, path)
    return value && !isAbsolute(value) && value !== '..' && !value.startsWith('../') ? value : undefined
  }
  const safeDirectory = (path: string): boolean => {
    const output = relative(root, path)
    if (!output) return isDirectory(root)
    if (isAbsolute(output) || output === '..' || output.startsWith('../')) return false
    let cursor = root
    for (const segment of output.split(/[\\/]/)) {
      cursor = join(cursor, segment)
      if (!isDirectory(cursor)) return false
    }
    return true
  }
  const stageCreate = (path: string, content: string): void => {
    const output = contained(path)
    if (!output || existsSync(path) || !safeDirectory(dirname(path))) return
    creates.set(output, content)
  }

  return {
    scaffoldZoneIndexes: () => {
      for (const zone of ZONES) {
        const folder = zoneOf(zone)
        const directory = resolve(root, folder)
        if (!contained(directory) || !safeDirectory(directory)) continue
        stageCreate(join(directory, `${folder}.md`), `# ${folder}\n`)
      }
    },
    scaffoldMemoryIndex: () => {
      const admin = resolve(root, zoneOf('Admin'))
      if (!contained(admin) || !safeDirectory(admin)) return
      stageCreate(join(admin, 'MEMORY.md'), '# MEMORY\n\n## Active Pillars\n\n<!-- list active Pillars here -->\n')
    },
    proposal: () => ({
      writes: [...creates]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([path, content]) => ({ path, content, create: true }))
    })
  }
}

export const createKbSession = ({
  mode,
  repository,
  publication
}: RubricContextOptions): RubricSession<KbRubricContext> => {
  const findings = collectKbAuditEvidence(repository)
  const check = (code: string): KbCheck => outcomesFor(findings, code)
  const draft = mode === 'conform' ? createKbDraft(repository) : undefined
  const context: KbRubricContext = {
    rubric: { publication },
    zones: {
      requiredLayout: check('ZONE-1'),
      zoneIndexes: check('ZONE-2'),
      memoryIndex: check('ZONE-3'),
      stagingAreas: check('ZONE-4'),
      outboundPlacement: check('ZONE-5'),
      ...(draft
        ? {
            scaffoldZoneIndexes: draft.scaffoldZoneIndexes,
            scaffoldMemoryIndex: draft.scaffoldMemoryIndex
          }
        : {})
    },
    config: {
      parseable: check('CONFIG-0'),
      knownKeys: check('CONFIG-1'),
      nonRedundantAliases: check('CONFIG-2'),
      canonicalAliasKeys: check('CONFIG-3'),
      boundary: check('CONFIG-4'),
      preflightPaths: check('CONFIG-5')
    },
    admin: {
      subdivisions: check('ADMIN-1'),
      charter: check('ADMIN-2'),
      conformance: check('ADMIN-3')
    },
    routing: {},
    notes: {
      requiredFrontmatter: check('NOTE-1'),
      frontmatterFences: check('NOTE-1a'),
      frontmatterKeys: check('NOTE-1b'),
      noteType: check('NOTE-1c')
    },
    memory: { anchor: check('MEM-2') },
    links: {}
  }

  return {
    subjects: [
      { families: ['RUBRIC'], context: () => context },
      { families: ['ZONE', 'CONFIG', 'ADMIN', 'ROUTE', 'NOTE', 'MEM', 'LINK'], context: () => context }
    ],
    proposal: () => draft?.proposal() ?? { writes: [] }
  }
}
