import { afterEach, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { RubricFamily } from '../../shared/rubric.ts'
import type {
  HarnessCapabilityPublicationContext,
  HarnessConfigContext,
  HarnessReviewContext,
  HarnessRubricContext,
  HarnessSkillsContext
} from '../contexts/harness.ts'
import catalogue from './index.ts'

const temporaryDirectories: string[] = []
const familyModules = readdirSync(import.meta.dir)
  .filter((file) => file.endsWith('.ts') && file !== 'index.ts' && !file.endsWith('.test.ts'))
  .sort()

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

const fixture = (): string => {
  const repository = mkdtempSync(join(tmpdir(), 'ki-repo-harness-'))
  temporaryDirectories.push(repository)
  for (const part of ['skills', 'subagents', 'mcp', 'evals', 'hooks']) {
    mkdirSync(join(repository, part))
    writeFileSync(join(repository, part, 'README.md'), `# ${part}\n`)
  }
  writeFileSync(join(repository, 'CLAUDE.md'), '# Harness\n')
  writeFileSync(join(repository, 'ROADMAP.md'), '# Roadmap\n')
  writeFileSync(join(repository, '.ki-config.toml'), '[skills.ki-repo]\n')
  mkdirSync(join(repository, 'skills', 'group', 'example'), { recursive: true })
  writeFileSync(
    join(repository, 'skills', 'group', 'example', 'SKILL.md'),
    '---\nname: example\nki-kind: governance\nki-depends-on: []\ndescription: Use example for fixture work.\nargument-hint: help\n---\n\n# Example\n'
  )
  return repository
}

const configItem = (code = 'CONFIG-1') => {
  const family = catalogue.families.find((candidate) => candidate.code === 'CONFIG') as
    | RubricFamily<HarnessRubricContext, HarnessConfigContext>
    | undefined
  const item = family?.items.find((candidate) => candidate.code === code)
  if (!family || !item) throw new Error(`${code} is missing`)
  return { family, item }
}

const capabilityPublicationItem = () => {
  const family = catalogue.families.find((candidate) => candidate.code === 'CAP') as
    | RubricFamily<HarnessRubricContext, HarnessReviewContext & { publication: HarnessCapabilityPublicationContext }>
    | undefined
  const item = family?.items.find((candidate) => candidate.code === 'CAP-2')
  if (!family || !item) throw new Error('CAP-2 is missing')
  return { family, item }
}

test('the catalogue preserves the current compatible-harness criteria', () => {
  expect(catalogue.contract).toBe(1)
  expect(catalogue.name).toBe('ki-repo-harness')
  expect(catalogue.packageScripts).toEqual(['ki:harness:eval'])
  expect(catalogue.createSession).toBeFunction()
  expect(catalogue.families.map((family) => family.code)).toEqual([
    'CAP',
    'PAYLOAD',
    'LAY',
    'CLAUDE',
    'CONFIG',
    'SKILLS',
    'LONG',
    'COLL',
    'RUBRIC'
  ])
  const codes = catalogue.families.flatMap((family) => family.items.map((item) => item.code))
  expect(codes).toEqual([
    'CAP-1',
    'CAP-2',
    'PAYLOAD-1',
    'LAY-1',
    'LAY-2',
    'LAY-3',
    'LAY-4',
    'LAY-5',
    'CLAUDE-1',
    'CLAUDE-2',
    'CLAUDE-3',
    'CLAUDE-4',
    'CLAUDE-5',
    'CONFIG-1',
    'CONFIG-2',
    'CONFIG-3',
    'CONFIG-4',
    'SKILLS-1',
    'SKILLS-2',
    'SKILLS-3',
    'LONG-1',
    'COLL-1',
    'RUBRIC-1'
  ])
  expect(new Set(codes).size).toBe(codes.length)
})

test('each family module exports one complete family', async () => {
  for (const file of familyModules) {
    const module = (await import(`./${file}`)) as Record<string, unknown>
    expect(Object.keys(module)).toHaveLength(1)
    const family = Object.values(module)[0] as { code?: unknown; items?: unknown }
    expect(typeof family.code).toBe('string')
    expect(Array.isArray(family.items)).toBe(true)
  }
})

test('the session discovers grouped skills once and coalesces marker requests', () => {
  const repository = fixture()
  const session = catalogue.createSession({ mode: 'conform', repository, userHome: tmpdir(), configuration: {} })
  const context = session.subjects[0]?.context() as HarnessRubricContext
  expect(session.subjects[0]?.context()).toBe(context)
  expect(context.skills.skills).toEqual([
    { path: 'skills/group/example', directory: 'example', declaredName: 'example' }
  ])
  const { family, item } = configItem()
  const config = family.selectContext(context) as HarnessConfigContext
  expect(item.mechanical?.audit.run(config)[0]?.status).toBe('VIOLATION')
  item.mechanical?.conform?.run(config)
  item.mechanical?.conform?.run(config)
  expect(session.proposal().writes).toEqual([
    {
      path: '.ki-config.toml',
      content: '[skills.ki-repo]\n\n[skills.ki-repo-harness]\n'
    }
  ])
})

test('audit is read-only and an existing marker produces no proposal', () => {
  const repository = fixture()
  writeFileSync(join(repository, '.ki-config.toml'), '[skills.ki-repo]\n\n[skills.ki-repo-harness]\n')
  const session = catalogue.createSession({ mode: 'audit', repository, userHome: tmpdir(), configuration: {} })
  const context = session.subjects[0]?.context() as HarnessRubricContext
  expect(context.config.hasHarnessTable).toBe(true)
  expect(context.config.requestHarnessMarker).toBeUndefined()
  expect(session.proposal().writes).toEqual([])
})

test('the Harness declaration requires a valid explicit prefix', () => {
  const repository = fixture()
  const { family, item } = configItem('CONFIG-4')
  for (const [prefix, status] of [
    ['', 'VIOLATION'],
    ['KI', 'VIOLATION'],
    ['ki', 'PASS']
  ] as const) {
    writeFileSync(
      join(repository, '.ki-config.toml'),
      `[skills.ki-repo]\n\n[skills.ki-repo-harness]\n${prefix ? `prefix = "${prefix}"\n` : ''}`
    )
    const session = catalogue.createSession({ mode: 'audit', repository, userHome: tmpdir(), configuration: {} })
    const context = session.subjects[0]?.context() as HarnessRubricContext
    expect(item.mechanical?.audit.run(family.selectContext(context))[0]?.status).toBe(status)
  }
})

test('published skill names use the declared Harness prefix', () => {
  const repository = fixture()
  writeFileSync(join(repository, '.ki-config.toml'), '[skills.ki-repo]\n\n[skills.ki-repo-harness]\nprefix = "ki"\n')
  const session = catalogue.createSession({ mode: 'audit', repository, userHome: tmpdir(), configuration: {} })
  const context = session.subjects[0]?.context() as HarnessRubricContext
  const family = catalogue.families.find((candidate) => candidate.code === 'SKILLS') as
    | RubricFamily<HarnessRubricContext, HarnessSkillsContext>
    | undefined
  const item = family?.items.find((candidate) => candidate.code === 'SKILLS-3')
  if (!family || !item) throw new Error('SKILLS-3 is missing')
  expect(item.mechanical?.audit.run(family.selectContext(context))).toEqual([
    expect.objectContaining({ status: 'VIOLATION', message: expect.stringContaining("must begin with 'ki-'") })
  ])
})

test('a missing catalogue produces an exact finding and one marker-bounded conform write', () => {
  const repository = fixture()
  const session = catalogue.createSession({ mode: 'conform', repository, userHome: tmpdir(), configuration: {} })
  const context = session.subjects[0]?.context() as HarnessRubricContext
  const { family, item } = capabilityPublicationItem()
  const capability = family.selectContext(context)
  expect(item.mechanical?.audit.run(capability)).toEqual([
    {
      status: 'VIOLATION',
      message: 'The generated capability catalogue is missing from skills/README.md.',
      subject: 'skills/README.md'
    }
  ])
  item.mechanical?.conform?.run(capability)
  const proposal = session.proposal().writes.find((write) => write.path === 'skills/README.md')
  expect(proposal?.content).toStartWith('# skills\n\n')
  expect(proposal?.content).toContain('<!-- ki-repo-harness:capability-catalogue:start -->')
  expect(proposal?.content).toContain('This source harness publishes 1 skill: 1 governance skill and 0 process skills.')
  expect(proposal?.content).toContain('<!-- ki-repo-harness:capability-catalogue:end -->')
})

test('source conformance does not inherit payload or runtime assurance', () => {
  const repository = fixture()
  const session = catalogue.createSession({ mode: 'audit', repository, userHome: tmpdir(), configuration: {} })
  const context = session.subjects[0]?.context() as HarnessRubricContext
  expect(context.provenance.payload).toEqual([
    expect.objectContaining({
      status: 'NOT_APPLICABLE',
      message: expect.stringContaining('verified installed payload')
    })
  ])
})

test('conform refuses a symlinked or dangling configuration path', () => {
  for (const dangling of [false, true]) {
    const repository = fixture()
    rmSync(join(repository, '.ki-config.toml'))
    const target = join(repository, dangling ? 'missing-config' : 'config-source')
    if (!dangling) writeFileSync(target, '[skills.ki-repo]\n')
    symlinkSync(target, join(repository, '.ki-config.toml'))
    const session = catalogue.createSession({ mode: 'conform', repository, userHome: tmpdir(), configuration: {} })
    const context = session.subjects[0]?.context() as HarnessRubricContext
    expect(context.config.state).toBe('unsafe')
    expect(context.config.requestHarnessMarker).toBeUndefined()
    expect(session.proposal().writes).toEqual([])
  }
})

test('layout inspection does not traverse a symlinked shelf', () => {
  const repository = fixture()
  const external = mkdtempSync(join(tmpdir(), 'ki-repo-harness-external-'))
  temporaryDirectories.push(external)
  writeFileSync(join(external, 'README.md'), '# External\n')
  rmSync(join(repository, 'hooks'), { recursive: true })
  symlinkSync(external, join(repository, 'hooks'))

  const session = catalogue.createSession({ mode: 'audit', repository, userHome: tmpdir(), configuration: {} })
  const context = session.subjects[0]?.context() as HarnessRubricContext
  expect(context.layout.parts.find((part) => part.name === 'hooks')).toEqual({
    name: 'hooks',
    state: 'unsafe',
    readmeState: 'missing'
  })
})
