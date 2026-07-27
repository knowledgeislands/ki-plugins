import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import type { ConformProposal, ConformWrite } from '../../shared/rubric.ts'
import type { Finding } from './roadmap-evidence.ts'

const HORIZONS = ['Blocking', 'Next', 'Soon', 'Waiting for', 'Future'] as const
type Horizon = (typeof HORIZONS)[number]

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

type Heading = { level: number; title: string; line: number }
type Item = { theme: string; title: string; anchor: string; horizon: Horizon }
type Plan = { id: string; theme: string; name: string; roadmap: string }
type DraftFile = { absolute: string; original?: string; working: string }

export type RoadmapDraft = {
  normaliseHorizonBlurbs: () => void
  syncPlanReferences: () => void
  rebuildProjection: () => void
  proposal: () => ConformProposal
}

const headings = (text: string): Heading[] => {
  const result: Heading[] = []
  let fence: '`' | '~' | undefined
  for (const [index, line] of text.split(/\r?\n/).entries()) {
    const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/)
    if (fenceMatch) {
      const kind = fenceMatch[1]?.[0] as '`' | '~'
      fence = fence === undefined ? kind : fence === kind ? undefined : fence
      continue
    }
    if (fence) continue
    const match = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/)
    if (match) result.push({ level: match[1]?.length ?? 0, title: match[2]?.trim() ?? '', line: index + 1 })
  }
  return result
}

const slug = (title: string): string =>
  title
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[`*_~]/g, '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const headingAnchor = (title: string): string =>
  title
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[`*_~]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}\s_-]/gu, '')
    .replace(/\s/g, '-')

