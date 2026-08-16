import { type Dirent, existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { readSource, type SourceState } from '../../shared/binding.ts'
import type { RubricContextOptions, RubricPublicationContext, RubricSession } from '../../shared/rubric.ts'

export type RenderDataEvidence = { path: string; pattern: 'data-merge' | 'managed-source'; source: SourceState }
export type BindingChezMoiContext = {
  rubric: RubricPublicationContext
  repository: string
  repositoryState: 'absent' | 'physical' | 'unsafe'
  data: readonly RenderDataEvidence[]
  templates: readonly string[]
  wiredTargets: readonly string[]
  unsafePaths: readonly string[]
}

const physical = (path: string): boolean =>
  existsSync(path) && lstatSync(path).isFile() && !lstatSync(path).isSymbolicLink()
const include = (content: string, data: string, partial: string): boolean =>
  new RegExp(
    `{{-?\\s*(?:template\\s+${JSON.stringify(partial)}\\s+\\.|include\\s+${JSON.stringify(data)})\\s*-?}}`
  ).test(content)

const inspectRepository = (repository: string): Omit<BindingChezMoiContext, 'rubric'> => {
  if (!existsSync(repository))
    return { repository, repositoryState: 'absent', data: [], templates: [], wiredTargets: [], unsafePaths: [] }
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
  const data: RenderDataEvidence[] = [],
    templates: string[] = [],
    targets: { path: string; content: string }[] = [],
    unsafePaths: string[] = []
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
      const path = join(directory, entry.name),
        subject = relative(repository, path)
      let state: ReturnType<typeof lstatSync>
      try {
        state = lstatSync(path)
      } catch {
        unsafePaths.push(subject)
        continue
      }
      if (state.isSymbolicLink()) {
        if (
          entry.name === '.chezmoidata' ||
          entry.name === '.chezmoitemplates' ||
          /mcp/i.test(entry.name) ||
          entry.name.endsWith('.tmpl')
        )
          unsafePaths.push(subject)
        continue
      }
      if (state.isDirectory()) {
        walk(path, depth + 1)
        continue
      }
      if (!state.isFile()) {
        if (entry.name.endsWith('.tmpl')) unsafePaths.push(subject)
        continue
      }
      if (subject.startsWith('.chezmoidata/') && /\.ya?ml$/i.test(entry.name))
        data.push({ path: subject, pattern: 'data-merge', source: readSource(path) })
      if (entry.name === 'mcp-servers.yaml')
        data.push({ path: subject, pattern: 'managed-source', source: readSource(path) })
      if (subject === '.chezmoitemplates/mcp-servers-json.tmpl') templates.push(subject)
      if (entry.name.endsWith('.tmpl') && subject !== '.chezmoitemplates/mcp-servers-json.tmpl' && physical(path))
        targets.push({ path: subject, content: readFileSync(path, 'utf8') })
    }
  }
  walk(repository)
  const wiredTargets = targets
    .filter(
      ({ content }) =>
        data.some(({ path }) => include(content, path, 'mcp-servers-json.tmpl')) && templates.length === 1
    )
    .map(({ path }) => path)
    .sort()
  return {
    repository,
    repositoryState: 'physical',
    data: data.sort((left, right) => left.path.localeCompare(right.path)),
    templates: templates.sort(),
    wiredTargets,
    unsafePaths: [...new Set(unsafePaths)].sort()
  }
}
export const createBindingChezMoiSession = ({
  repository,
  publication
}: RubricContextOptions): RubricSession<BindingChezMoiContext> => {
  const root = resolve(repository),
    context = { ...inspectRepository(root), rubric: { publication } }
  return {
    subjects: [
      { families: ['BINDCHEZ'], context: () => context, subject: root },
      { families: ['RUBRIC'], context: () => context, subject: root }
    ],
    proposal: () => ({ writes: [] })
  }
}
