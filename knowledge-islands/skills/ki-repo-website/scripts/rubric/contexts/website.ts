import { existsSync, lstatSync, readFileSync } from 'node:fs'
import { isAbsolute, join, resolve } from 'node:path'
import type { RubricContextOptions, RubricPublicationContext, RubricSession } from '../../shared/rubric.ts'

const TABLE = 'ki-repo-website'
const DEFAULT_SITE_ROOT = 'apps/site'

export type WebsiteCoreContext = {
  readonly rubric: RubricPublicationContext
  readonly available: boolean
  readonly applicable: boolean
  readonly malformedConfiguration: boolean
  readonly configurationKeys: readonly string[]
  readonly siteRoot: string
  readonly siteRootConfigured: boolean
  readonly siteRootValid: boolean
  readonly sitePackagePath: string
  readonly distPath: string
  readonly packageState: 'missing' | 'unsafe' | 'malformed' | 'present'
  readonly sitePackageState: 'missing' | 'unsafe' | 'malformed' | 'present'
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

const safeSiteDirectory = (root: string, siteRoot: string): boolean => {
  if (siteRoot === '.') return true
  let current = root
  for (const part of siteRoot.split('/')) {
    current = join(current, part)
    try {
      const state = lstatSync(current)
      if (!state.isDirectory() || state.isSymbolicLink()) return false
    } catch {
      return false
    }
  }
  return true
}

type TableEvidence = {
  applicable: boolean
  malformed: boolean
  keys: string[]
  siteRoot: string
  siteRootConfigured: boolean
  siteRootValid: boolean
}

const safeSiteRoot = (value: unknown): value is string =>
  typeof value === 'string' &&
  (value === '.' ||
    (value.length > 0 &&
      !isAbsolute(value) &&
      !/^[A-Za-z]:[\\/]/.test(value) &&
      !value.includes('\\') &&
      value.split('/').every((part) => part.length > 0 && part !== '.' && part !== '..')))

const absentTable = (malformed = false): TableEvidence => ({
  applicable: false,
  malformed,
  keys: [],
  siteRoot: DEFAULT_SITE_ROOT,
  siteRootConfigured: false,
  siteRootValid: true
})

const parseTable = (path: string): TableEvidence => {
  if (!existsSync(path)) return absentTable()
  if (!safeFile(path)) return absentTable(true)
  try {
    const parsed = Bun.TOML.parse(readFileSync(path, 'utf8')) as Record<string, unknown>
    const skills = parsed.skills as Record<string, unknown> | undefined
    const value = skills?.[TABLE]
    if (value === undefined) return absentTable()
    if (!value || typeof value !== 'object' || Array.isArray(value)) return absentTable(true)
    const table = value as Record<string, unknown>
    const configured = Object.hasOwn(table, 'site-root')
    const rawSiteRoot = table['site-root']
    const valid = !configured || safeSiteRoot(rawSiteRoot)
    return {
      applicable: true,
      malformed: false,
      keys: Object.keys(table),
      siteRoot: valid && configured ? (rawSiteRoot as string) : DEFAULT_SITE_ROOT,
      siteRootConfigured: configured,
      siteRootValid: valid
    }
  } catch {
    return absentTable(true)
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
  const configuration = available ? parseTable(join(root, '.ki.toml')) : absentTable()
  const sitePackagePath = configuration.siteRoot === '.' ? 'package.json' : `${configuration.siteRoot}/package.json`
  const distPath = configuration.siteRoot === '.' ? 'dist/' : `${configuration.siteRoot}/dist/`
  const packageEvidence = available
    ? parsePackage(join(root, 'package.json'))
    : { packageState: 'missing' as const, scripts: {} }
  const sitePackageFile = join(root, sitePackagePath)
  let sitePackageEvidence: ReturnType<typeof parsePackage>
  if (!available) sitePackageEvidence = { packageState: 'missing', scripts: {} }
  else if (sitePackagePath === 'package.json') sitePackageEvidence = packageEvidence
  else if (safeSiteDirectory(root, configuration.siteRoot)) sitePackageEvidence = parsePackage(sitePackageFile)
  else
    sitePackageEvidence = {
      packageState: existsSync(sitePackageFile) ? 'unsafe' : 'missing',
      scripts: {}
    }
  const context: WebsiteCoreContext = {
    rubric: { publication },
    available,
    applicable: configuration.applicable,
    malformedConfiguration: configuration.malformed,
    configurationKeys: configuration.keys,
    siteRoot: configuration.siteRoot,
    siteRootConfigured: configuration.siteRootConfigured,
    siteRootValid: configuration.siteRootValid,
    sitePackagePath,
    distPath,
    ...packageEvidence,
    sitePackageState: sitePackageEvidence.packageState,
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
