export const CAPABILITY_CATALOGUE_START = '<!-- ki-repo-harness:capability-catalogue:start -->'
export const CAPABILITY_CATALOGUE_END = '<!-- ki-repo-harness:capability-catalogue:end -->'

export type CapabilityKind = 'governance' | 'process'

export type CapabilityEntry = {
  path: string
  domain: string
  name: string
  kind: CapabilityKind
  description: string
  argumentHint?: string
  dependencies: readonly string[]
  runtimeBinding: boolean
  supportedRuntimes: readonly string[]
}

export type CapabilitySource = {
  path: string
  content: string
}

export type CapabilityParseResult = { entry: CapabilityEntry; issue?: never } | { entry?: never; issue: string }

export type CapabilityPublicationDraft = {
  state: 'missing' | 'stale' | 'in-sync' | 'unsafe'
  issues: readonly string[]
  rendered?: string
  merged?: string
}

type Frontmatter = Record<string, unknown>

const frontmatterDocument = (content: string): string | null => {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)
  return match?.[1] ?? null
}

const stringList = (value: unknown): readonly string[] | null => {
  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string' && item.trim().length > 0)) return null
  return value.map((item) => item.trim())
}

const normaliseProse = (value: string): string => value.replace(/\s+/g, ' ').trim()

const domainFromPath = (path: string): string => {
  const segments = path.split('/').filter(Boolean)
  const skillsIndex = segments.lastIndexOf('skills')
  return segments[skillsIndex + 1] ?? 'ungrouped'
}

export const parseCapabilitySource = ({ path, content }: CapabilitySource): CapabilityParseResult => {
  const document = frontmatterDocument(content)
  if (document === null) return { issue: `${path} has no complete YAML frontmatter document` }

  let frontmatter: Frontmatter
  try {
    const parsed = Bun.YAML.parse(document)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
      return { issue: `${path} frontmatter is not a YAML mapping` }
    frontmatter = parsed as Frontmatter
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown YAML parse failure'
    return { issue: `${path} frontmatter is invalid YAML: ${message}` }
  }

  const name = frontmatter.name
  const kind = frontmatter['ki-kind']
  const description = frontmatter.description
  const dependencies = stringList(frontmatter['ki-depends-on'])
  const argumentHint = frontmatter['argument-hint']
  const runtimeBinding = frontmatter['ki-runtime-binding']
  const supportedRuntimes = frontmatter['ki-supported-runtimes']

  if (typeof name !== 'string' || name.trim().length === 0) return { issue: `${path} has no non-empty name` }
  if (kind !== 'governance' && kind !== 'process') return { issue: `${path} has invalid or missing ki-kind` }
  if (typeof description !== 'string' || normaliseProse(description).length === 0)
    return { issue: `${path} has no non-empty description` }
  if (dependencies === null) return { issue: `${path} has invalid or missing ki-depends-on` }
  if (argumentHint !== undefined && (typeof argumentHint !== 'string' || argumentHint.trim().length === 0))
    return { issue: `${path} has an invalid argument-hint` }
  if (runtimeBinding !== undefined && typeof runtimeBinding !== 'boolean')
    return { issue: `${path} has an invalid ki-runtime-binding` }
  const runtimes = supportedRuntimes === undefined ? [] : stringList(supportedRuntimes)
  if (runtimes === null) return { issue: `${path} has an invalid ki-supported-runtimes list` }
  if (runtimes.length > 0 && runtimeBinding !== true)
    return { issue: `${path} names supported runtimes without ki-runtime-binding: true` }

  return {
    entry: {
      path,
      domain: domainFromPath(path),
      name: name.trim(),
      kind,
      description: normaliseProse(description),
      ...(typeof argumentHint === 'string' ? { argumentHint: argumentHint.trim() } : {}),
      dependencies,
      runtimeBinding: runtimeBinding === true,
      supportedRuntimes: runtimes
    }
  }
}

const titleCase = (value: string): string =>
  value
    .split('-')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ')

