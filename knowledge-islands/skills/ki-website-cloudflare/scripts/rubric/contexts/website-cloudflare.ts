import { lstatSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import type { RubricContextOptions, RubricSession } from '../../shared/rubric.ts'

const CONFIG_FILE = '.ki-config.toml'
const CONFIG_SECTION = 'ki-website-cloudflare'
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
  readonly assetsDirectory: string | null
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

const inspectWranglerConfig = (root: string, path: string): WranglerConfigEvidence | null => {
  const absolute = join(root, path)
  const kind = nodeKind(absolute)
  if (kind === 'missing') return null
  const text = kind === 'file' ? readRegularText(absolute) : null
  const state = text === null ? 'unsafe' : 'present'
  const source = text ?? ''
  return {
    path,
    state,
    text,
    hasAssets: /"assets"\s*:|\[assets\]|^\s*assets\s*=/m.test(source),
    hasMain: /"main"\s*:|^\s*main\s*=/m.test(source),
    assetsDirectory: source.match(/"directory"\s*:\s*"([^"]+)"/)?.[1] ?? source.match(/^\s*directory\s*=\s*"([^"]+)"/m)?.[1] ?? null,
    hasName: /"name"\s*:\s*"[^"]+"|^\s*name\s*=\s*"[^"]+"/m.test(source),
    hasCompatibilityDate: /"compatibility_date"\s*:\s*"\d{4}-\d{2}-\d{2}"|^\s*compatibility_date\s*=\s*"\d{4}-\d{2}-\d{2}"/m.test(source),
    observabilityEnabled:
      /"observability"\s*:\s*\{[\s\S]*?"enabled"\s*:\s*true/.test(source) ||
      /\[observability\][\s\S]*?^\s*enabled\s*=\s*true/m.test(source),
    hasCustomDomain: /"custom_domain"\s*:\s*true|^\s*custom_domain\s*=\s*true/m.test(source)
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
} => {
  const kind = nodeKind(path)
  if (kind === 'missing') return { state: 'missing', keys: [], siteRoot: null }
  if (kind !== 'file') return { state: 'unsafe', keys: [], siteRoot: null }
  const text = readRegularText(path)
  if (text === null) return { state: 'unsafe', keys: [], siteRoot: null }
  try {
    const parsed = Bun.TOML.parse(text) as Record<string, unknown>
    const candidate = parsed[CONFIG_SECTION]
    if (candidate === undefined) return { state: 'absent', keys: [], siteRoot: null }
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return { state: 'malformed', keys: [], siteRoot: null }
    const table = candidate as Record<string, unknown>
    return {
      state: 'present',
      keys: Object.keys(table),
      siteRoot: typeof table['site-root'] === 'string' ? table['site-root'] : null
    }
  } catch {
    return { state: 'malformed', keys: [], siteRoot: null }
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
    if (!parsed.scripts || typeof parsed.scripts !== 'object' || Array.isArray(parsed.scripts)) return { state: 'present', scripts: {} }
    return {
      state: 'present',
      scripts: Object.fromEntries(
        Object.entries(parsed.scripts as Record<string, unknown>).filter((entry): entry is [string, string] => typeof entry[1] === 'string')
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

export const createWebsiteCloudflareSession = ({ repository }: RubricContextOptions): RubricSession<WebsiteCloudflareRubricContext> => {
  const target = resolve(repository)
  const targetExists = nodeKind(target) === 'directory'
  const configs = targetExists ? collectWranglerConfigs(target) : []
  const configuration = targetExists
    ? inspectConfiguration(join(target, CONFIG_FILE))
    : { state: 'missing' as const, keys: [], siteRoot: null }
  const siteConfigs = configs.filter((config) => config.state === 'present' && config.hasAssets)
  const companionConfigs = configs.filter((config) => config.state === 'present' && !config.hasAssets && config.hasMain)
  const hosting: WebsiteCloudflareContext = {
    targetExists,
    applicable:
      !targetExists ||
      configs.length > 0 ||
      configuration.state === 'present' ||
      configuration.state === 'malformed' ||
      configuration.state === 'unsafe',
    configs,
    siteConfigs,
    companionConfigs,
    configuration,
    package: targetExists ? inspectPackage(join(target, 'package.json')) : { state: 'missing' as const, scripts: {} },
    gitignore: targetExists ? inspectText(join(target, '.gitignore')) : { state: 'missing' as const, text: '' }
  }
  const context: WebsiteCloudflareRubricContext = { hosting }

  return {
    subjects: [{ families: ['WCF'], context: () => context }],
    proposal: () => ({ writes: [] })
  }
}

export const configDirectory = (config: WranglerConfigEvidence): string => dirname(config.path)
