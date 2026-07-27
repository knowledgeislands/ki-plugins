import { afterEach, expect, test } from 'bun:test'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { RubricContextOptions } from '../../shared/rubric.ts'
import { WEB } from '../items/web.ts'
import { createWebsiteSession } from './website.ts'

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

const fixture = (): string => {
  const repository = temporaryDirectory('ki-website-')
  mkdirSync(join(repository, 'site'), { recursive: true })
  writeFileSync(join(repository, 'site', 'eleventy.config.ts'), 'export default function () {}\n')
  writeFileSync(join(repository, 'package.json'), '{"scripts":{},"dependencies":{}}\n')
  return repository
}

const rootContext = (session: ReturnType<typeof createWebsiteSession>) => {
  const subject = session.subjects[0]
  if (!subject) throw new Error('ki-website session did not expose its repository subject')
  return { subject, context: subject.context() }
}

const item = (code: 'WEB-6' | 'WEB-33' | 'WEB-41') => {
  const candidate = WEB.items.find((entry) => entry.code === code)
  if (!candidate?.mechanical) throw new Error(`${code} mechanical item is missing`)
  return candidate.mechanical
}

test('audit is read-only, stable, and exposes no conform capabilities', () => {
  const repository = fixture()
  const session = createWebsiteSession(options(repository, 'audit'))
  const { subject, context } = rootContext(session)

  expect(subject.context()).toBe(subject.context())
  expect(context.applicable).toBe(true)
  expect(context.addOptIn).toBeUndefined()
  expect(context.addDistIgnore).toBeUndefined()
  expect(item('WEB-33').audit.run(context)[0]?.status).toBe('VIOLATION')
  expect(item('WEB-41').audit.run(context)[0]?.status).toBe('VIOLATION')
  expect(session.proposal()).toEqual({ writes: [] })
  expect(existsSync(join(repository, '.ki-config.toml'))).toBe(false)
  expect(existsSync(join(repository, '.gitignore'))).toBe(false)
})

test('safe marker and ignore repairs are item-owned, coalesced, and idempotent', () => {
  const repository = fixture()
  const session = createWebsiteSession(options(repository, 'conform'))
  const { context } = rootContext(session)

  item('WEB-41').conform?.run(context)
  item('WEB-41').conform?.run(context)
  item('WEB-33').conform?.run(context)
  item('WEB-33').conform?.run(context)

  const proposal = session.proposal()
  expect(proposal.writes).toHaveLength(2)
  expect(proposal.writes[0]).toMatchObject({ path: '.ki-config.toml', create: true })
  expect(proposal.writes[0]?.content).toContain('[ki-website]\n')
  expect(proposal.writes[1]).toEqual({ path: '.gitignore', content: 'site/dist\n', create: true })
  expect(session.proposal()).toEqual(proposal)
  expect(existsSync(join(repository, '.ki-config.toml'))).toBe(false)
  expect(existsSync(join(repository, '.gitignore'))).toBe(false)
})

test('existing physical files are preserved around bounded repairs', () => {
  const repository = fixture()
  writeFileSync(join(repository, '.ki-config.toml'), '[ki-repo]\n')
  writeFileSync(join(repository, '.gitignore'), '# generated\n/dist/\n')
  const session = createWebsiteSession(options(repository, 'conform'))
  const { context } = rootContext(session)

  item('WEB-41').conform?.run(context)
  item('WEB-33').conform?.run(context)

  expect(session.proposal().writes).toEqual([
    {
      path: '.ki-config.toml',
      content:
        '[ki-repo]\n\n# ki-website — opt-in marker: presence of this table opts the repo into the\n# Eleventy + Tailwind site-build standard. It takes no per-repo keys today.\n[ki-website]\n'
    },
    { path: '.gitignore', content: '# generated\n/site/dist/\n' }
  ])
  expect(readFileSync(join(repository, '.ki-config.toml'), 'utf8')).toBe('[ki-repo]\n')
  expect(readFileSync(join(repository, '.gitignore'), 'utf8')).toBe('# generated\n/dist/\n')
})

test('symlinked proposal targets are never traversed or replaced', () => {
  const repository = fixture()
  const outside = temporaryDirectory('ki-website-outside-')
  const config = join(outside, 'config.toml')
  const ignore = join(outside, 'ignore')
  writeFileSync(config, '[ki-repo]\n')
  writeFileSync(ignore, '/dist/\n')
  symlinkSync(config, join(repository, '.ki-config.toml'))
  symlinkSync(ignore, join(repository, '.gitignore'))
  const session = createWebsiteSession(options(repository, 'conform'))
  const { context } = rootContext(session)

  item('WEB-41').conform?.run(context)
  item('WEB-33').conform?.run(context)

  expect(context.malformedConfig).toBe(true)
  expect(context.addOptIn).toBeUndefined()
  expect(context.addDistIgnore).toBeUndefined()
  expect(session.proposal()).toEqual({ writes: [] })
  expect(readFileSync(config, 'utf8')).toBe('[ki-repo]\n')
  expect(readFileSync(ignore, 'utf8')).toBe('/dist/\n')
})

test('a symlinked Eleventy marker activates reporting without exposing its contents', () => {
  const repository = temporaryDirectory('ki-website-root-')
  const outside = temporaryDirectory('ki-website-config-')
  writeFileSync(join(outside, 'eleventy.config.ts'), 'toRelativeOutputUrl\n')
  symlinkSync(join(outside, 'eleventy.config.ts'), join(repository, 'eleventy.config.ts'))
  writeFileSync(join(repository, 'package.json'), '{"scripts":{},"dependencies":{}}\n')
  const session = createWebsiteSession(options(repository, 'audit'))
  const { context } = rootContext(session)

  expect(context.applicable).toBe(true)
  expect(context.cfgName).toBe('')
  expect(context.config).toBe('')
  expect(item('WEB-6').audit.run(context)[0]?.status).toBe('VIOLATION')
})
