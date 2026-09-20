import { existsSync, lstatSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import type { RubricContextOptions, RubricPublicationContext, RubricSession } from '../../shared/rubric.ts'
import { inspectWebsiteSelection, type WebsiteSelection, type WebsiteSite } from '../../shared/site-selection.ts'

type PackageState = 'missing' | 'unsafe' | 'malformed' | 'present'

export type WebsiteCoreContext = {
  readonly rubric: RubricPublicationContext
  readonly available: boolean
  readonly applicable: boolean
  readonly malformedConfiguration: boolean
  readonly configurationKeys: readonly string[]
  readonly configurationViolations: readonly string[]
  readonly selectionMode: WebsiteSelection['mode']
  readonly siteName: string | null
  readonly primary: boolean
  readonly siteRoot: string
  readonly siteRootConfigured: boolean
  readonly siteRootValid: boolean
  readonly sitePackagePath: string
  readonly distPath: string
  readonly packageState: PackageState
  readonly sitePackageState: PackageState
  readonly scripts: Readonly<Record<string, string>>
  readonly siteScripts: Readonly<Record<string, string>>
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

const parsePackage = (path: string): { packageState: PackageState; scripts: Record<string, string> } => {
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

const contextFor = (
  root: string,
  available: boolean,
  publication: RubricContextOptions['publication'],
  selection: WebsiteSelection,
  site: WebsiteSite,
  packageEvidence: ReturnType<typeof parsePackage>,
  gitignore: string | null
): WebsiteCoreContext => {
  const sitePackagePath = site.root === '.' ? 'package.json' : `${site.root}/package.json`
  const sitePackageEvidence =
    !available || !site.physical
      ? {
          packageState: existsSync(join(root, sitePackagePath)) ? ('unsafe' as const) : ('missing' as const),
          scripts: {}
        }
      : sitePackagePath === 'package.json'
        ? packageEvidence
        : parsePackage(join(root, sitePackagePath))
  return {
    rubric: { publication },
    available,
    applicable: selection.applicable,
    malformedConfiguration: selection.malformed,
    configurationKeys: selection.keys,
    configurationViolations: selection.violations,
    selectionMode: selection.mode,
    siteName: site.name,
    primary: site.primary,
    siteRoot: site.root,
    siteRootConfigured: selection.siteRootConfigured,
    siteRootValid: selection.violations.length === 0 && site.physical,
    sitePackagePath,
    distPath: site.root === '.' ? 'dist/' : `${site.root}/dist/`,
    ...packageEvidence,
    sitePackageState: sitePackageEvidence.packageState,
    siteScripts: sitePackageEvidence.scripts,
    gitignore
  }
}

export const createWebsiteCoreSession = ({
  repository,
  publication
}: RubricContextOptions): RubricSession<WebsiteCoreContext> => {
  const root = resolve(repository)
  const available = existsSync(root) && lstatSync(root).isDirectory() && !lstatSync(root).isSymbolicLink()
  const selection = inspectWebsiteSelection(root)
  const packageEvidence = available
    ? parsePackage(join(root, 'package.json'))
    : { packageState: 'missing' as const, scripts: {} }
  const gitignore =
    available && safeFile(join(root, '.gitignore')) ? readFileSync(join(root, '.gitignore'), 'utf8') : null
  const contexts = selection.sites.map((site) =>
    contextFor(root, available, publication, selection, site, packageEvidence, gitignore)
  )
  const primary = contexts.find((context) => context.primary) ?? contexts[0]
  if (!primary) throw new Error('website selection produced no site context')
  return {
    subjects: [
      { families: ['RUBRIC'], context: () => primary },
      ...contexts.map((context) => ({
        families: ['SITE'],
        subject: context.siteName ?? context.siteRoot,
        context: () => context
      }))
    ],
    proposal: () => ({ writes: [] })
  }
}
