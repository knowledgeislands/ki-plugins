import { lstatSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, isAbsolute, join, normalize, relative, resolve } from 'node:path'
import type { RubricContextOptions, RubricPublicationContext, RubricSession } from '../../shared/rubric.ts'
import {
  inspectWebsiteOverlay,
  inspectWebsiteSelection,
  type WebsiteOverlaySelection,
  type WebsiteSelection,
  type WebsiteSite
} from '../../shared/site-selection.ts'

const CONFIG_FILE = '.ki.toml'
const CONFIG_SECTION = 'ki-repo-website-cloudflare'
const WEBSITE_CONFIG_SECTION = 'ki-repo-website'
const DEFAULT_SITE_ROOT = 'apps/site'
export const GUIDE_PATH = 'docs/guides/developer/cloudflare.md'
const WRANGLER_FILES = ['wrangler.jsonc', 'wrangler.json', 'wrangler.toml'] as const
const SKIPPED_DIRECTORIES = new Set(['.git', '.wrangler', 'dist', 'node_modules'])

type NodeKind = 'missing' | 'file' | 'directory' | 'unsafe'
type TextState = 'missing' | 'present' | 'unsafe'
type ConfigurationState = 'missing' | 'unsafe' | 'malformed' | 'absent' | 'present'
type PackageState = 'missing' | 'unsafe' | 'malformed' | 'present'

export type WranglerConfigEvidence = {
  readonly path: string
  readonly state: Exclude<TextState, 'missing'>
  readonly text: string | null
  readonly hasAssets: boolean
  readonly hasMain: boolean
  readonly hasPagesBuildOutputDir: boolean
  readonly assetsDirectory: string | null
  readonly notFoundHandling: string | null
  readonly hasName: boolean
  readonly hasCompatibilityDate: boolean
  readonly observabilityEnabled: boolean
  readonly hasCustomDomain: boolean
}

export type WebsiteCloudflareContext = {
  readonly targetExists: boolean
  readonly applicable: boolean
  readonly siteName: string | null
  readonly primary: boolean
  readonly selectionMode: WebsiteSelection['mode']
  readonly overlayViolations: readonly string[]
  readonly configs: readonly WranglerConfigEvidence[]
  readonly siteConfigs: readonly WranglerConfigEvidence[]
  readonly companionConfigs: readonly WranglerConfigEvidence[]
  readonly configuration: {
    readonly state: ConfigurationState
    readonly keys: readonly string[]
    readonly siteRoot: string
    readonly siteRootValid: boolean
    readonly siteRootConfigured: boolean
    readonly appDeclared: boolean
  }
  readonly package: {
    readonly path: string
    readonly state: PackageState
    readonly scripts: Readonly<Record<string, string>>
  }
  readonly rootPackage: {
    readonly path: 'package.json'
    readonly state: PackageState
    readonly scripts: Readonly<Record<string, string>>
  }
  readonly turboTasks: readonly string[]
  readonly gitignore: {
    readonly state: TextState
    readonly text: string
  }
  readonly guide: {
    readonly path: typeof GUIDE_PATH
    readonly state: TextState
    readonly text: string
  }
}

export type WebsiteCloudflareRubricContext = {
  readonly rubric: RubricPublicationContext
  readonly hosting: WebsiteCloudflareContext
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

const readRegularText = (path: string): string | null => {
  try {
    return readFileSync(path, 'utf8')
  } catch {
    return null
  }
}

const parsedJsonc = (source: string): Record<string, unknown> | null => {
  const withoutComments = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '$1')
  const json = withoutComments.replace(/,\s*([}\]])/g, '$1')
  try {
    const value = JSON.parse(json) as unknown
    return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null
  } catch {
    return null
  }
}

