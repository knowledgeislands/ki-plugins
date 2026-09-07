import { afterEach, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { RubricContextOptions } from '../../shared/rubric.ts'
import { KI } from '../items/applicability.ts'
import { CI } from '../items/ci.ts'
import { PKG } from '../items/package.ts'
import { PROTO } from '../items/protocol.ts'
import { TOOL } from '../items/tools.ts'
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
  const config = join(repository, '.ki.toml')
  const configContent = '[skills.ki-repo]\n[skills.ki-repo-mcp]\n'
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

const protocolItem = () => {
  const item = PROTO.items.find((candidate) => candidate.code === 'PROTO-1')
  if (!item?.mechanical) throw new Error('PROTO-1 mechanical item is missing')
  return item.mechanical
}

const writeDependencies = (packagePath: string, dependencies: Record<string, string>): void => {
  const packageJson = JSON.parse(readFileSync(packagePath, 'utf8')) as Record<string, unknown>
  packageJson.dependencies = dependencies
  writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`)
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

test('selected source shape can propose only its owned package repair', () => {
  const { repository, config, configContent, packagePath, packageContent } = fixture()
  const session = createMcpSession(options(repository, 'conform'))
  const { context } = rootContext(session)

  packageItem().conform?.run(PKG.selectContext(context))
  packageItem().conform?.run(PKG.selectContext(context))

  const proposal = session.proposal()
  expect(proposal.writes.map((write) => write.path)).toEqual(['package.json'])
  const packageWrite = proposal.writes[0]
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
  symlinkSync(outsideConfig, join(repository, '.ki.toml'))
  symlinkSync(outsidePackage, join(repository, 'package.json'))
  const session = createMcpSession(options(repository, 'conform'))
  const { context } = rootContext(session)

  applicabilityItem().conform?.run(KI.selectContext(context))
  packageItem().conform?.run(PKG.selectContext(context))

  expect(applicabilityItem().audit.run(KI.selectContext(context))[0]?.status).toBe('NOT_APPLICABLE')
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

test('result-envelope checks bind each helper use to its own source file', () => {
  const { repository } = fixture()
  const tool = join(repository, 'src', 'tools', 'example', 'index.ts')
  writeFileSync(tool, "server.registerTool('example_items_list', {})\nconst response = jsonResult({})\n")
  writeFileSync(join(repository, 'src', 'utils', 'results.ts'), 'const outputSchema = {}\n')
  const session = createMcpSession(options(repository, 'audit'))
  const { context } = rootContext(session)
  const item = TOOL.items.find((candidate) => candidate.code === 'TOOL-1')
  const outcomes = item?.mechanical?.audit.run(TOOL.selectContext(context)) ?? []

  expect(outcomes).toContainEqual({
    status: 'VIOLATION',
    message: 'Source-local result helper use has no outputSchema in the same file.',
    subject: 'src/tools/example/index.ts'
  })
})

test('result-envelope evidence ignores helper and main modules', () => {
  const { repository } = fixture()
  writeFileSync(join(repository, 'src', 'utils', 'results.ts'), 'const jsonResult = { structuredContent: {} }\n')
  writeFileSync(join(repository, 'src', 'main', 'example.ts'), 'const structuredContent = {}\n')

  const session = createMcpSession(options(repository, 'audit'))
  const { context } = rootContext(session)
  const item = TOOL.items.find((candidate) => candidate.code === 'TOOL-1')
  const outcomes = item?.mechanical?.audit.run(TOOL.selectContext(context)) ?? []

  expect(outcomes).not.toEqual(
    expect.arrayContaining([
      expect.objectContaining({ status: 'VIOLATION', subject: 'src/utils/results.ts' }),
      expect.objectContaining({ status: 'VIOLATION', subject: 'src/main/example.ts' })
    ])
  )
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

test('legacy v1 package selects the legacy profile without modern-only checks', () => {
  const { repository, packagePath } = fixture()
  writeDependencies(packagePath, { '@modelcontextprotocol/sdk': '^1.30.0' })
  const { context } = rootContext(createMcpSession(options(repository, 'audit')))

  expect(protocolItem().audit.run(PROTO.selectContext(context))).toEqual([
    {
      status: 'PASS',
      message:
        '@modelcontextprotocol/sdk ^1.30.0 selects the conformant legacy 2025-11-25 profile; modern-only checks do not apply.',
      subject: 'package.json'
    }
  ])
})

test('modern v2 package requires serveStdio and complete result discriminators', () => {
  const { repository, packagePath } = fixture()
  writeDependencies(packagePath, { '@modelcontextprotocol/server': '2.0.0' })
  writeFileSync(
    join(repository, 'src', 'mcp-server', 'index.ts'),
    "import { serveStdio } from '@modelcontextprotocol/server/stdio'\nserveStdio(() => ({}))\n"
  )
  writeFileSync(
    join(repository, 'src', 'utils', 'results.ts'),
    "export const jsonResult = () => ({ resultType: 'complete' as const })\nexport const errorResult = () => ({ resultType: 'complete' as const })\n"
  )
  const { context } = rootContext(createMcpSession(options(repository, 'audit')))

  expect(protocolItem().audit.run(PROTO.selectContext(context))).toEqual([
    {
      status: 'PASS',
      message: '@modelcontextprotocol/server 2.0.0 selects the modern 2026-07-28 profile.',
      subject: 'package.json'
    },
    {
      status: 'PASS',
      message: 'Modern profile source does not retain the legacy SDK server boundary.',
      subject: 'src'
    },
    {
      status: 'PASS',
      message: 'Modern profile uses the supported SDK-owned serveStdio boundary.',
      subject: 'src/mcp-server'
    },
    {
      status: 'PASS',
      message: 'Every result helper carries resultType: "complete" (2).',
      subject: 'src/utils/results.ts'
    }
  ])
})

test('modern v2 profile rejects a result helper missing its discriminator', () => {
  const { repository, packagePath } = fixture()
  writeDependencies(packagePath, { '@modelcontextprotocol/server': '2.0.0' })
  writeFileSync(join(repository, 'src', 'mcp-server', 'index.ts'), 'serveStdio(() => ({}))\n')
  writeFileSync(
    join(repository, 'src', 'utils', 'results.ts'),
    "export const jsonResult = () => ({ resultType: 'complete' as const })\nexport const errorResult = () => ({ isError: true })\n"
  )
  const { context } = rootContext(createMcpSession(options(repository, 'audit')))

  expect(protocolItem().audit.run(PROTO.selectContext(context))).toContainEqual({
    status: 'VIOLATION',
    message: 'Result helpers require 2 complete discriminators; found 1.',
    subject: 'src/utils/results.ts'
  })
})

test('protocol profile rejects mixed package families and unknown majors', () => {
  const { repository, packagePath } = fixture()
  writeDependencies(packagePath, {
    '@modelcontextprotocol/sdk': '^1.30.0',
    '@modelcontextprotocol/server': '2.0.0'
  })
  let context = rootContext(createMcpSession(options(repository, 'audit'))).context
  expect(protocolItem().audit.run(PROTO.selectContext(context))[0]).toMatchObject({
    status: 'VIOLATION',
    subject: 'package.json'
  })

  writeDependencies(packagePath, { '@modelcontextprotocol/server': '3.0.0' })
  context = rootContext(createMcpSession(options(repository, 'audit'))).context
  expect(protocolItem().audit.run(PROTO.selectContext(context))[0]).toEqual({
    status: 'VIOLATION',
    message:
      '@modelcontextprotocol/server 3.0.0 has an unsupported or unrecognised major; modern profile requires major 2.',
    subject: 'package.json'
  })
})

test('legacy-only package cannot claim the modern serveStdio boundary', () => {
  const { repository, packagePath } = fixture()
  writeDependencies(packagePath, { '@modelcontextprotocol/sdk': '^1.30.0' })
  writeFileSync(join(repository, 'src', 'mcp-server', 'index.ts'), 'serveStdio(() => ({}))\n')
  const { context } = rootContext(createMcpSession(options(repository, 'audit')))

  expect(protocolItem().audit.run(PROTO.selectContext(context))).toEqual([
    {
      status: 'VIOLATION',
      message: 'Modern v2 server markers are present while package.json selects only the legacy v1 SDK profile.',
      subject: 'src'
    }
  ])
})
