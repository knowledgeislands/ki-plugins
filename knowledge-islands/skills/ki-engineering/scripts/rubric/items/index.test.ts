import { afterEach, expect, test } from 'bun:test'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { RubricEmitter, RubricFamily } from '../../shared/rubric.ts'
import {
  collectPackageScriptSources,
  collectTrackedMjs,
  findRelativeNodeModulesScriptUses,
  gradeDependencyFreshness,
  inspectDependencyHolds,
  inspectEngineeringCheckRecords,
  inspectGovernedScriptSurface,
  nextVersionAfter
} from '../contexts/audit-evidence.ts'
import {
  createEngineeringSession,
  type EngineeringEvidenceInspector,
  type EngineeringRubricContext,
  type KnipRubricContext,
  type PackageRubricContext,
  type ScriptsRubricContext
} from '../contexts/engineering.ts'
import {
  COMMITLINT_CONFIGURATION,
  hasCommitMessageBaseline,
  hasPreCommitBaseline,
  normaliseCommitMessage,
  normalisePreCommit
} from '../contexts/git-hooks.ts'
import catalogue from './index.ts'

const temporaryDirectories: string[] = []
const engineeringClaim = [{ script: 'ki:deps:update', skill: 'example/harness:ki-engineering' }] as const
const familyModules = readdirSync(import.meta.dir)
  .filter((file) => file.endsWith('.ts') && file !== 'index.ts' && !file.endsWith('.test.ts'))
  .sort()

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

test('the structured catalogue preserves the engineering criteria', async () => {
  expect(catalogue.contract).toBe(1)
  expect(catalogue.name).toBe('ki-engineering')
  expect(catalogue.packageScripts).toEqual(['ki:deps:update'])
  expect(catalogue.createSession).toBeFunction()
  expect(catalogue.families.map((family) => family.code)).toEqual([
    'RUBRIC',
    'PKG',
    'MISE',
    'CI',
    'SCR',
    'BUN',
    'TSC',
    'BIO',
    'KNIP',
    'SYNC',
    'DEPS',
    'GEN',
    'DESIGN',
    'REVIEW',
    'TEST',
    'BUILD',
    'ENV',
    'TOML'
  ])
  const codes = catalogue.families
    .filter((family) => family.code !== 'RUBRIC')
    .flatMap((family) => family.items.map((item) => item.code))
  expect(codes).toHaveLength(56)
  expect(new Set(codes).size).toBe(codes.length)
  expect(codes[0]).toBe('PKG-1')
  expect(codes).toContain('TEST-7')
  expect(codes).toContain('DESIGN-1')
  expect(codes).toContain('DESIGN-2')
  expect(codes).toContain('REVIEW-1')
  expect(codes).toContain('SCR-10')
  expect(codes).toContain('SCR-11')
  expect(codes).toContain('BUN-2')
  expect(codes.at(-1)).toBe('TOML-3')

  const observableCoverage = catalogue.families
    .find((family) => family.code === 'TEST')
    ?.items.find((item) => item.code === 'TEST-7')
  expect(observableCoverage?.mechanical).toBeUndefined()
  expect(observableCoverage?.sources).toEqual(['standards-engineering.md#testing-capability-the-repo-ships-tests'])
  expect(observableCoverage?.judgment?.prompt).toContain('nearest supported public boundary')

  const changeAwareReview = catalogue.families
    .find((family) => family.code === 'REVIEW')
    ?.items.find((item) => item.code === 'REVIEW-1')
  expect(changeAwareReview?.judgment?.prompt).toContain('warrant a focused review')
  expect(changeAwareReview?.judgment?.outcomes).toEqual([
    'not warranted',
    'consistent',
    'follow-up:<canonical-work-item-id>'
  ])
})

test('BUN-2 finds tracked mjs files without reporting untracked files', async () => {
  const repository = mkdtempSync(join(tmpdir(), 'ki-engineering-'))
  temporaryDirectories.push(repository)
  execFileSync('git', ['init', '--quiet', repository])
  writeFileSync(join(repository, 'script.mjs'), 'export default {}\n')
  writeFileSync(join(repository, 'untracked.mjs'), 'export default {}\n')
  execFileSync('git', ['-C', repository, 'add', '--', 'script.mjs'])

  expect(await collectTrackedMjs(repository)).toEqual(['script.mjs'])
})

