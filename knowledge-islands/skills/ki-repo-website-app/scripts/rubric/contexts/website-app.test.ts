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
    mkdirSync(join(repository, 'src'))
    writeFileSync(join(repository, '.ki-config.toml'), '[skills.ki-repo-website]\n[skills.ki-repo-website-app]\n')
    writeFileSync(
      join(repository, 'package.json'),
      JSON.stringify({
        dependencies: { react: '^19', 'react-dom': '^19' },
        devDependencies: { vite: '^7', '@vitejs/plugin-react': '^5' },
        scripts: { 'ki:site:build': 'vite build', 'ki:site:dev': 'vite' }
      })
    )
    writeFileSync(join(repository, 'vite.config.ts'), "export default { build: { outDir: 'dist' } }\n")
    writeFileSync(join(repository, 'index.html'), '<div id="root"></div>\n')
    writeFileSync(join(repository, 'src', 'main.tsx'), 'export {}\n')
    expect(violations(repository)).toEqual([])
  })

  test('rejects an Eleventy build beside the app', () => {
    const repository = root()
    writeFileSync(join(repository, '.ki-config.toml'), '[skills.ki-repo-website-app]\n')
    writeFileSync(
      join(repository, 'package.json'),
      JSON.stringify({
        dependencies: { react: '^19', 'react-dom': '^19', '@11ty/eleventy': '^3' },
        devDependencies: { vite: '^7', '@vitejs/plugin-react': '^5' }
      })
    )
    writeFileSync(join(repository, 'eleventy.config.ts'), 'export default {}\n')
    expect(violations(repository)).toContainEqual(
      expect.objectContaining({ message: expect.stringContaining('Eleventy is present') })
    )
  })
})
