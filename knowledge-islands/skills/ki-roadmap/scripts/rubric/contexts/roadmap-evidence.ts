#!/usr/bin/env bun
/** Mechanical auditor for the non-KB repository-roadmap standard. */
import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

type Level = 'FAIL' | 'WARN' | 'POLISH' | 'ADVISORY' | 'INFO' | 'NA' | 'PASS'
export type Finding = { level: Level; area: string; msg: string; ref?: string; file?: string }
type Horizon = (typeof HORIZONS)[number]
type LocalPlanReference = { id: string | null; path: string | null; line: number; final: boolean }
type Item = { theme: string; title: string; slug: string; anchor: string; horizon: Horizon; file: string; references: LocalPlanReference[] }
type Plan = {
  id: string
  theme: string
  file: string
  name: string
  fm: Record<string, string>
  blocks: string[]
  blockedBy: string[]
}
type Frontmatter = {
  values: Record<string, string>
  raw: string
  body: string
  duplicateKeys: string[]
  unparsedLines: string[]
}

const HORIZONS = ['Blocking', 'Next', 'Soon', 'Waiting for', 'Future'] as const
const HORIZON_BLURBS: Record<Horizon, string> = {
  Blocking:
    'Actively broken, or blocking the `Next` horizon: takes priority over everything else and must clear before `Next` work proceeds. Empty means nothing is on fire.',
  Next: 'Scoped and ready to start — the immediate queue, picked up before anything in **Soon** or **Future**.',
  Soon: 'Understood and roughly scoped but not yet started — worth doing once the **Next** queue clears, ahead of anything still speculative.',
  'Waiting for':
    'Worth doing, but presently blocked on an external dependency or decision. Revisit when its named condition changes rather than treating it as dormant local work.',
  Future:
    "Speculative or not yet scoped — items marked _(candidate)_ need a scoping pass (or a decision to drop them) before they're actionable."
}
const NEAR = new Set<Horizon>(['Blocking', 'Next'])
const THEME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const THEME_CODE_RE = /^[A-Z][A-Z0-9]{1,7}$/
const PLAN_ID_RE = /^[A-Z][A-Z0-9]{1,7}-\d{3,}$/
const COMMIT_ID_RE = /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/
const PLAN_RE = /^([A-Z][A-Z0-9]{1,7}-\d{3,})-([a-z0-9]+(?:-[a-z0-9]+)*)\.md$/
const PLAN_LINE_RE = /^\*\*Plan:\*\* \[([A-Z][A-Z0-9]{1,7}-\d{3,})\]\((plans\/[A-Z][A-Z0-9]{1,7}-\d{3,}-[a-z0-9]+(?:-[a-z0-9]+)*\.md)\)$/
const REQUIRED = ['id', 'title', 'status', 'roadmap', 'blocks', 'blocked-by', 'baseline-ref']
const OPTIONAL = ['transferred-from']
const VALID_STATUS = new Set(['open', 'ready', 'in-progress', 'acceptance', 'done'])
const STANDARD_REF = 'references/standards-repository-roadmaps.md'
const FORMAT_REF = 'references/standards-plan-format.md'
const RUBRIC_REF = 'references/rubric.md'
const TOML = (globalThis as unknown as { Bun: { TOML: { parse(text: string): unknown } } }).Bun.TOML
let findings: Finding[] = []
const add = (level: Level, area: string, msg: string, ref = RUBRIC_REF, file?: string): void => {
  findings.push({ level, area, msg, ref, file })
}

let root = ''

function isKb(repo: string): boolean {
  const config = join(repo, '.ki-config.toml')
  if (!existsSync(config)) return false
  try {
    const parsed = TOML.parse(readFileSync(config, 'utf8')) as Record<string, unknown>
    const repoTable = parsed['ki-repo']
    return (
      parsed.repo_type === 'kb' ||
      (typeof repoTable === 'object' && repoTable !== null && (repoTable as Record<string, unknown>).repo_type === 'kb')
    )
  } catch {
    return /^\s*repo_type\s*=\s*["']kb["']/m.test(readFileSync(config, 'utf8'))
  }
}

function markdownHeadings(text: string): Array<{ level: number; title: string; line: number }> {
  const result: Array<{ level: number; title: string; line: number }> = []
  let fence: '`' | '~' | null = null
  for (const [index, line] of text.split(/\r?\n/).entries()) {
    const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/)
    if (fenceMatch) {
      const kind = fenceMatch[1][0] as '`' | '~'
      fence = fence === null ? kind : fence === kind ? null : fence
      continue
    }
    if (fence) continue
    const match = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/)
    if (match) result.push({ level: match[1].length, title: match[2].trim(), line: index + 1 })
  }
  return result
}

