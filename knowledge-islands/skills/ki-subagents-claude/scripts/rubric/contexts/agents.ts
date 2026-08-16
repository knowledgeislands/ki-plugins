import { type Dirent, lstatSync, readdirSync, readFileSync } from 'node:fs'
import { basename, dirname, join, relative, resolve } from 'node:path'
import type { RubricContextOptions, RubricPublicationContext, RubricSession } from '../../shared/rubric.ts'

export type ClaudeDefinition = {
  file: string
  stem: string
  body: string
  keys: ReadonlyMap<string, unknown>
  raw: string | null
  parseError: string | null
}

export type ClaudeContext = {
  rubric: RubricPublicationContext
  repository: string
  rootState: 'absent' | 'physical' | 'unsafe'
  definition: ClaudeDefinition | null
  unsafePath: string | null
  definitions: readonly ClaudeDefinition[]
}

const state = (path: string): 'missing' | 'file' | 'directory' | 'unsafe' => {
  try {
    const entry = lstatSync(path)
    if (entry.isSymbolicLink()) return 'unsafe'
    if (entry.isFile()) return 'file'
    return entry.isDirectory() ? 'directory' : 'unsafe'
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === 'ENOENT' ? 'missing' : 'unsafe'
  }
}

const readDefinition = (file: string): ClaudeDefinition => {
  const content = readFileSync(file, 'utf8')
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)
  if (!match) return { file, stem: basename(file, '.md'), body: content, keys: new Map(), raw: null, parseError: null }
  try {
    const value = Bun.YAML.parse(match[1] as string)
    if (!value || typeof value !== 'object' || Array.isArray(value))
      return {
        file,
        stem: basename(file, '.md'),
        body: content.slice(match[0].length),
        keys: new Map(),
        raw: match[1] as string,
        parseError: 'YAML frontmatter must be a mapping.'
      }
    return {
      file,
      stem: basename(file, '.md'),
      body: content.slice(match[0].length),
      keys: new Map(Object.entries(value)),
      raw: match[1] as string,
      parseError: null
    }
  } catch (error) {
    return {
      file,
      stem: basename(file, '.md'),
      body: content.slice(match[0].length),
      keys: new Map(),
      raw: match[1] as string,
      parseError: error instanceof Error ? error.message : 'YAML frontmatter could not be parsed.'
    }
  }
}

export const createAgentsSession = ({
  mode: _mode,
  repository,
  publication
}: RubricContextOptions): RubricSession<ClaudeContext> => {
  const root = resolve(repository)
  const sourceRoot = join(root, 'subagents')
  const rawState = state(sourceRoot)
  const rootState = rawState === 'missing' ? 'absent' : rawState === 'directory' ? 'physical' : 'unsafe'
  const files: string[] = []
  const unsafe: string[] = []
  const walk = (directory: string, depth: number): void => {
    if (depth > 12) {
      unsafe.push(relative(root, directory))
      return
    }
    let entries: Dirent[]
    try {
      entries = readdirSync(directory, { withFileTypes: true })
    } catch {
      unsafe.push(relative(root, directory))
      return
    }
    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'README.md') continue
      const path = join(directory, entry.name)
      const entryState = state(path)
      if (entryState === 'directory') walk(path, depth + 1)
      else if (entryState === 'file' && entry.name.endsWith('.md')) files.push(path)
      else if (entryState === 'unsafe') unsafe.push(relative(root, path))
    }
  }
  if (rootState === 'physical') walk(sourceRoot, 0)
  else if (rootState === 'unsafe') unsafe.push('subagents')
  const definitions: ClaudeDefinition[] = []
  for (const file of files.sort()) {
    try {
      definitions.push(readDefinition(file))
    } catch {
      unsafe.push(relative(root, file))
    }
  }
  const context = (definition: ClaudeDefinition | null, unsafePath: string | null): ClaudeContext => ({
    rubric: { publication },
    repository: root,
    rootState,
    definition,
    unsafePath,
    definitions
  })
  const subjects = definitions.map((definition) => ({
    families: ['CLAUDE'],
    context: () => context(definition, null),
    subject: relative(root, definition.file)
  }))
  for (const unsafePath of [...new Set(unsafe)].sort())
    subjects.push({ families: ['CLAUDE'], context: () => context(null, unsafePath), subject: unsafePath })
  if (subjects.length === 0)
    subjects.push({
      families: ['CLAUDE'],
      context: () => context(null, null),
      subject: relative(dirname(sourceRoot), sourceRoot)
    })
  subjects.push({ families: ['RUBRIC'], context: () => context(null, null), subject: root })
  return { subjects, proposal: () => ({ writes: [] }) }
}