const inspectTurboTasks = (root: string): readonly string[] => {
  const path = join(root, 'turbo.json')
  if (nodeKind(path) !== 'file') return []
  const parsed = parsedJsonc(readRegularText(path) ?? '')
  return parsed?.tasks && typeof parsed.tasks === 'object' && !Array.isArray(parsed.tasks)
    ? Object.keys(parsed.tasks)
    : []
}

const configValue = (path: string, source: string): Record<string, unknown> | null => {
  if (path.endsWith('.toml')) {
    try {
      const value = Bun.TOML.parse(source) as unknown
      return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null
    } catch {
      return null
    }
  }
  return parsedJsonc(source)
}

const inspectWranglerConfig = (root: string, path: string): WranglerConfigEvidence | null => {
  const absolute = join(root, path)
  const kind = nodeKind(absolute)
  if (kind === 'missing') return null
  const text = kind === 'file' ? readRegularText(absolute) : null
  const state = text === null ? 'unsafe' : 'present'
  const value = text === null ? null : configValue(path, text)
  const assets = value?.assets
  const assetTable =
    assets && typeof assets === 'object' && !Array.isArray(assets) ? (assets as Record<string, unknown>) : null
  const routes = value?.routes
  const observability = value?.observability
  const observable =
    observability && typeof observability === 'object' && !Array.isArray(observability)
      ? (observability as Record<string, unknown>)
      : null
  return {
    path,
    state,
    text,
    hasAssets: assetTable !== null,
    hasMain: value !== null && Object.hasOwn(value, 'main'),
    hasPagesBuildOutputDir: value !== null && Object.hasOwn(value, 'pages_build_output_dir'),
    assetsDirectory: typeof assetTable?.directory === 'string' ? assetTable.directory : null,
    notFoundHandling: typeof assetTable?.not_found_handling === 'string' ? assetTable.not_found_handling : null,
    hasName: typeof value?.name === 'string' && value.name.length > 0,
    hasCompatibilityDate:
      typeof value?.compatibility_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.compatibility_date),
    observabilityEnabled: observable?.enabled === true,
    hasCustomDomain:
      Array.isArray(routes) &&
      routes.some(
        (route) => route && typeof route === 'object' && (route as Record<string, unknown>).custom_domain === true
      )
  }
}

