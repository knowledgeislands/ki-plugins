import { type Dirent, lstatSync, readdirSync, readFileSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import type {
  ConformCommand,
  ConformWrite,
  RubricContextOptions,
  RubricPublicationContext,
  RubricSession
} from '../../shared/rubric.ts'

type NodeKind = 'missing' | 'file' | 'directory' | 'unsafe'
type RootState = 'absent' | 'physical' | 'unsafe'
type DirectoryState = 'missing' | 'present' | 'unsafe'
type FileState = 'missing' | 'physical' | 'unsafe'
type ExecutableState = 'missing' | 'executable' | 'non-executable' | 'unsafe'
type ConfigState = 'missing' | 'unsafe' | 'malformed' | 'absent' | 'present'

const TOOLS_TABLE = 'ki-repo-tools'

export type ToolBinary = {
  readonly name: string
  readonly executable: boolean
}

export type ToolRepositoryContext = {
  readonly repository: string
  readonly rootState: RootState
  readonly applicable: boolean
  readonly binState: DirectoryState
  readonly bins: readonly ToolBinary[]
  readonly unsafeBinEntries: readonly string[]
  readonly primary: string | null
  readonly primaryText: string
  readonly releaseVersion: string | null
  readonly changelogVersion: string | null
  readonly install: ExecutableState
  readonly changelog: FileState
  readonly workflows: DirectoryState
  readonly workflowFiles: readonly string[]
  readonly unsafeWorkflowEntries: readonly string[]
  readonly tests: DirectoryState
  readonly testDirectories: readonly string[]
  readonly requestBinExecutables?: () => void
  readonly requestInstallExecutable?: () => void
}

export type ShellToolsContext = {
  readonly applicable: boolean
  readonly primary: string | null
  readonly shell: boolean
  readonly workflows: DirectoryState
  readonly workflowText: string
  readonly unsafeWorkflowEntries: readonly string[]
  readonly tests: DirectoryState
  readonly bats: boolean
  readonly unsafeTestEntries: readonly string[]
}

export type LanguageToolsContext = {
  readonly applicable: boolean
  readonly packageJson: FileState
}

export type ManualToolsContext = {
  readonly applicable: boolean
  readonly manual: FileState
  readonly manualPath: string
  readonly packageJson: FileState
  readonly manualCommand: string | null
  readonly workflows: DirectoryState
  readonly workflowText: string
  readonly unsafeWorkflowEntries: readonly string[]
}

export type ToolsConfigContext = {
  readonly rootState: RootState
  readonly applicable: boolean
  readonly config: ConfigState
  readonly configKeys: readonly string[]
  readonly requestMarker?: () => void
}

export type ToolsRubricContext = {
  readonly rubric: RubricPublicationContext
  readonly tool: ToolRepositoryContext
  readonly shell: ShellToolsContext
  readonly language: LanguageToolsContext
  readonly manual: ManualToolsContext
  readonly config: ToolsConfigContext
}

const nodeKind = (path: string): NodeKind => {
  try {
    const state = lstatSync(path)
    if (state.isSymbolicLink()) return 'unsafe'
    if (state.isFile()) return 'file'
    if (state.isDirectory()) return 'directory'
    return 'unsafe'
  } catch {
    return 'missing'
  }
}

const readableText = (path: string): string | null => {
  try {
    return readFileSync(path, 'utf8')
  } catch {
    return null
  }
}

const entries = (directory: string): readonly Dirent[] | null => {
  try {
    return readdirSync(directory, { withFileTypes: true })
  } catch {
    return null
  }
}

const executable = (path: string): boolean => (lstatSync(path).mode & 0o111) !== 0

const inspectConfig = (
  path: string,
  kind: NodeKind
): { readonly state: ConfigState; readonly keys: readonly string[]; readonly content: string | null } => {
  if (kind === 'missing') return { state: 'missing', keys: [], content: null }
  if (kind !== 'file') return { state: 'unsafe', keys: [], content: null }
  const content = readableText(path)
  if (content === null) return { state: 'unsafe', keys: [], content: null }
  try {
    const parsed = Bun.TOML.parse(content) as Record<string, unknown>
    const candidate = (parsed.skills as Record<string, unknown> | undefined)?.[TOOLS_TABLE]
    if (candidate && typeof candidate === 'object' && !Array.isArray(candidate))
      return { state: 'present', keys: Object.keys(candidate as Record<string, unknown>), content }
    return { state: 'absent', keys: [], content }
  } catch {
    return { state: 'malformed', keys: [], content }
  }
}

const packageVersion = (source: string | null): string | null => {
  if (!source) return null
  try {
    const value = JSON.parse(source) as { readonly version?: unknown }
    return typeof value.version === 'string' && /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(value.version)
      ? value.version
      : null
  } catch {
    return null
  }
}

const changelogVersion = (source: string | null): string | null =>
  source?.match(/^##\s+\[?(\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?)\]?/m)?.[1] ?? null

const inspectDirectory = (
  path: string,
  repository: string,
  accept: (entry: Dirent) => boolean
): { readonly state: DirectoryState; readonly files: readonly string[]; readonly unsafe: readonly string[] } => {
  const kind = nodeKind(path)
  if (kind === 'missing') return { state: 'missing', files: [], unsafe: [] }
  if (kind !== 'directory') return { state: 'unsafe', files: [], unsafe: [path.slice(repository.length + 1)] }
  const children = entries(path)
  if (children === null) return { state: 'unsafe', files: [], unsafe: [path.slice(repository.length + 1)] }
  const files: string[] = []
  const unsafe: string[] = []
  for (const entry of children) {
    if (!accept(entry)) continue
    const child = join(path, entry.name)
    const childKind = nodeKind(child)
    if (childKind === 'file') files.push(entry.name)
    else if (childKind === 'unsafe') unsafe.push(child.slice(repository.length + 1))
  }
  return { state: 'present', files: files.sort(), unsafe: unsafe.sort() }
}

export const createToolsSession = ({
  mode,
  repository,
  publication
}: RubricContextOptions): RubricSession<ToolsRubricContext> => {
  const root = resolve(repository)
  const rootKind = nodeKind(root)
  const rootState: RootState = rootKind === 'missing' ? 'absent' : rootKind === 'directory' ? 'physical' : 'unsafe'

  const binPath = join(root, 'bin')
  const inspectedBins =
    rootState === 'physical'
      ? inspectDirectory(binPath, root, () => true)
      : { state: 'missing' as const, files: [], unsafe: [] }
  const bins = inspectedBins.files.map((name) => ({ name, executable: executable(join(binPath, name)) }))
  const expected = basename(root).replace(/^tools-/, '')
  const manualPath = `man/${expected}.1`
  const primary = bins.find(({ name }) => name === expected)?.name ?? null
  const primaryPath = primary ? join(binPath, primary) : null
  const primaryText = primaryPath ? (readableText(primaryPath) ?? '') : ''
  const shell = /^#!.*\b(bash|sh|dash|zsh|ksh)\b/.test(primaryText.split(/\r?\n/, 1)[0] ?? '')

  const installPath = join(root, 'install.sh')
  const installKind = rootState === 'physical' ? nodeKind(installPath) : 'missing'
  const install: ExecutableState =
    installKind === 'missing'
      ? 'missing'
      : installKind !== 'file'
        ? 'unsafe'
        : executable(installPath)
          ? 'executable'
          : 'non-executable'

  const changelogKind = rootState === 'physical' ? nodeKind(join(root, 'CHANGELOG.md')) : 'missing'
  const changelog: FileState =
    changelogKind === 'missing' ? 'missing' : changelogKind === 'file' ? 'physical' : 'unsafe'
  const releaseVersion = packageVersion(readableText(join(root, 'package.json')))
  const changelogRelease = changelog === 'physical' ? changelogVersion(readableText(join(root, 'CHANGELOG.md'))) : null

  const githubPath = join(root, '.github')
  const githubKind = rootState === 'physical' ? nodeKind(githubPath) : 'missing'
  const workflowPath = join(root, '.github', 'workflows')
  const inspectedWorkflows =
    githubKind === 'directory'
      ? inspectDirectory(workflowPath, root, (entry) => /\.ya?ml$/.test(entry.name))
      : githubKind === 'missing'
        ? { state: 'missing' as const, files: [], unsafe: [] }
        : { state: 'unsafe' as const, files: [], unsafe: ['.github'] }
  const workflowTexts = inspectedWorkflows.files.map((name) => readableText(join(workflowPath, name)))
  const unreadableWorkflows = inspectedWorkflows.files.filter((_, index) => workflowTexts[index] === null)
  const unsafeWorkflowEntries = [
    ...inspectedWorkflows.unsafe,
    ...unreadableWorkflows.map((name) => `.github/workflows/${name}`)
  ].sort()
  const workflowText = workflowTexts.filter((text): text is string => text !== null).join('\n')

  const testsPath = join(root, 'tests')
  const sourceTestsPath = join(root, 'src', 'tests')
  const inspectedTests =
    rootState === 'physical'
      ? inspectDirectory(testsPath, root, () => true)
      : { state: 'missing' as const, files: [], unsafe: [] }
  const inspectedSourceTests =
    rootState === 'physical'
      ? inspectDirectory(sourceTestsPath, root, () => true)
      : { state: 'missing' as const, files: [], unsafe: [] }
  const testInspections = [
    ['tests/', inspectedTests],
    ['src/tests/', inspectedSourceTests]
  ] as const
  const tests = testInspections.some(([, inspection]) => inspection.state === 'unsafe')
    ? 'unsafe'
    : testInspections.some(([, inspection]) => inspection.state === 'present')
      ? 'present'
      : 'missing'
  const testDirectories = testInspections
    .filter(([, inspection]) => inspection.state === 'present')
    .map(([path]) => path)
  const bats = inspectedTests.files.some((name) => name.endsWith('.bats'))

  const packageKind = rootState === 'physical' ? nodeKind(join(root, 'package.json')) : 'missing'
  const packageJson: FileState = packageKind === 'missing' ? 'missing' : packageKind === 'file' ? 'physical' : 'unsafe'
  let manualCommand: string | null = null
  if (packageJson === 'physical') {
    try {
      const parsed = JSON.parse(readableText(join(root, 'package.json')) ?? '') as {
        readonly scripts?: Record<string, unknown>
      }
      const candidate = parsed.scripts?.['ki:tools:lint-man']
      if (typeof candidate === 'string') manualCommand = candidate
    } catch {
      // MAN-SCRIPT reports a missing or unsuitable manual command without failing unrelated tool checks.
    }
  }

  const manualDirectoryKind = rootState === 'physical' ? nodeKind(join(root, 'man')) : 'missing'
  const manualKind = manualDirectoryKind === 'directory' ? nodeKind(join(root, manualPath)) : manualDirectoryKind
  const manual: FileState = manualKind === 'missing' ? 'missing' : manualKind === 'file' ? 'physical' : 'unsafe'

  const configPath = join(root, '.ki-config.toml')
  const configEvidence =
    rootState === 'physical'
      ? inspectConfig(configPath, nodeKind(configPath))
      : { state: 'missing' as const, keys: [], content: null }
  const applicable = configEvidence.state === 'present'

  const requestedExecutables = new Set<string>()
  let markerRequested = false
  const originalConfig = configEvidence.content
  const context: ToolsRubricContext = {
    rubric: { publication },
    tool: {
      repository: root,
      rootState,
      applicable,
      binState: inspectedBins.state,
      bins,
      unsafeBinEntries: inspectedBins.unsafe,
      primary,
      primaryText,
      releaseVersion,
      changelogVersion: changelogRelease,
      install,
      changelog,
      workflows: inspectedWorkflows.state,
      workflowFiles: inspectedWorkflows.files,
      unsafeWorkflowEntries,
      tests,
      testDirectories,
      ...(mode === 'conform' && bins.some((bin) => !bin.executable)
        ? {
            requestBinExecutables: () => {
              for (const bin of bins) if (!bin.executable) requestedExecutables.add(`bin/${bin.name}`)
            }
          }
        : {}),
      ...(mode === 'conform' && install === 'non-executable'
        ? {
            requestInstallExecutable: () => {
              requestedExecutables.add('install.sh')
            }
          }
        : {})
    },
    shell: {
      applicable,
      primary,
      shell,
      workflows: inspectedWorkflows.state,
      workflowText,
      unsafeWorkflowEntries,
      tests: inspectedTests.state,
      bats,
      unsafeTestEntries: inspectedTests.unsafe
    },
    language: { applicable, packageJson },
    manual: {
      applicable,
      manual,
      manualPath,
      packageJson,
      manualCommand,
      workflows: inspectedWorkflows.state,
      workflowText,
      unsafeWorkflowEntries
    },
    config: {
      rootState,
      applicable,
      config: configEvidence.state,
      configKeys: configEvidence.keys,
      ...(mode === 'conform' &&
      inspectedBins.state === 'present' &&
      configEvidence.state === 'absent' &&
      originalConfig !== null
        ? {
            requestMarker: () => {
              markerRequested = true
            }
          }
        : {})
    }
  }

  return {
    subjects: [
      { families: ['RUBRIC'], context: () => context },
      { families: ['TOOL', 'SHELL', 'LANG', 'MAN', 'CONFIG'], context: () => context, subject: root }
    ],
    proposal: () => {
      const commands = [...requestedExecutables]
        .sort()
        .map((path): ConformCommand => ({ program: 'chmod', arguments: ['+x', path] }))
      const writes: ConformWrite[] =
        markerRequested && originalConfig !== null
          ? [{ path: '.ki-config.toml', content: `${originalConfig.replace(/\n*$/, '\n')}\n[skills.${TOOLS_TABLE}]\n` }]
          : []
      return { writes, ...(commands.length > 0 ? { commands } : {}) }
    }
  }
}
