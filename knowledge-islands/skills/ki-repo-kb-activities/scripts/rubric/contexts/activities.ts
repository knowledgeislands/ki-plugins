import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs'
import { isAbsolute, join, relative, resolve } from 'node:path'
import type {
  ConformWrite,
  RubricContextOptions,
  RubricPublicationContext,
  RubricSession
} from '../../shared/rubric.ts'

const DEFAULT_ACTIVITIES_DIRECTORY = 'Admin/Operations/Activities'
const ACTIVITIES_INDEX = 'Activities.md'

export type ActivityNote = {
  readonly relative: string
  readonly indexLink: string
  readonly title: string
  readonly frontmatter: Readonly<Record<string, string>> | null
  readonly malformedFrontmatter: boolean
}

export type ActivitiesContext = {
  readonly repository: {
    readonly path: string
    readonly available: boolean
  }
  readonly collection: {
    readonly relative: string
    readonly pathSafe: boolean
    readonly available: boolean
    readonly unsafeEntry: boolean
  }
  readonly index: {
    readonly relative: string
    readonly exists: boolean
    readonly content: string
    readonly unsafeEntry: boolean
  }
  readonly configuration: {
    readonly keys: readonly string[]
  }
  readonly notes: readonly ActivityNote[]
  readonly harness?: {
    readonly path: string
    readonly hasSkill: (name: string) => boolean
  }
  readonly ensureIndex?: () => void
}

export type ActivitiesRubricContext = {
  readonly rubric: RubricPublicationContext
  readonly activities: ActivitiesContext
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

const parseFrontmatter = (text: string): { value: Readonly<Record<string, string>> | null; malformed: boolean } => {
  if (text.split(/\r?\n/, 1)[0]?.trim() !== '---') return { value: null, malformed: false }
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)
  if (!match) return { value: null, malformed: true }
  try {
    const parsed = Bun.YAML.parse(match[1] ?? '')
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return { value: null, malformed: true }
    const fields = Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>).filter(
        (entry): entry is [string, string] => typeof entry[1] === 'string'
      )
    )
    return { value: fields, malformed: false }
  } catch {
    return { value: null, malformed: true }
  }
}

export const markdownLinkTargets = (text: string): ReadonlySet<string> => {
  const targets = new Set<string>()
  const prose = text.replace(/^```[\s\S]*?^```\s*$/gm, '')
  for (const match of prose.matchAll(/\[[^\]]+\]\((?:<([^>]+)>|([^\s)]+))(?:\s+['"][^)]*['"])?\)/g)) {
    const target = (match[1] ?? match[2] ?? '').trim()
    if (target) targets.add(target.replace(/^\.\//, ''))
  }
  return targets
}

const walkMarkdown = (directory: string, results: string[] = []): string[] => {
  if (!isDirectory(directory)) return results
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) walkMarkdown(path, results)
    else if (entry.isFile() && entry.name.endsWith('.md')) results.push(path)
  }
  return results
}

const titleFromNote = (text: string, link: string): string => {
  const body = text.replace(/^---\n[\s\S]*?\n---\n/, '')
  return body.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? link.replace(/\.md$/, '')
}

const configuredString = (configuration: Readonly<Record<string, unknown>>, key: string): string | undefined => {
  const value = configuration[key]
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

const indexEntry = (note: ActivityNote): string => {
  const target = /\s/.test(note.indexLink) ? `<${note.indexLink}>` : note.indexLink
  return `- [${note.title}](${target})`
}

export const createActivitiesSession = ({
  mode,
  repository,
  configuration,
  publication
}: RubricContextOptions): RubricSession<ActivitiesRubricContext> => {
  const root = resolve(repository)
  const repositoryAvailable = isDirectory(root)
  const activitiesDirectory = configuredString(configuration, 'activities_dir') ?? DEFAULT_ACTIVITIES_DIRECTORY
  const activitiesPath = resolve(root, activitiesDirectory)
  const activitiesRelative = containedPath(root, activitiesPath)
  const pathSafe = Boolean(activitiesRelative)
  const collectionEntryExists = existsSync(activitiesPath)
  const activitiesAvailable = repositoryAvailable && pathSafe && safeDirectory(root, activitiesPath)
  const unsafeCollectionEntry = collectionEntryExists && !activitiesAvailable
  const indexPath = join(activitiesPath, ACTIVITIES_INDEX)
  const indexRelative = activitiesRelative
    ? join(activitiesRelative, ACTIVITIES_INDEX)
    : join(activitiesDirectory, ACTIVITIES_INDEX)
  const indexEntryExists = pathSafe && existsSync(indexPath)
  const indexExists = activitiesAvailable && isFile(indexPath)
  const unsafeIndexEntry = indexEntryExists && !indexExists
  const indexContent = indexExists ? readFileSync(indexPath, 'utf8') : ''
  const notes = activitiesAvailable
    ? walkMarkdown(activitiesPath)
        .filter((path) => path !== indexPath)
        .map((path): ActivityNote => {
          const text = readFileSync(path, 'utf8')
          const link = relative(activitiesPath, path)
          const frontmatter = parseFrontmatter(text)
          return {
            relative: relative(root, path),
            indexLink: link,
            title: titleFromNote(text, link),
            frontmatter: frontmatter.value,
            malformedFrontmatter: frontmatter.malformed
          }
        })
    : []
  const harnessPath = configuredString(configuration, 'harness')
  const harness = harnessPath ? resolve(root, harnessPath) : undefined
  const original = indexExists ? indexContent : undefined
  let indexDraft = original

  const context: ActivitiesRubricContext = {
    rubric: { publication },
    activities: {
      repository: { path: root, available: repositoryAvailable },
      collection: {
        relative: activitiesRelative ?? activitiesDirectory,
        pathSafe,
        available: activitiesAvailable,
        unsafeEntry: unsafeCollectionEntry
      },
      index: {
        relative: indexRelative,
        exists: indexExists,
        content: indexContent,
        unsafeEntry: unsafeIndexEntry
      },
      configuration: { keys: Object.keys(configuration) },
      notes,
      ...(harness
        ? {
            harness: {
              path: harness,
              hasSkill: (name: string) =>
                /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) && isFile(join(harness, 'skills', name, 'SKILL.md'))
            }
          }
        : {}),
      ...(mode === 'conform'
        ? {
            ensureIndex: () => {
              if (!activitiesAvailable || unsafeIndexEntry || notes.length === 0) return
              const content = indexDraft || '# Activities'
              const targets = markdownLinkTargets(content)
              const missing = notes.filter((note) => !targets.has(note.indexLink))
              if (missing.length === 0) return
              const prefix = content.trimEnd()
              indexDraft = `${prefix}${prefix === '# Activities' ? '\n\n' : '\n'}${missing.map(indexEntry).join('\n')}\n`
            }
          }
        : {})
    }
  }

  return {
    subjects: [
      { families: ['RUBRIC'], context: () => context },
      { families: ['ACT'], context: () => context }
    ],
    proposal: () => {
      if (indexDraft === undefined || indexDraft === original || !activitiesRelative) return { writes: [] }
      const write: ConformWrite = {
        path: indexRelative,
        content: indexDraft,
        ...(original === undefined ? { create: true } : {})
      }
      return { writes: [write] }
    }
  }
}
