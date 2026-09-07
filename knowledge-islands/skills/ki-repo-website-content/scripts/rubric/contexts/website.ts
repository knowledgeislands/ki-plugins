import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs'
import { isAbsolute, join, relative, resolve, sep } from 'node:path'
import type {
  ConformWrite,
  RubricContextOptions,
  RubricPublicationContext,
  RubricSession
} from '../../shared/rubric.ts'

const CONFIG_NAMES = ['eleventy.config.ts', 'eleventy.config.js', 'eleventy.config.mjs', 'eleventy.config.cjs'] as const
const KI_SECTION = 'ki-repo-website-content'
const KI_WEBSITE_SECTION = 'ki-repo-website'
const DEFAULT_SITE_ROOT = 'apps/site'

type Draft = {
  path: string
  original: string | null
  content: string
}

export type WebsiteContext = {
  rubric: RubricPublicationContext
  target: string
  available: boolean
  applicable: boolean
  siteRoot: string
  packagePath: string
  cfgName: string
  config: string
  packageOk: boolean
  deps: Record<string, string>
  scripts: Record<string, string>
  has: (...parts: string[]) => boolean
  read: (...parts: string[]) => string
  isDir: (...parts: string[]) => boolean
  siteAt: (...parts: string[]) => string
  kiWebsiteTable: Record<string, unknown> | null
  malformedConfig: boolean
  seoMeta: boolean
  addDistIgnore?: () => void
}

const parseToml = (text: string): { document: Record<string, unknown> | null; malformed: boolean } => {
  try {
    return { document: Bun.TOML.parse(text) as Record<string, unknown>, malformed: false }
  } catch {
    return { document: null, malformed: true }
  }
}

const asTable = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null

const safeSiteRoot = (value: unknown): value is string =>
  typeof value === 'string' &&
  (value === '.' ||
    (value.length > 0 &&
      !isAbsolute(value) &&
      !/^[A-Za-z]:[\\/]/.test(value) &&
      !value.includes('\\') &&
      value.split('/').every((part) => part.length > 0 && part !== '.' && part !== '..')))

const physicalDirectory = (path: string): boolean => {
  if (!existsSync(path)) return false
  const state = lstatSync(path)
  return state.isDirectory() && !state.isSymbolicLink()
}

const containedPhysical = (root: string, path: string, kind: 'file' | 'directory'): boolean => {
  const remainder = relative(root, path)
  if (remainder.startsWith('..') || remainder === '..' || !physicalDirectory(root)) return false
  let cursor = root
  for (const segment of remainder.split(sep).filter(Boolean)) {
    cursor = join(cursor, segment)
    if (!existsSync(cursor) || lstatSync(cursor).isSymbolicLink()) return false
  }
  const state = lstatSync(path)
  return kind === 'file' ? state.isFile() : state.isDirectory()
}

