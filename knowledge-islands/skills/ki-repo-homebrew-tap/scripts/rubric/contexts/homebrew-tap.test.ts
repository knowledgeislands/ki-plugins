import { afterEach, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { RubricContextOptions } from '../../shared/rubric.ts'
import { CONFIG } from '../items/config.ts'
import { TAP } from '../items/tap.ts'
import { createHomebrewTapSession } from './homebrew-tap.ts'

const temporaryDirectories: string[] = []

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

const temporaryDirectory = (prefix: string): string => {
  const directory = mkdtempSync(join(tmpdir(), prefix))
  temporaryDirectories.push(directory)
  return directory
}

const options = (repository: string, mode: 'audit' | 'conform'): RubricContextOptions => ({
  mode,
  repository,
  userHome: tmpdir(),
  configuration: {}
})

const fixture = (): { readonly repository: string; readonly config: string; readonly original: string } => {
  const repository = temporaryDirectory('ki-repo-homebrew-tap-')
  mkdirSync(join(repository, 'Formula'))
  writeFileSync(
    join(repository, 'Formula', 'mgit.rb'),
    [
      'class Mgit < Formula',
      '  desc "Run commands across many repositories"',
      '  homepage "https://example.com/tools-mgit"',
      '  url "https://example.com/archive/refs/tags/v1.0.0.tar.gz"',
      '  sha256 "abc"',
      '  license "MIT"',
      '  def install',
      '    bin.install "bin/mgit"',
      '  end',
      '  test do',
      '    system "#{bin}/mgit", "--version"',
      '  end',
      'end',
      ''
    ].join('\n')
  )
  writeFileSync(join(repository, 'README.md'), '# Tap\n\n## Formulae\n\n| Formula |\n| --- |\n| `mgit` |\n')
  const config = join(repository, '.ki-config.toml')
  const original = '[skills.ki-repo]\n[skills.ki-repo-homebrew-tap]\n'
  writeFileSync(config, original)
  return { repository, config, original }
}

const rootContext = (session: Awaited<ReturnType<typeof createHomebrewTapSession>>) => {
  const subject = session.subjects[0]
  if (!subject) throw new Error('ki-repo-homebrew-tap session did not expose its repository subject')
  return { subject, context: subject.context() }
}

const tapItem = (code: string) => {
  const item = TAP.items.find((candidate) => candidate.code === code)
  if (!item?.mechanical) throw new Error(`${code} mechanical item is missing`)
  return item.mechanical
}

const configItem = () => {
  const item = CONFIG.items.find((candidate) => candidate.code === 'CONFIG-1')
  if (!item?.mechanical) throw new Error('CONFIG-1 mechanical item is missing')
  return item.mechanical
}

test('audit is read-only, stable, applicable, and never launches Homebrew', async () => {
  const { repository, config, original } = fixture()
  const session = await createHomebrewTapSession(options(repository, 'audit'))
  const { subject, context } = rootContext(session)

  expect(subject.context()).toBe(subject.context())
  expect(context.config.addMarker).toBeUndefined()
  expect(tapItem('TAP-1').audit.run(TAP.selectContext(context))[0]?.status).toBe('PASS')
  expect(configItem().audit.run(CONFIG.selectContext(context))[0]?.status).toBe('PASS')
  expect(tapItem('TAP-7').audit.run(TAP.selectContext(context))).toEqual([
    {
      status: 'INFO',
      message: 'Static audit does not execute Homebrew; obtain isolated opt-in brew style/audit evidence separately.',
      subject: 'Formula/'
    }
  ])
  expect(session.proposal()).toEqual({ writes: [] })
  expect(readFileSync(config, 'utf8')).toBe(original)
})

test('a symlinked config is reported but never proposed for replacement', async () => {
  const repository = temporaryDirectory('ki-repo-homebrew-tap-root-')
  const outside = join(temporaryDirectory('ki-repo-homebrew-tap-outside-'), 'config.toml')
  mkdirSync(join(repository, 'Formula'))
  writeFileSync(join(repository, 'Formula', 'mgit.rb'), 'class Mgit < Formula\n')
  writeFileSync(outside, '[skills.ki-repo]\n')
  symlinkSync(outside, join(repository, '.ki-config.toml'))
  const session = await createHomebrewTapSession(options(repository, 'conform'))
  const { context } = rootContext(session)
  const configContext = CONFIG.selectContext(context)

  expect(configItem().audit.run(configContext)[0]?.status).toBe('NOT_APPLICABLE')
  expect(session.proposal()).toEqual({ writes: [] })
  expect(readFileSync(outside, 'utf8')).toBe('[skills.ki-repo]\n')
})

test('an unrelated repository is not applicable', async () => {
  const repository = temporaryDirectory('ki-repo-homebrew-tap-unrelated-')
  const session = await createHomebrewTapSession(options(repository, 'audit'))
  const { context } = rootContext(session)

  expect(tapItem('TAP-1').audit.run(TAP.selectContext(context))[0]?.status).toBe('NOT_APPLICABLE')
  expect(tapItem('TAP-7').audit.run(TAP.selectContext(context))[0]?.status).toBe('NOT_APPLICABLE')
  expect(configItem().audit.run(CONFIG.selectContext(context))[0]?.status).toBe('NOT_APPLICABLE')
})
