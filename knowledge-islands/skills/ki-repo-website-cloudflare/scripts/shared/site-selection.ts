import { existsSync, lstatSync, readFileSync } from 'node:fs'
import { isAbsolute, join, resolve } from 'node:path'

const WEBSITE_SECTION = 'ki-repo-website'
const DEFAULT_SITE_ROOT = 'apps/site'
const SITE_NAME = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/

export type WebsiteSite = {
  readonly name: string | null
  readonly root: string
  readonly primary: boolean
  readonly physical: boolean
}

export type WebsiteSelection = {
  readonly applicable: boolean
  readonly malformed: boolean
  readonly mode: 'single' | 'multi'
  readonly keys: readonly string[]
  readonly sites: readonly WebsiteSite[]
  readonly primarySite: string | null
  readonly siteRootConfigured: boolean
  readonly violations: readonly string[]
}

export type WebsiteOverlaySelection = {
  readonly applicable: boolean
  readonly keys: readonly string[]
  readonly sites: readonly WebsiteSite[]
  readonly violations: readonly string[]
}

const table = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null

export const safeSiteRoot = (value: unknown): value is string =>
  typeof value === 'string' &&
  (value === '.' ||
    (value.length > 0 &&
      !isAbsolute(value) &&
      !/^[A-Za-z]:[\\/]/.test(value) &&
      !value.includes('\\') &&
      value.split('/').every((part) => part.length > 0 && part !== '.' && part !== '..')))

const safeFile = (path: string): boolean => {
  try {
    const state = lstatSync(path)
    return state.isFile() && !state.isSymbolicLink()
  } catch {
    return false
  }
}

