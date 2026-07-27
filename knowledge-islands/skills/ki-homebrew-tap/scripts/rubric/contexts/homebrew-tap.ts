import { lstatSync, readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import type { ConformWrite, RubricContextOptions, RubricSession } from '../../shared/rubric.ts'

const FORMULA_DIRECTORY = 'Formula'
const CONFIG_FILE = '.ki-config.toml'
const CONFIG_SECTION = 'ki-homebrew-tap'

type NodeKind = 'missing' | 'file' | 'directory' | 'unsafe'
type FormulaDirectoryState = 'missing' | 'present' | 'unsafe'
type ConfigState = 'missing' | 'unsafe' | 'malformed' | 'absent' | 'present'

export type FormulaEvidence = {
  readonly name: string
  readonly file: string
  readonly text: string
}

export type TapContext = {
  readonly targetExists: boolean
  readonly applicable: boolean
  readonly formulaDirectory: FormulaDirectoryState
  readonly formulae: readonly FormulaEvidence[]
  readonly readme: string | null
}

export type TapConfigContext = {
  readonly targetExists: boolean
  readonly applicable: boolean
  readonly config: ConfigState
  readonly configKeys: readonly string[]
  readonly addMarker?: () => void
}

export type HomebrewTapRubricContext = {
  readonly tap: TapContext
  readonly config: TapConfigContext
}

const nodeKind = (path: string): NodeKind => {
  try {
    const stat = lstatSync(path)
    if (stat.isSymbolicLink()) return 'unsafe'
    if (stat.isFile()) return 'file'
    if (stat.isDirectory()) return 'directory'
    return 'unsafe'
  } catch {
    return 'missing'
  }
}

const inspectConfig = (
  path: string,
  kind: NodeKind
): { readonly state: ConfigState; readonly keys: readonly string[]; readonly content: string | null } => {
  if (kind === 'missing') return { state: 'missing', keys: [], content: null }
  if (kind !== 'file') return { state: 'unsafe', keys: [], content: null }
  const content = readFileSync(path, 'utf8')
  try {
    const parsed = Bun.TOML.parse(content) as Record<string, unknown>
    const candidate = parsed[CONFIG_SECTION]
    if (candidate && typeof candidate === 'object' && !Array.isArray(candidate))
      return { state: 'present', keys: Object.keys(candidate as Record<string, unknown>), content }
    return { state: 'absent', keys: [], content }
  } catch {
    return { state: 'malformed', keys: [], content }
  }
}

export const createHomebrewTapSession = ({ mode, repository }: RubricContextOptions): RubricSession<HomebrewTapRubricContext> => {
  const target = resolve(repository)
  const targetExists = nodeKind(target) === 'directory'
  const formulaPath = join(target, FORMULA_DIRECTORY)
  const formulaKind = targetExists ? nodeKind(formulaPath) : 'missing'
  const formulaDirectory: FormulaDirectoryState = formulaKind === 'directory' ? 'present' : formulaKind === 'missing' ? 'missing' : 'unsafe'
  const formulae =
    formulaDirectory === 'present'
      ? readdirSync(formulaPath, { withFileTypes: true })
          .filter((entry) => entry.isFile() && entry.name.endsWith('.rb'))
          .map((entry) => entry.name)
          .sort()
          .map((file) => ({
            name: file.replace(/\.rb$/, ''),
            file,
            text: readFileSync(join(formulaPath, file), 'utf8')
          }))
      : []
  const configPath = join(target, CONFIG_FILE)
  const configEvidence = targetExists
    ? inspectConfig(configPath, nodeKind(configPath))
    : { state: 'missing' as const, keys: [], content: null }
  const applicable =
    configEvidence.state === 'present' ||
    configEvidence.state === 'malformed' ||
    configEvidence.state === 'unsafe' ||
    formulaDirectory !== 'missing'
  const readmePath = join(target, 'README.md')
  const readme = targetExists && nodeKind(readmePath) === 'file' ? readFileSync(readmePath, 'utf8') : null
  const originalConfig = configEvidence.content
  let configDraft = originalConfig

  const context: HomebrewTapRubricContext = {
    tap: {
      targetExists,
      applicable,
      formulaDirectory,
      formulae,
      readme
    },
    config: {
      targetExists,
      applicable,
      config: configEvidence.state,
      configKeys: configEvidence.keys,
      ...(mode === 'conform' && formulaDirectory === 'present' && configEvidence.state === 'absent' && originalConfig !== null
        ? {
            addMarker: () => {
              if (configDraft !== originalConfig) return
              configDraft = `${originalConfig.replace(/\n*$/, '\n')}\n# This repo is a Knowledge Islands Homebrew tap.\n[${CONFIG_SECTION}]\n`
            }
          }
        : {})
    }
  }

  return {
    subjects: [{ families: ['TAP', 'CONFIG'], context: () => context }],
    proposal: () => {
      const writes: ConformWrite[] =
        configDraft !== null && originalConfig !== null && configDraft !== originalConfig
          ? [{ path: CONFIG_FILE, content: configDraft }]
          : []
      return { writes }
    }
  }
}