function itemSlug(title: string): string {
  return title
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[`*_~]/g, '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function headingAnchor(title: string): string {
  return title
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[`*_~]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}\s_-]/gu, '')
    .replace(/\s/g, '-')
}

function parseRoadmap(path: string, display: string, theme?: string): Item[] {
  if (lstatSync(path).isSymbolicLink()) {
    add('FAIL', 'SAFE-1', 'authored roadmap must not be a symlink', STANDARD_REF, display)
    return []
  }
  const text = readFileSync(path, 'utf8')
  const lines = text.split(/\r?\n/)
  const headings = markdownHeadings(text)
  const h1 = headings.filter((heading) => heading.level === 1)
  if (h1.length !== 1) add('FAIL', 'ROAD-1', `expected exactly one H1; found ${h1.length}`, STANDARD_REF, display)
  const h2 = headings.filter((heading) => heading.level === 2).map((heading) => heading.title)
  if (JSON.stringify(h2) !== JSON.stringify(HORIZONS)) {
    add('FAIL', 'ROAD-1', `horizons must be exactly ${HORIZONS.join(' → ')}; found ${h2.join(' → ') || 'none'}`, STANDARD_REF, display)
  }
  for (const heading of headings.filter(
    (candidate): candidate is typeof candidate & { title: Horizon } =>
      candidate.level === 2 && HORIZONS.includes(candidate.title as Horizon)
  )) {
    if (lines[heading.line] !== '' || lines[heading.line + 1] !== HORIZON_BLURBS[heading.title]) {
      add('FAIL', 'ROAD-4', `the ${heading.title} horizon must be followed immediately by its canonical blurb`, STANDARD_REF, display)
    }
  }
  if (!theme) return []

  const items: Item[] = []
  let horizon: Horizon | null = null
  let current: Item | null = null
  let currentReference: LocalPlanReference | null = null
  let fence: '`' | '~' | null = null
  for (const [index, line] of lines.entries()) {
    const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/)
    if (fenceMatch) {
      const kind = fenceMatch[1][0] as '`' | '~'
      fence = fence === null ? kind : fence === kind ? null : fence
      continue
    }
    if (fence) continue
    const heading = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/)
    if (heading) {
      if (heading[1].length === 2) {
        horizon = HORIZONS.includes(heading[2].trim() as Horizon) ? (heading[2].trim() as Horizon) : null
        current = null
        currentReference = null
        continue
      }
      if (heading[1].length === 3) {
        currentReference = null
        if (!horizon) {
          add('FAIL', 'THEME-1', `item heading on line ${index + 1} is not beneath a canonical horizon`, STANDARD_REF, display)
          current = null
          continue
        }
        const title = heading[2].trim()
        const slug = itemSlug(title)
        if (!slug) {
          add('FAIL', 'ITEM-1', `item heading on line ${index + 1} has no usable locator slug`, STANDARD_REF, display)
          current = null
          continue
        }
        current = { theme, title, slug, anchor: headingAnchor(title), horizon, file: display, references: [] }
        items.push(current)
        continue
      }
    }
    if (!current) continue
    if (line.trim()) {
      if (currentReference) currentReference.final = false
      if (line.startsWith('**Plan:**')) {
        const match = PLAN_LINE_RE.exec(line)
        currentReference = { id: match?.[1] ?? null, path: match?.[2] ?? null, line: index + 1, final: true }
        current.references.push(currentReference)
      }
    }
  }
  return items
}