test('SCR-10 finds relative node_modules execution in root and safe workspace scripts only', () => {
  const repository = mkdtempSync(join(tmpdir(), 'ki-engineering-'))
  const outside = mkdtempSync(join(tmpdir(), 'ki-engineering-external-'))
  temporaryDirectories.push(repository, outside)
  mkdirSync(join(repository, 'apps/site'), { recursive: true })
  writeFileSync(
    join(repository, 'apps/site/package.json'),
    `${JSON.stringify({
      scripts: {
        build: 'node ./node_modules/typescript/bin/tsc',
        resolver: 'node --eval "createRequire(import.meta.url).resolve(\'typescript\')"'
      }
    })}\n`
  )
  writeFileSync(join(repository, 'eleventy.config.ts'), "const path = '../node_modules/tool/index.js'\n")
  writeFileSync(join(outside, 'package.json'), '{"scripts":{"build":"bun ../node_modules/hidden/bin.js"}}\n')
  symlinkSync(outside, join(repository, 'apps/escape'), 'dir')

  const sources = collectPackageScriptSources(
    repository,
    {
      scripts: {
        build: 'bun ../../node_modules/@11ty/eleventy/cmd.cjs',
        clean: 'rm -rf dist node_modules',
        packageBinary: 'bunx --bun @11ty/eleventy',
        malformed: 42
      }
    },
    ['apps/site', 'apps/escape', '../outside']
  )

  expect(sources.map((source) => source.packagePath)).toEqual(['.', 'apps/site'])
  expect(findRelativeNodeModulesScriptUses(sources)).toEqual([
    {
      packagePath: '.',
      manifestPath: 'package.json',
      scriptName: 'build',
      fragment: '../../node_modules/@11ty/eleventy/cmd.cjs'
    },
    {
      packagePath: 'apps/site',
      manifestPath: 'apps/site/package.json',
      scriptName: 'build',
      fragment: './node_modules/typescript/bin/tsc'
    }
  ])
})

test('engineering check records accept only known mechanical boolean entries', () => {
  expect(
    inspectEngineeringCheckRecords(
      '[skills.ki-engineering]\n\n[skills.ki-engineering.checks]\nBUILD-2 = false # temporary exception record\n'
    )
  ).toEqual([{ level: 'PASS', message: 'engineering check record BUILD-2 = false (diagnostic only)' }])
  expect(
    inspectEngineeringCheckRecords(
      '[skills.ki-engineering.checks]\nDESIGN-1 = false\nBUILD-2 = "false"\nUNKNOWN-1 = true\n'
    )
  ).toEqual([
    { level: 'WARN', message: 'unknown engineering check record: DESIGN-1' },
    {
      level: 'WARN',
      message: `engineering check record BUILD-2 must be boolean, got ${JSON.stringify('"false"')}`
    },
    { level: 'WARN', message: 'unknown engineering check record: UNKNOWN-1' }
  ])
})

test('exact external script exclusions satisfy the naming and claim boundaries', () => {
  const scripts = { 'ki:deps:update': 'bun update --latest', 'vendor:generate': 'vendor generate' }
  for (const configuration of [
    '[skills.ki-engineering]\nscript_exclusions = ["vendor:generate"]\n',
    '[skills."example/harness:ki-engineering"]\nscript_exclusions = ["vendor:generate"]\n'
  ]) {
    expect(inspectGovernedScriptSurface(configuration, scripts, engineeringClaim)).toEqual({
      namingOffenders: [],
      claimProblems: []
    })
  }
})

