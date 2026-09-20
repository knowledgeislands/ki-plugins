import { afterEach, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { RubricFamily } from '../../shared/rubric.ts'
import type {
  HarnessCapabilityPublicationContext,
  HarnessConfigContext,
  HarnessReviewContext,
  HarnessRootCapabilitySummaryContext,
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
  writeFileSync(join(repository, '.ki.toml'), '[skills.ki-repo]\n')
  mkdirSync(join(repository, 'skills', 'group', 'example'), { recursive: true })
  mkdirSync(join(repository, 'skills', 'group', 'ki-authoring'), { recursive: true })
  mkdirSync(join(repository, 'skills', 'group', 'ki-repo'), { recursive: true })
  writeFileSync(
    join(repository, 'skills', 'group', 'example', 'SKILL.md'),
    '---\nname: example\nki-kind: governance\nki-applicability: detected\nki-depends-on: []\ndescription: Use example for fixture work.\nargument-hint: help\n---\n\n# Example\n'
  )
  writeFileSync(
    join(repository, 'skills', 'group', 'ki-authoring', 'SKILL.md'),
    '---\nname: ki-authoring\nki-kind: governance\nki-applicability: baseline\nki-depends-on: []\ndescription: Use ki-authoring for fixture work.\nargument-hint: help\n---\n\n# KI authoring\n'
  )
  writeFileSync(
    join(repository, 'skills', 'group', 'ki-repo', 'SKILL.md'),
    '---\nname: ki-repo\nki-kind: governance\nki-applicability: baseline\nki-detects: [example]\nki-depends-on: []\ndescription: Use ki-repo for fixture work.\nargument-hint: help\n---\n\n# KI repo\n'
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

const rootCapabilitySummaryItem = () => {
  const family = catalogue.families.find((candidate) => candidate.code === 'CAP') as
    | RubricFamily<
        HarnessRubricContext,
        HarnessReviewContext & {
          publication: HarnessCapabilityPublicationContext
          rootSummary: HarnessRootCapabilitySummaryContext
        }
      >
    | undefined
  const item = family?.items.find((candidate) => candidate.code === 'CAP-3')
  if (!family || !item) throw new Error('CAP-3 is missing')
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
    'CAP-3',
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
    { path: 'skills/group/example', directory: 'example', declaredName: 'example' },
    { path: 'skills/group/ki-authoring', directory: 'ki-authoring', declaredName: 'ki-authoring' },
    { path: 'skills/group/ki-repo', directory: 'ki-repo', declaredName: 'ki-repo' }
  ])
  const { family, item } = configItem()
  const config = family.selectContext(context) as HarnessConfigContext
  expect(item.mechanical?.audit.run(config)[0]?.status).toBe('VIOLATION')
  item.mechanical?.conform?.run(config)
  item.mechanical?.conform?.run(config)
  expect(session.proposal().writes).toEqual([
    {
      path: '.ki.toml',
      content: '[skills.ki-repo]\n\n[skills.ki-repo-harness]\n'
    }
  ])
})

test('audit is read-only and an existing marker produces no proposal', () => {
  const repository = fixture()
  writeFileSync(join(repository, '.ki.toml'), '[skills.ki-repo]\n\n[skills.ki-repo-harness]\n')
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
      join(repository, '.ki.toml'),
      `[skills.ki-repo]\n\n[skills.ki-repo-harness]\n${prefix ? `prefix = "${prefix}"\n` : ''}`
    )
    const session = catalogue.createSession({ mode: 'audit', repository, userHome: tmpdir(), configuration: {} })
    const context = session.subjects[0]?.context() as HarnessRubricContext
    expect(item.mechanical?.audit.run(family.selectContext(context))[0]?.status).toBe(status)
  }
})

test('published skill names use the declared Harness prefix', () => {
  const repository = fixture()
  writeFileSync(join(repository, '.ki.toml'), '[skills.ki-repo]\n\n[skills.ki-repo-harness]\nprefix = "ki"\n')
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
  expect(proposal?.content).toContain(
    'This source harness publishes 3 skills: 3 governance skills and 0 process skills.'
  )
  expect(proposal?.content).toContain('<!-- ki-repo-harness:capability-catalogue:end -->')
})

test('an absent root capability summary is not applicable', () => {
  const repository = fixture()
  const session = catalogue.createSession({ mode: 'audit', repository, userHome: tmpdir(), configuration: {} })
  const context = session.subjects[0]?.context() as HarnessRubricContext
  const { family, item } = rootCapabilitySummaryItem()
  expect(item.mechanical?.audit.run(family.selectContext(context))).toEqual([
    {
      status: 'NOT_APPLICABLE',
      message: 'README.md does not publish an explicit numeric Agent Skills summary.',
      subject: 'README.md'
    }
  ])
})

