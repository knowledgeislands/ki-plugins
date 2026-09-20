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
  writeFileSync(join(repository, 'package.json'), '{"workspaces":["apps/*"]}\n')
  writeFileSync(join(repository, '.ki.toml'), '[skills.ki-repo-website]\n\n[skills.ki-repo-website-content]\n')
  return repository
}

const rootContext = (session: ReturnType<typeof createWebsiteSession>) => {
  const subject = session.subjects[0]
  if (!subject) throw new Error('ki-repo-website-content session did not expose its repository subject')
  return { subject, context: subject.context() }
}

const item = (
  code:
    | 'WEB-1'
    | 'WEB-6'
    | 'WEB-8'
    | 'WEB-12'
    | 'WEB-13'
    | 'WEB-14'
    | 'WEB-15'
    | 'WEB-16'
    | 'WEB-30'
    | 'WEB-31'
    | 'WEB-32'
    | 'WEB-33'
    | 'WEB-41'
    | 'WEB-42'
) => {
  const candidate = WEB.items.find((entry) => entry.code === code)
  if (!candidate?.mechanical) throw new Error(`${code} mechanical item is missing`)
  return candidate.mechanical
}

const sharedBehaviour = `
const toRelativeOutputUrl = () => undefined
eleventyConfig.addTransform('explicit-index-links', toRelativeOutputUrl)
eleventyConfig.addDataExtension('ts', {})
eleventyConfig.addDataExtension('json5', {})
eleventyConfig.on('eleventy.before', () => tailwindcss())
eleventyConfig.addWatchTarget('src/assets/css')
`

