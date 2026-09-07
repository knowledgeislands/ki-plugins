import { afterEach, describe, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
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
