import { afterEach, expect, test } from 'bun:test'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createAuthoringSession, EDITORCONFIG_DEFAULT, RUMDL_DEFAULT } from '../contexts/authoring.ts'
import catalogue, * as indexModule from './index.ts'
import * as markdownModule from './markdown.ts'
import * as ownedModule from './owned.ts'
import * as synchronisationModule from './sync.ts'
import * as tomlModule from './toml.ts'

const temporaryDirectories: string[] = []

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

const temporaryRepository = (): string => {
  const repository = mkdtempSync(join(tmpdir(), 'ki-authoring-'))
  temporaryDirectories.push(repository)
  return repository
}

test('the default export is the sole catalogue entrypoint and families are complete modules', () => {
  expect(Object.keys(indexModule)).toEqual(['default'])
  expect(Object.keys(markdownModule)).toEqual(['MARKDOWN'])
  expect(Object.keys(ownedModule)).toEqual(['OWNED'])
  expect(Object.keys(tomlModule)).toEqual(['TOML'])
  expect(Object.keys(synchronisationModule)).toEqual(['SYNCHRONISATION'])
  expect(catalogue.families.map((family) => family.code)).toEqual(['RUBRIC', 'MD', 'OWN', 'TOML', 'SYNC'])
  expect(
    catalogue.families
      .filter((family) => family.code !== 'RUBRIC')
      .flatMap((family) => family.items.map((item) => item.code))
  ).toEqual([
    'MD-mech',
    'MD-frontmatter',
    'MD-table',
    'MD-footnote',
    'MD-link',
    'MD-cell-prose',
    'MD-callout',
    'OWN-1',
    'OWN-2',
    'TOML-keys',
    'TOML-values',
    'TOML-tables',
    'TOML-comments',
    'SYNC-1'
  ])
})

test('conform retains drafts, coalesces writes, and leaves publication to the host', () => {
  const repository = temporaryRepository()
  writeFileSync(join(repository, '.prettierrc.json'), '{}\n')
  let inspections = 0
  const session = createAuthoringSession({ mode: 'conform', repository, userHome: tmpdir(), configuration: {} }, () => {
    inspections += 1
    return { clean: false, detail: 'formatter drift' }
  })
  const subject = session.subjects[1]
  const context = subject?.context()
  const markdown = markdownModule.MARKDOWN.items[0]
  const owned = ownedModule.OWNED.items[0]
  const retired = ownedModule.OWNED.items[1]

  expect(inspections).toBe(1)
  expect(subject?.context()).toBe(context)
  expect(markdown?.mechanical?.audit.run(context?.markdown as NonNullable<typeof context>['markdown'])[0]?.status).toBe(
    'VIOLATION'
  )
  expect(
    owned?.mechanical?.audit
      .run(context?.owned as NonNullable<typeof context>['owned'])
      .map((outcome) => outcome.status)
  ).toEqual(['VIOLATION', 'VIOLATION'])
  expect(
    retired?.mechanical?.audit
      .run(context?.owned as NonNullable<typeof context>['owned'])
      .map((outcome) => outcome.status)
  ).toEqual(['VIOLATION', 'PASS', 'PASS'])

  owned?.mechanical?.conform?.run(context?.owned as NonNullable<typeof context>['owned'])
  owned?.mechanical?.conform?.run(context?.owned as NonNullable<typeof context>['owned'])
  retired?.mechanical?.conform?.run(context?.owned as NonNullable<typeof context>['owned'])
  retired?.mechanical?.conform?.run(context?.owned as NonNullable<typeof context>['owned'])
  markdown?.mechanical?.conform?.run(context?.markdown as NonNullable<typeof context>['markdown'])

  expect(session.proposal()).toEqual({
    writes: [
      { path: '.editorconfig', content: EDITORCONFIG_DEFAULT, create: true },
      { path: '.rumdl.toml', content: RUMDL_DEFAULT, create: true }
    ],
    commands: [
      { program: 'rm', arguments: ['-f', '--', '.prettierrc.json'] },
      { program: 'bunx', arguments: ['rumdl', 'check', '--fix', '.'] }
    ]
  })
  expect(readFileSync(join(repository, '.prettierrc.json'), 'utf8')).toBe('{}\n')
  expect(existsSync(join(repository, '.editorconfig'))).toBe(false)
  expect(existsSync(join(repository, '.rumdl.toml'))).toBe(false)
})