const parseFrontmatter = (text: string): Record<string, string> => {
  const block = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1]
  if (!block) return {}
  const values: Record<string, string> = {}
  for (const line of block.split(/\r?\n/)) {
    const field = line.match(/^([a-zA-Z-]+):\s*(.*?)\s*$/)
    if (field?.[1]) values[field[1]] = (field[2] ?? '').replace(/^(['"])(.*)\1$/, '$2')
  }
  return values
}

const withHorizonBlurbs = (text: string): string => {
  const eol = text.includes('\r\n') ? '\r\n' : '\n'
  const trailingEol = text.endsWith('\n')
  const lines = text.split(/\r?\n/)
  if (trailingEol) lines.pop()
  for (const horizon of [...HORIZONS].reverse()) {
    const heading = lines.findIndex((line) => line.match(/^##\s+(.+?)\s*#*\s*$/)?.[1]?.trim() === horizon)
    if (heading < 0) continue
    let firstContent = heading + 1
    while (lines[firstContent] === '') firstContent += 1
    if (lines[firstContent] === HORIZON_BLURBS[horizon]) {
      lines.splice(heading + 1, firstContent - heading - 1, '')
      let nextContent = heading + 3
      while (lines[nextContent] === '') nextContent += 1
      if (nextContent === lines.length) lines.splice(heading + 3)
      else lines.splice(heading + 3, nextContent - heading - 3, '')
    } else {
      const replacement = ['', HORIZON_BLURBS[horizon]]
      if (firstContent < lines.length) replacement.push('')
      lines.splice(heading + 1, firstContent - heading - 1, ...replacement)
    }
  }
  return `${lines.join(eol)}${trailingEol ? eol : ''}`
}

const withLocalPlanReferences = (text: string, theme: string, plans: readonly Plan[]): string => {
  const eol = text.includes('\r\n') ? '\r\n' : '\n'
  const lines = text.split(/\r?\n/)
  const plansByLocator = new Map(plans.filter((plan) => plan.theme === theme).map((plan) => [plan.roadmap, plan]))
  const items: Array<{ line: number; locator: string }> = []
  let horizon: Horizon | undefined
  const documentHeadings = headings(text)
  for (const heading of documentHeadings) {
    if (heading.level === 2) horizon = HORIZONS.includes(heading.title as Horizon) ? (heading.title as Horizon) : undefined
    else if (heading.level === 3 && horizon) items.push({ line: heading.line, locator: `${theme}/${slug(heading.title)}` })
  }
  const boundaries = documentHeadings.filter((heading) => heading.level <= 3).map((heading) => heading.line)
  const output: string[] = []
  let cursor = 0
  for (const item of items) {
    const start = item.line - 1
    const end = (boundaries.find((line) => line > item.line) ?? lines.length + 1) - 1
    output.push(...lines.slice(cursor, start))
    const segment = lines.slice(start, end)
    let fence: '`' | '~' | undefined
    const withoutReferences = segment.filter((line) => {
      const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/)
      if (fenceMatch) {
        const kind = fenceMatch[1]?.[0] as '`' | '~'
        fence = fence === undefined ? kind : fence === kind ? undefined : fence
        return true
      }
      return Boolean(fence) || !line.startsWith('**Plan:**')
    })
    const plan = plansByLocator.get(item.locator)
    if (!plan) output.push(...withoutReferences)
    else {
      while (withoutReferences.at(-1) === '') withoutReferences.pop()
      output.push(...withoutReferences, '', `**Plan:** [${plan.id}](plans/${plan.name})`, '')
    }
    cursor = end
  }
  output.push(...lines.slice(cursor))
  return output.join(eol)
}

const itemsFrom = (theme: string, text: string): Item[] => {
  const items: Item[] = []
  let horizon: Horizon | undefined
  for (const heading of headings(text)) {
    if (heading.level === 2) horizon = HORIZONS.includes(heading.title as Horizon) ? (heading.title as Horizon) : undefined
    else if (heading.level === 3 && horizon) items.push({ theme, title: heading.title, anchor: headingAnchor(heading.title), horizon })
  }
  return items
}

const projection = (items: readonly Item[]): string => {
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
      .sort((left, right) => left.theme.localeCompare(right.theme) || left.title.localeCompare(right.title))
    for (const item of selected) {
      const label = item.theme
        .split('-')
        .map((part) => `${part[0]?.toUpperCase() ?? ''}${part.slice(1)}`)
        .join(' ')
      lines.push(`- [${label}: ${item.title}](docs/roadmap/${item.theme}/ROADMAP.md#${item.anchor})`)
    }
    if (selected.length > 0) lines.push('')
  }
  return `${lines.join('\n').trimEnd()}\n`
}

const derivablePlanReferenceFailure = (finding: Finding): boolean =>
  finding.area === 'PLAN-2' &&
  /local plan reference|has a local plan reference|must contain exactly one local reference|must have exactly one local roadmap reference/.test(
    finding.msg
  )

const safeToDraft = (findings: readonly Finding[]): boolean =>
  !findings.some(
    (finding) =>
      finding.level === 'FAIL' && finding.area !== 'ROAD-4' && finding.area !== 'PROJ-1' && !derivablePlanReferenceFailure(finding)
  )

const regularFileContent = (path: string): string | undefined => {
  if (!existsSync(path)) return undefined
  const entry = lstatSync(path)
  if (entry.isSymbolicLink() || !entry.isFile()) return undefined
  return readFileSync(path, 'utf8')
}

export const createRoadmapDraft = (repository: string, findings: readonly Finding[]): RoadmapDraft | undefined => {
  if (!safeToDraft(findings)) return undefined

  const root = resolve(repository)
  const roadmapDirectory = join(root, 'docs', 'roadmap')
  const thematic = existsSync(roadmapDirectory)
  const themeNames = thematic
    ? readdirSync(roadmapDirectory, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort()
    : []
  const drafts = new Map<string, DraftFile>()
  const register = (absolute: string): DraftFile | undefined => {
    const original = regularFileContent(absolute)
    if (original === undefined) return undefined
    const draft = { absolute, original, working: original }
    drafts.set(absolute, draft)
    return draft
  }

  const rootPath = join(root, 'ROADMAP.md')
  const rootContent = regularFileContent(rootPath)
  drafts.set(rootPath, { absolute: rootPath, ...(rootContent === undefined ? {} : { original: rootContent }), working: rootContent ?? '' })

  const themes = new Map<string, DraftFile>()
  for (const theme of themeNames) {
    const draft = register(join(roadmapDirectory, theme, 'ROADMAP.md'))
    if (draft) themes.set(theme, draft)
  }

  const plans: Plan[] = []
  for (const theme of themeNames) {
    const plansDirectory = join(roadmapDirectory, theme, 'plans')
    if (!existsSync(plansDirectory) || !lstatSync(plansDirectory).isDirectory()) continue
    for (const name of readdirSync(plansDirectory)
      .filter((entry) => entry.endsWith('.md'))
      .sort()) {
      const content = regularFileContent(join(plansDirectory, name))
      if (content === undefined) continue
      const frontmatter = parseFrontmatter(content)
      plans.push({ id: frontmatter.id ?? '', theme, name, roadmap: frontmatter.roadmap ?? '' })
    }
  }

  return {
    normaliseHorizonBlurbs: () => {
      for (const draft of thematic ? themes.values() : [drafts.get(rootPath)].filter((value): value is DraftFile => Boolean(value)))
        draft.working = withHorizonBlurbs(draft.working)
    },
    syncPlanReferences: () => {
      for (const [theme, draft] of themes) draft.working = withLocalPlanReferences(draft.working, theme, plans)
    },
    rebuildProjection: () => {
      if (!thematic) return
      const items = [...themes].flatMap(([theme, draft]) => itemsFrom(theme, draft.working))
      const rootDraft = drafts.get(rootPath)
      if (rootDraft) rootDraft.working = projection(items)
    },
    proposal: () => {
      const writes: ConformWrite[] = [...drafts.values()]
        .filter((draft) => draft.working !== draft.original)
        .sort((left, right) => left.absolute.localeCompare(right.absolute))
        .map((draft) => ({
          path: relative(root, draft.absolute),
          content: draft.working,
          ...(draft.original === undefined ? { create: true } : {})
        }))
      return { writes }
    }
  }
}
