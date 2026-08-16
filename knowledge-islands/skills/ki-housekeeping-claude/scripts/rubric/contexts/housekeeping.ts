import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs'
import { basename, isAbsolute, join, relative, resolve } from 'node:path'
import type {
  AuditOutcome,
  ConformWrite,
  RubricContextOptions,
  RubricPublicationContext,
  RubricSession
} from '../../shared/rubric.ts'

const VALID_TYPES = new Set(['user', 'feedback', 'project', 'reference'])
const INDEX_FILE = 'MEMORY.md'
type MemoryFrontmatter = Record<string, unknown>

type MemoryFile = {
  file: string
  relativePath: string
  content: string
  frontmatter: MemoryFrontmatter | null
  frontmatterError?: string
}

type MemorySelection =
  | { state: 'selected'; relativePath: string; directory: string; message: string }
  | { state: 'unavailable'; relativePath: string; message: string }

export type HousekeepingSelectionContext = {
  selected: readonly AuditOutcome[]
}

export type HousekeepingRuntimeContext = {
  server: readonly AuditOutcome[]
}

export type HousekeepingIndexContext = {
  exists: readonly AuditOutcome[]
  entriesResolve: readonly AuditOutcome[]
  filesIndexed: readonly AuditOutcome[]
  sizeEvidence: readonly AuditOutcome[]
  markers: readonly AuditOutcome[]
  learnedEntries: readonly AuditOutcome[]
  appendUnindexed?: () => void
}

export type HousekeepingFrontmatterContext = {
  present: readonly AuditOutcome[]
  namesMatch: readonly AuditOutcome[]
  descriptions: readonly AuditOutcome[]
  types: readonly AuditOutcome[]
  uniqueNames: readonly AuditOutcome[]
  alignNames?: () => void
}

export type HousekeepingLinkContext = {
  unresolved: readonly AuditOutcome[]
}

export type HousekeepingDocContext = Record<never, never>

export type HousekeepingRubricContext = {
  rubric: RubricPublicationContext
  selection: HousekeepingSelectionContext
  runtime: HousekeepingRuntimeContext
  index: HousekeepingIndexContext
  frontmatter: HousekeepingFrontmatterContext
  link: HousekeepingLinkContext
  doc: HousekeepingDocContext
}

type MemoryDraft = {
  original: string
  content: string
}

const physicalDirectory = (path: string): boolean =>
  existsSync(path) && !lstatSync(path).isSymbolicLink() && lstatSync(path).isDirectory()

const physicalFile = (path: string): boolean =>
  existsSync(path) && !lstatSync(path).isSymbolicLink() && lstatSync(path).isFile()

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const parseFrontmatter = (content: string): { frontmatter: MemoryFrontmatter | null; error?: string } => {
  const match = content.match(/^---\n([\s\S]*?)\n---(?:\n|$)/)
  if (!match) return { frontmatter: null }
  try {
    const value = Bun.YAML.parse(match[1] as string)
    return isRecord(value) ? { frontmatter: value } : { frontmatter: null, error: 'frontmatter must be a YAML mapping' }
  } catch {
    return { frontmatter: null, error: 'frontmatter is not valid YAML' }
  }
}

const one = (outcome: AuditOutcome): readonly AuditOutcome[] => [outcome]
const notApplicable = (message: string, subject: string): readonly AuditOutcome[] =>
  one({ status: 'NOT_APPLICABLE', message, subject })

const headroomBlockRange = (index: string): { start: number; end: number } | null => {
  const start = index.indexOf('<!-- headroom:learn:start -->')
  const end = index.indexOf('<!-- headroom:learn:end -->')
  return start >= 0 && end >= start ? { start, end: end + '<!-- headroom:learn:end -->'.length } : null
}

const indexEntries = (index: string): { files: string[]; malformed: string[] } => {
  const files: string[] = []
  const malformed: string[] = []
  const block = headroomBlockRange(index)
  const authoredIndex = block === null ? index : `${index.slice(0, block.start)}${index.slice(block.end)}`
  for (const line of authoredIndex.split('\n')) {
    if (!line.startsWith('-')) continue
    const match = line.match(/^-\s*\[[^\]]+\]\(([^)]+\.md)\)\s+—\s+\S.*$/)
    if (!match || (match[1] as string).includes('/') || (match[1] as string).includes('\\')) {
      malformed.push(line)
      continue
    }
    files.push(match[1] as string)
  }
  return { files, malformed }
}