const normaliseSiteRoot = (siteRoot: string): string => siteRoot.replace(/^\.\//, '').replace(/\/$/, '') || '.'

const safeSiteRoot = (value: unknown): value is string =>
  typeof value === 'string' &&
  (value === '.' ||
    (value.length > 0 &&
      !isAbsolute(value) &&
      !/^[A-Za-z]:[\\/]/.test(value) &&
      !value.includes('\\') &&
      value.split('/').every((part) => part.length > 0 && part !== '.' && part !== '..')))

const collectWranglerConfigs = (
  root: string,
  siteRoot: string,
  siteRootValid: boolean
): readonly WranglerConfigEvidence[] => {
  const paths = new Set<string>(WRANGLER_FILES)
  try {
    for (const entry of readdirSync(root, { withFileTypes: true })) {
      if (!entry.isDirectory() || SKIPPED_DIRECTORIES.has(entry.name)) continue
      for (const file of WRANGLER_FILES) paths.add(join(entry.name, file))
    }
  } catch {
    return []
  }
  if (siteRootValid) {
    const normalised = normaliseSiteRoot(siteRoot)
    for (const file of WRANGLER_FILES) paths.add(normalised === '.' ? file : join(normalised, file))
  }
  return [...paths]
    .sort()
    .map((path) => inspectWranglerConfig(root, path))
    .filter((config): config is WranglerConfigEvidence => config !== null)
}

const inspectConfiguration = (
  path: string
): {
  readonly state: ConfigurationState
  readonly keys: readonly string[]
  readonly siteRoot: string
  readonly siteRootValid: boolean
  readonly siteRootConfigured: boolean
  readonly appDeclared: boolean
} => {
  const kind = nodeKind(path)
  const empty = {
    keys: [],
    siteRoot: DEFAULT_SITE_ROOT,
    siteRootValid: true,
    siteRootConfigured: false,
    appDeclared: false
  }
  if (kind === 'missing') return { state: 'missing', ...empty }
  if (kind !== 'file') return { state: 'unsafe', ...empty, siteRootValid: false }
  const text = readRegularText(path)
  if (text === null) return { state: 'unsafe', ...empty, siteRootValid: false }
  try {
    const parsed = Bun.TOML.parse(text) as Record<string, unknown>
    const skills = parsed.skills as Record<string, unknown> | undefined
    const appDeclared = skills?.['ki-repo-website-app'] !== undefined
    const website = skills?.[WEBSITE_CONFIG_SECTION]
    const websiteTable =
      website && typeof website === 'object' && !Array.isArray(website) ? (website as Record<string, unknown>) : null
    const siteRootConfigured = websiteTable !== null && Object.hasOwn(websiteTable, 'site-root')
    const siteRootValue = websiteTable?.['site-root']
    const siteRoot = safeSiteRoot(siteRootValue) ? siteRootValue : DEFAULT_SITE_ROOT
    const siteRootValid =
      website !== undefined && websiteTable !== null && (!siteRootConfigured || safeSiteRoot(siteRootValue))
    const candidate = skills?.[CONFIG_SECTION]
    if (candidate === undefined)
      return { state: 'absent', keys: [], siteRoot, siteRootValid, siteRootConfigured, appDeclared }
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate))
      return { state: 'malformed', keys: [], siteRoot, siteRootValid, siteRootConfigured, appDeclared }
    const table = candidate as Record<string, unknown>
    return {
      state: 'present',
      keys: Object.keys(table),
      siteRoot,
      siteRootValid,
      siteRootConfigured,
      appDeclared
    }
  } catch {
    return { state: 'malformed', ...empty, siteRootValid: false }
  }
}

const inspectPackage = (
  path: string
): {
  readonly state: PackageState
  readonly scripts: Readonly<Record<string, string>>
} => {
  const kind = nodeKind(path)
  if (kind === 'missing') return { state: 'missing', scripts: {} }
  if (kind !== 'file') return { state: 'unsafe', scripts: {} }
  const text = readRegularText(path)
  if (text === null) return { state: 'unsafe', scripts: {} }
  try {
    const parsed = JSON.parse(text) as { readonly scripts?: unknown }
    if (!parsed.scripts || typeof parsed.scripts !== 'object' || Array.isArray(parsed.scripts))
      return { state: 'present', scripts: {} }
    return {
      state: 'present',
      scripts: Object.fromEntries(
        Object.entries(parsed.scripts as Record<string, unknown>).filter(
          (entry): entry is [string, string] => typeof entry[1] === 'string'
        )
      )
    }
  } catch {
    return { state: 'malformed', scripts: {} }
  }
}

const inspectText = (path: string): { readonly state: TextState; readonly text: string } => {
  const kind = nodeKind(path)
  if (kind === 'missing') return { state: 'missing', text: '' }
  if (kind !== 'file') return { state: 'unsafe', text: '' }
  const text = readRegularText(path)
  return text === null ? { state: 'unsafe', text: '' } : { state: 'present', text }
}