const runtimeDescription = ({ runtimeBinding, supportedRuntimes }: CapabilityEntry): string => {
  if (!runtimeBinding) return 'Portable'
  if (supportedRuntimes.length === 0) return 'Runtime-bound; supported runtimes are resolved by its host contract'
  return `Runtime-bound: ${supportedRuntimes.map((runtime) => `\`${runtime}\``).join(', ')}`
}

const counted = (count: number, singular: string): string => `${count} ${count === 1 ? singular : `${singular}s`}`

export const renderCapabilityCatalogue = (entries: readonly CapabilityEntry[]): string => {
  const ordered = [...entries].sort((left, right) =>
    left.domain === right.domain ? left.name.localeCompare(right.name) : left.domain.localeCompare(right.domain)
  )
  const governance = ordered.filter((entry) => entry.kind === 'governance').length
  const process = ordered.filter((entry) => entry.kind === 'process').length
  const sections: string[] = [
    CAPABILITY_CATALOGUE_START,
    '## Generated capability catalogue',
    '',
    `This source harness publishes ${counted(ordered.length, 'skill')}: ${counted(governance, 'governance skill')} and ${counted(process, 'process skill')}. The entries below are generated from canonical \`SKILL.md\` frontmatter; edit the source skill, then run \`ki repo conform --skill ki-repo-harness\` to republish this section.`,
    ''
  ]

  for (const domain of [...new Set(ordered.map((entry) => entry.domain))]) {
    sections.push(`### ${titleCase(domain)}`, '')
    for (const entry of ordered.filter((candidate) => candidate.domain === domain)) {
      sections.push(
        `#### \`${entry.name}\``,
        '',
        entry.description,
        '',
        `- **Kind:** ${titleCase(entry.kind)}`,
        `- **Arguments:** ${entry.argumentHint ? `\`${entry.argumentHint}\`` : 'None'}`,
        `- **Dependencies:** ${entry.dependencies.length === 0 ? 'None' : entry.dependencies.map((dependency) => `\`${dependency}\``).join(', ')}`,
        `- **Runtime:** ${runtimeDescription(entry)}`,
        ''
      )
    }
  }

  sections.push(CAPABILITY_CATALOGUE_END)
  return `${sections.join('\n')}\n`
}

const markerCount = (content: string, marker: string): number => content.split(marker).length - 1

export const prepareCapabilityPublication = (
  readme: string | undefined,
  sources: readonly CapabilitySource[]
): CapabilityPublicationDraft => {
  const parsed = sources.map(parseCapabilitySource)
  const issues = parsed.flatMap((result) => (result.issue ? [result.issue] : []))
  const entries = parsed.flatMap((result) => (result.entry ? [result.entry] : []))
  const duplicateNames = entries
    .map((entry) => entry.name)
    .filter((name, index, names) => names.indexOf(name) !== index)
  for (const name of [...new Set(duplicateNames)].sort()) issues.push(`duplicate capability name: ${name}`)
  const names = new Set(entries.map((entry) => entry.name))
  for (const entry of entries)
    for (const dependency of entry.dependencies)
      if (!names.has(dependency)) issues.push(`${entry.path} depends on unknown capability ${dependency}`)
  if (issues.length > 0) return { state: 'unsafe', issues: [...new Set(issues)].sort() }

  const rendered = renderCapabilityCatalogue(entries)
  if (readme === undefined) return { state: 'missing', issues: [], rendered, merged: rendered }
  const startCount = markerCount(readme, CAPABILITY_CATALOGUE_START)
  const endCount = markerCount(readme, CAPABILITY_CATALOGUE_END)
  if (startCount === 0 && endCount === 0) {
    const prefix = readme.replace(/\s*$/, '')
    return { state: 'missing', issues: [], rendered, merged: `${prefix}\n\n${rendered}` }
  }
  if (startCount !== 1 || endCount !== 1)
    return { state: 'unsafe', issues: ['skills/README.md has ambiguous capability-catalogue markers'] }
  const start = readme.indexOf(CAPABILITY_CATALOGUE_START)
  const end = readme.indexOf(CAPABILITY_CATALOGUE_END)
  if (start > end) return { state: 'unsafe', issues: ['skills/README.md capability-catalogue markers are reversed'] }
  const existing = readme.slice(start, end + CAPABILITY_CATALOGUE_END.length + 1)
  const merged = `${readme.slice(0, start)}${rendered}${readme.slice(end + CAPABILITY_CATALOGUE_END.length + (readme[end + CAPABILITY_CATALOGUE_END.length] === '\n' ? 1 : 0))}`
  return { state: existing === rendered ? 'in-sync' : 'stale', issues: [], rendered, merged }
}
