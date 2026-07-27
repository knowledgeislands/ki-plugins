import { type Dirent, existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs'
import { basename, join, relative, resolve } from 'node:path'
import type { RubricContextOptions, RubricSession } from '../../shared/rubric.ts'

export type RenderDataEvidence = {
  path: string
  pattern: 'data-merge' | 'managed-source'
}

export type BindingChezMoiContext = {
  repository: string
  repositoryState: 'absent' | 'physical' | 'unsafe'
  data: readonly RenderDataEvidence[]
  templates: readonly string[]
  wiredTargets: readonly string[]
  unsafePaths: readonly string[]
}

const inspectRepository = (repository: string): BindingChezMoiContext => {
  if (!existsSync(repository))
    return {
      repository,
      repositoryState: 'absent',
      data: [],
      templates: [],
      wiredTargets: [],
      unsafePaths: []
    }
  const rootState = lstatSync(repository)
  if (!rootState.isDirectory() || rootState.isSymbolicLink())
    return {
      repository,
      repositoryState: 'unsafe',
      data: [],
      templates: [],
      wiredTargets: [],
      unsafePaths: [repository]
    }

  const data: RenderDataEvidence[] = []
  const templates: string[] = []
  const wiredTargets: string[] = []
  const unsafePaths: string[] = []

  const walk = (directory: string, depth = 0): void => {
    if (depth > 6) return
    let entries: Dirent[]
    try {
      entries = readdirSync(directory, { withFileTypes: true })
    } catch {
      unsafePaths.push(relative(repository, directory) || '.')
      return
    }
    for (const entry of entries) {
      if (entry.name === '.git' || entry.name === 'node_modules') continue
      const path = join(directory, entry.name)
      const subject = relative(repository, path)
      let state: ReturnType<typeof lstatSync>
      try {
        state = lstatSync(path)
      } catch {
        unsafePaths.push(subject)
        continue
      }
      if (state.isSymbolicLink()) {
        if (entry.name === '.chezmoidata' || entry.name === '.chezmoitemplates' || /mcp/i.test(entry.name) || entry.name.endsWith('.tmpl'))
          unsafePaths.push(subject)
        continue
      }
      if (state.isDirectory()) {
        walk(path, depth + 1)
        continue
      }
      if (!state.isFile()) {
        if (/mcp/i.test(entry.name) || entry.name.endsWith('.tmpl')) unsafePaths.push(subject)
        continue
      }
      const filename = basename(path)
      if (/mcp/i.test(filename) && /\.(ya?ml|toml|json)$/i.test(filename)) {
        const pattern = subject.startsWith('.chezmoidata/') ? 'data-merge' : 'managed-source'
        data.push({ path: subject, pattern })
      }
      if (/mcp-servers-json/i.test(filename)) templates.push(subject)
      if (path.endsWith('.tmpl')) {
        try {
          if (/mcp-servers-json/i.test(readFileSync(path, 'utf8'))) wiredTargets.push(subject)
        } catch {
          unsafePaths.push(subject)
        }
      }
    }
  }

  walk(repository)
  return {
    repository,
    repositoryState: 'physical',
    data: data.sort((left, right) => left.path.localeCompare(right.path)),
    templates: templates.sort(),
    wiredTargets: wiredTargets.sort(),
    unsafePaths: [...new Set(unsafePaths)].sort()
  }
}

export const createBindingChezMoiSession = ({ repository }: RubricContextOptions): RubricSession<BindingChezMoiContext> => {
  const root = resolve(repository)
  const context = inspectRepository(root)
  return {
    subjects: [{ families: ['BINDCHEZ'], context: () => context, subject: root }],
    proposal: () => ({ writes: [] })
  }
}