test('repository-owned self scripts and the closed bare lifecycle set need no exclusions', () => {
  const scripts = {
    build: 'build',
    prepare: 'husky',
    test: 'bun test',
    'test:coverage': 'bun test --coverage',
    'test:watch': 'bun test --watch',
    clean: 'rm -rf node_modules',
    'ki:deps:update': 'bun update --latest',
    'self:cf:build': 'build for cloudflare',
    'self:typecheck': 'tsc --noEmit'
  }

  expect(inspectGovernedScriptSurface('[skills.ki-engineering]\n', scripts, engineeringClaim)).toEqual({
    namingOffenders: [],
    claimProblems: []
  })
})

test('self ownership requires a non-empty suffix and cannot be redundantly excluded', () => {
  expect(
    inspectGovernedScriptSurface(
      '[skills.ki-engineering]\n',
      { 'ki:deps:update': 'bun update --latest', 'self:': 'invalid' },
      engineeringClaim
    )
  ).toEqual({
    namingOffenders: ['self:'],
    claimProblems: ['unsupported or unclaimed script key(s): self:']
  })

  expect(
    inspectGovernedScriptSurface(
      '[skills.ki-engineering]\nscript_exclusions = ["self:vendor:clone"]\n',
      { 'ki:deps:update': 'bun update --latest', 'self:vendor:clone': 'vendor clone' },
      engineeringClaim
    )
  ).toEqual({
    namingOffenders: [],
    claimProblems: ['script exclusion overlaps repository-owned self: namespace: self:vendor:clone']
  })
})

test('unclaimed ki scripts cannot use exclusions as a capability claim', () => {
  expect(
    inspectGovernedScriptSurface(
      '[skills.ki-engineering]\nscript_exclusions = ["ki:local:run"]\n',
      { 'ki:deps:update': 'bun update --latest', 'ki:local:run': 'run local task' },
      engineeringClaim
    )
  ).toEqual({
    namingOffenders: [],
    claimProblems: ['script exclusion overlaps capability-owned ki: namespace: ki:local:run']
  })
})

test('script exclusions reject invalid, stale, duplicate, patterned, and owned entries', () => {
  const scripts = {
    'ki:deps:update': 'bun update --latest',
    'ki:harness:eval': 'bun evals/harness.ts',
    'vendor:generate': 'vendor generate'
  }
  const configuration = `[skills.ki-engineering]
script_exclusions = ["", "vendor:*", "missing", "vendor:generate", "vendor:generate", "ki:harness:eval", 7]

[skills.ki-repo-harness]
`
  expect(
    inspectGovernedScriptSurface(configuration, scripts, [
      ...engineeringClaim,
      { script: 'ki:harness:eval', skill: 'example/harness:ki-repo-harness' }
    ])
  ).toEqual({
    namingOffenders: [],
    claimProblems: [
      'script_exclusions entries must be non-empty strings',
      'script exclusion "vendor:*" must be exact, not a pattern',
      'stale script exclusion names no existing script: missing',
      'duplicate script exclusion: vendor:generate',
      'script exclusion overlaps declared owner example/harness:ki-repo-harness: ki:harness:eval',
      'script_exclusions entries must be non-empty strings'
    ]
  })
})

test('script_exclusions must be an array and cannot hide an ordinary unexcluded script', () => {
  expect(
    inspectGovernedScriptSurface(
      '[skills.ki-engineering]\nscript_exclusions = "vendor:generate"\n',
      {
        'ki:deps:update': 'bun update --latest',
        'vendor:generate': 'vendor generate'
      },
      engineeringClaim
    )
  ).toEqual({
    namingOffenders: ['vendor:generate'],
    claimProblems: [
      'unsupported or unclaimed script key(s): vendor:generate',
      'script_exclusions must be an array of exact script names'
    ]
  })
})

