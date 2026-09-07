const RULE = '# -----------------------------------------------------------------------------'

export const CONFIGURATION_NEIGHBOURHOODS = [
  'Foundation',
  'Repository shape',
  'Governance runtime',
  'Change management',
  'Relationships'
] as const

type Neighbourhood = (typeof CONFIGURATION_NEIGHBOURHOODS)[number]
type MultilineDelimiter = '"""' | "'''"

type SourceLine = {
  readonly line: number
  readonly raw: string
  readonly code: string
}

type SkillTable = {
  readonly line: number
  readonly owner: string
  readonly root: boolean
}

type Banner = {
  readonly line: number
  readonly name: Neighbourhood
}

export type ConfigurationPresentation = {
  readonly substantial: boolean
  readonly issues: readonly string[]
}

const tripleClose = (line: string, delimiter: MultilineDelimiter, from: number): number => {
  let at = line.indexOf(delimiter, from)
  while (at !== -1) {
    const backslashes = line.slice(0, at).match(/\\+$/)?.[0].length ?? 0
    if (delimiter === "'''" || backslashes % 2 === 0) return at
    at = line.indexOf(delimiter, at + delimiter.length)
  }
  return -1
}

const sourceLines = (text: string): readonly SourceLine[] => {
  const lines: SourceLine[] = []
  let multiline: MultilineDelimiter | null = null
  for (const [index, raw] of text.split(/\r?\n/).entries()) {
    if (multiline) {
      if (tripleClose(raw, multiline, 0) !== -1) multiline = null
      lines.push({ line: index + 1, raw, code: '' })
      continue
    }

    let code = ''
    let quote: '"' | "'" | null = null
    let escaped = false
    for (let at = 0; at < raw.length; at++) {
      const delimiter = raw.startsWith('"""', at) ? '"""' : raw.startsWith("'''", at) ? "'''" : null
      if (!quote && delimiter) {
        if (tripleClose(raw, delimiter, at + delimiter.length) === -1) multiline = delimiter
        break
      }
      const character = raw[at] as string
      if (!quote && character === '#') break
      code += character
      if (quote === '"') {
        if (!escaped && character === '"') quote = null
        escaped = !escaped && character === '\\'
      } else if (quote === "'") {
        if (character === "'") quote = null
      } else if (character === '"' || character === "'") {
        quote = character
        escaped = false
      }
    }
    lines.push({ line: index + 1, raw, code: code.trim() })
  }
  return lines
}

const skillTables = (lines: readonly SourceLine[]): readonly SkillTable[] =>
  lines.flatMap(({ code, line }) => {
    const match = code.match(/^\[\s*skills\s*\.\s*(?:"([^"\\]+)"|'([^']+)'|([A-Za-z0-9_-]+))\s*(\.|\])/)
    const owner = match?.[1] ?? match?.[2] ?? match?.[3]
    return owner ? [{ line, owner, root: match?.[4] === ']' }] : []
  })

const banners = (lines: readonly SourceLine[], issues: string[]): readonly Banner[] => {
  const found: Banner[] = []
  for (let index = 0; index < lines.length; index++) {
    const name = CONFIGURATION_NEIGHBOURHOODS.find((candidate) => lines[index]?.raw.trim() === `# ${candidate}`)
    if (!name) continue
    if (lines[index - 1]?.raw.trim() !== RULE || lines[index + 1]?.raw.trim() !== RULE) {
      issues.push(`line ${lines[index]?.line}: ${name} banner must use the exact three-line comment form`)
      continue
    }
    found.push({ line: lines[index - 1]?.line ?? lines[index]?.line ?? 0, name })
  }
  return found
}

const bannerGroup = (line: number, found: readonly Banner[]): string => {
  const banner = [...found].reverse().find((candidate) => candidate.line < line)
  return banner?.name ?? '<unbannered>'
}

export const inspectConfigurationPresentation = (text: string): ConfigurationPresentation => {
  const lines = sourceLines(text)
  const tables = skillTables(lines)
  const roots = tables.filter((table) => table.root)
  const extraRoots = roots.filter((table) => !['ki-repo', 'ki-authoring'].includes(table.owner))
  const substantial = extraRoots.length >= 3
  const issues: string[] = []
  const foundBanners = banners(lines, issues)

  const firstTable = lines.find(({ code }) => /^\[\[?/.test(code))
  if (firstTable && firstTable.code !== '[repo]') issues.push(`line ${firstTable.line}: [repo] must be the first table`)

  if (roots[0] && roots[0].owner !== 'ki-repo')
    issues.push(`line ${roots[0].line}: [skills.ki-repo] must be the first skill root`)
  const authoringRoot = roots.find((table) => table.owner === 'ki-authoring')
  if (authoringRoot && roots[1]?.owner !== 'ki-authoring')
    issues.push(`line ${authoringRoot.line}: [skills.ki-authoring] must follow [skills.ki-repo]`)

  for (const child of tables.filter((table) => !table.root)) {
    const root = roots.find((candidate) => candidate.owner === child.owner && candidate.line < child.line)
    if (!root) issues.push(`line ${child.line}: [skills.${child.owner}] must be declared before its child tables`)
  }

  const ownerGroups = new Map<string, Set<string>>()
  for (const table of tables) {
    const groups = ownerGroups.get(table.owner) ?? new Set<string>()
    groups.add(bannerGroup(table.line, foundBanners))
    ownerGroups.set(table.owner, groups)
  }
  for (const [owner, groups] of ownerGroups) {
    if (groups.size > 1) issues.push(`[skills.${owner}] is split across neighbourhood banners`)
  }

  const seen = new Set<Neighbourhood>()
  let previous = -1
  for (const banner of foundBanners) {
    if (seen.has(banner.name)) issues.push(`line ${banner.line}: ${banner.name} banner is duplicated`)
    seen.add(banner.name)
    const order = CONFIGURATION_NEIGHBOURHOODS.indexOf(banner.name)
    if (order < previous) issues.push(`line ${banner.line}: ${banner.name} banner is out of canonical order`)
    previous = Math.max(previous, order)
  }

  for (const [index, banner] of foundBanners.entries()) {
    const nextLine = foundBanners[index + 1]?.line ?? Number.POSITIVE_INFINITY
    if (!lines.some(({ code, line }) => line > banner.line + 2 && line < nextLine && /^\[\[?/.test(code)))
      issues.push(`line ${banner.line}: ${banner.name} banner introduces no configuration tables`)
  }

  if (substantial) {
    if (foundBanners[0]?.name !== 'Foundation')
      issues.push('substantial .ki.toml must begin its declarations with the exact Foundation banner')
    if (foundBanners.length < 2)
      issues.push('substantial .ki.toml must use Foundation and at least one additional neighbourhood banner')
    if (firstTable && foundBanners[0] && foundBanners[0].line > firstTable.line)
      issues.push('the Foundation banner must precede [repo]')
  }

  return { substantial, issues }
}
