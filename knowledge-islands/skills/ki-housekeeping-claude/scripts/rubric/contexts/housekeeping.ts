import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs'
import { basename, join, relative, resolve } from 'node:path'
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
}

export type HousekeepingIndexContext = {
  exists: readonly AuditOutcome[]
  entriesResolve: readonly AuditOutcome[]
  filesIndexed: readonly AuditOutcome[]
  lineLength: readonly AuditOutcome[]
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

const parseFrontmatter = (content: string): MemoryFrontmatter | null => {
  const match = content.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return null
  const output: Record<string, unknown> = {}
  let currentKey: string | null = null
  for (const line of (match[1] as string).split('\n')) {
    const topLevel = line.match(/^([a-zA-Z_]+):\s*(.*)$/)
    if (topLevel) {
      currentKey = topLevel[1] as string
      const value = (topLevel[2] as string).trim()
      output[currentKey] = value === '' ? {} : value.replace(/^["']|["']$/g, '')
      continue
    }
    const nested = line.match(/^\s+([a-zA-Z_]+):\s*(.*)$/)
    if (nested && currentKey && typeof output[currentKey] === 'object') {
      ;(output[currentKey] as Record<string, string>)[nested[1] as string] = (nested[2] as string)
        .trim()
        .replace(/^["']|["']$/g, '')
    }
  }
  return output
}

const one = (outcome: AuditOutcome): readonly AuditOutcome[] => [outcome]
const notApplicable = (message: string, subject: string): readonly AuditOutcome[] =>
  one({ status: 'NOT_APPLICABLE', message, subject })

const indexEntries = (index: string): string[] =>
  [...index.matchAll(/^-\s*\[.+\]\(([^)]+\.md)\)/gm)].map((match) => match[1] as string)

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
  subject: string,
  publication?: RubricContextOptions['publication']
): HousekeepingRubricContext => {
  const memory = notApplicable('The selected repository has no physical Claude project memory directory.', subject)
  return {
    rubric: { publication },
    index: {
      exists: memory,
      entriesResolve: memory,
      filesIndexed: memory,
      lineLength: memory,
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
      return { file: entry.name, relativePath, content, frontmatter: parseFrontmatter(content) }
    })
    .sort((left, right) => left.file.localeCompare(right.file))
  const indexPath = join(memoryDirectory, INDEX_FILE)
  const indexRelativePath = relative(userHome, indexPath)
  const index = physicalFile(indexPath) ? readFileSync(indexPath, 'utf8') : null
  if (index !== null) drafts.set(indexRelativePath, { original: index, content: index })
  const indexed = new Set(index === null ? [] : indexEntries(index))
  const noFiles = memoryFiles.length === 0
  const noFileEvidence = notApplicable('No memory files to inspect.', memoryRoot)
  const present = noFiles
    ? noFileEvidence
    : memoryFiles.map((memory) => ({
        status: memory.frontmatter ? ('PASS' as const) : ('VIOLATION' as const),
        message: memory.frontmatter ? 'frontmatter block found' : 'no frontmatter block found',
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
  const missingFiles =
    index === null ? [] : indexEntries(index).filter((entry) => !memoryFiles.some((file) => file.file === entry))
  const unindexed = index === null ? [] : memoryFiles.filter((memory) => !indexed.has(memory.file))
  const longLines =
    index === null ? [] : index.split('\n').filter((line) => /^-\s*\[.+\]\(.+\.md\)/.test(line) && line.length > 150)
  const start = index?.indexOf('<!-- headroom:learn:start -->') ?? -1
  const end = index?.indexOf('<!-- headroom:learn:end -->') ?? -1
  const markers =
    index === null
      ? notApplicable('MEMORY.md is absent.', indexRelativePath)
      : one(
          start === -1 && end === -1
            ? { status: 'PASS', message: 'No headroom:learn block is present.', subject: indexRelativePath }
            : start === -1 || end === -1 || end < start
              ? {
                  status: 'VIOLATION',
                  message: 'headroom:learn block has malformed markers',
                  subject: indexRelativePath
                }
              : { status: 'PASS', message: 'headroom:learn block markers well-formed', subject: indexRelativePath }
        )
  const learnedEntries =
    index === null
      ? notApplicable('MEMORY.md is absent.', indexRelativePath)
      : start === -1 || end === -1 || end < start
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
          : missingFiles.length > 0
            ? missingFiles.map((file) => ({
                status: 'VIOLATION',
                message: `index entry points to missing file: ${file}`,
                subject: indexRelativePath
              }))
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
      lineLength:
        index === null
          ? notApplicable('MEMORY.md is absent.', indexRelativePath)
          : longLines.length > 0
            ? longLines.map((line) => ({
                status: 'VIOLATION',
                message: `index line exceeds 150 chars: ${line.slice(0, 60)}...`,
                subject: indexRelativePath
              }))
            : one({ status: 'PASS', message: 'Index lines stay within 150 characters.', subject: indexRelativePath }),
      markers,
      learnedEntries,
      ...(mutable && index !== null && unindexed.length > 0
        ? {
            appendUnindexed: () => {
              const draft = drafts.get(indexRelativePath)
              if (!draft) return
              const currentIndexed = new Set(indexEntries(draft.content))
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
  const projectsRoot = join(claudeRoot, 'projects')
  const drafts = new Map<string, MemoryDraft>()
  const memoryRelativePath = join('.claude', 'projects', repositorySlug, 'memory')
  const memoryDirectory = join(projectsRoot, repositorySlug, 'memory')
  const selectedMemory =
    physicalDirectory(claudeRoot) && physicalDirectory(projectsRoot) && physicalDirectory(memoryDirectory)
      ? {
          ...projectContext(home, repositoryName, memoryRelativePath, memoryDirectory, mode === 'conform', drafts),
          rubric: { publication }
        }
      : null
  const memoryFamilies = ['IDX', 'FM', 'LINK', 'DOC']

  return {
    subjects: [
      {
        families: memoryFamilies,
        subject: memoryRelativePath,
        context: () => selectedMemory ?? unavailableMemoryContext(memoryRelativePath, publication)
      },
      {
        families: ['RUBRIC'],
        subject: repositoryRoot,
        context: () => selectedMemory ?? unavailableMemoryContext(memoryRelativePath, publication)
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
