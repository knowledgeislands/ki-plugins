import { afterEach, describe, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { RubricContextOptions } from '../../shared/rubric.ts'
import { APP } from '../items/app.ts'
import { createWebsiteAppSession } from './website-app.ts'

const roots: string[] = []
afterEach(() =>
  roots.splice(0).forEach((root) => {
    rmSync(root, { recursive: true, force: true })
  })
)
const root = (): string => {
  const path = mkdtempSync(join(tmpdir(), 'ki-website-app-'))
  roots.push(path)
  return path
}
const options = (repository: string): RubricContextOptions => ({
  mode: 'audit',
  repository,
  userHome: repository,
  configuration: {}
})
const violations = (repository: string) => {
  const context = createWebsiteAppSession(options(repository)).subjects[0].context()
  return APP.items
    .flatMap((item) => item.mechanical?.audit.run(context) ?? [])
    .filter((outcome) => outcome.status === 'VIOLATION')
}

describe('interactive website context', () => {
  test('accepts one React/Vite app that emits dist', () => {
    const repository = root()
    mkdirSync(join(repository, 'apps', 'site', 'src'), { recursive: true })
    writeFileSync(join(repository, '.ki.toml'), '[skills.ki-repo-website]\n[skills.ki-repo-website-app]\n')
    writeFileSync(
      join(repository, 'apps', 'site', 'package.json'),
      JSON.stringify({
        dependencies: { react: '^19', 'react-dom': '^19' },
        devDependencies: { vite: '^7', '@vitejs/plugin-react': '^5' },
        scripts: { build: 'vite build', dev: 'vite' }
      })
    )
    writeFileSync(join(repository, 'apps', 'site', 'vite.config.ts'), "export default { build: { outDir: 'dist' } }\n")
    writeFileSync(join(repository, 'apps', 'site', 'index.html'), '<div id="root"></div>\n')
    writeFileSync(join(repository, 'apps', 'site', 'src', 'main.tsx'), 'export {}\n')
    expect(violations(repository)).toEqual([])
  })

  test('rejects an Eleventy build beside the app', () => {
    const repository = root()
    mkdirSync(join(repository, 'apps', 'site'), { recursive: true })
    writeFileSync(join(repository, '.ki.toml'), '[skills.ki-repo-website-app]\n')
    writeFileSync(
      join(repository, 'apps', 'site', 'package.json'),
      JSON.stringify({
        dependencies: { react: '^19', 'react-dom': '^19', '@11ty/eleventy': '^3' },
        devDependencies: { vite: '^7', '@vitejs/plugin-react': '^5' }
      })
    )
    writeFileSync(join(repository, 'apps', 'site', 'eleventy.config.ts'), 'export default {}\n')
    expect(violations(repository)).toContainEqual(
      expect.objectContaining({ message: expect.stringContaining('Eleventy is present') })
    )
  })

  test('resolves an explicit custom site root and ignores a root package', () => {
    const repository = root()
    mkdirSync(join(repository, 'web', 'src'), { recursive: true })
    writeFileSync(
      join(repository, '.ki.toml'),
      '[skills.ki-repo-website]\nsite-root = "web"\n[skills.ki-repo-website-app]\n'
    )
    writeFileSync(join(repository, 'package.json'), JSON.stringify({ dependencies: {} }))
    writeFileSync(
      join(repository, 'web', 'package.json'),
      JSON.stringify({
        dependencies: { react: '^19', 'react-dom': '^19' },
        devDependencies: { vite: '^7', '@vitejs/plugin-react': '^5' },
        scripts: { build: 'vite build', dev: 'vite' }
      })
    )
    writeFileSync(join(repository, 'web', 'vite.config.ts'), 'export default {}\n')
    writeFileSync(join(repository, 'web', 'index.html'), '<div id="root"></div>\n')
    writeFileSync(join(repository, 'web', 'src', 'main.tsx'), 'export {}\n')

    const context = createWebsiteAppSession(options(repository)).subjects[0].context()
    expect(context.siteRoot).toBe('web')
    expect(context.packagePath).toBe('web/package.json')
    expect(violations(repository)).toEqual([])
  })

  test('keeps the app table keyless', () => {
    const repository = root()
    writeFileSync(
      join(repository, '.ki.toml'),
      '[skills.ki-repo-website]\nsite-root = "apps/site"\n[skills.ki-repo-website-app]\nsite-root = "."\n'
    )

    expect(violations(repository)).toContainEqual(
      expect.objectContaining({ message: expect.stringContaining('Unknown key under [skills.ki-repo-website-app]') })
    )
  })
})
