#!/usr/bin/env bun
/** Mechanical auditor for flat non-KB repository work items. */
import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

type Level = 'FAIL' | 'WARN' | 'POLISH' | 'ADVISORY' | 'INFO' | 'NA' | 'PASS'
export type Finding = { level: Level; area: string; msg: string; ref?: string; file?: string }
export type Horizon = (typeof HORIZONS)[number]
export type WorkItem = {
  readonly id: string
  readonly area: string | null
  readonly serial: number
  readonly title: string
  readonly theme: string
  readonly horizon: Horizon
  readonly status: string
  readonly candidate: boolean
  readonly blocks: readonly string[]
  readonly blockedBy: readonly string[]
  readonly waitingOnTrades: readonly string[]
  readonly baselineRef: string | null
  readonly file: string
  readonly body: string
}
type RoadmapConfiguration = {
  readonly repoCode: string
  readonly themes: ReadonlySet<string>
  readonly areas: ReadonlyMap<string, string>
}

export const HORIZONS = ['now', 'next', 'soon', 'waiting-for', 'parked', 'future'] as const
export const HORIZON_BLURBS: Record<Horizon, string> = {
  now: 'Receiving current delivery attention. An urgent breakage may be Now, but dependency links—not the horizon—record what it blocks.',
  next: 'The next bounded work to prepare or begin once current Now work permits it.',
  soon: 'Understood and roughly scoped but not yet started — worth doing once the **Next** queue clears, ahead of anything still speculative.',
  'waiting-for':
    'Worth doing, but presently blocked on an external dependency or decision. Revisit when its named condition changes; do not use this horizon for intentionally paused work.',
  parked:
    'Intentionally paused work with no current attention. Revisit only when its priority or named return trigger changes.',
  future:
    'Speculative or not yet scoped — candidate items need a scoping pass (or a decision to drop them) before they are actionable.'
}

const ID_RE = /^[A-Z][A-Z0-9-]{1,23}-\d{3,}$/
const FILE_RE = /^([A-Z][A-Z0-9-]{1,23}-\d{3,})-([a-z0-9]+(?:-[a-z0-9]+)*)\.md$/
const THEME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const AREA_RE = /^[A-Z][A-Z0-9]*$/
const COMMIT_RE = /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/
const TRADE_RE = /^TRD-[0-9a-f]{8}$/
const MAX_TITLE_WORDS = 4
const STATUS = new Set(['draft', 'ready', 'in-progress', 'awaiting-review', 'done'])
const IMMEDIATE = new Set<Horizon>(['now', 'next'])
const STANDARD = 'references/standards-repository-roadmaps.md'
const FORMAT = 'references/standards-work-item-format.md'
const RUBRIC = 'references/rubric.md'
const ROADMAP_CONFIG = 'ki-work-roadmap'
const REPO_CONFIG = 'ki-repo'
export const ISSUE_LEDGER = '_ISSUES.md'
const TOML = (globalThis as unknown as { Bun: { TOML: { parse(text: string): unknown } } }).Bun.TOML

let findings: Finding[] = []
const add = (level: Level, area: string, msg: string, ref = RUBRIC, file?: string): void => {
  findings.push({ level, area, msg, ref, file })
}

