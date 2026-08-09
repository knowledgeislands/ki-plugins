import { afterEach, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { RubricContextOptions } from '../../shared/rubric.ts'
import { KI } from '../items/applicability.ts'
import { CI } from '../items/ci.ts'
import { PKG } from '../items/package.ts'
import { createMcpSession } from './mcp.ts'

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

const fixture = (): {
  readonly repository: string
  readonly config: string
  readonly configContent: string
  readonly packagePath: string
  readonly packageContent: string
} => {
  const repository = temporaryDirectory('ki-repo-mcp-')
  for (const directory of ['config', 'mcp-server', 'tools/example', 'main', 'utils'])
    mkdirSync(join(repository, 'src', directory), { recursive: true })
  writeFileSync(
    join(repository, 'src', 'config', 'index.ts'),
    'export const loadConfig = () => process.loadEnvFile()\nconst values = [ACCESS_LEVELS, ACCESS_LEVEL_RANK, AuditLogMode]\n'
  )
  writeFileSync(
    join(repository, 'src', 'tools', 'example', 'index.ts'),
    "server.registerTool('example_items_list', {})\n"
  )
  for (const file of ['access-level.ts', 'annotations.ts', 'audit-log.ts'])
    writeFileSync(join(repository, 'src', 'utils', file), '')
  const config = join(repository, '.ki-config.toml')
  const configContent = '[skills.ki-repo]\n'
  writeFileSync(config, configContent)
  const packagePath = join(repository, 'package.json')
  const packageContent = `${JSON.stringify(
    {
      name: '@knowledgeislands/mcp-example',
      bin: {},
      exports: {},
      scripts: { 'ki:generate:client': 'mcporter emit-ts example', 'ki:test:smoke': 'bun smoke.ts' }
    },
    null,
    2
  )}\n`
  writeFileSync(packagePath, packageContent)
  return { repository, config, configContent, packagePath, packageContent }
}

const rootContext = (session: ReturnType<typeof createMcpSession>) => {
  const subject = session.subjects[0]
  if (!subject) throw new Error('ki-repo-mcp session did not expose its repository subject')
  return { subject, context: subject.context() }
}

const applicabilityItem = () => {
  const item = KI.items.find((candidate) => candidate.code === 'KI-CONFIG')
  if (!item?.mechanical) throw new Error('KI-CONFIG mechanical item is missing')
  return item.mechanical
}

const packageItem = () => {
  const item = PKG.items.find((candidate) => candidate.code === 'PKG-1')
  if (!item?.mechanical) throw new Error('PKG-1 mechanical item is missing')
  return item.mechanical
}

const ciItem = () => {
  const item = CI.items.find((candidate) => candidate.code === 'CI-2')
  if (!item?.mechanical) throw new Error('CI-2 mechanical item is missing')
  return item.mechanical
}

test('audit is read-only and returns one stable prepared context', () => {
  const { repository, config, configContent, packagePath, packageContent } = fixture()
  const session = createMcpSession(options(repository, 'audit'))
  const { subject, context } = rootContext(session)

  expect(subject.context()).toBe(subject.context())
  expect(context.applicability.addMarker).toBeUndefined()
  expect(context.package.conformPackage).toBeUndefined()
  expect(session.proposal()).toEqual({ writes: [] })
  expect(readFileSync(config, 'utf8')).toBe(configContent)
  expect(readFileSync(packagePath, 'utf8')).toBe(packageContent)
})

test('item-owned actions coalesce config and package changes into one deterministic proposal', () => {
  const { repository, config, configContent, packagePath, packageContent } = fixture()
  const session = createMcpSession(options(repository, 'conform'))
  const { context } = rootContext(session)

  applicabilityItem().conform?.run(KI.selectContext(context))
  packageItem().conform?.run(PKG.selectContext(context))
  applicabilityItem().conform?.run(KI.selectContext(context))
  packageItem().conform?.run(PKG.selectContext(context))

  const proposal = session.proposal()
  expect(proposal.writes.map((write) => write.path)).toEqual(['.ki-config.toml', 'package.json'])
  expect(proposal.writes[0]?.content).toBe(`${configContent}\n[skills.ki-repo-mcp]\n`)
  const packageWrite = proposal.writes[1]
  if (!packageWrite) throw new Error('package proposal is missing')
  const packageJson = JSON.parse(packageWrite.content) as Record<string, unknown>
  expect(packageJson.main).toBe('dist/mcp-server/index.js')
  expect(Object.values(packageJson.bin as Record<string, string>)).toContain('dist/mcp-server/index.js')
  expect(Object.keys(packageJson.exports as Record<string, unknown>)).toEqual(['.', './config', './package.json'])
  expect(readFileSync(config, 'utf8')).toBe(configContent)
  expect(readFileSync(packagePath, 'utf8')).toBe(packageContent)
})

test('symlinked mutation targets remain report-only', () => {
  const repository = temporaryDirectory('ki-repo-mcp-root-')
  const outside = temporaryDirectory('ki-repo-mcp-outside-')
  mkdirSync(join(repository, 'src', 'mcp-server'), { recursive: true })
  const outsideConfig = join(outside, 'config.toml')
  const outsidePackage = join(outside, 'package.json')
  writeFileSync(outsideConfig, '[skills.ki-repo]\n')
  writeFileSync(outsidePackage, '{}\n')
  symlinkSync(outsideConfig, join(repository, '.ki-config.toml'))
  symlinkSync(outsidePackage, join(repository, 'package.json'))
  const session = createMcpSession(options(repository, 'conform'))
  const { context } = rootContext(session)

  applicabilityItem().conform?.run(KI.selectContext(context))
  packageItem().conform?.run(PKG.selectContext(context))

  expect(applicabilityItem().audit.run(KI.selectContext(context))[0]?.message).toContain('not a regular file')
  expect(session.proposal()).toEqual({ writes: [] })
  expect(readFileSync(outsideConfig, 'utf8')).toBe('[skills.ki-repo]\n')
  expect(readFileSync(outsidePackage, 'utf8')).toBe('{}\n')
})

test('unrelated repositories route only the applicability family', () => {
  const repository = temporaryDirectory('ki-repo-mcp-unrelated-')
  const session = createMcpSession(options(repository, 'audit'))
  const { subject, context } = rootContext(session)

  expect(subject.families).toEqual(['KI'])
  expect(applicabilityItem().audit.run(KI.selectContext(context))[0]?.status).toBe('NOT_APPLICABLE')
})

test('smoke execution is reported without launching repository code', () => {
  const { repository } = fixture()
  const session = createMcpSession(options(repository, 'audit'))
  const { context } = rootContext(session)

  expect(ciItem().audit.run(CI.selectContext(context))).toEqual([
    {
      status: 'INFO',
      message: 'Run `bun run ki:test:smoke` explicitly; hosted rubric execution does not launch repository scripts.',
      subject: 'package.json'
    }
  ])
})