export const createWebsiteSession = ({
  mode,
  repository,
  publication
}: RubricContextOptions): RubricSession<WebsiteContext> => {
  const root = resolve(repository)
  const available = physicalDirectory(root)
  const at = (...parts: string[]) => join(root, ...parts)
  const has = (...parts: string[]) =>
    available && (containedPhysical(root, at(...parts), 'file') || containedPhysical(root, at(...parts), 'directory'))
  const read = (...parts: string[]) =>
    available && containedPhysical(root, at(...parts), 'file') ? readFileSync(at(...parts), 'utf8') : ''
  const isDir = (...parts: string[]) => available && containedPhysical(root, at(...parts), 'directory')

  const configPath = at('.ki.toml')
  const configExists = existsSync(configPath)
  const configSafe = !configExists || containedPhysical(root, configPath, 'file')
  const configRaw = configSafe && configExists ? read('.ki.toml') : ''
  const ki = configSafe ? parseToml(configRaw) : { document: null, malformed: true }
  const skillTables = asTable(ki.document?.skills)
  const kiWebsiteTable = asTable(skillTables?.[KI_SECTION])
  const kiWebsiteCoreTable = asTable(skillTables?.[KI_WEBSITE_SECTION])
  const configuredSiteRoot = kiWebsiteCoreTable?.['site-root']
  const siteRoot =
    configuredSiteRoot === undefined || !safeSiteRoot(configuredSiteRoot) ? DEFAULT_SITE_ROOT : configuredSiteRoot
  const siteAt = (...parts: string[]) => (siteRoot ? join(siteRoot, ...parts) : join(...parts))
  const cfgName = CONFIG_NAMES.find((name) => containedPhysical(root, at(siteAt(name)), 'file')) ?? ''
  const applicable = available && kiWebsiteTable !== null

  const packagePath = siteAt('package.json')
  const packageSource = read(packagePath)
  let packageOk = true
  let packageDocument: Record<string, unknown> = {}
  try {
    if (!packageSource) throw new Error('package.json unavailable')
    packageDocument = JSON.parse(packageSource) as Record<string, unknown>
  } catch {
    packageOk = false
  }
  const deps = {
    ...((packageDocument.dependencies as object) ?? {}),
    ...((packageDocument.devDependencies as object) ?? {})
  } as Record<string, string>
  const scripts = (packageDocument.scripts ?? {}) as Record<string, string>

  const partials = siteAt('src', '_includes', 'partials')
  let seoMeta = false
  const walkPartials = (path: string): void => {
    if (!isDir(path)) return
    for (const entry of readdirSync(at(path), { withFileTypes: true })) {
      if (entry.isSymbolicLink()) continue
      if (entry.isDirectory()) walkPartials(join(path, entry.name))
      else if (/seo-meta/i.test(entry.name)) seoMeta = true
    }
  }
  if (available) walkPartials(partials)

  const drafts = new Map<string, Draft>()
  const prepareDraft = (path: '.ki.toml' | '.gitignore'): Draft | undefined => {
    const absolute = at(path)
    if (!existsSync(absolute)) {
      const draft = { path, original: null, content: '' }
      drafts.set(path, draft)
      return draft
    }
    if (!containedPhysical(root, absolute, 'file')) return undefined
    const original = read(path)
    const draft = { path, original, content: original }
    drafts.set(path, draft)
    return draft
  }

  const ignoreDraft = mode === 'conform' && cfgName ? prepareDraft('.gitignore') : undefined
  const addDistIgnore =
    ignoreDraft === undefined
      ? undefined
      : (): void => {
          const distPath = siteRoot === '.' ? 'dist' : `${siteRoot}/dist`
          const escapedDistPath = distPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          const correct = new RegExp(String.raw`^\s*/?${escapedDistPath}/?\s*$`, 'm').test(ignoreDraft.content)
          if (correct) return
          ignoreDraft.content =
            siteRoot && /^\s*\/dist\/?\s*$/m.test(ignoreDraft.content)
              ? ignoreDraft.content.replace(/^(\s*)\/dist(\/?)(\s*)$/m, `$1/${distPath}$2$3`)
              : `${ignoreDraft.content ? ignoreDraft.content.replace(/\n*$/, '\n') : ''}${distPath}\n`
        }

  const context: WebsiteContext = {
    rubric: { publication },
    target: root,
    available,
    applicable,
    siteRoot,
    packagePath,
    cfgName,
    config: cfgName ? read(siteAt(cfgName)) : '',
    packageOk,
    deps,
    scripts,
    has,
    read,
    isDir,
    siteAt,
    kiWebsiteTable,
    malformedConfig: ki.malformed,
    seoMeta,
    ...(addDistIgnore ? { addDistIgnore } : {})
  }

  return {
    subjects: [
      { families: ['RUBRIC'], context: () => context },
      { families: ['WEB'], subject: root, context: () => context }
    ],
    proposal: () => ({
      writes: [...drafts.values()].flatMap((draft): ConformWrite[] =>
        draft.content === (draft.original ?? '')
          ? []
          : [{ path: draft.path, content: draft.content, ...(draft.original === null ? { create: true } : {}) }]
      )
    })
  }
}