function parseFrontmatter(text: string): Frontmatter | null {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)
  if (!match) return null
  const values: Record<string, string> = {}
  const duplicateKeys = new Set<string>()
  const unparsedLines: string[] = []
  for (const line of match[1].split(/\r?\n/)) {
    const field = line.match(/^([a-zA-Z-]+):\s*(.*?)\s*$/)
    if (field) {
      if (field[1] in values) duplicateKeys.add(field[1])
      values[field[1]] = field[2].replace(/^(['"])(.*)\1$/, '$2')
    } else if (line.trim() && !line.trimStart().startsWith('#')) unparsedLines.push(line)
  }
  return {
    values,
    raw: match[1],
    body: text.slice(match[0].length),
    duplicateKeys: [...duplicateKeys].sort(),
    unparsedLines
  }
}

function ids(value: string | undefined): string[] {
  if (!value || value.trim() === '—') return []
  return value
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
}

const planRef = (plan: Pick<Plan, 'id'>): string => plan.id

function themeCode(text: string, display: string): string | null {
  const parsed = parseFrontmatter(text)
  if (!parsed) {
    add('FAIL', 'THEME-2', 'theme roadmap must declare a code in YAML frontmatter', STANDARD_REF, display)
    return null
  }
  const unexpected = Object.keys(parsed.values).filter((field) => field !== 'code')
  if (unexpected.length)
    add('FAIL', 'THEME-2', `theme frontmatter has unexpected field(s): ${unexpected.sort().join(', ')}`, STANDARD_REF, display)
  if (parsed.duplicateKeys.length)
    add('FAIL', 'THEME-2', `theme frontmatter duplicates key(s): ${parsed.duplicateKeys.join(', ')}`, STANDARD_REF, display)
  if (parsed.unparsedLines.length) add('FAIL', 'THEME-2', 'theme frontmatter must contain only a flat code field', STANDARD_REF, display)
  if (!/^code:\s*[A-Z][A-Z0-9]{1,7}\s*$/m.test(parsed.raw))
    add('FAIL', 'THEME-2', 'theme code must be an unquoted uppercase identifier', STANDARD_REF, display)
  if (!parsed.values.code || !THEME_CODE_RE.test(parsed.values.code)) {
    add('FAIL', 'THEME-2', `theme code '${parsed.values.code ?? ''}' must match ${THEME_CODE_RE.source}`, STANDARD_REF, display)
    return null
  }
  return parsed.values.code
}

function validatePlanBody(body: string, display: string, status: string | undefined): void {
  const requiredSections = ['Context', 'Current state', 'Steps', 'Files touched', 'Verify', 'Dependencies / blocks']
  const bodyLines = body.split(/\r?\n/)
  const headings = markdownHeadings(body)
  const sections = headings.filter((heading) => heading.level === 2)
  const names = sections.map((section) => section.title)
  const core = names.filter((name) => requiredSections.includes(name))
  if (JSON.stringify(core) !== JSON.stringify(requiredSections)) {
    add(
      'FAIL',
      'PLAN-1',
      `body must contain each core H2 exactly once in this order: ${requiredSections.join(' → ')}; found ${core.join(' → ') || 'none'}`,
      FORMAT_REF,
      display
    )
    return
  }
  for (const required of ['Steps', 'Verify']) {
    const index = sections.findIndex((section) => section.title === required)
    const start = sections[index].line
    const end = index + 1 < sections.length ? sections[index + 1].line - 1 : bodyLines.length
    if (!bodyLines.slice(start, end).join('\n').trim()) {
      add('FAIL', 'PLAN-1', `body section '${required}' must not be empty`, FORMAT_REF, display)
    }
  }
  const acceptance = sections.filter((section) => section.title === 'Acceptance')
  if (status === 'acceptance' || status === 'done') {
    const dependencies = sections.find((section) => section.title === 'Dependencies / blocks')
    if (acceptance.length !== 1 || !dependencies || acceptance[0].line <= dependencies.line) {
      add('FAIL', 'PLAN-1', `${status} status requires one non-empty 'Acceptance' H2 after 'Dependencies / blocks'`, FORMAT_REF, display)
      return
    }
    const index = sections.indexOf(acceptance[0])
    const start = acceptance[0].line
    const end = index + 1 < sections.length ? sections[index + 1].line - 1 : bodyLines.length
    if (!bodyLines.slice(start, end).join('\n').trim())
      add('FAIL', 'PLAN-1', "body section 'Acceptance' must not be empty", FORMAT_REF, display)
    const expectedAcceptanceSections = ['Delivered', 'Summary of changes', 'Verification', 'Outstanding concerns', 'Mini recap']
    const nextH2 = sections[index + 1]
    const acceptanceSections = headings.filter(
      (heading) => heading.level === 3 && heading.line > acceptance[0].line && (!nextH2 || heading.line < nextH2.line)
    )
    const acceptanceNames = acceptanceSections.map((section) => section.title)
    if (JSON.stringify(acceptanceNames) !== JSON.stringify(expectedAcceptanceSections)) {
      add(
        'FAIL',
        'PLAN-1',
        `acceptance packet must contain these H3 sections once and in order: ${expectedAcceptanceSections.join(' → ')}; found ${acceptanceNames.join(' → ') || 'none'}`,
        FORMAT_REF,
        display
      )
      return
    }
    for (let sectionIndex = 0; sectionIndex < acceptanceSections.length; sectionIndex += 1) {
      const section = acceptanceSections[sectionIndex]
      const end =
        sectionIndex + 1 < acceptanceSections.length
          ? acceptanceSections[sectionIndex + 1].line - 1
          : nextH2
            ? nextH2.line - 1
            : bodyLines.length
      if (!bodyLines.slice(section.line, end).join('\n').trim())
        add('FAIL', 'PLAN-1', `acceptance subsection '${section.title}' must not be empty`, FORMAT_REF, display)
    }
    if (status === 'done') {
      const done = sections.filter((section) => section.title === 'Done')
      const last = sections.at(-1)
      if (done.length !== 1 || done[0].line <= acceptance[0].line || last !== done[0]) {
        add('FAIL', 'PLAN-1', "done status requires one terminal non-empty 'Done' H2 after 'Acceptance'", FORMAT_REF, display)
        return
      }
      if (!bodyLines.slice(done[0].line).join('\n').trim())
        add('FAIL', 'PLAN-1', "body section 'Done' must not be empty", FORMAT_REF, display)
    }
  }
}

function projection(items: Item[]): string {
  const lines = [
    '# Repository roadmap',
    '',
    'This portfolio view is generated from the canonical theme roadmaps under `docs/roadmap/`. Edit those files, then run `ki-roadmap` CONFORM.',
    ''
  ]
  for (const horizon of HORIZONS) {
    lines.push(`## ${horizon}`, '', HORIZON_BLURBS[horizon], '')
    const selected = items
      .filter((item) => item.horizon === horizon)
      .sort((a, b) => a.theme.localeCompare(b.theme) || a.title.localeCompare(b.title))
    if (selected.length) {
      for (const item of selected) {
        const label = item.theme
          .split('-')
          .map((part) => part[0].toUpperCase() + part.slice(1))
          .join(' ')
        lines.push(`- [${label}: ${item.title}](docs/roadmap/${item.theme}/ROADMAP.md#${item.anchor})`)
      }
      lines.push('')
    }
  }
  return `${lines.join('\n').trimEnd()}\n`
}

function discoverThematic(): { themes: string[]; items: Item[]; plans: Plan[] } {
  const roadmapDir = join(root, 'docs', 'roadmap')
  const themes: string[] = []
  const items: Item[] = []
  const plans: Plan[] = []
  const codes = new Map<string, string>()
  const entries = readdirSync(roadmapDir, { withFileTypes: true })
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      add(
        'FAIL',
        'THEME-1',
        'only theme directories belong directly under docs/roadmap; remove the legacy README.md index',
        STANDARD_REF,
        `docs/roadmap/${entry.name}`
      )
      continue
    }
    if (!THEME_RE.test(entry.name)) {
      add('FAIL', 'THEME-1', 'theme directory must be lowercase kebab-case', STANDARD_REF, `docs/roadmap/${entry.name}`)
      continue
    }
    const theme = entry.name
    themes.push(theme)
    const themeRoot = join(roadmapDir, theme)
    const roadmap = join(themeRoot, 'ROADMAP.md')
    if (!existsSync(roadmap)) {
      add('FAIL', 'THEME-1', 'theme has no ROADMAP.md', STANDARD_REF, `docs/roadmap/${theme}`)
      continue
    }
    const displayRoadmap = `docs/roadmap/${theme}/ROADMAP.md`
    const code = themeCode(readFileSync(roadmap, 'utf8'), displayRoadmap)
    if (code) {
      const previous = codes.get(code)
      if (previous) add('FAIL', 'THEME-2', `theme code '${code}' is already used by ${previous}`, STANDARD_REF, displayRoadmap)
      else codes.set(code, displayRoadmap)
    }
    const themeItems = parseRoadmap(roadmap, displayRoadmap, theme)
    if (!themeItems.length) add('FAIL', 'THEME-3', 'empty theme roadmap must be pruned', STANDARD_REF, displayRoadmap)
    items.push(...themeItems)
    const allowed = new Set(['ROADMAP.md', 'plans'])
    for (const child of readdirSync(themeRoot)) {
      if (!allowed.has(child))
        add(
          'FAIL',
          'THEME-1',
          'unexpected theme entry; only ROADMAP.md and plans/ are allowed',
          STANDARD_REF,
          `docs/roadmap/${theme}/${child}`
        )
    }
    const plansDir = join(themeRoot, 'plans')
    if (!existsSync(plansDir)) {
      continue
    }
    if (lstatSync(plansDir).isSymbolicLink() || !lstatSync(plansDir).isDirectory()) {
      add('FAIL', 'SAFE-1', 'plans must be a real directory', STANDARD_REF, `docs/roadmap/${theme}/plans`)
      continue
    }
    for (const name of readdirSync(plansDir).sort()) {
      const display = `docs/roadmap/${theme}/plans/${name}`
      const path = join(plansDir, name)
      if (lstatSync(path).isSymbolicLink()) {
        add('FAIL', 'SAFE-1', 'plan must not be a symlink', STANDARD_REF, display)
        continue
      }
      const match = PLAN_RE.exec(name)
      if (!match || !lstatSync(path).isFile()) {
        add('FAIL', 'PLAN-1', 'plan filename must be <THEME>-<NNN>-<slug>.md', FORMAT_REF, display)
        continue
      }
      const content = readFileSync(path, 'utf8')
      const parsed = parseFrontmatter(content)
      if (!parsed) {
        add('FAIL', 'PLAN-1', 'missing YAML frontmatter', FORMAT_REF, display)
        continue
      }
      const fm = parsed.values
      for (const field of REQUIRED) if (!(field in fm)) add('FAIL', 'PLAN-1', `frontmatter missing '${field}'`, FORMAT_REF, display)
      const unexpected = Object.keys(fm).filter((field) => !REQUIRED.includes(field) && !OPTIONAL.includes(field))
      if (unexpected.length)
        add('FAIL', 'PLAN-1', `frontmatter has unexpected field(s): ${unexpected.sort().join(', ')}`, FORMAT_REF, display)
      for (const field of parsed.duplicateKeys) add('FAIL', 'PLAN-1', `duplicate frontmatter key '${field}'`, FORMAT_REF, display)
      if (parsed.unparsedLines.length)
        add('FAIL', 'PLAN-1', 'frontmatter must contain only flat key/value fields and comments', FORMAT_REF, display)
      for (const field of ['id', 'title', 'status', 'roadmap', 'baseline-ref']) {
        if (field in fm && !fm[field].trim()) add('FAIL', 'PLAN-1', `frontmatter field '${field}' must not be empty`, FORMAT_REF, display)
      }
      if ('transferred-from' in fm && !fm['transferred-from'].trim())
        add('FAIL', 'PLAN-1', "optional frontmatter field 'transferred-from' must be a non-empty string", FORMAT_REF, display)
      if (!/^id:\s*(['"])[A-Z][A-Z0-9]{1,7}-\d{3,}\1\s*$/m.test(parsed.raw))
        add('FAIL', 'PLAN-1', 'id must be quoted in frontmatter', FORMAT_REF, display)
      if (fm.id && !PLAN_ID_RE.test(fm.id))
        add('FAIL', 'PLAN-1', `id '${fm.id}' must be a quoted <THEME>-<NNN> identifier`, FORMAT_REF, display)
      if (fm.id && fm.id !== match[1]) add('FAIL', 'PLAN-1', `id '${fm.id}' does not match filename id '${match[1]}'`, FORMAT_REF, display)
      if (fm.id && code && !fm.id.startsWith(`${code}-`))
        add('FAIL', 'PLAN-1', `id '${fm.id}' does not use theme code '${code}'`, FORMAT_REF, display)
      if (fm.status && !VALID_STATUS.has(fm.status)) add('FAIL', 'PLAN-1', `invalid status '${fm.status}'`, FORMAT_REF, display)
      if (fm.status && ['open', 'ready'].includes(fm.status) && fm['baseline-ref'] !== '—')
        add('FAIL', 'PLAN-1', `${fm.status} plan baseline-ref must be — until execution starts`, FORMAT_REF, display)
      if (fm.status && ['in-progress', 'acceptance', 'done'].includes(fm.status) && !COMMIT_ID_RE.test(fm['baseline-ref'] ?? ''))
        add('FAIL', 'PLAN-1', `${fm.status} plan baseline-ref must be a full lowercase commit object ID`, FORMAT_REF, display)
      if (match[2].length > 50) add('FAIL', 'PLAN-1', `filename slug is ${match[2].length} characters; maximum is 50`, FORMAT_REF, display)
      validatePlanBody(parsed.body, display, fm.status)
      const blocks = ids(fm.blocks)
      const blockedBy = ids(fm['blocked-by'])
      for (const [field, dependencies] of [
        ['blocks', blocks],
        ['blocked-by', blockedBy]
      ] as const) {
        const duplicates = [...new Set(dependencies.filter((id, index) => dependencies.indexOf(id) !== index))]
        if (duplicates.length) add('FAIL', 'PLAN-3', `${field} contains duplicate id(s): ${duplicates.join(', ')}`, FORMAT_REF, display)
      }
      const planId = fm.id || match[1]
      const reference = planId
      if (blocks.includes(reference) || blockedBy.includes(reference))
        add('FAIL', 'PLAN-3', `plan ${reference} must not depend on itself`, FORMAT_REF, display)
      plans.push({ id: planId, theme, file: display, name, fm, blocks, blockedBy })
    }
  }
  return { themes: themes.sort(), items, plans }
}

export const inspectRoadmap = (target: string): Finding[] => {
  root = resolve(target)
  findings = []
  const rootRoadmap = join(root, 'ROADMAP.md')
  const thematicDir = join(root, 'docs', 'roadmap')
  try {
    if (!existsSync(root) || !lstatSync(root).isDirectory()) {
      add('FAIL', 'PROFILE-1', `repository directory does not exist: ${target}`, STANDARD_REF)
      emit()
    }
    if (isKb(root)) {
      const artifacts = [rootRoadmap, thematicDir].filter(existsSync).map((path) => relative(root, path))
      if (artifacts.length)
        add(
          'FAIL',
          'SCOPE-1',
          `KB repositories use ki-kb-streams; remove repository-roadmap artifacts: ${artifacts.join(', ')}`,
          STANDARD_REF
        )
      else add('NA', 'SCOPE-1', 'KB repository: streams and proposal checklists are governed by ki-kb-streams', STANDARD_REF)
      emit()
    }

    if (existsSync(join(root, 'docs', 'plans'))) {
      add(
        'FAIL',
        'PROFILE-1',
        'legacy docs/plans is outside both profiles; migrate it into thematic roadmap plans',
        STANDARD_REF,
        'docs/plans'
      )
    }

    if (!existsSync(thematicDir)) {
      if (!existsSync(rootRoadmap)) add('FAIL', 'PROFILE-1', 'non-KB repository has no root ROADMAP.md', STANDARD_REF, 'ROADMAP.md')
      else {
        parseRoadmap(rootRoadmap, 'ROADMAP.md')
        add('INFO', 'PROFILE-1', 'simple profile detected', STANDARD_REF)
      }
    } else {
      if (lstatSync(thematicDir).isSymbolicLink() || !lstatSync(thematicDir).isDirectory()) {
        add('FAIL', 'SAFE-1', 'docs/roadmap must be a real directory', STANDARD_REF, 'docs/roadmap')
        emit()
      }
      const { themes, items, plans } = discoverThematic()
      const locators = new Map<string, Item>()
      for (const item of items) {
        const locator = `${item.theme}/${item.slug}`
        const previous = locators.get(locator)
        if (previous)
          add('FAIL', 'ITEM-1', `qualified locator '${locator}' duplicates an item in ${previous.file}`, STANDARD_REF, item.file)
        else locators.set(locator, item)
      }

      const refsSeen = new Map<string, string>()
      const byRef = new Map<string, Plan>()
      const planLocators = new Map<string, string>()
      for (const plan of plans) {
        const reference = planRef(plan)
        if (refsSeen.has(reference))
          add('FAIL', 'PLAN-1', `plan reference ${reference} is already used by ${refsSeen.get(reference)}`, FORMAT_REF, plan.file)
        else {
          refsSeen.set(reference, plan.file)
          byRef.set(reference, plan)
        }
        const item = locators.get(plan.fm.roadmap)
        if (planLocators.has(plan.fm.roadmap)) {
          add(
            'FAIL',
            'PLAN-2',
            `roadmap locator '${plan.fm.roadmap}' already has plan ${planLocators.get(plan.fm.roadmap)}`,
            FORMAT_REF,
            plan.file
          )
        } else planLocators.set(plan.fm.roadmap, reference)
        if (!/^[-a-z0-9]+\/[-a-z0-9]+$/.test(plan.fm.roadmap ?? ''))
          add('FAIL', 'PLAN-2', 'roadmap must be a qualified <theme>/<item-slug> locator', FORMAT_REF, plan.file)
        else if (!item) add('FAIL', 'PLAN-2', `roadmap locator '${plan.fm.roadmap}' does not resolve`, FORMAT_REF, plan.file)
        else {
          if (item.theme !== plan.theme)
            add('FAIL', 'PLAN-2', `locator theme '${item.theme}' does not match plan theme '${plan.theme}'`, FORMAT_REF, plan.file)
          if (!NEAR.has(item.horizon) && (plan.fm.status !== 'open' || !plan.fm['transferred-from']?.trim()))
            add(
              'FAIL',
              'PLAN-2',
              `locator resolves to ${item.horizon}; only an open plan with non-empty transferred-from may exist outside Blocking or Next`,
              FORMAT_REF,
              plan.file
            )
        }
      }
      const plansByLocator = new Map(plans.map((plan) => [plan.fm.roadmap, plan]))
      const referencedPlans = new Map<string, Item[]>()
      for (const item of items) {
        const locator = `${item.theme}/${item.slug}`
        for (const reference of item.references) {
          if (!reference.id || !reference.path)
            add(
              'FAIL',
              'PLAN-2',
              `local plan reference on line ${reference.line} must use the canonical **Plan:** [<ID>](plans/<file>.md) form`,
              FORMAT_REF,
              item.file
            )
          if (!reference.final)
            add('FAIL', 'PLAN-2', `local plan reference on line ${reference.line} must be the final item line`, FORMAT_REF, item.file)
          if (!reference.id || !reference.path) continue
          const plan = byRef.get(reference.id)
          if (!plan) {
            add('FAIL', 'PLAN-2', `local plan reference ${reference.id} does not resolve to an active plan`, FORMAT_REF, item.file)
            continue
          }
          const expectedPath = `plans/${plan.name}`
          if (reference.path !== expectedPath)
            add('FAIL', 'PLAN-2', `local plan reference ${reference.id} must link to ${expectedPath}`, FORMAT_REF, item.file)
          if (plan.fm.roadmap !== locator)
            add(
              'FAIL',
              'PLAN-2',
              `local plan reference ${reference.id} belongs to ${plan.fm.roadmap}, not ${locator}`,
              FORMAT_REF,
              item.file
            )
          const owners = referencedPlans.get(reference.id) ?? []
          owners.push(item)
          referencedPlans.set(reference.id, owners)
        }
        const plan = plansByLocator.get(locator)
        if (!plan && item.references.length)
          add('FAIL', 'PLAN-2', `item ${locator} has a local plan reference but no active plan`, FORMAT_REF, item.file)
        if (plan && item.references.length !== 1)
          add(
            'FAIL',
            'PLAN-2',
            `item ${locator} must contain exactly one local reference to ${planRef(plan)}; found ${item.references.length}`,
            FORMAT_REF,
            item.file
          )
      }
      for (const plan of plans) {
        const owners = referencedPlans.get(planRef(plan)) ?? []
        if (owners.length !== 1)
          add(
            'FAIL',
            'PLAN-2',
            `plan ${planRef(plan)} must have exactly one local roadmap reference; found ${owners.length}`,
            FORMAT_REF,
            plan.file
          )
      }
      for (const plan of plans) {
        const reference = planRef(plan)
        for (const dependency of [...plan.blocks, ...plan.blockedBy]) {
          if (!PLAN_ID_RE.test(dependency))
            add('FAIL', 'PLAN-3', `dependency '${dependency}' is not a <THEME>-<NNN> plan identifier`, FORMAT_REF, plan.file)
          else if (!byRef.has(dependency)) add('FAIL', 'PLAN-3', `dependency ${dependency} does not exist`, FORMAT_REF, plan.file)
        }
        for (const blocked of plan.blocks) {
          const other = byRef.get(blocked)
          if (other && !other.blockedBy.includes(reference))
            add('FAIL', 'PLAN-3', `blocks ${blocked}, but its blocked-by omits ${reference}`, FORMAT_REF, plan.file)
        }
        for (const blocker of plan.blockedBy) {
          const other = byRef.get(blocker)
          if (other && !other.blocks.includes(reference))
            add('FAIL', 'PLAN-3', `blocked-by ${blocker}, but its blocks omits ${reference}`, FORMAT_REF, plan.file)
          if (['ready', 'in-progress', 'acceptance'].includes(plan.fm.status) && other?.fm.status !== 'done') {
            add('FAIL', 'PLAN-3', `${plan.fm.status} plan still has non-done blocker ${blocker}`, FORMAT_REF, plan.file)
          }
        }
      }
      const state = new Map(plans.map((plan) => [planRef(plan), 0]))
      let cycle = false
      const visit = (reference: string, stack: string[]): void => {
        state.set(reference, 1)
        for (const blocker of byRef.get(reference)?.blockedBy ?? []) {
          if (!byRef.has(blocker)) continue
          if (state.get(blocker) === 1 && !cycle) {
            add('FAIL', 'PLAN-3', `dependency cycle: ${[...stack, reference, blocker].join(' → ')}`, FORMAT_REF)
            cycle = true
          } else if (state.get(blocker) === 0) visit(blocker, [...stack, reference])
        }
        state.set(reference, 2)
      }
      for (const plan of plans) {
        const reference = planRef(plan)
        if (state.get(reference) === 0) visit(reference, [])
      }

      if (existsSync(rootRoadmap) && lstatSync(rootRoadmap).isSymbolicLink()) {
        add('FAIL', 'SAFE-1', 'generated portfolio must not be a symlink', STANDARD_REF, 'ROADMAP.md')
      } else if (!existsSync(rootRoadmap) || readFileSync(rootRoadmap, 'utf8') !== projection(items)) {
        add('FAIL', 'PROJ-1', 'generated portfolio is missing or drifted; run CONFORM', STANDARD_REF, 'ROADMAP.md')
      }
      add(
        'INFO',
        'PROFILE-1',
        `thematic profile detected: ${themes.length} theme(s), ${items.length} item(s), ${plans.length} plan(s)`,
        STANDARD_REF
      )
    }

    if (!findings.some((finding) => ['FAIL', 'WARN', 'POLISH'].includes(finding.level))) {
      add('PASS', 'PROFILE-1', 'repository-roadmap mechanics conform', STANDARD_REF)
    }
  } catch (result) {
    if (result === findings) return findings
    throw result
  }
  return findings
}

function emit(): never {
  throw findings
}
