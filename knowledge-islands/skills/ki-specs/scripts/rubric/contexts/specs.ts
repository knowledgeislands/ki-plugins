import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs'
import { basename, isAbsolute, join, relative, resolve } from 'node:path'
import type {
  ConformWrite,
  RubricContextOptions,
  RubricPublicationContext,
  RubricSession
} from '../../shared/rubric.ts'

const DEFAULT_DIRECTORY = 'docs/specs'
const INDEX_FILE = 'index.md'
const RFC2119 =
  /\b(MUST NOT|MUST|SHALL NOT|SHALL|SHOULD NOT|SHOULD|MAY|REQUIRED|RECOMMENDED|NOT RECOMMENDED|OPTIONAL)\b/
const REQUIREMENT_HEADING = /^###\s+([A-Z][A-Z0-9]*(?:-[A-Z][A-Z0-9]*)*)-(\d{3,})\s+—\s+(.+?)\s*$/
const H3 = /^###\s+(.+?)\s*$/
const NEAR_MISS_HEADING = /^###\s+([A-Z][A-Z0-9]*(?:-[A-Z][A-Z0-9]*)*-\d{3,})\s*(?:[–—-]{1,2})\s*(\S.*?)\s*$/

export type SpecRequirement = {
  readonly file: string
  readonly id: string
  readonly prefix: string
  readonly owner?: string
  readonly duplicateOf?: string
  readonly deprecated: boolean
  readonly hasNormativeKeyword: boolean
  readonly hasVerify: boolean
}

export type DuplicatePrefixRegistration = {
  readonly prefix: string
  readonly firstFile: string
  readonly duplicateFile: string
}

export type SpecHeadingIssue = {
  readonly file: string
  readonly heading: string
  readonly canonical?: string
}

type CanonicalHeadingIssue = SpecHeadingIssue & { readonly canonical: string }

export type SpecIndexContext = {
  readonly exists: boolean
  readonly prefixToFile: ReadonlyMap<string, string>
  readonly duplicatePrefixRegistrations: readonly DuplicatePrefixRegistration[]
}

export type SpecAreaContext = {
  readonly registeredMissingFiles: readonly { readonly prefix: string; readonly file: string }[]
  readonly unregisteredFiles: readonly string[]
}

export type SpecIdentityContext = {
  readonly headingIssues: readonly SpecHeadingIssue[]
  readonly requirements: readonly SpecRequirement[]
  readonly normaliseHeadings?: () => void
}

export type SpecRequirementContext = {
  readonly requirements: readonly SpecRequirement[]
}

export type SpecVerificationContext = {
  readonly requirements: readonly SpecRequirement[]
}

export type SpecJudgmentContext = Record<never, never>

export type SpecsRubricContext = {
  readonly rubric: RubricPublicationContext
  readonly index: SpecIndexContext
  readonly area: SpecAreaContext
  readonly identity: SpecIdentityContext
  readonly requirement: SpecRequirementContext
  readonly verification: SpecVerificationContext
  readonly judgment: SpecJudgmentContext
}

const isDirectory = (path: string): boolean =>
  existsSync(path) && !lstatSync(path).isSymbolicLink() && lstatSync(path).isDirectory()

const isFile = (path: string): boolean =>
  existsSync(path) && !lstatSync(path).isSymbolicLink() && lstatSync(path).isFile()

const containedPath = (root: string, path: string): string | undefined => {
  const value = relative(root, path)
  return value && !isAbsolute(value) && value !== '..' && !value.startsWith('../') ? value : undefined
}

const safeDirectory = (root: string, path: string): boolean => {
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

const splitRow = (line: string): string[] | null => {
  if (!/^\s*\|/.test(line)) return null
  return line
    .split('|')
    .slice(1, -1)
    .map((cell) => cell.trim())
}

const parseAreasTables = (
  indexContent: string
): { prefixToFile: Map<string, string>; duplicatePrefixRegistrations: DuplicatePrefixRegistration[] } => {
  const prefixToFile = new Map<string, string>()
  const duplicatePrefixRegistrations: DuplicatePrefixRegistration[] = []
  let prefixColumn = -1
  let fileColumn = -1
  for (const line of indexContent.split('\n')) {
    const cells = splitRow(line)
    if (!cells) {
      if (line.trim() === '') {
        prefixColumn = -1
        fileColumn = -1
      }
      continue
    }
    const nextPrefix = cells.findIndex((cell) => /^prefix$/i.test(cell.replace(/`/g, '')))
    const nextFile = cells.findIndex((cell) => /^file$/i.test(cell.replace(/`/g, '')))
    if (nextPrefix >= 0 && nextFile >= 0) {
      prefixColumn = nextPrefix
      fileColumn = nextFile
      continue
    }
    if (prefixColumn < 0 || fileColumn < 0 || /^[-: ]+$/.test(cells.join(''))) continue
    const prefixCell = cells[prefixColumn]?.replace(/`/g, '').trim() ?? ''
    const fileCell = (cells[fileColumn] ?? '')
      .replace(/[`[\]]/g, '')
      .replace(/\(.*?\)/, '')
      .trim()
    if (!prefixCell || !fileCell) continue
    for (const prefix of prefixCell
      .split(/[·,/]|\s+/)
      .map((value) => value.trim())
      .filter(Boolean)) {
      const owner = prefixToFile.get(prefix)
      if (owner && owner !== fileCell)
        duplicatePrefixRegistrations.push({ prefix, firstFile: owner, duplicateFile: fileCell })
      else prefixToFile.set(prefix, fileCell)
    }
  }
  return { prefixToFile, duplicatePrefixRegistrations }
}

