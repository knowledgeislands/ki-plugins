import { existsSync, lstatSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import type { RubricContextOptions, RubricPublicationContext, RubricSession } from '../../shared/rubric.ts'

const TABLE = 'ki-repo-website-app'
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
  readonly siteRoot: '' | 'site'
  readonly viteConfig: string | null
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

const tableEvidence = (path: string) => {
  if (!safeFile(path)) return { applicable: false, malformed: existsSync(path), keys: [] as string[] }
  try {
    const parsed = Bun.TOML.parse(readFileSync(path, 'utf8')) as Record<string, unknown>
    const value = (parsed.skills as Record<string, unknown> | undefined)?.[TABLE]
    if (value === undefined) return { applicable: false, malformed: false, keys: [] as string[] }
    if (!value || typeof value !== 'object' || Array.isArray(value))
      return { applicable: false, malformed: true, keys: [] as string[] }
    return { applicable: true, malformed: false, keys: Object.keys(value as Record<string, unknown>) }
  } catch {
    return { applicable: false, malformed: true, keys: [] as string[] }
  }
}

export const createWebsiteAppSession = ({
  repository,
  publication
}: RubricContextOptions): RubricSession<WebsiteAppContext> => {
  const root = resolve(repository)
  const available = existsSync(root) && lstatSync(root).isDirectory() && !lstatSync(root).isSymbolicLink()
  const configuration = available
    ? tableEvidence(join(root, '.ki-config.toml'))
    : { applicable: false, malformed: false, keys: [] }
  let packageOk = false
  let dependencies: Record<string, string> = {}
  let scripts: Record<string, string> = {}
  if (available && safeFile(join(root, 'package.json'))) {
    try {
      const parsed = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as Record<string, unknown>
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
  const flatConfig = VITE_CONFIGS.find((name) => safeFile(join(root, name)))
  const siteConfig = VITE_CONFIGS.find((name) => safeFile(join(root, 'site', name)))
  const siteRoot: '' | 'site' = flatConfig
    ? ''
    : siteConfig
      ? 'site'
      : safeFile(join(root, 'site', 'index.html'))
        ? 'site'
        : ''
  const viteConfig = flatConfig ?? siteConfig ?? null
  const atSite = (...parts: string[]) => join(root, ...(siteRoot ? ['site'] : []), ...parts)
  const context: WebsiteAppContext = {
    rubric: { publication },
    available,
    applicable: configuration.applicable,
    malformedConfiguration: configuration.malformed,
    configurationKeys: configuration.keys,
    packageOk,
    dependencies,
    scripts,
    siteRoot,
    viteConfig,
    viteConfigSource: viteConfig ? readFileSync(atSite(viteConfig), 'utf8') : '',
    hasIndex: safeFile(atSite('index.html')),
    hasEntry: ['main.tsx', 'main.jsx'].some((name) => safeFile(atSite('src', name))),
    hasEleventyConfig: ELEVENTY_CONFIGS.some((name) => safeFile(join(root, name)) || safeFile(join(root, 'site', name)))
  }
  return {
    subjects: [
      { families: ['RUBRIC'], context: () => context },
      { families: ['APP'], context: () => context }
    ],
    proposal: () => ({ writes: [] })
  }
}