const configuredPath = (home: string, raw: string): string =>
  raw === '~'
    ? home
    : raw.startsWith('~/')
      ? join(home, raw.slice(2))
      : isAbsolute(raw)
        ? resolve(raw)
        : resolve(home, raw)

const isContained = (root: string, path: string): boolean => {
  const pathRelative = relative(root, path)
  return pathRelative === '' || (!pathRelative.startsWith('..') && !isAbsolute(pathRelative))
}

const physicalDescendant = (root: string, path: string): boolean => {
  if (!isContained(root, path) || !physicalDirectory(root) || !physicalDirectory(path)) return false
  let current = root
  for (const part of relative(root, path).split('/').filter(Boolean)) {
    current = join(current, part)
    if (!physicalDirectory(current)) return false
  }
  return true
}

const physicalFileDescendant = (root: string, path: string): boolean => {
  if (!isContained(root, path) || !physicalDirectory(root) || !physicalFile(path)) return false
  const parts = relative(root, path).split('/').filter(Boolean)
  let current = root
  for (const part of parts.slice(0, -1)) {
    current = join(current, part)
    if (!physicalDirectory(current)) return false
  }
  return true
}

const selectMemory = (home: string, repositorySlug: string): MemorySelection => {
  const claudeRoot = join(home, '.claude')
  const defaultDirectory = join(claudeRoot, 'projects', repositorySlug, 'memory')
  const defaultRelativePath = relative(home, defaultDirectory)
  const settingsPath = join(claudeRoot, 'settings.json')
  if (!physicalFileDescendant(home, settingsPath)) {
    return {
      state: 'unavailable',
      relativePath: defaultRelativePath,
      message: 'Native Claude settings are unavailable; the selected auto-memory directory cannot be established.'
    }
  }
  let settings: Record<string, unknown>
  try {
    const parsed = JSON.parse(readFileSync(settingsPath, 'utf8'))
    if (!isRecord(parsed)) throw new Error('not an object')
    settings = parsed
  } catch {
    return {
      state: 'unavailable',
      relativePath: defaultRelativePath,
      message: 'Native Claude settings are malformed; the selected auto-memory directory cannot be established.'
    }
  }
  if (!Object.hasOwn(settings, 'autoMemoryDirectory')) {
    return {
      state: 'selected',
      relativePath: defaultRelativePath,
      directory: defaultDirectory,
      message: 'Native settings contain no auto-memory override; the documented default directory is selected.'
    }
  }
  const override = settings.autoMemoryDirectory
  if (typeof override !== 'string' || !override.trim()) {
    return {
      state: 'unavailable',
      relativePath: defaultRelativePath,
      message:
        'Native auto-memory override is disabled or unsupported; the selected directory is unavailable rather than defaulted.'
    }
  }
  const directory = configuredPath(home, override)
  if (!isContained(claudeRoot, directory)) {
    return {
      state: 'unavailable',
      relativePath: defaultRelativePath,
      message: 'Native auto-memory override resolves outside the bounded Claude root and is not inspected.'
    }
  }
  return {
    state: 'selected',
    relativePath: relative(home, directory),
    directory,
    message: 'Native auto-memory override selects this bounded directory.'
  }
}

const replaceName = (content: string, expected: string): string => {
  const block = content.match(/^---\n([\s\S]*?)\n---/)
  if (!block) return content
  const body = block[1] as string
  const replacement = /^name:\s*.*$/m.test(body)
    ? body.replace(/^name:\s*.*$/m, `name: ${expected}`)
    : `name: ${expected}\n${body}`
  return content.replace(block[0], `---\n${replacement}\n---`)
}

const unavailableMemoryContext = (
  selection: MemorySelection,
  publication?: RubricContextOptions['publication']
): HousekeepingRubricContext => {
  const memory = notApplicable(
    'The selected native auto-memory directory is unavailable for inspection.',
    selection.relativePath
  )
  return {
    rubric: { publication },
    selection: {
      selected: one({ status: 'VIOLATION', message: selection.message, subject: selection.relativePath })
    },
    runtime: {
      server: notApplicable(
        'No server registration, access exposure, or executed audit evidence is available to this bounded local session.',
        selection.relativePath
      )
    },
    index: {
      exists: memory,
      entriesResolve: memory,
      filesIndexed: memory,
      sizeEvidence: memory,
      markers: memory,
      learnedEntries: memory
    },
    frontmatter: {
      present: memory,
      namesMatch: memory,
      descriptions: memory,
      types: memory,
      uniqueNames: memory
    },
    link: { unresolved: memory },
    doc: {}
  }
}