const specsDirectory = (target: string): string => {
  const absolute = resolve(target)
  const nested = join(absolute, DEFAULT_DIRECTORY)
  if (isDirectory(nested)) return nested
  if (basename(absolute) === 'specs' || isFile(join(absolute, INDEX_FILE))) return absolute
  return nested
}

export const createSpecsSession = ({
  mode,
  repository,
  publication
}: RubricContextOptions): RubricSession<SpecsRubricContext> => {
  const root = resolve(repository)
  const directory = specsDirectory(root)
  const directorySafe = containedPath(root, directory)
    ? safeDirectory(root, directory)
    : directory === root && isDirectory(root)
  const entries = directorySafe ? readdirSync(directory, { withFileTypes: true }) : []
  const indexPath = join(directory, INDEX_FILE)
  const indexExists = entries.some((entry) => entry.name === INDEX_FILE && entry.isFile()) && isFile(indexPath)
  const indexContent = indexExists ? readFileSync(indexPath, 'utf8') : ''
  const { prefixToFile, duplicatePrefixRegistrations } = parseAreasTables(indexContent)
  const areaFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md') && entry.name !== INDEX_FILE)
    .map((entry) => entry.name)
    .sort()
  const registeredFiles = new Set(prefixToFile.values())
  const registeredMissingFiles = [...prefixToFile]
    .filter(([, file]) => !areaFiles.includes(file))
    .map(([prefix, file]) => ({ prefix, file }))
  const unregisteredFiles = areaFiles.filter((file) => !registeredFiles.has(file))
  const headingIssues: SpecHeadingIssue[] = []
  const requirements: SpecRequirement[] = []
  const seenIds = new Map<string, string>()
  const originals = new Map<string, string>()

  for (const file of areaFiles) {
    const relativePath = relative(root, join(directory, file))
    const content = readFileSync(join(directory, file), 'utf8')
    originals.set(relativePath, content)
    const lines = content.split('\n')
    let inGaps = false
    const fileRequirements: Array<{
      index: number
      id: string
      prefix: string
      title: string
      owner?: string
      duplicateOf?: string
    }> = []
    for (const [index, line] of lines.entries()) {
      const h2 = line.match(/^##\s+(.+?)\s*$/)
      if (h2) {
        inGaps = /^gaps\b/i.test((h2[1] ?? '').trim())
        continue
      }
      if (inGaps) continue
      const h3 = line.match(H3)
      if (!h3) continue
      const requirement = line.match(REQUIREMENT_HEADING)
      if (!requirement) {
        const near = line.match(NEAR_MISS_HEADING)
        headingIssues.push({
          file,
          heading: h3[1] ?? '',
          ...(near ? { canonical: `### ${near[1]} — ${near[2]}` } : {})
        })
        continue
      }
      const [, prefix, serial, title] = requirement
      const id = `${prefix}-${serial}`
      const duplicateOf = seenIds.get(id)
      if (!duplicateOf) seenIds.set(id, file)
      fileRequirements.push({
        index,
        id,
        prefix,
        title,
        owner: prefixToFile.get(prefix),
        ...(duplicateOf ? { duplicateOf } : {})
      })
    }
    for (const [position, requirement] of fileRequirements.entries()) {
      const nextRequirement = fileRequirements[position + 1]?.index ?? lines.length
      const nextH2 = lines.findIndex(
        (line, index) => index > requirement.index && index < nextRequirement && /^##\s+/.test(line)
      )
      const block = lines.slice(requirement.index + 1, nextH2 >= 0 ? nextH2 : nextRequirement).join('\n')
      requirements.push({
        file,
        id: requirement.id,
        prefix: requirement.prefix,
        ...(requirement.owner ? { owner: requirement.owner } : {}),
        ...(requirement.duplicateOf ? { duplicateOf: requirement.duplicateOf } : {}),
        deprecated: /deprecated/i.test(requirement.title) || /^~~/.test(requirement.title.trim()),
        hasNormativeKeyword: RFC2119.test(block),
        hasVerify: /_Verify:_/.test(block)
      })
    }
  }

  const drafts = new Map(originals)
  const context: SpecsRubricContext = {
    rubric: { publication },
    index: { exists: indexExists, prefixToFile, duplicatePrefixRegistrations },
    area: { registeredMissingFiles, unregisteredFiles },
    identity: {
      headingIssues,
      requirements,
      ...(mode === 'conform'
        ? {
            normaliseHeadings: () => {
              const byFile = new Map<string, CanonicalHeadingIssue[]>()
              for (const issue of headingIssues.filter(
                (value): value is CanonicalHeadingIssue => typeof value.canonical === 'string'
              ))
                byFile.set(issue.file, [...(byFile.get(issue.file) ?? []), issue])
              for (const [file, issues] of byFile) {
                const path = relative(root, join(directory, file))
                const content = drafts.get(path)
                if (content === undefined) continue
                const replacements = new Map(issues.map((issue) => [`### ${issue.heading}`, issue.canonical]))
                drafts.set(
                  path,
                  content
                    .split('\n')
                    .map((line) => replacements.get(line) ?? line)
                    .join('\n')
                )
              }
            }
          }
        : {})
    },
    requirement: { requirements },
    verification: { requirements },
    judgment: {}
  }

  return {
    subjects: [
      { families: ['RUBRIC'], context: () => context },
      {
        families: ['INDEX', 'AREA', 'ID', 'REQ', 'VERIFY', 'BEHAVIOUR', 'AS-BUILT', 'SPLIT', 'DR-LINK', 'AREA-FIT'],
        context: () => context
      }
    ],
    proposal: () => {
      const writes: ConformWrite[] = []
      for (const [path, content] of [...drafts].sort(([left], [right]) => left.localeCompare(right)))
        if (content !== originals.get(path)) writes.push({ path, content })
      return { writes }
    }
  }
}