const parseScalar = (value: string): string | boolean | null | undefined => {
  const trimmed = value.trim()
  if (trimmed === 'true') return true
  if (trimmed === 'false') return false
  if (trimmed === 'null') return null
  const quoted = trimmed.match(/^(['"])(.*)\1$/)
  return quoted ? quoted[2] : trimmed || undefined
}

const parseFrontmatter = (
  text: string,
  display: string
): { values: Record<string, string | boolean | null | string[] | undefined>; body: string } | undefined => {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!match) {
    add('FAIL', 'ITEM-1', 'work item must begin with YAML frontmatter', FORMAT, display)
    return undefined
  }
  const values: Record<string, string | boolean | null | string[] | undefined> = {}
  for (const line of match[1].split(/\r?\n/)) {
    const field = line.match(/^([a-z][a-z0-9]*(?:_[a-z0-9]+)*):\s*(.*?)\s*$/)
    if (!field) {
      add('FAIL', 'ITEM-1', `frontmatter line is invalid: ${line}`, FORMAT, display)
      continue
    }
    const [, key, raw] = field
    if (key in values) add('FAIL', 'ITEM-1', `frontmatter repeats '${key}'`, FORMAT, display)
    if (raw === '[]') values[key] = []
    else if (/^\[[^\]]*\]$/.test(raw)) {
      values[key] = raw
        .slice(1, -1)
        .split(',')
        .map((value) => value.trim().replace(/^(['"])(.*)\1$/, '$2'))
        .filter(Boolean)
    } else values[key] = parseScalar(raw)
  }
  return { values, body: text.slice(match[0].length) }
}

const isKb = (repository: string): boolean => {
  const config = join(repository, '.ki-config.toml')
  if (!existsSync(config)) return false
  try {
    const parsed = TOML.parse(readFileSync(config, 'utf8')) as Record<string, unknown>
    const table = (parsed.skills as Record<string, unknown> | undefined)?.[REPO_CONFIG]
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

const roadmapConfiguration = (repository: string): RoadmapConfiguration | undefined => {
  const config = join(repository, '.ki-config.toml')
  if (!existsSync(config)) {
    add('FAIL', 'ROAD-6', 'missing .ki-config.toml ki-work-roadmap repo_code', STANDARD, '.ki-config.toml')
    return undefined
  }
  try {
    const parsed = TOML.parse(readFileSync(config, 'utf8')) as Record<string, unknown>
    const repoTable = (parsed.skills as Record<string, unknown> | undefined)?.[REPO_CONFIG]
    const repoValues =
      typeof repoTable === 'object' && repoTable !== null && !Array.isArray(repoTable)
        ? (repoTable as Record<string, unknown>)
        : undefined
    const code = repoValues?.repo_code
    if (typeof code !== 'string' || !/^[A-Z][A-Z0-9-]{1,23}$/.test(code)) {
      add(
        'FAIL',
        'ROAD-6',
        'ki-repo repo_code must be a stable uppercase identifier for a repository declaring ki-work-roadmap',
        STANDARD,
        '.ki-config.toml'
      )
      return undefined
    }
    const table = (parsed.skills as Record<string, unknown> | undefined)?.[ROADMAP_CONFIG]
    const values =
      typeof table === 'object' && table !== null && !Array.isArray(table)
        ? (table as Record<string, unknown>)
        : undefined
    const configuredThemes = values?.themes
    if (configuredThemes !== undefined && (!Array.isArray(configuredThemes) || configuredThemes.length === 0)) {
      add('FAIL', 'ROAD-6', 'roadmap themes must be a non-empty array when declared', STANDARD, '.ki-config.toml')
      return undefined
    }
    if (
      Array.isArray(configuredThemes) &&
      configuredThemes.some((theme) => typeof theme !== 'string' || !THEME_RE.test(theme))
    ) {
      add(
        'FAIL',
        'ROAD-6',
        'ki-work-roadmap themes must contain only lowercase kebab-case names',
        STANDARD,
        '.ki-config.toml'
      )
      return undefined
    }
    if (Array.isArray(configuredThemes) && new Set(configuredThemes).size !== configuredThemes.length) {
      add(
        'FAIL',
        'ROAD-6',
        'ki-work-roadmap themes must not repeat a theme name',
        STANDARD,
        '.ki-config.toml'
      )
      return undefined
    }
    const configuredAreas = values?.areas
    const areas = new Map<string, string>()
    if (configuredAreas !== undefined) {
      if (typeof configuredAreas !== 'object' || configuredAreas === null || Array.isArray(configuredAreas)) {
        add(
          'FAIL',
          'ROAD-6',
          'ki-work-roadmap areas must be a code-to-theme table',
          STANDARD,
          '.ki-config.toml'
        )
        return undefined
      }
      for (const [area, theme] of Object.entries(configuredAreas as Record<string, unknown>)) {
        if (!AREA_RE.test(area) || typeof theme !== 'string' || !THEME_RE.test(theme)) {
          add(
            'FAIL',
            'ROAD-6',
            'roadmap area codes must be uppercase and map to lowercase kebab-case themes',
            STANDARD,
            '.ki-config.toml'
          )
          return undefined
        }
        if (Array.isArray(configuredThemes) && !configuredThemes.includes(theme)) {
          add('FAIL', 'ROAD-6', 'every roadmap area must map to a declared theme', STANDARD, '.ki-config.toml')
          return undefined
        }
        areas.set(area, theme)
      }
      if (!areas.size) {
        add(
          'FAIL',
          'ROAD-6',
          'ki-work-roadmap areas must not be empty when declared',
          STANDARD,
          '.ki-config.toml'
        )
        return undefined
      }
    }
    const themes = new Set(Array.isArray(configuredThemes) ? configuredThemes : areas.values())
    if (!themes.size) {
      add('FAIL', 'ROAD-6', 'roadmap must declare themes or a non-empty areas table', STANDARD, '.ki-config.toml')
      return undefined
    }
    return { repoCode: code, themes, areas }
  } catch {
    add('FAIL', 'ROAD-6', 'cannot parse .ki-config.toml', STANDARD, '.ki-config.toml')
    return undefined
  }
}

const EXECUTION_SECTIONS = [
  'Current state',
  'Steps',
  'Files touched',
  'Verify',
  'Dependencies / blocks',
  'Documentation impact'
] as const
const DOCUMENTATION_IMPACT_SECTIONS = ['Decision Records', 'Specifications', 'Guides', 'Roadmap'] as const
const REVIEW_SECTIONS = [
  'Delivered',
  'Summary of changes',
  'Verification',
  'Outstanding concerns',
  'Post-change review',
  'Mini recap'
] as const

const requiredSections = (item: WorkItem): readonly string[] => {
  const sections: string[] = ['Goal', 'Context', 'Boundary']
  if (item.status === 'draft' && item.horizon === 'soon') sections.push('Shaping')
  if (item.status !== 'draft' || IMMEDIATE.has(item.horizon)) sections.push(...EXECUTION_SECTIONS)
  if (item.status === 'awaiting-review' || item.status === 'done') sections.push('Review')
  if (item.status === 'done') sections.push('Done')
  sections.push('Discussion')
  return sections
}

const headings = (body: string): readonly string[] =>
  body.split(/\r?\n/).flatMap((line) => line.match(/^##\s+(.+?)\s*#*\s*$/)?.[1] ?? [])

const sectionContent = (body: string, heading: string): string | undefined => {
  const lines = body.split(/\r?\n/)
  const start = lines.findIndex((line) => line.match(new RegExp(`^##\\s+${heading}\\s*#*\\s*$`)))
  if (start === -1) return undefined
  const end = lines.findIndex((line, index) => index > start && /^##\s+/.test(line))
  return lines
    .slice(start + 1, end === -1 ? undefined : end)
    .join('\n')
    .trim()
}

const subsectionHeadings = (content: string): readonly string[] =>
  content.split(/\r?\n/).flatMap((line) => line.match(/^###\s+(.+?)\s*#*\s*$/)?.[1] ?? [])

const subsectionContent = (content: string, heading: string): string | undefined => {
  const lines = content.split(/\r?\n/)
  const start = lines.findIndex((line) => line.match(new RegExp(`^###\\s+${heading}\\s*#*\\s*$`)))
  if (start === -1) return undefined

  const end = lines.findIndex((line, index) => index > start && /^#{1,3}\s+/.test(line))
  return lines
    .slice(start + 1, end === -1 ? undefined : end)
    .join('\n')
    .trim()
}

const validateSteps = (item: WorkItem): void => {
  const content = sectionContent(item.body, 'Steps')
  if (content === undefined) return
  const steps = content.split(/\r?\n/).filter((line) => line.trim())
  if (!steps.length || steps.some((step) => !/^- \[(?: |x)\] \S/.test(step))) {
    add('FAIL', 'ITEM-3', '## Steps must contain only task-list entries using - [ ] or - [x]', FORMAT, item.file)
    return
  }
  const hasUnchecked = steps.some((step) => step.startsWith('- [ ]'))
  if (['awaiting-review', 'done'].includes(item.status) && hasUnchecked)
    add('FAIL', 'ITEM-3', 'awaiting-review and done items must mark every Step as - [x]', FORMAT, item.file)
  if (['draft', 'ready'].includes(item.status) && !hasUnchecked)
    add('FAIL', 'ITEM-3', 'draft and ready items must retain at least one - [ ] Step', FORMAT, item.file)
}

const validateDocumentationImpact = (item: WorkItem): void => {
  const impact = sectionContent(item.body, 'Documentation impact')
  if (impact === undefined) return

  const sections = subsectionHeadings(impact)
  if (JSON.stringify(sections) !== JSON.stringify(DOCUMENTATION_IMPACT_SECTIONS)) {
    add(
      'FAIL',
      'EXEC-4',
      `## Documentation impact requires ${DOCUMENTATION_IMPACT_SECTIONS.map((heading) => `### ${heading}`).join(', ')}`,
      FORMAT,
      item.file
    )
    return
  }

  for (const heading of DOCUMENTATION_IMPACT_SECTIONS) {
    if (!subsectionContent(impact, heading)) {
      add('FAIL', 'EXEC-4', `### ${heading} documentation impact is non-empty`, FORMAT, item.file)
    }
  }
}

const validateBody = (item: WorkItem): void => {
  const present = headings(item.body)
  const required = requiredSections(item)
  const sequence = present.filter((heading) => required.includes(heading))
  if (JSON.stringify(sequence) !== JSON.stringify(required))
    add('FAIL', 'ITEM-3', `body must contain ${required.join(' → ')} in order`, FORMAT, item.file)
  if (!sectionContent(item.body, 'Goal')) add('FAIL', 'ITEM-3', '## Goal must be non-empty', FORMAT, item.file)
  if (present.at(-1) !== 'Discussion')
    add('FAIL', 'ITEM-3', '## Discussion must be the final top-level section', FORMAT, item.file)
  if (required.includes('Steps')) validateSteps(item)
  if (required.includes('Documentation impact')) validateDocumentationImpact(item)
  if (item.status === 'awaiting-review' || item.status === 'done') {
    const review = sectionContent(item.body, 'Review')
    if (review && JSON.stringify(subsectionHeadings(review)) !== JSON.stringify(REVIEW_SECTIONS))
      add('FAIL', 'ITEM-3', `## Review must contain ${REVIEW_SECTIONS.join(' → ')} in order`, FORMAT, item.file)
  }
}

const parseItem = (repository: string, name: string, configuration?: RoadmapConfiguration): WorkItem | undefined => {
  const directory = join(repository, 'docs', 'roadmap')
  const absolute = join(directory, name)
  const display = relative(repository, absolute)
  const file = FILE_RE.exec(name)
  if (!file) {
    add('FAIL', 'ITEM-1', 'work-item filename must be <id>-<slug>.md', FORMAT, display)
    return undefined
  }
  if (lstatSync(absolute).isSymbolicLink()) {
    add('FAIL', 'SAFE-1', 'work item must not be a symlink', STANDARD, display)
    return undefined
  }
  const parsed = parseFrontmatter(readFileSync(absolute, 'utf8'), display)
  if (!parsed) return undefined
  const value = (key: string): string | undefined =>
    typeof parsed.values[key] === 'string' ? (parsed.values[key] as string) : undefined
  const id = value('id')
  const area = value('area')
  const title = value('title')
  const theme = value('theme')
  const horizon = value('horizon') as Horizon | undefined
  const status = value('status')
  const blocks = Array.isArray(parsed.values.blocks) ? (parsed.values.blocks as string[]) : undefined
  const blockedBy = Array.isArray(parsed.values.blocked_by) ? (parsed.values.blocked_by as string[]) : undefined
  const waitingOnTrades = Array.isArray(parsed.values.waiting_on_trades)
    ? (parsed.values.waiting_on_trades as string[])
    : undefined
  const baselineRef = parsed.values.baseline_ref
  const candidate = parsed.values.candidate === true
  for (const key of ['id', 'title', 'theme', 'horizon', 'status', 'blocks', 'blocked_by', 'baseline_ref']) {
    if (!(key in parsed.values)) add('FAIL', 'ITEM-1', `frontmatter is missing '${key}'`, FORMAT, display)
  }
  const unexpected = Object.keys(parsed.values).filter(
    (key) =>
      ![
        'id',
        'area',
        'title',
        'theme',
        'horizon',
        'status',
        'candidate',
        'blocks',
        'blocked_by',
        'waiting_on_trades',
        'baseline_ref',
        'transferred_from',
        'housekeeping_template',
        'scheduled_for'
      ].includes(key)
  )
  if (unexpected.length)
    add('FAIL', 'ITEM-1', `frontmatter has unexpected field(s): ${unexpected.join(', ')}`, FORMAT, display)
  if (!id || id !== file[1] || !ID_RE.test(id))
    add('FAIL', 'ITEM-1', 'frontmatter id must match the filename identifier', FORMAT, display)
  if (!title?.trim()) add('FAIL', 'ITEM-1', 'title must be non-empty', FORMAT, display)
  else if (title.trim().split(/\s+/).length > MAX_TITLE_WORDS)
    add('FAIL', 'ITEM-1', `title must contain at most ${MAX_TITLE_WORDS} words`, FORMAT, display)
  if (!theme || !THEME_RE.test(theme)) add('FAIL', 'ITEM-2', 'theme must be lowercase kebab-case', FORMAT, display)
  const configuredArea = configuration && area && configuration.areas.has(area) ? area : undefined
  const issueNumber =
    configuration && id
      ? id.slice(`${configuration.repoCode}${configuration.areas.size ? `-${area ?? ''}` : ''}-`.length)
      : undefined
  const expectedPrefix = configuration?.areas.size
    ? `${configuration.repoCode}-${configuredArea ?? ''}-`
    : `${configuration?.repoCode ?? ''}-`
  if (
    !configuration ||
    !id?.startsWith(expectedPrefix) ||
    !issueNumber ||
    !/^\d{3,}$/.test(issueNumber) ||
    (configuration.areas.size > 0 && (!area || !configuredArea)) ||
    (configuration.areas.size === 0 && area !== undefined)
  )
    add(
      'FAIL',
      'ITEM-1',
      'item identifier must use the configured repository code, optional configured area code, and a zero-padded issue number',
      FORMAT,
      display
    )
  if (!configuration || !theme || !configuration.themes.has(theme))
    add('FAIL', 'ITEM-2', 'item theme must be declared by ki-work-roadmap configuration', FORMAT, display)
  if (configuration?.areas.size && (!area || configuration.areas.get(area) !== theme))
    add(
      'FAIL',
      'ITEM-2',
      'item area must map to its theme in ki-work-roadmap configuration',
      FORMAT,
      display
    )
  if (!horizon || !HORIZONS.includes(horizon))
    add('FAIL', 'ITEM-2', 'horizon must be one canonical value', FORMAT, display)
  if (!status || !STATUS.has(status)) add('FAIL', 'ITEM-2', 'status must be one lifecycle value', FORMAT, display)
  if (!blocks || !blockedBy) add('FAIL', 'ITEM-2', 'blocks and blocked_by must be arrays', FORMAT, display)
  if ('waiting_on_trades' in parsed.values) {
    if (!waitingOnTrades?.length)
      add('FAIL', 'TRADE-2', 'waiting_on_trades must be a non-empty flat array', FORMAT, display)
    else {
      if (waitingOnTrades.some((trade) => !TRADE_RE.test(trade)))
        add('FAIL', 'TRADE-2', 'waiting_on_trades must contain only canonical trade identities', FORMAT, display)
      if (new Set(waitingOnTrades).size !== waitingOnTrades.length)
        add('FAIL', 'TRADE-2', 'waiting_on_trades must not repeat a trade identity', FORMAT, display)
    }
    if (horizon !== 'waiting-for')
      add('FAIL', 'TRADE-2', 'waiting_on_trades is valid only at the waiting-for horizon', FORMAT, display)
  }
  if (baselineRef !== null && (typeof baselineRef !== 'string' || !COMMIT_RE.test(baselineRef)))
    add('FAIL', 'ITEM-2', 'baseline_ref must be null or a full lowercase commit ID', FORMAT, display)
  if (horizon === 'future' ? !candidate : 'candidate' in parsed.values)
    add('FAIL', 'ITEM-2', 'candidate: true is required only for Future items', FORMAT, display)
  if (status && status !== 'draft' && horizon && !IMMEDIATE.has(horizon))
    add('FAIL', 'ITEM-2', 'non-draft item must be in now or next', FORMAT, display)
  if (status === 'draft' && baselineRef !== null)
    add('FAIL', 'ITEM-2', 'draft item baseline_ref must be null', FORMAT, display)
  if (
    status &&
    ['in-progress', 'awaiting-review', 'done'].includes(status) &&
    (typeof baselineRef !== 'string' || !COMMIT_RE.test(baselineRef))
  )
    add('FAIL', 'ITEM-2', 'executing or completed item needs an immutable baseline_ref', FORMAT, display)
  const serial = Number.parseInt(id?.split('-').at(-1) ?? '', 10)
  if (!id || !title || !theme || !horizon || !status || !blocks || !blockedBy || !Number.isSafeInteger(serial))
    return undefined
  const item: WorkItem = {
    id,
    area: area ?? null,
    serial,
    title,
    theme,
    horizon,
    status,
    candidate,
    blocks,
    blockedBy,
    waitingOnTrades: waitingOnTrades ?? [],
    baselineRef: baselineRef as string | null,
    file: display,
    body: parsed.body
  }
  validateBody(item)
  return item
}

export const workItemsFor = (repository: string, configuration?: RoadmapConfiguration): readonly WorkItem[] => {
  const root = resolve(repository)
  const directory = join(root, 'docs', 'roadmap')
  if (!existsSync(directory) || !lstatSync(directory).isDirectory()) return []
  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md') && entry.name !== ISSUE_LEDGER)
    .sort((left, right) => left.name.localeCompare(right.name))
    .flatMap((entry) => [parseItem(root, entry.name, configuration)].filter((item): item is WorkItem => Boolean(item)))
}

const validateDependencies = (items: readonly WorkItem[]): void => {
  const byId = new Map(items.map((item) => [item.id, item]))
  for (const item of items) {
    for (const id of [...item.blocks, ...item.blockedBy])
      if (!byId.has(id)) add('FAIL', 'ITEM-5', `dependency '${id}' does not exist`, FORMAT, item.file)
    for (const id of item.blocks)
      if (!byId.get(id)?.blockedBy.includes(item.id))
        add('FAIL', 'ITEM-5', `blocks '${id}' is not reciprocal`, FORMAT, item.file)
    for (const id of item.blockedBy)
      if (!byId.get(id)?.blocks.includes(item.id))
        add('FAIL', 'ITEM-5', `blocked_by '${id}' is not reciprocal`, FORMAT, item.file)
    if (
      ['ready', 'in-progress', 'awaiting-review'].includes(item.status) &&
      item.blockedBy.some((id) => byId.get(id)?.status !== 'done')
    )
      add('FAIL', 'ITEM-5', 'active item has a non-done blocker', FORMAT, item.file)
  }
}

export const rootRoadmap = (): string =>
  '# Repository roadmap\n\nThis repository manages forward work as canonical structured Markdown work items under [`docs/roadmap/`](docs/roadmap/).\n\nUse `ki` to audit and report these items; `ROADMAP.md` deliberately does not duplicate their queue.\n'

export const issueLedger = (allocation: number | ReadonlyMap<string, number>): string => {
  if (typeof allocation === 'number')
    return `---\nlast_id: ${allocation}\n---\n\n# Roadmap issue ledger\n\nThis ledger reserves every repository-scoped roadmap issue number through \`${allocation.toString().padStart(3, '0')}\`. Allocate the next work item as one greater than \`last_id\`; never lower this value or reuse an issued number after a record is pruned.\n`
  const areas = [...allocation.entries()].sort(([left], [right]) => left.localeCompare(right))
  const values = areas.map(([area, lastId]) => `${area}: ${lastId}`).join(', ')
  const detail = areas
    .map(([area, lastId]) => `- \`${area}\` reserves through \`${lastId.toString().padStart(3, '0')}\`.`)
    .join('\n')
  return `---\nareas: { ${values} }\n---\n\n# Roadmap issue ledger\n\nThis ledger reserves fixed issuing-area namespaces. Allocate the next work item in its area as one greater than that area's high-water mark; never lower a value or reuse an issued number after a record is pruned. Areas are not mutable themes or groups.\n\n${detail}\n`
}

const ledgerAllocation = (text: string): number | ReadonlyMap<string, number> | undefined => {
  const matched = text.match(/^---\r?\nlast_id:\s*(\d+)\s*\r?\n---\r?\n/)
  if (matched) {
    const lastId = Number.parseInt(matched[1], 10)
    return Number.isSafeInteger(lastId) && lastId >= 0 && text === issueLedger(lastId) ? lastId : undefined
  }
  const areaMatch = text.match(/^---\r?\nareas:\s*\{\s*(.*?)\s*}\s*\r?\n---\r?\n/)
  if (!areaMatch) return undefined
  const allocation = new Map<string, number>()
  for (const entry of areaMatch[1].split(',')) {
    const pair = entry.trim().match(/^([A-Z][A-Z0-9]*):\s*(\d+)$/)
    if (!pair || allocation.has(pair[1])) return undefined
    const lastId = Number.parseInt(pair[2], 10)
    if (!Number.isSafeInteger(lastId) || lastId < 0) return undefined
    allocation.set(pair[1], lastId)
  }
  return allocation.size && text === issueLedger(allocation) ? allocation : undefined
}

export const inspectRoadmap = (repository: string): readonly Finding[] => {
  findings = []
  const root = resolve(repository)
  const roadmap = join(root, 'docs', 'roadmap')
  const rootIndexPath = join(root, 'ROADMAP.md')
  if (isKb(root)) {
    if (existsSync(roadmap) || existsSync(rootIndexPath))
      add(
        'FAIL',
        'SCOPE-1',
        'KB repository must use ki-repo-kb-streams instead of repository roadmap artefacts',
        STANDARD
      )
    else add('NA', 'SCOPE-1', 'KB repository: repository-roadmap standard does not apply', STANDARD)
    return findings
  }
  const configuration = roadmapConfiguration(root)
  if (!existsSync(roadmap) || !lstatSync(roadmap).isDirectory()) {
    add('FAIL', 'ROAD-1', 'non-KB repository requires docs/roadmap/ as a directory', STANDARD)
    return findings
  }
  const names = readdirSync(roadmap, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))
  for (const entry of names) {
    const display = relative(root, join(roadmap, entry.name))
    if (!entry.isFile()) {
      add('FAIL', 'ROAD-1', 'docs/roadmap contains only regular work-item files', STANDARD, display)
    }
  }
  const items = workItemsFor(root, configuration)
  const ids = new Set<string>()
  for (const item of items) {
    if (ids.has(item.id)) add('FAIL', 'ITEM-1', `duplicate work-item id '${item.id}'`, FORMAT, item.file)
    ids.add(item.id)
  }
  validateDependencies(items)
  const ledgerPath = join(roadmap, ISSUE_LEDGER)
  if (!existsSync(ledgerPath) || lstatSync(ledgerPath).isSymbolicLink() || !lstatSync(ledgerPath).isFile())
    add(
      'FAIL',
      'ROAD-7',
      `docs/roadmap/${ISSUE_LEDGER} must be a regular issue-allocation ledger`,
      STANDARD,
      `docs/roadmap/${ISSUE_LEDGER}`
    )
  else {
    const allocation = ledgerAllocation(readFileSync(ledgerPath, 'utf8'))
    if (allocation === undefined)
      add(
        'FAIL',
        'ROAD-7',
        `docs/roadmap/${ISSUE_LEDGER} must use the canonical immutable ledger shape`,
        STANDARD,
        `docs/roadmap/${ISSUE_LEDGER}`
      )
    else if (configuration?.areas.size) {
      if (
        typeof allocation === 'number' ||
        [...configuration.areas.keys()].some((area) => !allocation.has(area)) ||
        [...allocation.keys()].some((area) => !configuration.areas.has(area))
      )
        add(
          'FAIL',
          'ROAD-7',
          'issue ledger areas must exactly match configured issuing areas',
          STANDARD,
          `docs/roadmap/${ISSUE_LEDGER}`
        )
      else {
        for (const area of configuration.areas.keys()) {
          const highest = Math.max(0, ...items.filter((item) => item.area === area).map((item) => item.serial))
          const lastId = allocation.get(area) ?? 0
          if (lastId < highest)
            add(
              'FAIL',
              'ROAD-7',
              `issue ledger area ${area} high-water ${lastId} is below retained issue ${highest}`,
              STANDARD,
              `docs/roadmap/${ISSUE_LEDGER}`
            )
        }
      }
    } else {
      const highest = Math.max(0, ...items.map((item) => item.serial))
      if (typeof allocation !== 'number')
        add(
          'FAIL',
          'ROAD-7',
          'repository-scoped roadmap ledger must use last_id',
          STANDARD,
          `docs/roadmap/${ISSUE_LEDGER}`
        )
      else if (allocation < highest)
        add(
          'FAIL',
          'ROAD-7',
          `issue ledger last_id ${allocation} is below retained issue ${highest}`,
          STANDARD,
          `docs/roadmap/${ISSUE_LEDGER}`
        )
    }
  }
  if (!existsSync(rootIndexPath) || lstatSync(rootIndexPath).isSymbolicLink())
    add('FAIL', 'ROOT-1', 'root ROADMAP.md must be a regular work-item orientation', STANDARD, 'ROADMAP.md')
  else if (readFileSync(rootIndexPath, 'utf8') !== rootRoadmap())
    add('FAIL', 'ROOT-1', 'root ROADMAP.md must be the canonical work-item orientation', STANDARD, 'ROADMAP.md')
  return findings
}