export const physicalSiteDirectory = (repository: string, siteRoot: string): boolean => {
  const root = resolve(repository)
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

const fallback = (malformed = false): WebsiteSelection => ({
  applicable: false,
  malformed,
  mode: 'single',
  keys: [],
  sites: [{ name: null, root: DEFAULT_SITE_ROOT, primary: true, physical: false }],
  primarySite: null,
  siteRootConfigured: false,
  violations: malformed ? ['.ki.toml is malformed or unsafe.'] : []
})

const skillsFrom = (repository: string): { skills: Record<string, unknown> | null; malformed: boolean } => {
  const path = join(resolve(repository), '.ki.toml')
  if (!existsSync(path)) return { skills: null, malformed: false }
  if (!safeFile(path)) return { skills: null, malformed: true }
  try {
    const document = Bun.TOML.parse(readFileSync(path, 'utf8')) as Record<string, unknown>
    return { skills: table(document.skills), malformed: false }
  } catch {
    return { skills: null, malformed: true }
  }
}

export const inspectWebsiteSelection = (repository: string): WebsiteSelection => {
  const parsed = skillsFrom(repository)
  if (parsed.malformed) return fallback(true)
  const value = parsed.skills?.[WEBSITE_SECTION]
  if (value === undefined) return fallback()
  const website = table(value)
  if (!website) return { ...fallback(true), applicable: true }

  const keys = Object.keys(website)
  const siteRootConfigured = Object.hasOwn(website, 'site-root')
  const hasMultiKey = Object.hasOwn(website, 'sites') || Object.hasOwn(website, 'primary-site')
  const unknown = keys.filter((key) => !['site-root', 'sites', 'primary-site'].includes(key))
  const unknownViolations = unknown.map((key) => `Unknown key under [skills.ki-repo-website]: ${key}.`)
  const violations: string[] = []

  if (!hasMultiKey) {
    const candidate = website['site-root']
    const valid = !siteRootConfigured || safeSiteRoot(candidate)
    if (!valid) violations.push('site-root must be "." or a canonical safe relative path.')
    const root = valid && siteRootConfigured ? (candidate as string) : DEFAULT_SITE_ROOT
    if (valid && siteRootConfigured && root === DEFAULT_SITE_ROOT)
      violations.push('site-root = "apps/site" restates the implicit default; remove the key.')
    violations.push(...unknownViolations)
    return {
      applicable: true,
      malformed: false,
      mode: 'single',
      keys,
      sites: [{ name: null, root, primary: true, physical: physicalSiteDirectory(repository, root) }],
      primarySite: null,
      siteRootConfigured,
      violations
    }
  }

  if (siteRootConfigured) violations.push('site-root is mutually exclusive with primary-site and sites.')
  violations.push(...unknownViolations)
  const primarySite = website['primary-site']
  if (typeof primarySite !== 'string' || !SITE_NAME.test(primarySite))
    violations.push('primary-site must be a declared lower-kebab-case site name.')
  const siteTable = table(website.sites)
  if (!siteTable || Object.keys(siteTable).length === 0)
    violations.push('[skills.ki-repo-website.sites] must declare at least one site.')

  const seenRoots = new Set<string>()
  const sites = Object.entries(siteTable ?? {}).flatMap(([name, root]): WebsiteSite[] => {
    if (!SITE_NAME.test(name)) {
      violations.push(`Site name ${name} must use lower-kebab-case.`)
      return []
    }
    if (!safeSiteRoot(root)) {
      violations.push(`Site ${name} must select a canonical safe relative root.`)
      return []
    }
    if (seenRoots.has(root)) violations.push(`Site root ${root} is declared more than once.`)
    seenRoots.add(root)
    const physical = physicalSiteDirectory(repository, root)
    if (!physical) violations.push(`Site ${name} root ${root} must be a physical repository directory.`)
    return [{ name, root, primary: name === primarySite, physical }]
  })
  if (typeof primarySite === 'string' && !sites.some((site) => site.name === primarySite))
    violations.push(`primary-site ${primarySite} must name a declared site.`)

  const ordered = [...sites].sort((left, right) => Number(right.primary) - Number(left.primary))
  return {
    applicable: true,
    malformed: false,
    mode: 'multi',
    keys,
    sites: ordered.length > 0 ? ordered : [{ name: null, root: DEFAULT_SITE_ROOT, primary: true, physical: false }],
    primarySite: typeof primarySite === 'string' ? primarySite : null,
    siteRootConfigured,
    violations
  }
}

export const inspectWebsiteOverlay = (
  repository: string,
  section: string,
  selection: WebsiteSelection
): WebsiteOverlaySelection => {
  const parsed = skillsFrom(repository)
  if (parsed.malformed)
    return { applicable: true, keys: [], sites: selection.sites, violations: ['.ki.toml is malformed or unsafe.'] }
  const value = parsed.skills?.[section]
  if (value === undefined) return { applicable: false, keys: [], sites: [], violations: [] }
  const overlay = table(value)
  if (!overlay)
    return {
      applicable: true,
      keys: [],
      sites: selection.sites,
      violations: [`[skills.${section}] must be a table.`]
    }

  const keys = Object.keys(overlay)
  const violations = keys
    .filter((key) => key !== 'sites')
    .map((key) => `Unknown key under [skills.${section}]: ${key}.`)
  if (!Object.hasOwn(overlay, 'sites')) return { applicable: true, keys, sites: selection.sites, violations }
  if (selection.mode !== 'multi') violations.push(`[skills.${section}].sites requires a named multi-site registry.`)
  const requested = overlay.sites
  if (!Array.isArray(requested) || requested.length === 0 || requested.some((name) => typeof name !== 'string')) {
    violations.push(`[skills.${section}].sites must be a non-empty array of site names.`)
    return { applicable: true, keys, sites: [], violations }
  }
  const names = requested as string[]
  if (new Set(names).size !== names.length) violations.push(`[skills.${section}].sites must not repeat a site name.`)
  const known = new Map(selection.sites.flatMap((site) => (site.name ? [[site.name, site] as const] : [])))
  for (const name of names)
    if (!known.has(name)) violations.push(`[skills.${section}].sites names unknown site ${name}.`)
  return {
    applicable: true,
    keys,
    sites: names.flatMap((name) => {
      const site = known.get(name)
      return site ? [site] : []
    }),
    violations
  }
}