test('package script claims authorize exact identities without prefix inference', () => {
  const scripts = {
    'ki:deps:update': 'bun update --latest',
    'ki:custom:run': 'bun run custom'
  }
  expect(
    inspectGovernedScriptSurface('[skills.ki-engineering]\n', scripts, [
      ...engineeringClaim,
      { script: 'ki:custom:run', skill: 'example/harness:ki-custom' }
    ])
  ).toEqual({ namingOffenders: [], claimProblems: [] })
  expect(inspectGovernedScriptSurface('[skills.ki-engineering]\n', scripts, engineeringClaim).claimProblems).toContain(
    'unsupported or unclaimed script key(s): ki:custom:run'
  )
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

test('the session keeps stable focused context and coalesces package drafts', async () => {
  const repository = mkdtempSync(join(tmpdir(), 'ki-engineering-'))
  temporaryDirectories.push(repository)
  writeFileSync(
    join(repository, 'package.json'),
    '{"name":"example","scripts":{"ki:all":"ki repo audit","ki:engineering:check":"ki repo audit --skill ki-engineering","ki:authoring:fix":"ki repo conform --skill ki-authoring","ki:harness:eval":"bun evals/harness.ts"}}\n'
  )
  const session = await createEngineeringSession(
    { mode: 'conform', repository, userHome: tmpdir(), configuration: {}, packageScriptClaims: [] },
    () => [
      { level: 'FAIL', code: 'PKG-1', message: 'type missing', subject: 'package.json' },
      { level: 'FAIL', code: 'PKG-2', message: 'package manager missing', subject: 'package.json' }
    ]
  )
  const root = session.subjects[1]?.context()
  expect(session.subjects[1]?.context()).toBe(root)

  const family = catalogue.families.find((candidate) => candidate.code === 'PKG') as RubricFamily<
    EngineeringRubricContext,
    PackageRubricContext
  >
  const context = family.selectContext(root as EngineeringRubricContext)
  expect(family.items[0]?.mechanical?.audit.run(context)[0]?.status).toBe('VIOLATION')
  family.items[0]?.mechanical?.conform?.run(context)
  family.items[1]?.mechanical?.conform?.run(context)

  const writes = session.proposal().writes
  expect(writes).toHaveLength(1)
  expect(writes[0]?.path).toBe('package.json')
  expect(writes[0]?.content).not.toContain('ki repo audit')
  expect(writes[0]?.content).not.toContain('ki repo conform')
  expect(JSON.parse(writes[0]?.content ?? '{}').scripts['ki:harness:eval']).toBe('bun evals/harness.ts')
  expect(JSON.parse(writes[0]?.content ?? '{}').type).toBe('module')
})

test('SCR-2 proposes removal for any whole-repository or focused native governance wrapper', async () => {
  const repository = mkdtempSync(join(tmpdir(), 'ki-engineering-'))
  temporaryDirectories.push(repository)
  writeFileSync(
    join(repository, 'package.json'),
    '{"scripts":{"ki:all":"ki repo audit","ki:engineering:check":"ki repo audit --skill ki-engineering","ki:authoring:fix":"ki repo conform --skill ki-authoring","ki:harness:eval":"bun evals/harness.ts"}}\n'
  )
  const session = await createEngineeringSession(
    { mode: 'conform', repository, userHome: tmpdir(), configuration: {}, packageScriptClaims: [] },
    () => [{ level: 'FAIL', code: 'SCR-2', message: 'native governance wrappers present', subject: 'package.json' }]
  )
  const root = session.subjects[1]?.context() as EngineeringRubricContext
  const family = catalogue.families.find((candidate) => candidate.code === 'SCR') as RubricFamily<
    EngineeringRubricContext,
    ScriptsRubricContext
  >
  family.items.find((candidate) => candidate.code === 'SCR-2')?.mechanical?.conform?.run(family.selectContext(root))

  const scripts = JSON.parse(session.proposal().writes[0]?.content ?? '{}').scripts
  expect(scripts).toEqual({
    'ki:deps:update': 'bun update --latest',
    'ki:harness:eval': 'bun evals/harness.ts',
    clean: 'rm -rf dist node_modules',
    prepare: 'husky'
  })
})

test('the common hook contract detects missing and ordered baselines', () => {
  expect(hasPreCommitBaseline('')).toBe(false)
  expect(hasPreCommitBaseline('bunx syncpack format --check || exit 1\nbunx lint-staged || exit 1\n')).toBe(false)
  expect(hasPreCommitBaseline(normalisePreCommit(''))).toBe(true)
  expect(hasCommitMessageBaseline('')).toBe(false)
  expect(hasCommitMessageBaseline(normaliseCommitMessage(''))).toBe(true)
})

test('SCR-11 conform repairs common prefixes while preserving repository checks', async () => {
  const repository = mkdtempSync(join(tmpdir(), 'ki-engineering-'))
  temporaryDirectories.push(repository)
  mkdirSync(join(repository, '.husky'), { recursive: true })
  writeFileSync(join(repository, 'package.json'), '{}\n')
  writeFileSync(
    join(repository, '.husky/pre-commit'),
    'bunx syncpack format --check\nbunx lint-staged\nif test -f custom; then custom-check; fi\n'
  )
  writeFileSync(join(repository, '.husky/commit-msg'), 'bunx commitlint --edit "$1"\ncustom-message-check "$1"\n')
  writeFileSync(join(repository, 'commitlint.config.ts'), 'export default {}\n')

  const session = await createEngineeringSession(
    { mode: 'conform', repository, userHome: tmpdir(), configuration: {}, packageScriptClaims: [] },
    () => [{ level: 'FAIL', code: 'SCR-11', message: 'hook drift' }]
  )
  const root = session.subjects[1]?.context() as EngineeringRubricContext
  const family = catalogue.families.find((candidate) => candidate.code === 'SCR') as RubricFamily<
    EngineeringRubricContext,
    ScriptsRubricContext
  >
  family.items.find((candidate) => candidate.code === 'SCR-11')?.mechanical?.conform?.run(family.selectContext(root))

  const writes = new Map(session.proposal().writes.map((write) => [write.path, write.content]))
  expect(writes.get('.husky/pre-commit')).toBe(`${normalisePreCommit('if test -f custom; then custom-check; fi\n')}`)
  expect(writes.get('.husky/commit-msg')).toBe(`${normaliseCommitMessage('custom-message-check "$1"\n')}`)
  expect(writes.get('commitlint.config.ts')).toBe(COMMITLINT_CONFIGURATION)
})

test('SCR-11 conform leaves unsafe hook paths untouched', async () => {
  const repository = mkdtempSync(join(tmpdir(), 'ki-engineering-'))
  temporaryDirectories.push(repository)
  mkdirSync(join(repository, '.husky'), { recursive: true })
  writeFileSync(join(repository, 'package.json'), '{}\n')
  const hookTarget = join(repository, 'foreign-pre-commit')
  writeFileSync(hookTarget, 'foreign-hook\n')
  symlinkSync(hookTarget, join(repository, '.husky/pre-commit'))

  const session = await createEngineeringSession(
    { mode: 'conform', repository, userHome: tmpdir(), configuration: {}, packageScriptClaims: [] },
    () => [{ level: 'FAIL', code: 'SCR-11', message: 'unsafe hook path' }]
  )
  const root = session.subjects[1]?.context() as EngineeringRubricContext
  const family = catalogue.families.find((candidate) => candidate.code === 'SCR') as RubricFamily<
    EngineeringRubricContext,
    ScriptsRubricContext
  >
  family.items.find((candidate) => candidate.code === 'SCR-11')?.mechanical?.conform?.run(family.selectContext(root))

  expect(session.proposal().writes.some((write) => write.path === '.husky/pre-commit')).toBe(false)
  expect(readFileSync(hookTarget, 'utf8')).toBe('foreign-hook\n')
})

test('guarded remedies do not expose unsafe command conform actions', async () => {
  const repository = mkdtempSync(join(tmpdir(), 'ki-engineering-'))
  temporaryDirectories.push(repository)
  writeFileSync(join(repository, 'package.json'), '{}\n')
  const session = await createEngineeringSession(
    { mode: 'conform', repository, userHome: tmpdir(), configuration: {}, packageScriptClaims: [] },
    () => [
      { level: 'FAIL', code: 'BIO-1', message: 'formatting drift' },
      { level: 'FAIL', code: 'KNIP-2', message: 'unused export' },
      { level: 'WARN', code: 'DEPS-1', message: 'dependency update available' }
    ]
  )
  for (const [familyCode, itemCode] of [
    ['BIO', 'BIO-1'],
    ['KNIP', 'KNIP-2'],
    ['DEPS', 'DEPS-1']
  ] as const) {
    const family = catalogue.families.find((candidate) => candidate.code === familyCode)
    expect(family?.items.find((item) => item.code === itemCode)?.mechanical?.conform).toBeUndefined()
  }
  expect(session.proposal().commands).toBeUndefined()
})

test('conform never replaces a symlinked contributed package file', async () => {
  const repository = mkdtempSync(join(tmpdir(), 'ki-engineering-'))
  temporaryDirectories.push(repository)
  const source = join(repository, 'package-source.json')
  writeFileSync(source, '{}\n')
  symlinkSync(source, join(repository, 'package.json'))
  const session = await createEngineeringSession(
    { mode: 'conform', repository, userHome: tmpdir(), configuration: {}, packageScriptClaims: [] },
    () => [{ level: 'FAIL', code: 'PKG-1', message: 'type missing' }]
  )
  const root = session.subjects[1]?.context() as EngineeringRubricContext
  root.package.synchronise?.()
  expect(session.proposal().writes).toEqual([])
  expect(readFileSync(source, 'utf8')).toBe('{}\n')
})

test('knip export coverage is audited without offering a repair', async () => {
  const repository = mkdtempSync(join(tmpdir(), 'ki-engineering-'))
  temporaryDirectories.push(repository)
  writeFileSync(join(repository, 'package.json'), '{}\n')
  const session = await createEngineeringSession(
    { mode: 'conform', repository, userHome: tmpdir(), configuration: {}, packageScriptClaims: [] },
    () => [{ level: 'FAIL', code: 'KNIP-3', message: 'export "./cli" is unreachable', subject: 'knip.json' }]
  )
  const root = session.subjects[1]?.context() as EngineeringRubricContext
  const family = catalogue.families.find((candidate) => candidate.code === 'KNIP') as RubricFamily<
    EngineeringRubricContext,
    KnipRubricContext
  >
  const item = family.items.find((candidate) => candidate.code === 'KNIP-3')

  // Choosing which entry glob to add is a judgment call, so KNIP-3 never proposes a
  // conform action — and in particular never reaches for the `knip --fix` repair that
  // would delete the very exports this criterion protects.
  expect(item?.mechanical?.conform).toBeUndefined()
  expect(item?.mechanical?.audit.run(family.selectContext(root))).toEqual([
    { status: 'VIOLATION', message: 'export "./cli" is unreachable', subject: 'knip.json' }
  ])
  expect(session.proposal().commands).toBeUndefined()
})

// Emission is observational: a rubric that reported differently when watched would make
// progress part of the contract under audit, and a finding that turned on whether a display
// was attached could not be defended. The inspector is recorded rather than asserted on
// directly, because the emitter must also reach the evidence gathering, not just the session.
test('a recording emitter changes no outcome and still observes the evidence stage', async () => {
  const repository = mkdtempSync(join(tmpdir(), 'ki-engineering-'))
  temporaryDirectories.push(repository)
  writeFileSync(join(repository, 'package.json'), '{"name":"example"}\n')

  const events: unknown[] = []
  const seen: (RubricEmitter | undefined)[] = []
  const recording: EngineeringEvidenceInspector = (_target, emit) => {
    seen.push(emit)
    return [
      { level: 'FAIL', code: 'PKG-1', message: 'type missing', subject: 'package.json' },
      { level: 'WARN', code: 'DEPS-1', message: 'dependency update available' }
    ]
  }

  const options = { mode: 'audit', repository, userHome: tmpdir(), configuration: {}, packageScriptClaims: [] } as const
  const silent = await createEngineeringSession(options, recording)
  const watched = await createEngineeringSession({ ...options, emit: (event) => void events.push(event) }, recording)

  const outcomes = (session: Awaited<ReturnType<typeof createEngineeringSession>>) =>
    catalogue.families
      .filter((family) => family.code !== 'RUBRIC')
      .flatMap((candidate) => {
        // The catalogue's families are heterogeneous in their focused context, so the sweep
        // reads them through the erased contract rather than the union of their thirteen shapes.
        const family = candidate as RubricFamily<EngineeringRubricContext, unknown>
        const root = session.subjects[1]?.context() as EngineeringRubricContext
        return family.items.map((item) => item.mechanical?.audit.run(family.selectContext(root)))
      })
  expect(outcomes(watched)).toEqual(outcomes(silent))
  expect(watched.proposal()).toEqual(silent.proposal())

  expect(seen[0]).toBeUndefined()
  expect(seen[1]).toBeInstanceOf(Function)
  expect(events).toEqual([
    { kind: 'stage', edge: 'start', label: 'engineering evidence' },
    { kind: 'stage', edge: 'end', label: 'engineering evidence' }
  ])
})

// ── DEPS-1: leading-edge dependency freshness ─────────────────────────────────

test('dependency holds parse "<name> — <reason>" entries and flag malformed, duplicate, and stale holds', () => {
  const configuration = [
    '[skills.ki-engineering]',
    'dependency_holds = [',
    '  "typescript — vendored packages still target TS 5",',
    '  "typescript — repeated",',
    '  "react",',
    '  "left-pad — no update is actually available"',
    ']'
  ].join('\n')
  const inspected = inspectDependencyHolds(configuration, ['typescript', 'react'])
  expect(inspected.holds).toEqual(
    new Map([
      ['typescript', 'vendored packages still target TS 5'],
      ['left-pad', 'no update is actually available']
    ])
  )
  expect(inspected.messages).toEqual([
    'duplicate dependency hold: typescript',
    'dependency hold "react" must record a reason as "<name> — <reason>"',
    'stale dependency hold names a package with no available update: left-pad'
  ])
})

test('dependency holds are absent when the table declares none', () => {
  expect(inspectDependencyHolds('[skills.ki-engineering]\n', ['typescript'])).toEqual({
    holds: new Map(),
    messages: []
  })
  expect(inspectDependencyHolds('[skills.ki-engineering]\ndependency_holds = "typescript"\n', []).messages).toEqual([
    'dependency_holds must be an array of "<name> — <reason>" strings'
  ])
})

test('the adoption clock is set by the next unadopted release, never the latest', () => {
  expect(nextVersionAfter('5.9.3', ['5.9.3', '7.0.2', '6.0.0', '7.0.0-beta.1'])).toBe('6.0.0')
  expect(nextVersionAfter('7.0.2', ['5.9.3', '7.0.2'])).toBeUndefined()
  expect(nextVersionAfter('not-a-version', ['1.0.0'])).toBeUndefined()
})

test('freshness grades FAIL beyond the 14-day window, INFO within it, held and unknown as recorded', () => {
  const now = new Date('2026-09-03T00:00:00Z')
  const graded = gradeDependencyFreshness(
    [
      { name: 'stale-lib', current: '1.0.0' },
      { name: 'fresh-lib', current: '1.0.0' },
      { name: 'typescript', current: '5.9.3' },
      { name: 'unknown-lib', current: '1.0.0' }
    ],
    new Map([
      [
        'stale-lib',
        new Map([
          ['1.1.0', '2026-08-01T00:00:00Z'],
          ['1.2.0', '2026-09-02T00:00:00Z']
        ])
      ],
      ['fresh-lib', new Map([['1.1.0', '2026-08-25T00:00:00Z']])]
    ]),
    new Map([['typescript', 'vendored packages still target TS 5']]),
    now
  )
  expect(graded).toEqual([
    { state: 'stale', name: 'stale-lib', current: '1.0.0', next: '1.1.0', ageDays: 33 },
    { state: 'fresh', name: 'fresh-lib', current: '1.0.0', next: '1.1.0', ageDays: 9 },
    { state: 'held', name: 'typescript', current: '5.9.3', reason: 'vendored packages still target TS 5' },
    { state: 'unknown', name: 'unknown-lib', current: '1.0.0' }
  ])
})
