import { type Dirent, lstatSync, readdirSync, readFileSync } from 'node:fs'
import { basename, dirname, join, relative, resolve } from 'node:path'
import type { ConformWrite, RubricContextOptions, RubricSession } from '../../shared/rubric.ts'

export type AgentFrontmatter = {
  keys: ReadonlyMap<string, string>
  present: ReadonlySet<string>
  raw: string | null
}

export type AgentDefinition = {
  file: string
  stem: string
  content: string
  frontmatter: AgentFrontmatter
  name: string | undefined
  description: string | undefined
  body: string
}

type ScopeState = 'absent' | 'physical' | 'unsafe'

export type AgentFileContext = {
  repository: string
  scopeState: ScopeState
  agent: AgentDefinition | null
  unsafePath: string | null
  duplicateNameFiles: readonly string[]
  requestNameAlignment?: () => void
}

export type AgentSetContext = {
  repository: string
  scopeState: ScopeState
  agents: readonly AgentDefinition[]
  unsafePaths: readonly string[]
}

export type AgentsRubricContext = {
  file: AgentFileContext
  set: AgentSetContext
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

const stripQuotes = (value: string): string => {
  const trimmed = value.trim()
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) return trimmed.slice(1, -1)
  return trimmed
}

const parseFrontmatter = (content: string): AgentFrontmatter => {
  const keys = new Map<string, string>()
  const present = new Set<string>()
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match) return { keys, present, raw: null }

  const block = match[1] as string
  const lines = block.split(/\r?\n/)
  let index = 0
  while (index < lines.length) {
    const line = lines[index] as string
    if (line.trim() === '' || line.trimStart().startsWith('#')) {
      index++
      continue
    }
    const keyValue = line.match(/^([A-Za-z0-9_-]+):(.*)$/)
    if (!keyValue) {
      index++
      continue
    }
    const key = keyValue[1] as string
    const remainder = (keyValue[2] as string).trim()
    present.add(key)
    if (
      remainder === '>' ||
      remainder === '|' ||
      remainder.startsWith('> ') ||
      remainder.startsWith('| ') ||
      /^[>|][-+]?\d*\s*$/.test(remainder)
    ) {
      const folded = remainder[0] === '>'
      const collected: string[] = []
      index++
      while (index < lines.length) {
        const continuation = lines[index] as string
        if (continuation.trim() !== '' && !/^\s/.test(continuation)) break
        if (continuation.trim() !== '') collected.push(continuation.trim())
        index++
      }
      keys.set(key, folded ? collected.join(' ') : collected.join('\n'))
      continue
    }
    if (remainder === '') {
      index++
      while (index < lines.length && /^\s+\S/.test(lines[index] as string)) index++
      keys.set(key, '')
      continue
    }
    keys.set(key, stripQuotes(remainder))
    index++
  }
  return { keys, present, raw: block }
}

const bodyAfterFrontmatter = (content: string): string =>
  content.slice((content.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/) ?? [''])[0].length)

const readAgent = (file: string): AgentDefinition => {
  const content = readFileSync(file, 'utf8')
  const frontmatter = parseFrontmatter(content)
  return {
    file,
    stem: basename(file).replace(/\.md$/, ''),
    content,
    frontmatter,
    name: frontmatter.keys.get('name'),
    description: frontmatter.keys.get('description'),
    body: bodyAfterFrontmatter(content)
  }
}

const inspectAgentFiles = (repository: string, root: string): { files: string[]; unsafePaths: string[] } => {
  const files: string[] = []
  const unsafePaths: string[] = []
  const walk = (directory: string, depth: number): void => {
    if (depth > 12) {
      unsafePaths.push(relative(repository, directory))
      return
    }
    let entries: Dirent[]
    try {
      entries = readdirSync(directory, { withFileTypes: true })
    } catch {
      unsafePaths.push(relative(repository, directory))
      return
    }
    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'README.md') continue
      const candidate = join(directory, entry.name)
      const state = pathState(candidate)
      if (state === 'directory') walk(candidate, depth + 1)
      else if (state === 'file' && entry.name.endsWith('.md')) files.push(candidate)
      else if (state === 'unsafe') unsafePaths.push(relative(repository, candidate))
    }
  }
  walk(root, 0)
  return { files: files.sort(), unsafePaths: [...new Set(unsafePaths)].sort() }
}