test('one stale complete root capability summary produces one numeric-only conform write', () => {
  const repository = fixture()
  const original =
    '# Harness\n\n- **Skills** ([`skills/`](skills)) — 9 reusable [Agent Skills](https://agentskills.io/specification): 8 governance skills that hold standards and 7 process skills that drive workflows. Keep this prose.\n'
  writeFileSync(join(repository, 'README.md'), original)
  const session = catalogue.createSession({ mode: 'conform', repository, userHome: tmpdir(), configuration: {} })
  const context = session.subjects[0]?.context() as HarnessRubricContext
  const { family, item } = rootCapabilitySummaryItem()
  expect(item.mechanical?.audit.run(family.selectContext(context))).toEqual([
    {
      status: 'VIOLATION',
      message: 'README.md publishes 9/8/7 total/governance/process skills; canonical skill frontmatter requires 3/3/0.',
      subject: 'README.md'
    }
  ])
  item.mechanical?.conform?.run(family.selectContext(context))
  expect(session.proposal().writes.find((write) => write.path === 'README.md')?.content).toBe(
    original
      .replace('9 reusable', '3 reusable')
      .replace('8 governance', '3 governance')
      .replace('7 process', '0 process')
  )
})

test('matching, incomplete, ambiguous, and malformed root summaries do not produce writes', () => {
  const cases = [
    '3 reusable [Agent Skills](https://agentskills.io/specification): 3 governance skills that hold standards and 0 process skills that drive workflows.',
    '1 reusable [Agent Skills](https://agentskills.io/specification): see the catalogue.',
    '1 reusable [Agent Skills](https://agentskills.io/specification): 1 governance skills that hold standards and 0 process skills that drive workflows.\n\n1 reusable [Agent Skills](https://agentskills.io/specification): 1 governance skills that hold standards and 0 process skills that drive workflows.'
  ]
  for (const body of cases) {
    const repository = fixture()
    writeFileSync(join(repository, 'README.md'), `# Harness\n\n${body}\n`)
    const session = catalogue.createSession({ mode: 'conform', repository, userHome: tmpdir(), configuration: {} })
    const context = session.subjects[0]?.context() as HarnessRubricContext
    const { family, item } = rootCapabilitySummaryItem()
    item.mechanical?.conform?.run(family.selectContext(context))
    expect(session.proposal().writes.some((write) => write.path === 'README.md')).toBe(false)
  }

  const repository = fixture()
  writeFileSync(
    join(repository, 'README.md'),
    '# Harness\n\n1 reusable [Agent Skills](https://agentskills.io/specification): 1 governance skills that hold standards and 0 process skills that drive workflows.\n'
  )
  writeFileSync(join(repository, 'skills', 'group', 'example', 'SKILL.md'), 'not frontmatter\n')
  const session = catalogue.createSession({ mode: 'conform', repository, userHome: tmpdir(), configuration: {} })
  const context = session.subjects[0]?.context() as HarnessRubricContext
  const { family, item } = rootCapabilitySummaryItem()
  expect(item.mechanical?.audit.run(family.selectContext(context))).toEqual([
    {
      status: 'VIOLATION',
      message: 'skills/group/example/SKILL.md has no complete YAML frontmatter document',
      subject: 'README.md'
    }
  ])
  item.mechanical?.conform?.run(family.selectContext(context))
  expect(session.proposal().writes.some((write) => write.path === 'README.md')).toBe(false)
})

test('an unsafe root README is diagnostic', () => {
  const repository = fixture()
  const external = join(repository, 'external-readme')
  writeFileSync(external, '# External\n')
  symlinkSync(external, join(repository, 'README.md'))
  const session = catalogue.createSession({ mode: 'conform', repository, userHome: tmpdir(), configuration: {} })
  const context = session.subjects[0]?.context() as HarnessRubricContext
  const { family, item } = rootCapabilitySummaryItem()
  expect(item.mechanical?.audit.run(family.selectContext(context))).toEqual([
    {
      status: 'VIOLATION',
      message: 'README.md is not a physical regular file.',
      subject: 'README.md'
    }
  ])
  item.mechanical?.conform?.run(family.selectContext(context))
  expect(session.proposal().writes.some((write) => write.path === 'README.md')).toBe(false)
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
    rmSync(join(repository, '.ki.toml'))
    const target = join(repository, dangling ? 'missing-config' : 'config-source')
    if (!dangling) writeFileSync(target, '[skills.ki-repo]\n')
    symlinkSync(target, join(repository, '.ki.toml'))
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