const projectContext = (
  userHome: string,
  repositoryName: string,
  memoryRoot: string,
  memoryDirectory: string,
  mutable: boolean,
  drafts: Map<string, MemoryDraft>
): Omit<HousekeepingRubricContext, 'rubric'> => {
  const names = readdirSync(memoryDirectory, { withFileTypes: true })
  const memoryFiles: MemoryFile[] = names
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md') && entry.name !== INDEX_FILE)
    .map((entry) => {
      const path = join(memoryDirectory, entry.name)
      const content = readFileSync(path, 'utf8')
      const relativePath = relative(userHome, path)
      drafts.set(relativePath, { original: content, content })
      const parsed = parseFrontmatter(content)
      return { file: entry.name, relativePath, content, ...parsed }
    })
    .sort((left, right) => left.file.localeCompare(right.file))
  const indexPath = join(memoryDirectory, INDEX_FILE)
  const indexRelativePath = relative(userHome, indexPath)
  const index = physicalFile(indexPath) ? readFileSync(indexPath, 'utf8') : null
  if (index !== null) drafts.set(indexRelativePath, { original: index, content: index })
  const parsedIndex = index === null ? { files: [], malformed: [] } : indexEntries(index)
  const indexed = new Set(parsedIndex.files)
  const noFiles = memoryFiles.length === 0
  const noFileEvidence = notApplicable('No memory files to inspect.', memoryRoot)
  const present = noFiles
    ? noFileEvidence
    : memoryFiles.map((memory) => ({
        status: memory.frontmatter ? ('PASS' as const) : ('VIOLATION' as const),
        message: memory.frontmatter
          ? 'frontmatter block found'
          : (memory.frontmatterError ?? 'no frontmatter block found'),
        subject: memory.relativePath
      }))
  const namesMatch = noFiles
    ? noFileEvidence
    : memoryFiles.map((memory): AuditOutcome => {
        const expected = memory.file.replace(/\.md$/, '')
        const name = memory.frontmatter?.name
        const validSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(expected)
        const valid = typeof name === 'string' && name === expected && validSlug
        return {
          status: valid ? 'PASS' : 'VIOLATION',
          message: valid
            ? 'name matches the filename slug'
            : !validSlug
              ? `filename slug '${expected}' is not kebab-case`
              : typeof name !== 'string'
                ? 'missing name field'
                : `name '${name}' does not match filename slug '${expected}'`,
          subject: memory.relativePath
        }
      })
  const descriptions = noFiles
    ? noFileEvidence
    : memoryFiles.map((memory) => {
        const description = memory.frontmatter?.description
        const valid = typeof description === 'string' && Boolean(description.trim())
        return {
          status: valid ? ('PASS' as const) : ('VIOLATION' as const),
          message: valid ? 'description field present' : 'missing or empty description field',
          subject: memory.relativePath
        }
      })
  const types = noFiles
    ? noFileEvidence
    : memoryFiles.map((memory) => {
        const metadata = memory.frontmatter?.metadata
        const type = metadata && typeof metadata === 'object' ? (metadata as Record<string, string>).type : undefined
        const valid = Boolean(type && VALID_TYPES.has(type))
        return {
          status: valid ? ('PASS' as const) : ('VIOLATION' as const),
          message: valid
            ? 'metadata.type is valid'
            : `metadata.type is '${type ?? '(missing)'}', must be one of ${[...VALID_TYPES].join(', ')}`,
          subject: memory.relativePath
        }
      })
  const seen = new Map<string, string>()
  const uniqueNames: AuditOutcome[] = []
  for (const memory of memoryFiles) {
    const name = memory.frontmatter?.name
    if (typeof name !== 'string') continue
    const prior = seen.get(name)
    uniqueNames.push(
      prior
        ? {
            status: 'VIOLATION',
            message: `duplicate name '${name}' also used by ${prior}`,
            subject: memory.relativePath
          }
        : { status: 'PASS', message: 'name slug is unique.', subject: memory.relativePath }
    )
    if (!prior) seen.set(name, memory.relativePath)
  }
  if (uniqueNames.length === 0) uniqueNames.push(...noFileEvidence)
  const missingFiles = parsedIndex.files.filter((entry) => !memoryFiles.some((file) => file.file === entry))
  const unindexed = index === null ? [] : memoryFiles.filter((memory) => !indexed.has(memory.file))
  const block = index === null ? null : headroomBlockRange(index)
  const start = block?.start ?? -1
  const end = block === null ? -1 : block.end - '<!-- headroom:learn:end -->'.length
  const learnedBlock = block === null || index === null ? undefined : index.slice(start, end)
  const markerDate = learnedBlock?.match(/_Auto-generated by `headroom learn` on (\d{4}-\d{2}-\d{2})\b/)
  const validMarkerDate = markerDate ? !Number.isNaN(Date.parse(markerDate[1] as string)) : false
  const markers =
    index === null
      ? notApplicable('MEMORY.md is absent.', indexRelativePath)
      : one(
          start === -1 && end === -1
            ? { status: 'PASS', message: 'No headroom:learn block is present.', subject: indexRelativePath }
            : start === -1 || end === -1 || end < start || !validMarkerDate
              ? {
                  status: 'VIOLATION',
                  message: 'headroom:learn block has malformed markers or required generation date',
                  subject: indexRelativePath
                }
              : { status: 'PASS', message: 'headroom:learn block markers well-formed', subject: indexRelativePath }
        )
  const learnedEntries =
    index === null
      ? notApplicable('MEMORY.md is absent.', indexRelativePath)
      : start === -1 || end === -1 || end < start || !validMarkerDate
        ? notApplicable('No well-formed headroom:learn block to inspect.', indexRelativePath)
        : (() => {
            const foreign = new Set<string>()
            let count = 0
            for (const line of index.slice(start, end).split('\n')) {
              const names = [...line.matchAll(/knowledgeislands\/([A-Za-z0-9_-]+)/g)]
                .map((match) => match[1] as string)
                .filter((name) => name !== repositoryName)
              if (names.length === 0) continue
              count++
              for (const name of names) foreign.add(name)
            }
            return one(
              foreign.size > 0
                ? {
                    status: 'VIOLATION',
                    message: `headroom:learn block has ${count} line(s) rooted in other repo(s) (${[...foreign].join(', ')}) — remove the source with headroom memory list/show/delete --db-path; re-learn here if still useful`,
                    subject: indexRelativePath
                  }
                : {
                    status: 'PASS',
                    message: 'headroom:learn block contains no foreign-repository entries.',
                    subject: indexRelativePath
                  }
            )
          })()
  const knownNames = new Set(
    memoryFiles.map((memory) => memory.frontmatter?.name).filter((name): name is string => typeof name === 'string')
  )
  let dangling = 0
  for (const memory of memoryFiles) {
    for (const link of memory.content.match(/\[\[([a-z0-9-]+)\]\]/g) ?? []) {
      const target = link.slice(2, -2)
      if (!knownNames.has(target) && target !== memory.file.replace(/\.md$/, '')) dangling++
    }
  }

  return {
    index: {
      exists: one(
        index === null
          ? { status: 'VIOLATION', message: `${INDEX_FILE} not found`, subject: indexRelativePath }
          : { status: 'PASS', message: `${INDEX_FILE} exists`, subject: indexRelativePath }
      ),
      entriesResolve:
        index === null
          ? notApplicable('MEMORY.md is absent.', indexRelativePath)
          : missingFiles.length > 0 || parsedIndex.malformed.length > 0
            ? [
                ...parsedIndex.malformed.map((line) => ({
                  status: 'VIOLATION' as const,
                  message: `malformed index entry: ${line || '(empty bullet)'}`,
                  subject: indexRelativePath
                })),
                ...missingFiles.map((file) => ({
                  status: 'VIOLATION' as const,
                  message: `index entry points to missing file: ${file}`,
                  subject: indexRelativePath
                }))
              ]
            : one({ status: 'PASS', message: 'Every index entry resolves.', subject: indexRelativePath }),
      filesIndexed:
        index === null
          ? notApplicable('MEMORY.md is absent.', indexRelativePath)
          : unindexed.length > 0
            ? unindexed.map((memory) => ({
                status: 'VIOLATION',
                message: `${memory.file} is not listed in ${INDEX_FILE}`,
                subject: memory.relativePath
              }))
            : one({ status: 'PASS', message: 'Every memory file is indexed.', subject: indexRelativePath }),
      sizeEvidence:
        index === null
          ? notApplicable('MEMORY.md is absent.', indexRelativePath)
          : one({
              status: 'INFO',
              message: `Observed ${Buffer.byteLength(index, 'utf8')} UTF-8 byte(s) in ${INDEX_FILE}; no effective native aggregate loading limit is asserted by this rubric.`,
              subject: indexRelativePath
            }),
      markers,
      learnedEntries,
      ...(mutable && index !== null && unindexed.length > 0
        ? {
            appendUnindexed: () => {
              const draft = drafts.get(indexRelativePath)
              if (!draft) return
              const currentIndexed = new Set(indexEntries(draft.content).files)
              const lines = memoryFiles.flatMap((memory) => {
                if (currentIndexed.has(memory.file)) return []
                const title = memory.file.replace(/\.md$/, '')
                const description =
                  typeof memory.frontmatter?.description === 'string' && memory.frontmatter.description.trim()
                    ? memory.frontmatter.description.trim()
                    : '(no description — see file)'
                return [`- [${title}](${memory.file}) — ${description}`]
              })
              if (lines.length > 0) draft.content = `${draft.content.replace(/\n*$/, '\n')}${lines.join('\n')}\n`
            }
          }
        : {})
    },
    selection: {
      selected: one({
        status: 'PASS',
        message: 'The native auto-memory directory was selected from available settings evidence.',
        subject: memoryRoot
      })
    },
    runtime: {
      server: notApplicable(
        'No server registration, access exposure, or executed audit evidence is available to this bounded local session.',
        memoryRoot
      )
    },
    frontmatter: {
      present,
      namesMatch,
      descriptions,
      types,
      uniqueNames,
      ...(mutable &&
      memoryFiles.some((memory) => {
        const expected = memory.file.replace(/\.md$/, '')
        return memory.frontmatter && memory.frontmatter.name !== expected && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(expected)
      })
        ? {
            alignNames: () => {
              for (const memory of memoryFiles) {
                if (!memory.frontmatter) continue
                const expected = memory.file.replace(/\.md$/, '')
                if (memory.frontmatter.name === expected || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(expected)) continue
                const draft = drafts.get(memory.relativePath)
                if (draft) draft.content = replaceName(draft.content, expected)
              }
            }
          }
        : {})
    },
    link: {
      unresolved: one(
        dangling > 0
          ? {
              status: 'INFO',
              message: `${dangling} [[wikilink]] reference(s) point to a memory not yet written — treated as intentional forward references`,
              subject: memoryRoot
            }
          : { status: 'PASS', message: 'No unresolved wikilinks.', subject: memoryRoot }
      )
    },
    doc: {}
  }
}