test('trade records are normalized like any other authored Markdown', () => {
  const repository = temporaryRepository()
  const inbound = join(repository, '+', '_TRADES', 'peer', 'repo')
  const outbound = join(repository, '-', '_TRADES', 'peer', 'repo')
  mkdirSync(inbound, { recursive: true })
  mkdirSync(outbound, { recursive: true })
  writeFileSync(join(inbound, 'TRD-00000001.md'), '---\nid: "TRD-00000001"\n---\n\n# Submitted\n')
  writeFileSync(join(outbound, 'TRD-00000002.md'), '---\nid: "TRD-00000002"\n---\n\n# Preparation\n')
  writeFileSync(join(repository, '+', '_TRADES', 'README.md'), '---\nid: "trade-readme"\n---\n\n# Trade README\n')

  const session = createAuthoringSession(
    { mode: 'conform', repository, userHome: tmpdir(), configuration: {} },
    () => ({ clean: true })
  )
  const context = session.subjects[1]?.context()

  // ki-trades AUTH-1 compares a record's meaning against the sender's copy, so formatting
  // one is safe and no longer needs an exclusion that never covered Biome anyway.
  expect(context?.markdown.frontmatter.files.map((file) => file.path)).toEqual([
    '+/_TRADES/README.md',
    '+/_TRADES/peer/repo/TRD-00000001.md',
    '-/_TRADES/peer/repo/TRD-00000002.md'
  ])
})

test('frontmatter conform removes only safely unnecessary scalar quotes', () => {
  const repository = temporaryRepository()
  writeFileSync(
    join(repository, 'guide.md'),
    '---\nid: \'DOTFILES-UE-001\'\nname: "agent"\nenabled: "true"\nrelease: "2026-08-05"\ntitle: "A value: with punctuation"\n---\n\n# Guide\n'
  )
  const session = createAuthoringSession(
    { mode: 'conform', repository, userHome: tmpdir(), configuration: {} },
    () => ({ clean: true })
  )
  const context = session.subjects[1]?.context()
  const frontmatter = markdownModule.MARKDOWN.items.find((item) => item.code === 'MD-frontmatter')

  expect(frontmatter?.mechanical?.audit.run(context?.markdown as NonNullable<typeof context>['markdown'])).toEqual([
    {
      status: 'VIOLATION',
      message: 'frontmatter has 2 unnecessarily quoted bare-safe scalars',
      subject: 'guide.md'
    }
  ])

  frontmatter?.mechanical?.conform?.run(context?.markdown as NonNullable<typeof context>['markdown'])

  expect(session.proposal().writes).toEqual([
    {
      path: 'guide.md',
      content:
        '---\nid: DOTFILES-UE-001\nname: agent\nenabled: "true"\nrelease: "2026-08-05"\ntitle: "A value: with punctuation"\n---\n\n# Guide\n'
    }
  ])
})

test('a declared owned-file exception remains a warning and suppresses only its drifted-file write', () => {
  const repository = temporaryRepository()
  writeFileSync(join(repository, '.editorconfig'), EDITORCONFIG_DEFAULT)
  writeFileSync(join(repository, '.rumdl.toml'), '# evidence-preserving variation\n')
  const session = createAuthoringSession(
    {
      mode: 'conform',
      repository,
      userHome: tmpdir(),
      configuration: {
        owned_file_exceptions: {
          '.rumdl.toml': 'Preserves verbatim correspondence whose list markers are source evidence.'
        }
      }
    },
    () => ({ clean: true })
  )
  const context = session.subjects[1]?.context()
  const owned = ownedModule.OWNED.items[0]

  expect(owned?.mechanical?.audit.run(context?.owned as NonNullable<typeof context>['owned'])).toContainEqual({
    status: 'VIOLATION',
    message:
      '.rumdl.toml has a declared exception because Preserves verbatim correspondence whose list markers are source evidence. — it remains non-canonical; return it to the house template when the constraint ends',
    subject: '.rumdl.toml'
  })

  owned?.mechanical?.conform?.run(context?.owned as NonNullable<typeof context>['owned'])
  expect(session.proposal().writes).toEqual([])
})

