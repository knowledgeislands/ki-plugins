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
  const repository = temporaryDirectory('ki-repo-website-content-')
  mkdirSync(join(repository, 'apps', 'site'), { recursive: true })
  writeFileSync(join(repository, 'apps', 'site', 'eleventy.config.ts'), 'export default function () {}\n')
  writeFileSync(join(repository, 'apps', 'site', 'package.json'), '{"scripts":{},"dependencies":{}}\n')
  writeFileSync(join(repository, '.ki.toml'), '[skills.ki-repo-website]\n\n[skills.ki-repo-website-content]\n')
  return repository
}

const rootContext = (session: ReturnType<typeof createWebsiteSession>) => {
  const subject = session.subjects[0]
  if (!subject) throw new Error('ki-repo-website-content session did not expose its repository subject')
  return { subject, context: subject.context() }
}

const item = (code: 'WEB-1' | 'WEB-6' | 'WEB-30' | 'WEB-31' | 'WEB-32' | 'WEB-33' | 'WEB-41' | 'WEB-42') => {
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
  expect(context.addDistIgnore).toBeUndefined()
  expect(item('WEB-33').audit.run(context)[0]?.status).toBe('VIOLATION')
  expect(item('WEB-41').audit.run(context)[0]?.status).toBe('PASS')
  expect(session.proposal()).toEqual({ writes: [] })
  expect(existsSync(join(repository, '.ki.toml'))).toBe(true)
  expect(existsSync(join(repository, '.gitignore'))).toBe(false)
})

test('an explicit flat site root is supported', () => {
  const repository = temporaryDirectory('ki-repo-website-content-flat-')
  writeFileSync(join(repository, 'eleventy.config.ts'), 'export default function () {}\n')
  writeFileSync(join(repository, 'package.json'), '{"scripts":{},"dependencies":{}}\n')
  writeFileSync(
    join(repository, '.ki.toml'),
    '[skills.ki-repo-website]\nsite-root = "."\n\n[skills.ki-repo-website-content]\n'
  )

  const session = createWebsiteSession(options(repository, 'audit'))
  const { context } = rootContext(session)
  const web6 = item('WEB-6')

  const [outcome] = web6.audit.run(context)
  expect(outcome).toMatchObject({
    status: 'PASS',
    subject: 'eleventy.config.ts'
  })
  expect(outcome?.message).toBeTruthy()
  expect(session.subjects.length).toBeGreaterThan(0)
})

test('ignore repair is delegated to the ki-repo composer', () => {
  const repository = fixture()
  const session = createWebsiteSession(options(repository, 'conform'))
  const proposal = session.proposal()
  expect(item('WEB-33').conform).toBeUndefined()
  expect(proposal.writes).toEqual([])
  expect(session.proposal()).toEqual(proposal)
  expect(existsSync(join(repository, '.ki.toml'))).toBe(true)
  expect(existsSync(join(repository, '.gitignore'))).toBe(false)
})

test('existing physical files are preserved around bounded repairs', () => {
  const repository = fixture()
  writeFileSync(join(repository, '.ki.toml'), '[skills.ki-repo]\n')
  writeFileSync(join(repository, '.gitignore'), '# generated\n/dist/\n')
  const session = createWebsiteSession(options(repository, 'conform'))
  expect(item('WEB-33').conform).toBeUndefined()
  expect(session.proposal().writes).toEqual([])
  expect(readFileSync(join(repository, '.ki.toml'), 'utf8')).toBe('[skills.ki-repo]\n')
  expect(readFileSync(join(repository, '.gitignore'), 'utf8')).toBe('# generated\n/dist/\n')
})

test('symlinked proposal targets are never traversed or replaced', () => {
  const repository = fixture()
  const outside = temporaryDirectory('ki-repo-website-content-outside-')
  const config = join(outside, 'config.toml')
  const ignore = join(outside, 'ignore')
  writeFileSync(config, '[skills.ki-repo]\n')
  writeFileSync(ignore, '/dist/\n')
  rmSync(join(repository, '.ki.toml'))
  symlinkSync(config, join(repository, '.ki.toml'))
  symlinkSync(ignore, join(repository, '.gitignore'))
  const session = createWebsiteSession(options(repository, 'conform'))
  const { context } = rootContext(session)

  item('WEB-41').conform?.run(context)
  item('WEB-33').conform?.run(context)

  expect(context.malformedConfig).toBe(true)
  expect(context.addDistIgnore).toBeUndefined()
  expect(session.proposal()).toEqual({ writes: [] })
  expect(readFileSync(config, 'utf8')).toBe('[skills.ki-repo]\n')
  expect(readFileSync(ignore, 'utf8')).toBe('/dist/\n')
})