export const createHousekeepingSession = ({
  mode,
  repository,
  userHome,
  publication
}: RubricContextOptions): RubricSession<HousekeepingRubricContext> => {
  const home = resolve(userHome)
  const repositoryRoot = resolve(repository)
  const repositoryName = basename(repositoryRoot)
  const repositorySlug = repositoryRoot.replace(/[/.]/g, '-')
  const claudeRoot = join(home, '.claude')
  const drafts = new Map<string, MemoryDraft>()
  const selection = selectMemory(home, repositorySlug)
  const selectedMemory =
    selection.state === 'selected' && physicalDescendant(claudeRoot, selection.directory)
      ? {
          ...projectContext(
            home,
            repositoryName,
            selection.relativePath,
            selection.directory,
            mode === 'conform',
            drafts
          ),
          rubric: { publication }
        }
      : null
  const memoryFamilies = ['SELECT', 'RUNTIME', 'IDX', 'FM', 'LINK', 'DOC']

  return {
    subjects: [
      {
        families: memoryFamilies,
        subject: selection.relativePath,
        context: () => selectedMemory ?? unavailableMemoryContext(selection, publication)
      },
      {
        families: ['RUBRIC'],
        subject: repositoryRoot,
        context: () => selectedMemory ?? unavailableMemoryContext(selection, publication)
      }
    ],
    proposal: () => {
      const writes: ConformWrite[] = []
      for (const [path, draft] of drafts) {
        if (draft.content !== draft.original) writes.push({ path, content: draft.content })
      }
      return { writes }
    }
  }
}