test('owned-file exceptions do not suppress missing or unsafe paths', () => {
  const missingRepository = temporaryRepository()
  writeFileSync(join(missingRepository, '.editorconfig'), EDITORCONFIG_DEFAULT)
  const missing = createAuthoringSession(
    {
      mode: 'conform',
      repository: missingRepository,
      userHome: tmpdir(),
      configuration: { owned_file_exceptions: { '.rumdl.toml': 'Evidence preservation.' } }
    },
    () => ({ clean: true })
  )
  const missingContext = missing.subjects[1]?.context()
  ownedModule.OWNED.items[0]?.mechanical?.conform?.run(
    missingContext?.owned as NonNullable<typeof missingContext>['owned']
  )
  expect(missing.proposal().writes).toEqual([{ path: '.rumdl.toml', content: RUMDL_DEFAULT, create: true }])

  const unsafeRepository = temporaryRepository()
  const outside = join(temporaryRepository(), 'outside')
  writeFileSync(join(unsafeRepository, '.editorconfig'), EDITORCONFIG_DEFAULT)
  writeFileSync(outside, 'do not replace\n')
  symlinkSync(outside, join(unsafeRepository, '.rumdl.toml'))
  const unsafe = createAuthoringSession(
    {
      mode: 'conform',
      repository: unsafeRepository,
      userHome: tmpdir(),
      configuration: { owned_file_exceptions: { '.rumdl.toml': 'Evidence preservation.' } }
    },
    () => ({ clean: true })
  )
  const unsafeContext = unsafe.subjects[1]?.context()
  ownedModule.OWNED.items[0]?.mechanical?.conform?.run(
    unsafeContext?.owned as NonNullable<typeof unsafeContext>['owned']
  )
  expect(unsafe.proposal().writes).toEqual([])
  expect(readFileSync(outside, 'utf8')).toBe('do not replace\n')
})

test('owned-file exception declarations reject unknown, blank, and stale entries', () => {
  const repository = temporaryRepository()
  writeFileSync(join(repository, '.editorconfig'), EDITORCONFIG_DEFAULT)
  writeFileSync(join(repository, '.rumdl.toml'), RUMDL_DEFAULT)
  const session = createAuthoringSession(
    {
      mode: 'audit',
      repository,
      userHome: tmpdir(),
      configuration: {
        owned_file_exceptions: {
          '.rumdl.toml': 'No longer needed.',
          '.unknown': 'Not owned.',
          '.editorconfig': ''
        }
      }
    },
    () => ({ clean: true })
  )
  const context = session.subjects[1]?.context()
  const outcomes = ownedModule.OWNED.items[0]?.mechanical?.audit.run(
    context?.owned as NonNullable<typeof context>['owned']
  )

  expect(outcomes).toContainEqual({
    status: 'VIOLATION',
    message:
      '.rumdl.toml matches the house template but retains a declared exception — remove it because No longer needed.',
    subject: '.rumdl.toml'
  })
  expect(outcomes).toContainEqual({
    status: 'VIOLATION',
    message: 'owned_file_exceptions[".unknown"] is not a currently owned file',
    subject: 'owned_file_exceptions'
  })
  expect(outcomes).toContainEqual({
    status: 'VIOLATION',
    message: 'owned_file_exceptions[".editorconfig"] must have a non-empty reason',
    subject: 'owned_file_exceptions'
  })
})

test('owned-file conform refuses to propose a write through a symlink', () => {
  const repository = temporaryRepository()
  const outside = join(temporaryRepository(), 'outside')
  writeFileSync(outside, 'do not replace\n')
  symlinkSync(outside, join(repository, '.editorconfig'))
  const session = createAuthoringSession(
    { mode: 'conform', repository, userHome: tmpdir(), configuration: {} },
    () => ({ clean: true })
  )
  const context = session.subjects[1]?.context()
  const owned = ownedModule.OWNED.items[0]

  expect(context?.owned.files.find((file) => file.name === '.editorconfig')?.state).toBe('unsafe')
  owned?.mechanical?.conform?.run(context?.owned as NonNullable<typeof context>['owned'])

  expect(session.proposal().writes.some((write) => write.path === '.editorconfig')).toBe(false)
  expect(readFileSync(outside, 'utf8')).toBe('do not replace\n')
})