test('the conventional apps/site shape passes WEB-6 and scopes the dist ignore', () => {
  const repository = temporaryDirectory('ki-repo-website-content-apps-')
  mkdirSync(join(repository, 'apps', 'site'), { recursive: true })
  writeFileSync(join(repository, 'apps', 'site', 'eleventy.config.ts'), 'export default function () {}\n')
  writeFileSync(join(repository, 'apps', 'site', 'package.json'), '{"scripts":{},"dependencies":{}}\n')
  writeFileSync(
    join(repository, '.ki.toml'),
    '[skills.ki-repo-website]\nsite-root = "apps/site"\n\n[skills.ki-repo-website-content]\n'
  )
  writeFileSync(join(repository, '.gitignore'), 'apps/site/dist\n')
  const session = createWebsiteSession(options(repository, 'audit'))
  const { context } = rootContext(session)

  expect(context.siteRoot).toBe('apps/site')
  expect(item('WEB-6').audit.run(context)[0]).toMatchObject({
    status: 'PASS',
    subject: join('apps/site', 'eleventy.config.ts')
  })
  expect(item('WEB-33').audit.run(context)[0]?.status).toBe('PASS')
  expect(item('WEB-42').audit.run(context)[0]?.status).toBe('PASS')
})

test('a keyless website core table selects the conventional apps/site default', () => {
  const repository = temporaryDirectory('ki-repo-website-content-default-')
  mkdirSync(join(repository, 'apps', 'site'), { recursive: true })
  writeFileSync(join(repository, 'apps', 'site', 'eleventy.config.ts'), 'export default function () {}\n')
  writeFileSync(join(repository, 'apps', 'site', 'package.json'), '{"scripts":{},"dependencies":{}}\n')
  writeFileSync(join(repository, '.ki.toml'), '[skills.ki-repo-website]\n\n[skills.ki-repo-website-content]\n')

  const { context } = rootContext(createWebsiteSession(options(repository, 'audit')))

  expect(context.siteRoot).toBe('apps/site')
  expect(item('WEB-6').audit.run(context)[0]?.status).toBe('PASS')
})

test('dependencies are inspected in the selected site package', () => {
  const repository = temporaryDirectory('ki-repo-website-content-package-')
  mkdirSync(join(repository, 'apps', 'site'), { recursive: true })
  writeFileSync(join(repository, 'apps', 'site', 'eleventy.config.ts'), 'export default function () {}\n')
  writeFileSync(
    join(repository, 'apps', 'site', 'package.json'),
    '{"scripts":{},"dependencies":{"@11ty/eleventy":"^3.1.6"}}\n'
  )
  writeFileSync(join(repository, 'package.json'), '{"scripts":{},"dependencies":{}}\n')
  writeFileSync(
    join(repository, '.ki.toml'),
    '[skills.ki-repo-website]\nsite-root = "apps/site"\n\n[skills.ki-repo-website-content]\n'
  )

  const { context } = rootContext(createWebsiteSession(options(repository, 'audit')))

  expect(context.packagePath).toBe(join('apps', 'site', 'package.json'))
  expect(item('WEB-1').audit.run(context)[0]).toMatchObject({
    status: 'PASS',
    subject: join('apps', 'site', 'package.json')
  })
})

test('the selected site package owns ordinary local lifecycle scripts', () => {
  const repository = temporaryDirectory('ki-repo-website-content-scripts-')
  mkdirSync(join(repository, 'apps', 'site'), { recursive: true })
  writeFileSync(join(repository, 'apps', 'site', 'eleventy.config.ts'), 'export default function () {}\n')
  writeFileSync(
    join(repository, 'apps', 'site', 'package.json'),
    JSON.stringify({
      scripts: {
        build: 'eleventy --config=eleventy.config.ts',
        dev: 'concurrently "bun run dev:css" "bun run dev:serve"',
        'dev:css': 'tailwindcss --watch',
        'dev:serve': 'eleventy --serve',
        clean: 'rm -rf dist'
      },
      dependencies: {}
    })
  )
  writeFileSync(
    join(repository, '.ki.toml'),
    '[skills.ki-repo-website]\nsite-root = "apps/site"\n\n[skills.ki-repo-website-content]\n'
  )

  const { context } = rootContext(createWebsiteSession(options(repository, 'audit')))

  expect(
    item('WEB-30')
      .audit.run(context)
      .every((outcome) => outcome.status === 'PASS')
  ).toBe(true)
  expect(
    item('WEB-31')
      .audit.run(context)
      .every((outcome) => outcome.status === 'PASS')
  ).toBe(true)
  expect(item('WEB-32').audit.run(context)[0]?.status).toBe('PASS')
})

