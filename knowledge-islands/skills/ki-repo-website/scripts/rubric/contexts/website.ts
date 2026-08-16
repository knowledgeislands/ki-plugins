import { existsSync, lstatSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import type { RubricContextOptions, RubricPublicationContext, RubricSession } from '../../shared/rubric.ts'

const TABLE = 'ki-repo-website'

export type WebsiteCoreContext = {
  readonly rubric: RubricPublicationContext
  readonly available: boolean
  readonly applicable: boolean
  readonly malformedConfiguration: boolean
  readonly configurationKeys: readonly string[]
  readonly packageState: 'missing' | 'unsafe' | 'malformed' | 'present'
  readonly scripts: Readonly<Record<string, string>>
  readonly gitignore: string | null
}

const safeFile = (path: string): boolean => {
  try {
    const state = lstatSync(path)
    return state.isFile() && !state.isSymbolicLink()
  } catch {
    return false
  }
}

const parseTable = (path: string): { applicable: boolean; malformed: boolean; keys: string[] } => {
  if (!existsSync(path)) return { applicable: false, malformed: false, keys: [] }
  if (!safeFile(path)) return { applicable: false, malformed: true, keys: [] }
  try {
    const parsed = Bun.TOML.parse(readFileSync(path, 'utf8')) as Record<string, unknown>
    const skills = parsed.skills as Record<string, unknown> | undefined
    const value = skills?.[TABLE]
    if (value === undefined) return { applicable: false, malformed: false, keys: [] }
    if (!value || typeof value !== 'object' || Array.isArray(value))
      return { applicable: false, malformed: true, keys: [] }
    return { applicable: true, malformed: false, keys: Object.keys(value as Record<string, unknown>) }
  } catch {
    return { applicable: false, malformed: true, keys: [] }
  }
}

const parsePackage = (path: string): Pick<WebsiteCoreContext, 'packageState' | 'scripts'> => {
  if (!existsSync(path)) return { packageState: 'missing', scripts: {} }
  if (!safeFile(path)) return { packageState: 'unsafe', scripts: {} }
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as { scripts?: unknown }
    const scripts =
      parsed.scripts && typeof parsed.scripts === 'object' && !Array.isArray(parsed.scripts)
        ? Object.fromEntries(
            Object.entries(parsed.scripts as Record<string, unknown>).filter(
              (entry): entry is [string, string] => typeof entry[1] === 'string'
            )
          )
        : {}
    return { packageState: 'present', scripts }
  } catch {
    return { packageState: 'malformed', scripts: {} }
  }
}

export const createWebsiteCoreSession = ({
  repository,
  publication
}: RubricContextOptions): RubricSession<WebsiteCoreContext> => {
  const root = resolve(repository)
  const available = existsSync(root) && lstatSync(root).isDirectory() && !lstatSync(root).isSymbolicLink()
  const configuration = available
    ? parseTable(join(root, '.ki-config.toml'))
    : { applicable: false, malformed: false, keys: [] }
  const packageEvidence = available
    ? parsePackage(join(root, 'package.json'))
    : { packageState: 'missing' as const, scripts: {} }
  const context: WebsiteCoreContext = {
    rubric: { publication },
    available,
    applicable: configuration.applicable,
    malformedConfiguration: configuration.malformed,
    configurationKeys: configuration.keys,
    ...packageEvidence,
    gitignore: available && safeFile(join(root, '.gitignore')) ? readFileSync(join(root, '.gitignore'), 'utf8') : null
  }
  return {
    subjects: [
      { families: ['RUBRIC'], context: () => context },
      { families: ['SITE'], context: () => context }
    ],
    proposal: () => ({ writes: [] })
  }
}
