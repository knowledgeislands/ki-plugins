import { type Dirent, lstatSync, readdirSync, readFileSync } from 'node:fs'
import { basename, join, relative, resolve } from 'node:path'
import type {
  AuditOutcome,
  ConformWrite,
  RubricContextOptions,
  RubricPublicationContext,
  RubricSession
} from '../../shared/rubric.ts'
import {
  type CapabilityPublicationDraft,
  type CapabilitySource,
  prepareCapabilityPublication
} from './capability-publication.ts'

export const HARNESS_PARTS = ['skills', 'subagents', 'mcp', 'evals', 'hooks'] as const
export type HarnessPart = (typeof HARNESS_PARTS)[number]

type PathState = 'missing' | 'file' | 'directory' | 'unsafe'
type RepositoryState = 'absent' | 'physical' | 'unsafe'

export type HarnessSkillEntry = {
  path: string
  directory: string
  declaredName: string | null
}

export type HarnessLayoutContext = {
  repository: string
  repositoryState: RepositoryState
  parts: readonly {
    name: HarnessPart
    state: PathState
    readmeState: PathState
  }[]
  rootFiles: Readonly<Record<'CLAUDE.md' | 'ROADMAP.md' | '.ki-config.toml', PathState>>
}

export type HarnessConfigContext = {
  repository: string
  repositoryState: RepositoryState
  state: 'missing' | 'physical' | 'unsafe'
  hasHarnessTable: boolean
  hasRepositoryTable: boolean
  requestHarnessMarker?: () => void
}

export type HarnessSkillsContext = {
  repository: string
  repositoryState: RepositoryState
  skillsState: PathState
  skills: readonly HarnessSkillEntry[]
  unsafePaths: readonly string[]
}

export type HarnessCapabilityPublicationContext = {
  repository: string
  state: CapabilityPublicationDraft['state']
  issues: readonly string[]
  requestUpdate?: () => void
}

export type HarnessReviewContext = {
  repository: string
}

export type HarnessProvenanceContext = {
  repository: string
  payload: readonly AuditOutcome[]
}

export type HarnessRubricContext = {
  rubric: RubricPublicationContext
  capabilityPublication: HarnessCapabilityPublicationContext
  layout: HarnessLayoutContext
  config: HarnessConfigContext
  skills: HarnessSkillsContext
  review: HarnessReviewContext
  provenance: HarnessProvenanceContext
}

const pathState = (path: string): PathState => {
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

const repositoryState = (repository: string): RepositoryState => {
  const state = pathState(repository)
  return state === 'missing' ? 'absent' : state === 'directory' ? 'physical' : 'unsafe'
}

const parseFrontmatterName = (content: string): string | null => {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/)
  const nameMatch = match?.[1]?.match(/^name:\s*(.+)$/m)
  return nameMatch?.[1]?.trim() ?? null
}

const inspectSkills = (
  repository: string,
  state: RepositoryState
): Pick<HarnessSkillsContext, 'skillsState' | 'skills' | 'unsafePaths'> => {
  const root = join(repository, 'skills')
  const skillsState = state === 'physical' ? pathState(root) : 'missing'
  if (skillsState !== 'directory') return { skillsState, skills: [], unsafePaths: [] }

  const skills: HarnessSkillEntry[] = []
  const unsafePaths: string[] = []
  const walk = (directory: string, depth: number): void => {
    if (depth > 8) {
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
    const skillFile = join(directory, 'SKILL.md')
    if (pathState(skillFile) === 'file') {
      try {
        skills.push({
          path: relative(repository, directory),
          directory: basename(directory),
          declaredName: parseFrontmatterName(readFileSync(skillFile, 'utf8'))
        })
      } catch {
        unsafePaths.push(relative(repository, skillFile))
      }
      return
    }
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue
      const path = join(directory, entry.name)
      const childState = pathState(path)
      if (childState === 'directory') walk(path, depth + 1)
      else if (childState === 'unsafe') unsafePaths.push(relative(repository, path))
    }
  }
  walk(root, 0)
  return {
    skillsState,
    skills: skills.sort((left, right) => left.path.localeCompare(right.path)),
    unsafePaths: [...new Set(unsafePaths)].sort()
  }
}

const tableIdentity = (name: string): string => name
const hasTomlTable = (toml: string, name: string): boolean =>
  new RegExp(`^\\[skills\\.${tableIdentity(name)}\\]`, 'm').test(toml)

