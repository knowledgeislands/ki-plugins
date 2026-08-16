import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs'
import { isAbsolute, join, relative, resolve } from 'node:path'
import type { RubricContextOptions, RubricPublicationContext, RubricSession } from '../../shared/rubric.ts'

const GUIDES_DIRECTORY = 'docs/guides'
const INDEX_FILE = 'README.md'
const RETIRED_ROOTS = ['docs/spec', 'docs/developer'] as const

export type GuidesLayoutContext = {
  readonly directoryExists: boolean
  readonly indexExists: boolean
  readonly headingIssues: readonly string[]
}

export type GuidesBoundaryContext = {
  readonly retiredRoots: readonly string[]
}

export type GuidesJudgmentContext = Record<never, never>

export type GuidesRubricContext = {
  readonly rubric: RubricPublicationContext
  readonly layout: GuidesLayoutContext
  readonly boundary: GuidesBoundaryContext
  readonly judgment: GuidesJudgmentContext
}

const isDirectory = (path: string): boolean =>
  existsSync(path) && !lstatSync(path).isSymbolicLink() && lstatSync(path).isDirectory()

const isFile = (path: string): boolean =>
  existsSync(path) && !lstatSync(path).isSymbolicLink() && lstatSync(path).isFile()

const safeDirectory = (root: string, directory: string): boolean => {
  const output = relative(root, directory)
  if (!output) return isDirectory(root)
  if (isAbsolute(output) || output === '..' || output.startsWith('../')) return false
  let cursor = root
  for (const segment of output.split(/[\\/]/)) {
    cursor = join(cursor, segment)
    if (!isDirectory(cursor)) return false
  }
  return true
}

const guideFiles = (root: string, directory: string): string[] => {
  const files: string[] = []
  const visit = (current: string): void => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const path = join(current, entry.name)
      if (entry.isDirectory() && !entry.isSymbolicLink()) visit(path)
      else if (
        entry.isFile() &&
        entry.name.endsWith('.md') &&
        relative(root, path) !== `${GUIDES_DIRECTORY}/${INDEX_FILE}`
      )
        files.push(relative(root, path))
    }
  }
  visit(directory)
  return files.sort()
}

const h1Count = (content: string): number => {
  let fenced = false
  let count = 0
  for (const line of content.split('\n')) {
    if (/^\s*(`{3,}|~{3,})/.test(line)) {
      fenced = !fenced
      continue
    }
    if (!fenced && /^#\s+\S/.test(line)) count += 1
  }
  return count
}

export const createGuidesSession = ({
  repository,
  publication
}: RubricContextOptions): RubricSession<GuidesRubricContext> => {
  const root = resolve(repository)
  const directory = join(root, GUIDES_DIRECTORY)
  const directoryExists = safeDirectory(root, directory)
  const indexPath = join(directory, INDEX_FILE)
  const indexExists = directoryExists && isFile(indexPath)
  const headingIssues = directoryExists
    ? guideFiles(root, directory).filter((file) => h1Count(readFileSync(join(root, file), 'utf8')) !== 1)
    : []
  const context: GuidesRubricContext = {
    rubric: { publication },
    layout: { directoryExists, indexExists, headingIssues },
    boundary: { retiredRoots: RETIRED_ROOTS.filter((path) => existsSync(join(root, path))) },
    judgment: {}
  }

  return {
    subjects: [
      { families: ['RUBRIC'], context: () => context },
      { families: ['GUIDE', 'ROUTE'], context: () => context }
    ],
    proposal: () => ({ writes: [] })
  }
}
