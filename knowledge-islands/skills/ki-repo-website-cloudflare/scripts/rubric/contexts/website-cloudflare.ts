import { lstatSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, isAbsolute, join, normalize, relative, resolve } from 'node:path'
import type { RubricContextOptions, RubricPublicationContext, RubricSession } from '../../shared/rubric.ts'

const CONFIG_FILE = '.ki-config.toml'
const CONFIG_SECTION = 'ki-repo-website-cloudflare'
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
  readonly configs: readonly WranglerConfigEvidence[]
  readonly siteConfigs: readonly WranglerConfigEvidence[]
  readonly companionConfigs: readonly WranglerConfigEvidence[]
  readonly configuration: {
    readonly state: ConfigurationState
    readonly keys: readonly string[]
    readonly siteRoot: string | null
    readonly appDeclared: boolean
  }
  readonly package: {
    readonly state: PackageState
    readonly scripts: Readonly<Record<string, string>>
  }
  readonly gitignore: {
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

const collectWranglerConfigs = (root: string): readonly WranglerConfigEvidence[] => {
  const paths = new Set<string>(WRANGLER_FILES)
  try {
    for (const entry of readdirSync(root, { withFileTypes: true })) {
      if (!entry.isDirectory() || SKIPPED_DIRECTORIES.has(entry.name)) continue
      for (const file of WRANGLER_FILES) paths.add(join(entry.name, file))
    }
  } catch {
    return []
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
  readonly siteRoot: string | null
  readonly appDeclared: boolean
} => {
  const kind = nodeKind(path)
  if (kind === 'missing') return { state: 'missing', keys: [], siteRoot: null, appDeclared: false }
  if (kind !== 'file') return { state: 'unsafe', keys: [], siteRoot: null, appDeclared: false }
  const text = readRegularText(path)
  if (text === null) return { state: 'unsafe', keys: [], siteRoot: null, appDeclared: false }
  try {
    const parsed = Bun.TOML.parse(text) as Record<string, unknown>
    const skills = parsed.skills as Record<string, unknown> | undefined
    const appDeclared = skills?.['ki-repo-website-app'] !== undefined
    const candidate = skills?.[CONFIG_SECTION]
    if (candidate === undefined) return { state: 'absent', keys: [], siteRoot: null, appDeclared }
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate))
      return { state: 'malformed', keys: [], siteRoot: null, appDeclared }
    const table = candidate as Record<string, unknown>
    return {
      state: 'present',
      keys: Object.keys(table),
      siteRoot: typeof table['site-root'] === 'string' ? table['site-root'] : null,
      appDeclared
    }
  } catch {
    return { state: 'malformed', keys: [], siteRoot: null, appDeclared: false }
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

export const createWebsiteCloudflareSession = ({
  repository,
  publication
}: RubricContextOptions): RubricSession<WebsiteCloudflareRubricContext> => {
  const target = resolve(repository)
  const targetExists = nodeKind(target) === 'directory'
  const configs = targetExists ? collectWranglerConfigs(target) : []
  const configuration = targetExists
    ? inspectConfiguration(join(target, CONFIG_FILE))
    : { state: 'missing' as const, keys: [], siteRoot: null, appDeclared: false }
  const siteConfigs = configs.filter((config) => config.state === 'present' && config.hasAssets)
  const companionConfigs = configs.filter((config) => config.state === 'present' && !config.hasAssets && config.hasMain)
  const hosting: WebsiteCloudflareContext = {
    targetExists,
    applicable: configuration.state === 'present' || configs.length > 0,
    configs,
    siteConfigs,
    companionConfigs,
    configuration,
    package: targetExists ? inspectPackage(join(target, 'package.json')) : { state: 'missing' as const, scripts: {} },
    gitignore: targetExists ? inspectText(join(target, '.gitignore')) : { state: 'missing' as const, text: '' }
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

export const configDirectory = (config: WranglerConfigEvidence): string => dirname(config.path)

export const isExactSiteOutput = (config: WranglerConfigEvidence): boolean => {
  if (!config.assetsDirectory) return false
  const expected = join(configDirectory(config), 'dist')
  const resolved = normalize(join(configDirectory(config), config.assetsDirectory))
  return !isAbsolute(config.assetsDirectory) && relative(expected, resolved) === ''
}
