import { existsSync, lstatSync, readFileSync } from 'node:fs'
import { isAbsolute, join, resolve } from 'node:path'
import type { RubricContextOptions, RubricPublicationContext, RubricSession } from '../../shared/rubric.ts'

const TABLE = 'ki-repo-website-app'
const WEBSITE_TABLE = 'ki-repo-website'
const DEFAULT_SITE_ROOT = 'apps/site'
const VITE_CONFIGS = ['vite.config.ts', 'vite.config.js', 'vite.config.mjs', 'vite.config.mts'] as const
const ELEVENTY_CONFIGS = [
  'eleventy.config.ts',
  'eleventy.config.js',
  'eleventy.config.mjs',
  'eleventy.config.cjs'
] as const

export type WebsiteAppContext = {
  readonly rubric: RubricPublicationContext
  readonly available: boolean
  readonly applicable: boolean
  readonly malformedConfiguration: boolean
  readonly configurationKeys: readonly string[]
  readonly packageOk: boolean
  readonly dependencies: Readonly<Record<string, string>>
  readonly scripts: Readonly<Record<string, string>>
  readonly siteRoot: string
  readonly siteRootValid: boolean
  readonly packagePath: string
  readonly viteConfig: string | null
  readonly viteConfigPath: string | null
  readonly viteConfigSource: string
  readonly hasIndex: boolean
  readonly hasEntry: boolean
  readonly hasEleventyConfig: boolean
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

const tableEvidence = (path: string) => {
  if (!safeFile(path))
    return {
      applicable: false,
      malformed: existsSync(path),
      keys: [] as string[],
      siteRoot: DEFAULT_SITE_ROOT,
      siteRootValid: true
    }
  try {
    const parsed = Bun.TOML.parse(readFileSync(path, 'utf8')) as Record<string, unknown>
    const skills = parsed.skills as Record<string, unknown> | undefined
    const value = skills?.[TABLE]
    const website = skills?.[WEBSITE_TABLE]
    if (value !== undefined && (!value || typeof value !== 'object' || Array.isArray(value)))
      return {
        applicable: false,
        malformed: true,
        keys: [] as string[],
        siteRoot: DEFAULT_SITE_ROOT,
        siteRootValid: true
      }
    const rawSiteRoot =
      website && typeof website === 'object' && !Array.isArray(website)
        ? (website as Record<string, unknown>)['site-root']
        : undefined
    const siteRootValid = rawSiteRoot === undefined || safeSiteRoot(rawSiteRoot)
    return {
      applicable: value !== undefined,
      malformed: false,
      keys: value === undefined ? [] : Object.keys(value as Record<string, unknown>),
      siteRoot: siteRootValid && rawSiteRoot !== undefined ? rawSiteRoot : DEFAULT_SITE_ROOT,
      siteRootValid
    }
  } catch {
    return {
      applicable: false,
      malformed: true,
      keys: [] as string[],
      siteRoot: DEFAULT_SITE_ROOT,
      siteRootValid: true
    }
  }
}

const safeSiteRoot = (value: unknown): value is string =>
  typeof value === 'string' &&
  (value === '.' ||
    (value.length > 0 &&
      !isAbsolute(value) &&
      !/^[A-Za-z]:[\\/]/.test(value) &&
      !value.includes('\\') &&
      value.split('/').every((part) => part.length > 0 && part !== '.' && part !== '..')))

const atSiteRoot = (root: string, siteRoot: string, ...parts: string[]): string =>
  join(root, ...(siteRoot === '.' ? [] : [siteRoot]), ...parts)

const relativeToRepository = (siteRoot: string, name: string): string =>
  siteRoot === '.' ? name : `${siteRoot}/${name}`

export const createWebsiteAppSession = ({
  repository,
  publication
}: RubricContextOptions): RubricSession<WebsiteAppContext> => {
  const root = resolve(repository)
  const available = existsSync(root) && lstatSync(root).isDirectory() && !lstatSync(root).isSymbolicLink()
  const configuration = available
    ? tableEvidence(join(root, '.ki.toml'))
    : {
        applicable: false,
        malformed: false,
        keys: [],
        siteRoot: DEFAULT_SITE_ROOT,
        siteRootValid: true
      }
  const packagePath = relativeToRepository(configuration.siteRoot, 'package.json')
  const siteDirectorySafe = configuration.siteRootValid && safeSiteDirectory(root, configuration.siteRoot)
  let packageOk = false
  let dependencies: Record<string, string> = {}
  let scripts: Record<string, string> = {}
  if (available && siteDirectorySafe && safeFile(atSiteRoot(root, configuration.siteRoot, 'package.json'))) {
    try {
      const parsed = JSON.parse(
        readFileSync(atSiteRoot(root, configuration.siteRoot, 'package.json'), 'utf8')
      ) as Record<string, unknown>
      dependencies = {
        ...((parsed.dependencies as object) ?? {}),
        ...((parsed.devDependencies as object) ?? {})
      } as Record<string, string>
      scripts = (
        parsed.scripts && typeof parsed.scripts === 'object' && !Array.isArray(parsed.scripts) ? parsed.scripts : {}
      ) as Record<string, string>
      packageOk = true
    } catch {}
  }
  const viteConfig = siteDirectorySafe
    ? (VITE_CONFIGS.find((name) => safeFile(atSiteRoot(root, configuration.siteRoot, name))) ?? null)
    : null
  const viteConfigPath = viteConfig ? relativeToRepository(configuration.siteRoot, viteConfig) : null
  const atSite = (...parts: string[]) => atSiteRoot(root, configuration.siteRoot, ...parts)
  const context: WebsiteAppContext = {
    rubric: { publication },
    available,
    applicable: configuration.applicable,
    malformedConfiguration: configuration.malformed,
    configurationKeys: configuration.keys,
    packageOk,
    dependencies,
    scripts,
    siteRoot: configuration.siteRoot,
    siteRootValid: configuration.siteRootValid,
    packagePath,
    viteConfig,
    viteConfigPath,
    viteConfigSource: viteConfig ? readFileSync(atSite(viteConfig), 'utf8') : '',
    hasIndex: siteDirectorySafe && safeFile(atSite('index.html')),
    hasEntry: siteDirectorySafe && ['main.tsx', 'main.jsx'].some((name) => safeFile(atSite('src', name))),
    hasEleventyConfig: siteDirectorySafe && ELEVENTY_CONFIGS.some((name) => safeFile(atSite(name)))
  }
  return {
    subjects: [
      { families: ['RUBRIC'], context: () => context },
      { families: ['APP'], context: () => context }
    ],
    proposal: () => ({ writes: [] })
  }
}