const alignedNameContent = (agent: AgentDefinition): string | null => {
  const openingLength = agent.content.match(/^---\r?\n/)?.[0].length
  if (openingLength === undefined) return null
  const closing = agent.content.slice(openingLength).search(/\r?\n---(?:\r?\n|$)/)
  if (closing === -1) return null
  const frontmatterEnd = openingLength + closing
  const frontmatter = agent.content.slice(0, frontmatterEnd)
  if (!/^name:[^\r\n]*$/m.test(frontmatter)) return null
  return `${frontmatter.replace(/^name:[^\r\n]*$/m, `name: ${agent.stem}`)}${agent.content.slice(frontmatterEnd)}`
}

export const createAgentsSession = ({ mode, repository }: RubricContextOptions): RubricSession<AgentsRubricContext> => {
  const root = resolve(repository)
  const agentsRoot = join(root, 'subagents')
  const rawRootState = pathState(agentsRoot)
  const scopeState: ScopeState = rawRootState === 'missing' ? 'absent' : rawRootState === 'directory' ? 'physical' : 'unsafe'
  const inspected = scopeState === 'physical' ? inspectAgentFiles(root, agentsRoot) : { files: [], unsafePaths: [] }
  if (scopeState === 'unsafe') inspected.unsafePaths.push('subagents')

  const agents: AgentDefinition[] = []
  for (const file of inspected.files) {
    try {
      agents.push(readAgent(file))
    } catch {
      inspected.unsafePaths.push(relative(root, file))
    }
  }
  inspected.unsafePaths = [...new Set(inspected.unsafePaths)].sort()

  const byName = new Map<string, string[]>()
  for (const agent of agents) {
    if (!agent.name) continue
    byName.set(agent.name, [...(byName.get(agent.name) ?? []), agent.file])
  }

  const requestedDrafts = new Map<string, string>()
  const set: AgentSetContext = { repository: root, scopeState, agents, unsafePaths: inspected.unsafePaths }
  const fileSubjects = agents.map((agent) => {
    const aligned = alignedNameContent(agent)
    const file: AgentFileContext = {
      repository: root,
      scopeState,
      agent,
      unsafePath: null,
      duplicateNameFiles: agent.name ? (byName.get(agent.name) ?? []) : [],
      ...(mode === 'conform' && agent.name !== agent.stem && aligned !== null
        ? {
            requestNameAlignment: () => {
              requestedDrafts.set(relative(root, agent.file), aligned)
            }
          }
        : {})
    }
    const context: AgentsRubricContext = { file, set }
    return {
      families: ['LAY', 'NAME', 'DESC', 'FM', 'PROMPT', 'LANE', 'LINK', 'PROC', 'LONG'],
      context: () => context,
      subject: relative(root, agent.file)
    }
  })
  const unavailableSubjects = inspected.unsafePaths.map((unsafePath) => {
    const context: AgentsRubricContext = {
      file: { repository: root, scopeState, agent: null, unsafePath, duplicateNameFiles: [] },
      set
    }
    return {
      families: ['LAY', 'NAME', 'DESC', 'FM', 'PROMPT', 'LANE', 'LINK', 'PROC', 'LONG'],
      context: () => context,
      subject: unsafePath
    }
  })
  if (fileSubjects.length === 0 && unavailableSubjects.length === 0) {
    const context: AgentsRubricContext = {
      file: { repository: root, scopeState, agent: null, unsafePath: null, duplicateNameFiles: [] },
      set
    }
    unavailableSubjects.push({
      families: ['LAY', 'NAME', 'DESC', 'FM', 'PROMPT', 'LANE', 'LINK', 'PROC', 'LONG'],
      context: () => context,
      subject: relative(dirname(agentsRoot), agentsRoot)
    })
  }
  const collectionContext: AgentsRubricContext = {
    file: { repository: root, scopeState, agent: null, unsafePath: null, duplicateNameFiles: [] },
    set
  }
  return {
    subjects: [
      ...fileSubjects,
      ...unavailableSubjects,
      { families: ['COLL'], context: () => collectionContext, subject: relative(root, agentsRoot) }
    ],
    proposal: () => ({
      writes: [...requestedDrafts.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([path, content]): ConformWrite => ({ path, content }))
    })
  }
}
