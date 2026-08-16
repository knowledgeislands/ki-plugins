import { afterEach, describe, expect, test } from 'bun:test'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { AuditOutcome, RubricContextOptions } from '../../shared/rubric.ts'
import { WCF } from '../items/wcf.ts'
import { createWebsiteCloudflareSession, type WebsiteCloudflareRubricContext } from './website-cloudflare.ts'

const roots: string[] = []

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

const makeRoot = (): string => {
  const root = mkdtempSync(join(tmpdir(), 'ki-repo-website-cloudflare-'))
  roots.push(root)
  return root
}

const options = (repository: string, mode: 'audit' | 'conform' = 'audit'): RubricContextOptions => ({
  mode,
  repository,
  userHome: makeRoot(),
  configuration: {}
})

const writeCanonicalRepository = (repository: string): void => {
  mkdirSync(join(repository, 'site'), { recursive: true })
  writeFileSync(join(repository, '.ki-config.toml'), '[skills.ki-repo-website-cloudflare]\n')
  writeFileSync(
    join(repository, 'site', 'wrangler.jsonc'),
    `{
  "name": "example-site",
  "compatibility_date": "2026-07-27",
  "assets": { "directory": "dist" },
  "routes": [{ "pattern": "example.com", "custom_domain": true }],
  "observability": { "enabled": true }
}\n`
  )
  writeFileSync(
    join(repository, 'package.json'),
    `${JSON.stringify(
      {
        scripts: {
          'ki:site:deploy': 'cd site && bunx wrangler deploy',
          'ki:site:preview': 'bun run ki:site:build && cd site && bunx wrangler dev'
        }
      },
      null,
      2
    )}\n`
  )
  writeFileSync(join(repository, '.gitignore'), 'site/dist/\n.wrangler/\n')
}

const outcomes = (context: WebsiteCloudflareRubricContext): readonly AuditOutcome[] =>
  WCF.items.flatMap((item) => item.mechanical?.audit.run(WCF.selectContext(context)) ?? [])

