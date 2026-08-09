import { existsSync, lstatSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import type {
  ConformWrite,
  RubricContextOptions,
  RubricPublicationContext,
  RubricSession
} from '../../shared/rubric.ts'

const SECTION = 'ki-repo-specifications'
const core = ['proposals', 'specifications', 'schemas'] as const
const supporting = ['templates', 'examples', 'docs', 'tooling'] as const

const isPhysicalDirectory = (path: string): boolean => {
  if (!existsSync(path)) return false
  const state = lstatSync(path)
  return state.isDirectory() && !state.isSymbolicLink()
}

const isPhysicalFile = (path: string): boolean => {
  if (!existsSync(path)) return false
  const state = lstatSync(path)
  return state.isFile() && !state.isSymbolicLink()
}

const asTable = (value: unknown): Readonly<Record<string, unknown>> | null =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Readonly<Record<string, unknown>>) : null

export type SpecificationsContext = {
  readonly rubric: RubricPublicationContext
  readonly target: string
  readonly targetExists: boolean
  readonly applicable: boolean
  readonly configExists: boolean
  readonly malformed: boolean
  readonly table: Readonly<Record<string, unknown>> | null
  readonly core: readonly { readonly path: string; readonly exists: boolean }[]
  readonly supporting: readonly { readonly path: string; readonly exists: boolean }[]
  readonly addMarker?: () => void
}

export const createSpecificationsSession = ({
  mode,
  repository,
  publication
}: RubricContextOptions): RubricSession<SpecificationsContext> => {
  const target = resolve(repository)
  const targetExists = isPhysicalDirectory(target)
  const configPath = join(target, '.ki-config.toml')
  const configPresent = targetExists && existsSync(configPath)
  const configExists = configPresent && isPhysicalFile(configPath)
  const configSource = configExists ? readFileSync(configPath, 'utf8') : ''
  let malformed = configPresent && !configExists
  let document: Readonly<Record<string, unknown>> | null = null
  let table: Readonly<Record<string, unknown>> | null = null

  if (configExists)
    try {
      document = Bun.TOML.parse(configSource) as Readonly<Record<string, unknown>>
      table = asTable(asTable(document.skills)?.[SECTION])
    } catch {
      malformed = true
    }

  const coreEvidence = core.map((path) => ({ path, exists: targetExists && isPhysicalDirectory(join(target, path)) }))
  const supportingEvidence = supporting.map((path) => ({
    path,
    exists: targetExists && isPhysicalDirectory(join(target, path))
  }))
  let draft = mode === 'conform' && configExists && !malformed && !table ? configSource : undefined
  let markerAdded = false
  const addMarker =
    draft === undefined
      ? undefined
      : (): void => {
          if (asTable(document?.skills)?.[SECTION] !== undefined || draft === undefined || markerAdded) return
          draft = `${draft.trimEnd()}\n\n# This repo carries the KI Specifications repository structure.\n[skills.${SECTION}]\n`
          markerAdded = true
        }

  const context: SpecificationsContext = {
    rubric: { publication },
    target,
    targetExists,
    configExists,
    malformed,
    table,
    applicable: Boolean(table || malformed || coreEvidence.some((entry) => entry.exists)),
    core: coreEvidence,
    supporting: supportingEvidence,
    ...(addMarker ? { addMarker } : {})
  }

  return {
    subjects: [
      { families: ['RUBRIC'], context: () => context },
      { families: ['SPEC', 'SYNC'], subject: target, context: () => context }
    ],
    proposal: () => ({
      writes:
        draft === undefined || draft === configSource
          ? []
          : ([{ path: '.ki-config.toml', content: draft }] satisfies readonly ConformWrite[])
    })
  }
}
