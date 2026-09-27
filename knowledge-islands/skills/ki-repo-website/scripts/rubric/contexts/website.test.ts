import { afterEach, describe, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { RubricContextOptions } from '../../shared/rubric.ts'
import { SITE } from '../items/site.ts'
import { createWebsiteCoreSession } from './website.ts'

const roots: string[] = []
afterEach(() =>
  roots.splice(0).forEach((root) => {
    rmSync(root, { recursive: true, force: true })
  })
)

const root = (): string => {
  const path = mkdtempSync(join(tmpdir(), 'ki-website-core-'))
  roots.push(path)
  return path
}

const options = (repository: string, mode: 'audit' | 'conform' = 'audit'): RubricContextOptions => ({
  mode,
  repository,
  userHome: repository,
  configuration: {}
})

describe('website core context', () => {
  test('defaults the neutral lifecycle seam to apps/site', () => {
    const repository = root()
    mkdirSync(join(repository, 'apps', 'site'), { recursive: true })
    writeFileSync(join(repository, '.ki.toml'), '[skills.ki-repo-website]\n')
    writeFileSync(
      join(repository, 'package.json'),
      JSON.stringify({
        scripts: {
          'ki:site:build': 'bun run --cwd apps/site build',
          'ki:site:dev': 'bun run --cwd apps/site ki:site:dev',
          'ki:site:clean': 'bun run --cwd apps/site clean'
        }
      })
    )
    writeFileSync(
      join(repository, 'apps', 'site', 'package.json'),
      JSON.stringify({ scripts: { build: 'build', 'ki:site:dev': 'dev', clean: 'clean' } })
    )
    writeFileSync(join(repository, '.gitignore'), 'dist/\n')

    const context = createWebsiteCoreSession(options(repository)).subjects[0].context()
    const violations = SITE.items
      .flatMap((item) => item.mechanical?.audit.run(context) ?? [])
      .filter((outcome) => outcome.status === 'VIOLATION')
    expect(violations).toEqual([])
    expect(context.siteRoot).toBe('apps/site')
    expect(context.siteRootConfigured).toBe(false)
    expect(createWebsiteCoreSession(options(repository, 'conform')).proposal().writes).toEqual([])
  })

  test('accepts an explicit flat site root', () => {
    const repository = root()
    writeFileSync(join(repository, '.ki.toml'), '[skills.ki-repo-website]\nsite-root = "."\n')
    writeFileSync(
      join(repository, 'package.json'),
      JSON.stringify({ scripts: { 'ki:site:build': 'build', 'ki:site:dev': 'dev', 'ki:site:clean': 'clean' } })
    )
    writeFileSync(join(repository, '.gitignore'), 'dist/\n')

    const context = createWebsiteCoreSession(options(repository)).subjects[0].context()
    expect(context.siteRoot).toBe('.')
    expect(
      SITE.items
        .flatMap((item) => item.mechanical?.audit.run(context) ?? [])
        .filter((outcome) => outcome.status === 'VIOLATION')
    ).toEqual([])
  })

  test('rejects unsafe and unknown website configuration without reading outside the repository', () => {
    const repository = root()
    writeFileSync(
      join(repository, '.ki.toml'),
      '[skills.ki-repo-website]\nsite-root = "../site"\nimplementation = "app"\n'
    )

    const context = createWebsiteCoreSession(options(repository)).subjects[0].context()
    expect(context.siteRootValid).toBe(false)
    expect(context.sitePackagePath).toBe('apps/site/package.json')
    expect(
      SITE.items
        .flatMap((item) => item.mechanical?.audit.run(context) ?? [])
        .filter((outcome) => outcome.status === 'VIOLATION')
        .map((outcome) => outcome.message)
    ).toEqual([
      'site-root must be "." or a canonical safe relative path.',
      'Unknown key under [skills.ki-repo-website]: implementation.'
    ])
  })

  test('does not follow a symlinked site-root ancestor', () => {
    const repository = root()
    const outside = root()
    mkdirSync(join(outside, 'site'), { recursive: true })
    writeFileSync(join(outside, 'site', 'package.json'), JSON.stringify({ scripts: {} }))
    symlinkSync(outside, join(repository, 'apps'))
    writeFileSync(join(repository, '.ki.toml'), '[skills.ki-repo-website]\n')
    writeFileSync(
      join(repository, 'package.json'),
      JSON.stringify({
        scripts: { 'ki:site:build': 'build', 'ki:site:dev': 'dev', 'ki:site:clean': 'clean' }
      })
    )

    const context = createWebsiteCoreSession(options(repository)).subjects[0].context()
    expect(context.sitePackageState).toBe('unsafe')
  })
})

test('accepts only an exact Turborepo task declared by the root task graph', () => {
  const repository = root()
  mkdirSync(join(repository, 'apps', 'site'), { recursive: true })
  writeFileSync(join(repository, '.ki.toml'), '[skills.ki-repo-website]\n')
  writeFileSync(
    join(repository, 'apps', 'site', 'package.json'),
    JSON.stringify({ scripts: { build: 'build', 'ki:site:dev': 'dev', clean: 'clean' } })
  )
  writeFileSync(join(repository, '.gitignore'), 'apps/site/dist/\n')
  const rootPackage = join(repository, 'package.json')
  const turbo = join(repository, 'turbo.json')
  const buildOutcomes = () => {
    const context = createWebsiteCoreSession(options(repository)).subjects[0]?.context()
    if (!context) throw new Error('missing website context')
    return SITE.items.find((item) => item.code === 'SITE-4')?.mechanical?.audit.run(context) ?? []
  }

  writeFileSync(
    rootPackage,
    JSON.stringify({
      scripts: {
        'ki:site:build': 'turbo run build',
        'ki:site:dev': 'bun run --cwd apps/site ki:site:dev',
        'ki:site:clean': 'bun run --cwd apps/site clean'
      }
    })
  )
  writeFileSync(turbo, '{\n// root task graph\n"tasks":{"build":{}}\n}\n')
  expect(buildOutcomes()).not.toContainEqual(expect.objectContaining({ status: 'VIOLATION' }))

  writeFileSync(turbo, '{"tasks":{"clean":{}}}\n')
  expect(buildOutcomes()).toContainEqual(expect.objectContaining({ status: 'VIOLATION' }))

  writeFileSync(
    rootPackage,
    JSON.stringify({ scripts: { 'ki:site:build': 'turbo run clean', 'ki:site:dev': 'dev', 'ki:site:clean': 'clean' } })
  )
  expect(buildOutcomes()).toContainEqual(expect.objectContaining({ status: 'VIOLATION' }))

  writeFileSync(
    rootPackage,
    JSON.stringify({
      scripts: { 'ki:site:build': 'turbo run build && echo chained', 'ki:site:dev': 'dev', 'ki:site:clean': 'clean' }
    })
  )
  writeFileSync(turbo, '{"tasks":{"build":{}}}\n')
  expect(buildOutcomes()).toContainEqual(expect.objectContaining({ status: 'VIOLATION' }))
})

test('diagnoses an explicitly materialised apps/site default', () => {
  const repository = root()
  writeFileSync(join(repository, '.ki.toml'), '[skills.ki-repo-website]\nsite-root = "apps/site"\n')
  const context = createWebsiteCoreSession(options(repository)).subjects[0].context()

  expect(
    SITE.items
      .flatMap((item) => item.mechanical?.audit.run(context) ?? [])
      .filter((outcome) => outcome.status === 'VIOLATION')
      .map((outcome) => outcome.message)
  ).toContain('site-root = "apps/site" restates the implicit default; remove the key.')
})

test('rejects a root development alias that targets a bare package key', () => {
  const repository = root()
  mkdirSync(join(repository, 'apps', 'site'), { recursive: true })
  writeFileSync(join(repository, '.ki.toml'), '[skills.ki-repo-website]\n')
  writeFileSync(
    join(repository, 'package.json'),
    JSON.stringify({
      scripts: {
        'ki:site:build': 'bun run --cwd apps/site build',
        'ki:site:dev': 'bun run --cwd apps/site dev',
        'ki:site:clean': 'bun run --cwd apps/site clean'
      }
    })
  )
  writeFileSync(
    join(repository, 'apps', 'site', 'package.json'),
    JSON.stringify({ scripts: { build: 'build', dev: 'dev', clean: 'clean' } })
  )
  writeFileSync(join(repository, '.gitignore'), 'dist/\n')

  const context = createWebsiteCoreSession(options(repository)).subjects[0].context()
  const outcomes = SITE.items.find((item) => item.code === 'SITE-5')?.mechanical?.audit.run(context) ?? []
  expect(outcomes.some((outcome) => outcome.status === 'VIOLATION')).toBe(true)
})

test('audits every named site and permits one exact primary self alias hop', () => {
  const repository = root()
  for (const site of ['site-apex', 'site-tower']) {
    mkdirSync(join(repository, 'apps', site), { recursive: true })
    writeFileSync(
      join(repository, 'apps', site, 'package.json'),
      JSON.stringify({ scripts: { build: 'build', 'ki:site:dev': 'dev', clean: 'clean' } })
    )
  }
  writeFileSync(
    join(repository, '.ki.toml'),
    '[skills.ki-repo-website]\nprimary-site = "apex"\n\n[skills.ki-repo-website.sites]\napex = "apps/site-apex"\ntower = "apps/site-tower"\n'
  )
  writeFileSync(
    join(repository, 'package.json'),
    JSON.stringify({
      scripts: {
        'ki:site:build': 'bun run self:site:apex:build',
        'ki:site:dev': 'bun run self:site:apex:dev',
        'ki:site:clean': 'bun run self:site:apex:clean',
        'self:site:apex:build': 'bun run --cwd apps/site-apex build',
        'self:site:apex:dev': 'bun run --cwd apps/site-apex ki:site:dev',
        'self:site:apex:clean': 'bun run --cwd apps/site-apex clean'
      }
    })
  )
  writeFileSync(join(repository, '.gitignore'), 'apps/site-apex/dist/\napps/site-tower/dist/\n')

  const session = createWebsiteCoreSession(options(repository))
  const contexts = session.subjects
    .filter((subject) => subject.families.includes('SITE'))
    .map((subject) => subject.context())

  expect(contexts.map((context) => [context.siteName, context.siteRoot, context.primary])).toEqual([
    ['apex', 'apps/site-apex', true],
    ['tower', 'apps/site-tower', false]
  ])
  expect(
    contexts.flatMap((context) => SITE.items.flatMap((item) => item.mechanical?.audit.run(context) ?? []))
  ).not.toContainEqual(expect.objectContaining({ status: 'VIOLATION' }))

  const rootPackage = JSON.parse(readFileSync(join(repository, 'package.json'), 'utf8')) as {
    scripts: Record<string, string>
  }
  rootPackage.scripts['self:site:apex:build'] = 'bun run self:site:apex:build:terminal'
  writeFileSync(join(repository, 'package.json'), JSON.stringify(rootPackage))
  const primary = createWebsiteCoreSession(options(repository)).subjects[0]?.context()
  expect(primary && SITE.items.find((item) => item.code === 'SITE-4')?.mechanical?.audit.run(primary)).toContainEqual(
    expect.objectContaining({ status: 'VIOLATION' })
  )
})
