import { type Dirent, lstatSync, readdirSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import type { ConformWrite, RubricContextOptions, RubricSession } from '../../shared/rubric.ts'

const SKIP_DIRECTORIES = new Set(['.git', 'node_modules', '.ki', '.agents', '.claude'])
const RECOGNISED_PREFIXES = ['executable_', 'symlink_', 'private_', 'readonly_', 'dot_', 'create_', 'modify_'] as const
const IGNORE_CONTENT = '# Files/directories chezmoi should never manage.\n# Add repository-specific ignore patterns deliberately.\n'

export type RepositoryState = 'absent' | 'physical' | 'unsafe'
export type IgnoreState = 'missing' | 'physical' | 'unsafe'

export type ChezmoiShapeContext = {
  repository: string
  repositoryState: RepositoryState
  ignoreState: IgnoreState
  hasTemplateFiles: boolean
  hasTemplateSupport: boolean
  requestIgnoreCreate?: () => void
}

export type BinEntry = {
  name: string
  physical: boolean
}

export type BinContext = {
  repository: string
  repositoryState: RepositoryState
  entries: readonly BinEntry[] | null
}

export type GitContext = {
  repository: string
  repositoryState: RepositoryState
  locks: readonly string[] | null
}

export type ReviewContext = {
  repository: string
}

export type ChezmoiRubricContext = {
  shape: ChezmoiShapeContext
  bin: BinContext
  git: GitContext
  review: ReviewContext
}

const pathState = (path: string): 'missing' | 'file' | 'directory' | 'unsafe' => {
  try {
    const state = lstatSync(path)
    if (state.isSymbolicLink()) return 'unsafe'
    if (state.isFile()) return 'file'
    if (state.isDirectory()) return 'directory'
    return 'unsafe'
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === 'ENOENT' ? 'missing' : 'unsafe'
  }
}

const walkPhysicalFiles = (directory: string, onFile: (path: string) => void, skip: (name: string) => boolean): void => {
  let entries: Dirent[]
  try {
    entries = readdirSync(directory, { withFileTypes: true })
  } catch {
    return
  }
  for (const entry of entries) {
    if (skip(entry.name)) continue
    const path = join(directory, entry.name)
    const state = pathState(path)
    if (state === 'directory') walkPhysicalFiles(path, onFile, skip)
    else if (state === 'file') onFile(path)
  }
}

const repositoryState = (repository: string): RepositoryState => {
  const state = pathState(repository)
  if (state === 'missing') return 'absent'
  return state === 'directory' ? 'physical' : 'unsafe'
}

const inspectTemplates = (repository: string, state: RepositoryState): { files: boolean; support: boolean } => {
  if (state !== 'physical') return { files: false, support: false }
  let files = false
  walkPhysicalFiles(
    repository,
    (path) => {
      if (path.endsWith('.tmpl')) files = true
    },
    (name) => SKIP_DIRECTORIES.has(name)
  )
  return {
    files,
    support: pathState(join(repository, '.chezmoidata')) === 'directory' || pathState(join(repository, '.chezmoitemplates')) === 'directory'
  }
}

const inspectBin = (repository: string, state: RepositoryState): readonly BinEntry[] | null => {
  if (state !== 'physical' || pathState(join(repository, 'bin')) !== 'directory') return null
  let entries: string[]
  try {
    entries = readdirSync(join(repository, 'bin'))
  } catch {
    return []
  }
  return entries
    .flatMap((name): BinEntry[] => {
      const state = pathState(join(repository, 'bin', name))
      if (state === 'directory') return []
      return [{ name, physical: state === 'file' }]
    })
    .sort((left, right) => left.name.localeCompare(right.name))
}

const inspectGitLocks = (repository: string, state: RepositoryState): readonly string[] | null => {
  const git = join(repository, '.git')
  if (state !== 'physical' || pathState(git) !== 'directory') return null
  const locks: string[] = []
  for (const candidate of ['index.lock', 'HEAD.lock', 'config.lock', 'packed-refs.lock'])
    if (pathState(join(git, candidate)) === 'file') locks.push(`.git/${candidate}`)
  if (pathState(join(git, 'refs')) === 'directory')
    walkPhysicalFiles(
      join(git, 'refs'),
      (path) => {
        if (path.endsWith('.lock')) locks.push(relative(repository, path))
      },
      () => false
    )
  return locks.sort()
}

export const hasRecognisedPrefix = (name: string): boolean => RECOGNISED_PREFIXES.some((prefix) => name.startsWith(prefix))

export const createChezmoiSession = ({ mode, repository }: RubricContextOptions): RubricSession<ChezmoiRubricContext> => {
  const root = resolve(repository)
  const state = repositoryState(root)
  const ignorePath = join(root, '.chezmoiignore')
  const rawIgnoreState = pathState(ignorePath)
  const ignoreState: IgnoreState = rawIgnoreState === 'missing' ? 'missing' : rawIgnoreState === 'file' ? 'physical' : 'unsafe'
  let ignoreRequested = false
  const templates = inspectTemplates(root, state)
  const shape: ChezmoiShapeContext = {
    repository: root,
    repositoryState: state,
    ignoreState,
    hasTemplateFiles: templates.files,
    hasTemplateSupport: templates.support,
    ...(mode === 'conform' && state === 'physical' && ignoreState === 'missing'
      ? {
          requestIgnoreCreate: () => {
            ignoreRequested = true
          }
        }
      : {})
  }
  const context: ChezmoiRubricContext = {
    shape,
    bin: { repository: root, repositoryState: state, entries: inspectBin(root, state) },
    git: { repository: root, repositoryState: state, locks: inspectGitLocks(root, state) },
    review: { repository: root }
  }
  return {
    subjects: [
      { families: ['CHEZMOI', 'BIN', 'GIT', 'PATTERN', 'CONFIG', 'LAYER', 'ETIQ', 'SYNC'], context: () => context, subject: root }
    ],
    proposal: () => {
      const writes: ConformWrite[] = []
      if (ignoreRequested) writes.push({ path: '.chezmoiignore', content: IGNORE_CONTENT, create: true })
      return { writes }
    }
  }
}
