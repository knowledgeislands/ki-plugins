import { afterEach, describe, expect, test } from 'bun:test'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
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

const options = (repository: string): RubricContextOptions => ({
  mode: 'audit',
  repository,
  userHome: repository,
  configuration: {}
})

describe('website core context', () => {
  test('accepts the neutral lifecycle seam without selecting an implementation', () => {
    const repository = root()
    writeFileSync(join(repository, '.ki-config.toml'), '[skills.ki-repo-website]\n')
    writeFileSync(
      join(repository, 'package.json'),
      JSON.stringify({ scripts: { 'ki:site:build': 'build', 'ki:site:dev': 'dev', 'ki:site:clean': 'clean' } })
    )
    writeFileSync(join(repository, '.gitignore'), 'dist/\n')

    const context = createWebsiteCoreSession(options(repository)).subjects[0].context()
    const violations = SITE.items
      .flatMap((item) => item.mechanical?.audit.run(context) ?? [])
      .filter((outcome) => outcome.status === 'VIOLATION')
    expect(violations).toEqual([])
  })
})