const createWebsiteCloudflareSiteSession = (
  { repository, publication }: RubricContextOptions,
  site: WebsiteSite,
  selection: WebsiteSelection,
  overlay: WebsiteOverlaySelection
): RubricSession<WebsiteCloudflareRubricContext> => {
  const target = resolve(repository)
  const targetExists = nodeKind(target) === 'directory'
  const inspectedConfiguration = targetExists
    ? inspectConfiguration(join(target, CONFIG_FILE))
    : {
        state: 'missing' as const,
        keys: [],
        siteRoot: DEFAULT_SITE_ROOT,
        siteRootValid: true,
        siteRootConfigured: false,
        appDeclared: false
      }
  const configuration = {
    ...inspectedConfiguration,
    keys: overlay.keys,
    siteRoot: site.root,
    siteRootValid: selection.violations.length === 0 && site.physical,
    siteRootConfigured: selection.siteRootConfigured
  }
  const configs = targetExists
    ? collectWranglerConfigs(target, configuration.siteRoot, configuration.siteRootValid)
    : []
  const expectedSiteDirectory = normaliseSiteRoot(configuration.siteRoot)
  const siteConfigs = configuration.siteRootValid
    ? configs.filter(
        (config) => config.state === 'present' && config.hasAssets && configDirectory(config) === expectedSiteDirectory
      )
    : []
  const companionConfigs = configs.filter(
    (config) => configDirectory(config) !== expectedSiteDirectory && config.state === 'present' && config.hasMain
  )
  const packagePath = configuration.siteRoot === '.' ? 'package.json' : join(configuration.siteRoot, 'package.json')
  const hosting: WebsiteCloudflareContext = {
    targetExists,
    applicable: overlay.applicable || configs.length > 0,
    siteName: site.name,
    primary: site.primary,
    selectionMode: selection.mode,
    overlayViolations: overlay.violations,
    configs,
    siteConfigs,
    companionConfigs,
    configuration,
    package: {
      path: packagePath,
      ...(targetExists ? inspectPackage(join(target, packagePath)) : { state: 'missing' as const, scripts: {} })
    },
    rootPackage: {
      path: 'package.json',
      ...(targetExists ? inspectPackage(join(target, 'package.json')) : { state: 'missing' as const, scripts: {} })
    },
    turboTasks: targetExists ? inspectTurboTasks(target) : [],
    gitignore: targetExists ? inspectText(join(target, '.gitignore')) : { state: 'missing' as const, text: '' },
    guide: {
      path: GUIDE_PATH,
      ...(targetExists ? inspectText(join(target, GUIDE_PATH)) : { state: 'missing' as const, text: '' })
    }
  }
  const context: WebsiteCloudflareRubricContext = { rubric: { publication }, hosting }

  return {
    subjects: [
      { families: ['RUBRIC'], context: () => context },
      { families: ['WCF'], context: () => context }
    ],
    proposal: () => ({ writes: [] })
  }
}

export const createWebsiteCloudflareSession = (
  options: RubricContextOptions
): RubricSession<WebsiteCloudflareRubricContext> => {
  const selection = inspectWebsiteSelection(options.repository)
  const overlay = inspectWebsiteOverlay(options.repository, CONFIG_SECTION, selection)
  const selectedSites = overlay.sites.length > 0 ? overlay.sites : selection.sites.slice(0, 1)
  const contexts = selectedSites.map((site) => {
    const session = createWebsiteCloudflareSiteSession(options, site, selection, overlay)
    const subject = session.subjects.find((candidate) => candidate.families.includes('WCF'))
    if (!subject) throw new Error('website-cloudflare site session produced no hosting context')
    return subject.context()
  })
  const primary = contexts.find((context) => context.hosting.primary) ?? contexts[0]
  if (!primary) throw new Error('website-cloudflare selection produced no site context')
  return {
    subjects: [
      { families: ['RUBRIC'], context: () => primary },
      ...contexts.map((context) => ({
        families: ['WCF'],
        subject: context.hosting.siteName ?? context.hosting.configuration.siteRoot,
        context: () => context
      }))
    ],
    proposal: () => ({ writes: [] })
  }
}

export const configDirectory = (config: WranglerConfigEvidence): string => dirname(config.path)

export const isExactSiteOutput = (config: WranglerConfigEvidence): boolean => {
  if (!config.assetsDirectory) return false
  const expected = join(configDirectory(config), 'dist')
  const resolved = normalize(join(configDirectory(config), config.assetsDirectory))
  return !isAbsolute(config.assetsDirectory) && relative(expected, resolved) === ''
}