const expectSharedBehaviour = (context: ReturnType<typeof rootContext>['context'], status: 'PASS' | 'VIOLATION') => {
  for (const code of ['WEB-12', 'WEB-13', 'WEB-14', 'WEB-15', 'WEB-16'] as const) {
    expect(item(code).audit.run(context)[0]?.status).toBe(status)
  }
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

test('WEB-12 through WEB-16 accept inline site configuration behaviour', () => {
  const repository = fixture()
  writeFileSync(join(repository, 'apps', 'site', 'eleventy.config.ts'), sharedBehaviour)

  const { context } = rootContext(createWebsiteSession(options(repository, 'audit')))

  expect(context.configSources.map((source) => source.path)).toEqual(['apps/site/eleventy.config.ts'])
  expectSharedBehaviour(context, 'PASS')
})

test('WEB-12 through WEB-16 follow one direct relative configuration import', () => {
  const repository = fixture()
  writeFileSync(join(repository, 'apps', 'site', 'eleventy.config.ts'), "import './shared-config.ts'\n")
  writeFileSync(join(repository, 'apps', 'site', 'shared-config.ts'), sharedBehaviour)

  const { context } = rootContext(createWebsiteSession(options(repository, 'audit')))

  expect(context.configSources.map((source) => source.path)).toEqual([
    'apps/site/eleventy.config.ts',
    'apps/site/shared-config.ts'
  ])
  expectSharedBehaviour(context, 'PASS')
})

test('WEB-12 through WEB-16 follow a direct workspace-package export', () => {
  const repository = fixture()
  mkdirSync(join(repository, 'packages', 'view-common', 'src'), { recursive: true })
  writeFileSync(join(repository, 'package.json'), '{"workspaces":["apps/*","packages/*"]}\n')
  writeFileSync(
    join(repository, 'packages', 'view-common', 'package.json'),
    '{"name":"@kit/view-common","exports":{"./eleventy":"./src/eleventy.ts"}}\n'
  )
  writeFileSync(join(repository, 'packages', 'view-common', 'src', 'eleventy.ts'), sharedBehaviour)
  writeFileSync(
    join(repository, 'apps', 'site', 'eleventy.config.ts'),
    "import { applyViewCommon } from '@kit/view-common/eleventy'\napplyViewCommon()\n"
  )

  const { context } = rootContext(createWebsiteSession(options(repository, 'audit')))

  expect(context.configSources.map((source) => source.path)).toEqual([
    'apps/site/eleventy.config.ts',
    'packages/view-common/src/eleventy.ts'
  ])
  expectSharedBehaviour(context, 'PASS')
})

test('WEB-12 through WEB-16 do not follow unsafe, installed, dynamic, or second-edge imports', () => {
  const repository = fixture()
  const outside = temporaryDirectory('ki-repo-website-content-import-outside-')
  writeFileSync(join(outside, 'shared.ts'), sharedBehaviour)
  symlinkSync(join(outside, 'shared.ts'), join(repository, 'apps', 'site', 'linked.ts'))
  mkdirSync(join(repository, 'node_modules', 'installed-package'), { recursive: true })
  writeFileSync(join(repository, 'node_modules', 'installed-package', 'shared.ts'), sharedBehaviour)
  writeFileSync(
    join(repository, 'apps', 'site', 'eleventy.config.ts'),
    "import '../../../outside.ts'\nimport './linked.ts'\nimport '../../node_modules/installed-package/shared.ts'\nimport 'installed-package'\nvoid import('./dynamic.ts')\nimport './first.ts'\n"
  )
  writeFileSync(join(repository, 'apps', 'site', 'dynamic.ts'), sharedBehaviour)
  writeFileSync(join(repository, 'apps', 'site', 'first.ts'), "import './second.ts'\n")
  writeFileSync(join(repository, 'apps', 'site', 'second.ts'), sharedBehaviour)

  const { context } = rootContext(createWebsiteSession(options(repository, 'audit')))

  expect(context.configSources.map((source) => source.path)).toEqual([
    'apps/site/eleventy.config.ts',
    'apps/site/first.ts'
  ])
  expectSharedBehaviour(context, 'VIOLATION')
})

test('a flat content site is located but fails the workspace contract', () => {
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
  expect(item('WEB-8').audit.run(context)[0]?.status).toBe('VIOLATION')
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
  writeFileSync(join(repository, 'package.json'), '{"workspaces":["apps/*"]}\n')
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
  expect(item('WEB-8').audit.run(context)[0]?.status).toBe('PASS')
  expect(item('WEB-33').audit.run(context)[0]?.status).toBe('PASS')
  expect(item('WEB-42').audit.run(context)[0]?.status).toBe('PASS')
})

test('a keyless website core table selects the conventional apps/site default', () => {
  const repository = temporaryDirectory('ki-repo-website-content-default-')
  mkdirSync(join(repository, 'apps', 'site'), { recursive: true })
  writeFileSync(join(repository, 'apps', 'site', 'eleventy.config.ts'), 'export default function () {}\n')
  writeFileSync(join(repository, 'apps', 'site', 'package.json'), '{"scripts":{},"dependencies":{}}\n')
  writeFileSync(join(repository, 'package.json'), '{"workspaces":["apps/*"]}\n')
  writeFileSync(join(repository, '.ki.toml'), '[skills.ki-repo-website]\n\n[skills.ki-repo-website-content]\n')

  const { context } = rootContext(createWebsiteSession(options(repository, 'audit')))

  expect(context.siteRoot).toBe('apps/site')
  expect(item('WEB-6').audit.run(context)[0]?.status).toBe('PASS')
})

test('a root workspace declaration must cover the selected site root', () => {
  const repository = fixture()
  writeFileSync(join(repository, 'package.json'), '{"workspaces":["packages/*"]}\n')

  const { context } = rootContext(createWebsiteSession(options(repository, 'audit')))

  expect(item('WEB-8').audit.run(context)[0]?.status).toBe('VIOLATION')
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

test('the selected site package owns capability-scoped development scripts', () => {
  const repository = temporaryDirectory('ki-repo-website-content-scripts-')
  mkdirSync(join(repository, 'apps', 'site'), { recursive: true })
  writeFileSync(join(repository, 'apps', 'site', 'eleventy.config.ts'), 'export default function () {}\n')
  writeFileSync(
    join(repository, 'apps', 'site', 'package.json'),
    JSON.stringify({
      scripts: {
        build: 'eleventy --config=eleventy.config.ts',
        'ki:site:dev': 'concurrently "bun run ki:site:dev:css" "bun run ki:site:dev:serve"',
        'ki:site:dev:css': 'tailwindcss --watch',
        'ki:site:dev:serve': 'eleventy --serve',
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
  expect(
    item('WEB-31')
      .audit.run(context)
      .every((outcome) => outcome.status === 'PASS')
  ).toBe(true)
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

test('rejects the retired bare development family', () => {
  const repository = temporaryDirectory('ki-repo-website-content-bare-dev-')
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
      .some((outcome) => outcome.status === 'VIOLATION')
  ).toBe(true)
  expect(item('WEB-31').audit.run(context)[0]?.status).toBe('NOT_APPLICABLE')
})

test('rejects unreferenced development fan-out keys', () => {
  const repository = temporaryDirectory('ki-repo-website-content-unreferenced-dev-')
  mkdirSync(join(repository, 'apps', 'site'), { recursive: true })
  writeFileSync(join(repository, 'apps', 'site', 'eleventy.config.ts'), 'export default function () {}\n')
  writeFileSync(
    join(repository, 'apps', 'site', 'package.json'),
    JSON.stringify({
      scripts: {
        build: 'eleventy --config=eleventy.config.ts',
        'ki:site:dev': 'concurrently "echo css" "echo server"',
        'ki:site:dev:css': 'tailwindcss --watch',
        'ki:site:dev:serve': 'eleventy --serve',
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
    item('WEB-31')
      .audit.run(context)
      .every((outcome) => outcome.status === 'VIOLATION')
  ).toBe(true)
})

test('named registry audits every selected content site and honours a subset', () => {
  const repository = temporaryDirectory('ki-repo-website-content-multi-')
  for (const site of ['site-apex', 'site-tower']) {
    mkdirSync(join(repository, 'apps', site), { recursive: true })
    writeFileSync(join(repository, 'apps', site, 'eleventy.config.ts'), sharedBehaviour)
    writeFileSync(join(repository, 'apps', site, 'package.json'), '{"scripts":{},"dependencies":{}}\n')
  }
  writeFileSync(join(repository, 'package.json'), '{"workspaces":["apps/*"]}\n')
  writeFileSync(
    join(repository, '.ki.toml'),
    '[skills.ki-repo-website]\nprimary-site = "apex"\n\n[skills.ki-repo-website.sites]\napex = "apps/site-apex"\ntower = "apps/site-tower"\n\n[skills.ki-repo-website-content]\n'
  )

  const all = createWebsiteSession(options(repository, 'audit')).subjects.filter((subject) =>
    subject.families.includes('WEB')
  )
  expect(all.map((subject) => subject.context().siteName)).toEqual(['apex', 'tower'])
  expect(all.every((subject) => item('WEB-12').audit.run(subject.context())[0]?.status === 'PASS')).toBe(true)

  writeFileSync(
    join(repository, '.ki.toml'),
    '[skills.ki-repo-website]\nprimary-site = "apex"\n\n[skills.ki-repo-website.sites]\napex = "apps/site-apex"\ntower = "apps/site-tower"\n\n[skills.ki-repo-website-content]\nsites = ["tower"]\n'
  )
  const subset = createWebsiteSession(options(repository, 'audit')).subjects.filter((subject) =>
    subject.families.includes('WEB')
  )
  expect(subset.map((subject) => subject.context().siteName)).toEqual(['tower'])
  const tower = subset[0]
  if (!tower) throw new Error('content subset did not expose tower')
  expect(item('WEB-42').audit.run(tower.context())[0]?.status).toBe('PASS')
})