export const createHarnessSession = ({
  mode,
  repository,
  publication
}: RubricContextOptions): RubricSession<HarnessRubricContext> => {
  const root = resolve(repository)
  const state = repositoryState(root)
  const configPath = join(root, '.ki-config.toml')
  const rawConfigState = state === 'physical' ? pathState(configPath) : 'missing'
  let configContent: string | null = null
  let configState: HarnessConfigContext['state'] =
    rawConfigState === 'missing' ? 'missing' : rawConfigState === 'file' ? 'physical' : 'unsafe'
  if (configState === 'physical') {
    try {
      configContent = readFileSync(configPath, 'utf8')
    } catch {
      configState = 'unsafe'
    }
  }
  const hasHarnessTable = configContent !== null && hasTomlTable(configContent, 'ki-repo-harness')
  let markerRequested = false
  const inspectedSkills = inspectSkills(root, state)
  const capabilitySources: CapabilitySource[] = []
  const capabilitySourceIssues: string[] = []
  for (const skill of inspectedSkills.skills) {
    const path = join(root, skill.path, 'SKILL.md')
    try {
      capabilitySources.push({ path: `${skill.path}/SKILL.md`, content: readFileSync(path, 'utf8') })
    } catch {
      capabilitySourceIssues.push(`${skill.path}/SKILL.md could not be read`)
    }
  }
  const skillsReadmePath = join(root, 'skills', 'README.md')
  const skillsReadmeState = state === 'physical' ? pathState(skillsReadmePath) : 'missing'
  let skillsReadme: string | undefined
  if (skillsReadmeState === 'file') {
    try {
      skillsReadme = readFileSync(skillsReadmePath, 'utf8')
    } catch {
      capabilitySourceIssues.push('skills/README.md could not be read')
    }
  } else {
    capabilitySourceIssues.push('skills/README.md is missing or is not a physical file')
  }
  const capabilityDraft = prepareCapabilityPublication(skillsReadme, capabilitySources)
  const capabilityIssues = [...capabilitySourceIssues, ...capabilityDraft.issues].sort()
  let capabilityPublicationRequested = false
  const parts = HARNESS_PARTS.map((name) => {
    const partState = state === 'physical' ? pathState(join(root, name)) : 'missing'
    return {
      name,
      state: partState,
      readmeState: partState === 'directory' ? pathState(join(root, name, 'README.md')) : 'missing'
    }
  })
  const context: HarnessRubricContext = {
    rubric: { publication },
    capabilityPublication: {
      repository: root,
      state: capabilityIssues.length > 0 ? 'unsafe' : capabilityDraft.state,
      issues: capabilityIssues,
      ...(mode === 'conform' && capabilityIssues.length === 0 && capabilityDraft.state !== 'in-sync'
        ? {
            requestUpdate: () => {
              capabilityPublicationRequested = true
            }
          }
        : {})
    },
    layout: {
      repository: root,
      repositoryState: state,
      parts,
      rootFiles: {
        'CLAUDE.md': state === 'physical' ? pathState(join(root, 'CLAUDE.md')) : 'missing',
        'ROADMAP.md': state === 'physical' ? pathState(join(root, 'ROADMAP.md')) : 'missing',
        '.ki-config.toml': rawConfigState
      }
    },
    config: {
      repository: root,
      repositoryState: state,
      state: configState,
      hasHarnessTable,
      hasRepositoryTable: configContent !== null && hasTomlTable(configContent, 'ki-repo'),
      ...(mode === 'conform' && state === 'physical' && configState === 'physical' && !hasHarnessTable
        ? {
            requestHarnessMarker: () => {
              markerRequested = true
            }
          }
        : {})
    },
    skills: {
      repository: root,
      repositoryState: state,
      ...inspectedSkills
    },
    review: { repository: root },
    provenance: {
      repository: root,
      payload: [
        {
          status: 'NOT_APPLICABLE',
          message:
            'Source-harness inspection does not establish verified installed payload, development-source selection, runtime activation, declared capability resolution, or execution.',
          subject: root
        }
      ]
    }
  }
  return {
    subjects: [
      {
        families: ['CAP', 'PAYLOAD', 'LAY', 'CLAUDE', 'CONFIG', 'SKILLS', 'LONG', 'COLL'],
        context: () => context,
        subject: root
      },
      { families: ['RUBRIC'], context: () => context, subject: root }
    ],
    proposal: () => {
      const writes: ConformWrite[] = []
      if (markerRequested && configContent !== null)
        writes.push({
          path: '.ki-config.toml',
          content: `${configContent.replace(/\n*$/, '\n')}\n[skills.${tableIdentity('ki-repo-harness')}]\n`
        })
      if (capabilityPublicationRequested && capabilityDraft.merged !== undefined)
        writes.push({ path: 'skills/README.md', content: capabilityDraft.merged })
      return { writes }
    }
  }
}