describe('ki-repo-website-cloudflare session', () => {
  test('prepares canonical hosting evidence once and keeps audit read-only', () => {
    const repository = makeRoot()
    writeCanonicalRepository(repository)
    const before = {
      config: readFileSync(join(repository, '.ki-config.toml'), 'utf8'),
      wrangler: readFileSync(join(repository, 'site', 'wrangler.jsonc'), 'utf8'),
      package: readFileSync(join(repository, 'package.json'), 'utf8'),
      gitignore: readFileSync(join(repository, '.gitignore'), 'utf8')
    }
    const session = createWebsiteCloudflareSession(options(repository))
    const first = session.subjects[0].context()
    const second = session.subjects[0].context()

    expect(first).toBe(second)
    expect(outcomes(first).filter((outcome) => outcome.status === 'VIOLATION')).toEqual([])
    expect(session.proposal()).toEqual({ writes: [] })
    expect(readFileSync(join(repository, '.ki-config.toml'), 'utf8')).toBe(before.config)
    expect(readFileSync(join(repository, 'site', 'wrangler.jsonc'), 'utf8')).toBe(before.wrangler)
    expect(readFileSync(join(repository, 'package.json'), 'utf8')).toBe(before.package)
    expect(readFileSync(join(repository, '.gitignore'), 'utf8')).toBe(before.gitignore)
  })

  test('keeps conform and all Wrangler or deployment operations report-only', () => {
    const repository = makeRoot()
    writeCanonicalRepository(repository)
    const marker = join(repository, 'launched')
    const packagePath = join(repository, 'package.json')
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf8')) as { scripts: Record<string, string> }
    packageJson.scripts['ki:site:deploy'] = `touch ${marker} && bunx wrangler deploy`
    writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`)

    const session = createWebsiteCloudflareSession(options(repository, 'conform'))
    const context = WCF.selectContext(session.subjects[0].context())
    for (const item of WCF.items) {
      item.mechanical?.audit.run(context)
      item.mechanical?.conform?.run(context)
    }

    expect(session.proposal()).toEqual({ writes: [] })
    expect(existsSync(marker)).toBe(false)
  })

  test('does not follow a symlinked Wrangler config', () => {
    const repository = makeRoot()
    const outside = makeRoot()
    mkdirSync(join(repository, 'site'))
    writeFileSync(join(repository, '.ki-config.toml'), '[skills.ki-repo-website-cloudflare]\n')
    const outsideConfig = join(outside, 'wrangler.jsonc')
    const content = '{"assets":{"directory":"dist"}}\n'
    writeFileSync(outsideConfig, content)
    symlinkSync(outsideConfig, join(repository, 'site', 'wrangler.jsonc'))

    const session = createWebsiteCloudflareSession(options(repository))
    const context = session.subjects[0].context()
    const siteConfig = WCF.items.find((item) => item.code === 'WCF-1')
    const result = siteConfig?.mechanical?.audit.run(WCF.selectContext(context))

    expect(result?.[0]?.status).toBe('VIOLATION')
    expect(result?.[0]?.message).toContain('unsafe path')
    expect(readFileSync(outsideConfig, 'utf8')).toBe(content)
  })

  test('fails closed for assets-plus-main, malformed config, and a traversal output', () => {
    for (const [name, content] of [
      ['assets-plus-main', '{"main":"src/index.ts","assets":{"directory":"dist"}}\n'],
      ['malformed', '{"assets":{"directory":"dist"}\n'],
      ['traversal', '{"assets":{"directory":"../dist"}}\n']
    ] as const) {
      const repository = makeRoot()
      mkdirSync(join(repository, 'site'), { recursive: true })
      writeFileSync(join(repository, '.ki-config.toml'), '[skills.ki-repo-website-cloudflare]\n')
      writeFileSync(join(repository, 'site', 'wrangler.jsonc'), content)
      const context = WCF.selectContext(createWebsiteCloudflareSession(options(repository)).subjects[0].context())
      const code = name === 'assets-plus-main' ? 'WCF-23' : name === 'traversal' ? 'WCF-4' : 'WCF-1'
      const result = WCF.items.find((item) => item.code === code)?.mechanical?.audit.run(context)

      expect(result?.[0]?.status).toBe('VIOLATION')
      expect(result?.[0]?.message).toContain(
        name === 'assets-plus-main'
          ? 'Static site config has a main field'
          : name === 'traversal'
            ? 'not the exact contained local dist seam'
            : 'No site Worker config'
      )
    }
  })

  test('reports the legacy Pages marker with its Workers Static Assets replacement', () => {
    const repository = makeRoot()
    mkdirSync(join(repository, 'site'), { recursive: true })
    writeFileSync(join(repository, '.ki-config.toml'), '[skills.ki-repo-website-cloudflare]\n')
    writeFileSync(join(repository, 'site', 'wrangler.jsonc'), '{"pages_build_output_dir":"./dist"}\n')
    const context = WCF.selectContext(createWebsiteCloudflareSession(options(repository)).subjects[0].context())
    const result = WCF.items.find((item) => item.code === 'WCF-2')?.mechanical?.audit.run(context)

    expect(result?.[0]?.status).toBe('VIOLATION')
    expect(result?.[0]?.message).toContain('legacy Cloudflare Pages marker')
    expect(result?.[0]?.message).toContain('"assets": { "directory": "./dist" }')
  })

  test('requires Workers Static Assets SPA fallback for the app implementation', () => {
    const repository = makeRoot()
    mkdirSync(join(repository, 'site'), { recursive: true })
    writeFileSync(
      join(repository, '.ki-config.toml'),
      '[skills.ki-repo-website-app]\n\n[skills.ki-repo-website-cloudflare]\n'
    )
    writeFileSync(join(repository, 'site', 'wrangler.jsonc'), '{"assets":{"directory":"./dist"}}\n')
    const context = WCF.selectContext(createWebsiteCloudflareSession(options(repository)).subjects[0].context())
    const result = WCF.items.find((item) => item.code === 'WCF-24')?.mechanical?.audit.run(context)

    expect(result?.[0]?.status).toBe('VIOLATION')
    expect(result?.[0]?.message).toContain('single-page-application')
  })

  test('accepts parsed JSONC with comments but rejects a misleading comment-only assets declaration', () => {
    const repository = makeRoot()
    mkdirSync(join(repository, 'site'), { recursive: true })
    writeFileSync(join(repository, '.ki-config.toml'), '[skills.ki-repo-website-cloudflare]\n')
    writeFileSync(join(repository, 'site', 'wrangler.jsonc'), '// "assets": {"directory":"dist"}\n{"name":"site"}\n')
    const context = WCF.selectContext(createWebsiteCloudflareSession(options(repository)).subjects[0].context())
    const result = WCF.items.find((item) => item.code === 'WCF-1')?.mechanical?.audit.run(context)

    expect(result?.[0]?.status).toBe('VIOLATION')
  })

  test('routes an unrelated repository through one not-applicable outcome', () => {
    const repository = makeRoot()
    const session = createWebsiteCloudflareSession(options(repository))
    const result = outcomes(session.subjects[0].context())

    expect(result).toHaveLength(1)
    expect(result[0]?.status).toBe('NOT_APPLICABLE')
  })
})
