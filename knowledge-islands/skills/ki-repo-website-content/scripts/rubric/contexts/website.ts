import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs'
import { isAbsolute, join, relative, resolve, sep } from 'node:path'
import type {
  ConformWrite,
  RubricContextOptions,
  RubricPublicationContext,
  RubricSession
} from '../../shared/rubric.ts'
import {
  inspectWebsiteOverlay,
  inspectWebsiteSelection,
  type WebsiteOverlaySelection,
  type WebsiteSite
} from '../../shared/site-selection.ts'

const CONFIG_NAMES = ['eleventy.config.ts', 'eleventy.config.js', 'eleventy.config.mjs', 'eleventy.config.cjs'] as const
const KI_SECTION = 'ki-repo-website-content'

type Draft = {
  path: string
  original: string | null
  content: string
}

export type WebsiteConfigSource = {
  path: string
  content: string
}

export type WebsiteContext = {
  rubric: RubricPublicationContext
  target: string
  available: boolean
  applicable: boolean
  siteName: string | null
  primary: boolean
  overlayViolations: readonly string[]
  siteRoot: string
  rootPackageOk: boolean
  workspaceCoversSiteRoot: boolean
  packagePath: string
  cfgName: string
  config: string
  configSources: readonly WebsiteConfigSource[]
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

const workspaceEntryCovers = (entry: string, siteRoot: string): boolean => {
  if (entry === siteRoot) return true
  if (!entry.endsWith('/*')) return false
  const prefix = entry.slice(0, -2)
  const remainder = siteRoot.slice(prefix.length + 1)
  return siteRoot.startsWith(`${prefix}/`) && remainder.length > 0 && !remainder.includes('/')
}

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

const sourceEntry = (value: unknown): string | null => {
  if (typeof value === 'string') return value
  const table = asTable(value)
  if (!table) return null
  for (const key of ['source', 'bun', 'import', 'default', 'node']) {
    const candidate = sourceEntry(table[key])
    if (candidate) return candidate
  }
  return null
}

const importedSpecifiers = (source: string): readonly string[] =>
  [...source.matchAll(/\bimport\s+(?!type\b)(?:[^'";]*?\s+from\s*)?["']([^"']+)["']/g)].flatMap((match) =>
    match[1] ? [match[1]] : []
  )

const sourceCandidates = (path: string): readonly string[] => {
  if (/\.(?:[cm]?[jt]s)$/.test(path)) return [path]
  return [path, ...['ts', 'js', 'mts', 'mjs', 'cts', 'cjs'].map((extension) => `${path}.${extension}`)]
}

const createWebsiteSiteSession = (
  { mode, repository, publication }: RubricContextOptions,
  site: WebsiteSite,
  overlay: WebsiteOverlaySelection
): RubricSession<WebsiteContext> => {
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
  const siteRoot = site.root
  const siteAt = (...parts: string[]) => (siteRoot ? join(siteRoot, ...parts) : join(...parts))
  const cfgName = CONFIG_NAMES.find((name) => containedPhysical(root, at(siteAt(name)), 'file')) ?? ''
  const applicable = available && overlay.applicable

  const rootPackageSource = read('package.json')
  let rootPackageOk = true
  let rootPackageDocument: Record<string, unknown> = {}
  try {
    if (!rootPackageSource) throw new Error('package.json unavailable')
    rootPackageDocument = JSON.parse(rootPackageSource) as Record<string, unknown>
  } catch {
    rootPackageOk = false
  }
  const rootWorkspaces = Array.isArray(rootPackageDocument.workspaces)
    ? rootPackageDocument.workspaces.filter((entry): entry is string => typeof entry === 'string')
    : []
  const workspaceCoversSiteRoot =
    siteRoot !== '.' && rootWorkspaces.some((entry) => workspaceEntryCovers(entry, siteRoot))

  const workspacePackageDirectories = rootWorkspaces.flatMap((entry): string[] => {
    if (!entry.endsWith('/*')) return containedPhysical(root, at(entry), 'directory') ? [entry] : []
    const parent = entry.slice(0, -2)
    if (!containedPhysical(root, at(parent), 'directory')) return []
    return readdirSync(at(parent), { withFileTypes: true })
      .filter((candidate) => candidate.isDirectory() && !candidate.isSymbolicLink())
      .map((candidate) => join(parent, candidate.name))
  })

  const workspacePackages = workspacePackageDirectories.flatMap((directory) => {
    const manifestPath = join(directory, 'package.json')
    const manifestSource = read(manifestPath)
    if (!manifestSource) return []
    try {
      const manifest = JSON.parse(manifestSource) as Record<string, unknown>
      return typeof manifest.name === 'string' ? [{ directory, manifest, name: manifest.name }] : []
    } catch {
      return []
    }
  })

  const resolveSource = (path: string): string | null =>
    sourceCandidates(path).find((candidate) => {
      const repositoryPath = relative(root, candidate)
      return !repositoryPath.split(sep).includes('node_modules') && containedPhysical(root, candidate, 'file')
    }) ?? null

  const resolveWorkspaceImport = (specifier: string): string | null => {
    const workspacePackage = workspacePackages
      .filter(({ name }) => specifier === name || specifier.startsWith(`${name}/`))
      .sort((left, right) => right.name.length - left.name.length)[0]
    if (!workspacePackage) return null

    const subpath = specifier === workspacePackage.name ? '.' : `.${specifier.slice(workspacePackage.name.length)}`
    const exports = workspacePackage.manifest.exports
    const exportsTable = asTable(exports)
    const exported =
      subpath === '.' && (!exportsTable || !Object.keys(exportsTable).some((key) => key.startsWith('.')))
        ? sourceEntry(exports)
        : sourceEntry(exportsTable?.[subpath])
    const entry =
      exported ??
      (subpath === '.'
        ? (sourceEntry(workspacePackage.manifest.source) ??
          sourceEntry(workspacePackage.manifest.module) ??
          sourceEntry(workspacePackage.manifest.main))
        : null)
    if (!entry || isAbsolute(entry) || /^[A-Za-z]:[\\/]/.test(entry) || entry.includes('\\')) return null
    return resolveSource(resolve(root, workspacePackage.directory, entry))
  }

  const configPathRelative = cfgName ? siteAt(cfgName) : ''
  const configSource = configPathRelative ? read(configPathRelative) : ''
  const importedSources = configSource
    ? importedSpecifiers(configSource).flatMap((specifier): WebsiteConfigSource[] => {
        const resolved = specifier.startsWith('.')
          ? resolveSource(resolve(root, siteRoot, specifier))
          : resolveWorkspaceImport(specifier)
        return resolved ? [{ path: relative(root, resolved), content: read(relative(root, resolved)) }] : []
      })
    : []
  const configSources: readonly WebsiteConfigSource[] = configPathRelative
    ? [
        { path: configPathRelative, content: configSource },
        ...importedSources.filter(
          (candidate, index) => importedSources.findIndex((source) => source.path === candidate.path) === index
        )
      ]
    : []

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
    siteName: site.name,
    primary: site.primary,
    overlayViolations: overlay.violations,
    siteRoot,
    rootPackageOk,
    workspaceCoversSiteRoot,
    packagePath,
    cfgName,
    config: configSource,
    configSources,
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

export const createWebsiteSession = (options: RubricContextOptions): RubricSession<WebsiteContext> => {
  const selection = inspectWebsiteSelection(options.repository)
  const overlay = inspectWebsiteOverlay(options.repository, KI_SECTION, selection)
  const selectedSites = overlay.sites.length > 0 ? overlay.sites : selection.sites.slice(0, 1)
  const sessions = selectedSites.map((site) => createWebsiteSiteSession(options, site, overlay))
  const contexts = sessions.flatMap((session) =>
    session.subjects.filter((subject) => subject.families.includes('WEB')).map((subject) => subject.context())
  )
  const primary = contexts.find((context) => context.primary) ?? contexts[0]
  if (!primary) throw new Error('website-content selection produced no site context')
  return {
    subjects: [
      { families: ['RUBRIC'], context: () => primary },
      ...contexts.map((context) => ({
        families: ['WEB'],
        subject: context.siteName ?? context.siteRoot,
        context: () => context
      }))
    ],
    proposal: () => {
      const writes = sessions.flatMap((session) => session.proposal().writes)
      const byPath = new Map<string, ConformWrite>()
      const conflicts = new Set<string>()
      for (const write of writes) {
        const previous = byPath.get(write.path)
        if (previous && previous.content !== write.content) conflicts.add(write.path)
        else byPath.set(write.path, write)
      }
      return { writes: [...byPath.values()].filter((write) => !conflicts.has(write.path)) }
    }
  }
}