test('root-owned public aliases do not substitute for site-local scripts', () => {
  const repository = temporaryDirectory('ki-repo-website-content-public-aliases-')
  mkdirSync(join(repository, 'apps', 'site'), { recursive: true })
  writeFileSync(join(repository, 'apps', 'site', 'eleventy.config.ts'), 'export default function () {}\n')
  writeFileSync(
    join(repository, 'apps', 'site', 'package.json'),
    JSON.stringify({
      scripts: {
        'ki:site:build': 'eleventy --config=eleventy.config.ts',
        'ki:site:dev': 'concurrently "bun run ki:site:dev:css" "bun run ki:site:dev:serve"',
        'ki:site:dev:css': 'tailwindcss --watch',
        'ki:site:dev:serve': 'eleventy --serve',
        'ki:site:clean': 'rm -rf dist'
      },
      dependencies: {}
    })
  )
  writeFileSync(
    join(repository, '.ki.toml'),
    '[skills.ki-repo-website]\nsite-root = "apps/site"\n\n[skills.ki-repo-website-content]\n'
  )

  const { context } = rootContext(createWebsiteSession(options(repository, 'audit')))

  expect(
    item('WEB-30')
      .audit.run(context)
      .some((outcome) => outcome.status === 'VIOLATION')
  ).toBe(true)
  expect(item('WEB-31').audit.run(context)[0]?.status).toBe('NOT_APPLICABLE')
  expect(item('WEB-32').audit.run(context)[0]?.status).toBe('VIOLATION')
})

test('the content table stays keyless and cannot override the core site root', () => {
  const repository = temporaryDirectory('ki-repo-website-content-keyless-')
  mkdirSync(join(repository, 'apps', 'site'), { recursive: true })
  writeFileSync(join(repository, 'apps', 'site', 'eleventy.config.ts'), 'export default function () {}\n')
  writeFileSync(join(repository, 'apps', 'site', 'package.json'), '{"scripts":{},"dependencies":{}}\n')
  writeFileSync(
    join(repository, '.ki.toml'),
    '[skills.ki-repo-website]\nsite-root = "apps/site"\n\n[skills.ki-repo-website-content]\nsite-root = "elsewhere"\n'
  )

  const { context } = rootContext(createWebsiteSession(options(repository, 'audit')))

  expect(context.siteRoot).toBe('apps/site')
  expect(item('WEB-42').audit.run(context)[0]).toMatchObject({
    status: 'VIOLATION',
    subject: '.ki.toml'
  })
})

test('a non-conventional selected site root remains supported', () => {
  const repository = temporaryDirectory('ki-repo-website-content-selected-')
  mkdirSync(join(repository, 'products', 'docs'), { recursive: true })
  writeFileSync(join(repository, 'products', 'docs', 'eleventy.config.ts'), 'export default function () {}\n')
  writeFileSync(join(repository, 'products', 'docs', 'package.json'), '{"scripts":{},"dependencies":{}}\n')
  writeFileSync(
    join(repository, '.ki.toml'),
    '[skills.ki-repo-website]\nsite-root = "products/docs"\n\n[skills.ki-repo-website-content]\n'
  )
  const session = createWebsiteSession(options(repository, 'audit'))
  const { context } = rootContext(session)

  expect(context.siteRoot).toBe('products/docs')
  const [outcome] = item('WEB-6').audit.run(context)
  expect(outcome).toMatchObject({
    status: 'PASS',
    subject: join('products', 'docs', 'eleventy.config.ts')
  })
})

test('a symlinked Eleventy marker activates reporting without exposing its contents', () => {
  const repository = temporaryDirectory('ki-repo-website-content-root-')
  const outside = temporaryDirectory('ki-repo-website-content-config-')
  mkdirSync(join(repository, 'apps', 'site'), { recursive: true })
  writeFileSync(join(outside, 'eleventy.config.ts'), 'toRelativeOutputUrl\n')
  symlinkSync(join(outside, 'eleventy.config.ts'), join(repository, 'apps', 'site', 'eleventy.config.ts'))
  writeFileSync(join(repository, 'apps', 'site', 'package.json'), '{"scripts":{},"dependencies":{}}\n')
  writeFileSync(
    join(repository, '.ki.toml'),
    '[skills.ki-repo-website]\nsite-root = "apps/site"\n\n[skills.ki-repo-website-content]\n'
  )
  const session = createWebsiteSession(options(repository, 'audit'))
  const { context } = rootContext(session)

  expect(context.applicable).toBe(true)
  expect(context.cfgName).toBe('')
  expect(context.config).toBe('')
  expect(item('WEB-6').audit.run(context)[0]?.status).toBe('VIOLATION')
})
