import { afterEach, expect, test } from 'bun:test'
import { existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createAuthoringSession, PRETTIER_DEFAULT } from '../contexts/authoring.ts'
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
  expect(catalogue.families.map((family) => family.code)).toEqual(['MD', 'OWN', 'TOML', 'SYNC'])
  expect(catalogue.families.flatMap((family) => family.items.map((item) => item.code))).toEqual([
    'MD-mech',
    'MD-table',
    'MD-footnote',
    'MD-link',
    'MD-cell-prose',
    'MD-callout',
    'OWN-1',
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
  const subject = session.subjects[0]
  const context = subject?.context()
  const markdown = markdownModule.MARKDOWN.items[0]
  const owned = ownedModule.OWNED.items[0]

  expect(inspections).toBe(1)
  expect(subject?.context()).toBe(context)
  expect(markdown?.mechanical?.audit.run(context?.markdown as NonNullable<typeof context>['markdown'])[0]?.status).toBe('VIOLATION')
  expect(owned?.mechanical?.audit.run(context?.owned as NonNullable<typeof context>['owned']).map((outcome) => outcome.status)).toEqual([
    'VIOLATION',
    'VIOLATION',
    'VIOLATION'
  ])

  owned?.mechanical?.conform?.run(context?.owned as NonNullable<typeof context>['owned'])
  owned?.mechanical?.conform?.run(context?.owned as NonNullable<typeof context>['owned'])
  markdown?.mechanical?.conform?.run(context?.markdown as NonNullable<typeof context>['markdown'])

  expect(session.proposal()).toEqual({
    writes: [
      { path: '.prettierrc.json', content: PRETTIER_DEFAULT },
      { path: '.editorconfig', content: expect.any(String), create: true },
      { path: '.markdownlint-cli2.jsonc', content: expect.any(String), create: true }
    ],
    commands: [
      {
        program: 'bunx',
        arguments: [
          'prettier',
          '--write',
          '**/*.md',
          '!src/generated/**',
          '!.claude/commands/**',
          '!.claude/skills/**',
          '!.claude/agents/**',
          '!.agents/skills/**',
          '--ignore-path',
          '.gitignore'
        ]
      },
      { program: 'bunx', arguments: ['markdownlint-cli2', '--fix'] }
    ]
  })
  expect(readFileSync(join(repository, '.prettierrc.json'), 'utf8')).toBe('{}\n')
  expect(existsSync(join(repository, '.editorconfig'))).toBe(false)
  expect(existsSync(join(repository, '.markdownlint-cli2.jsonc'))).toBe(false)
})

test('owned-file conform refuses to propose a write through a symlink', () => {
  const repository = temporaryRepository()
  const outside = join(temporaryRepository(), 'outside')
  writeFileSync(outside, 'do not replace\n')
  symlinkSync(outside, join(repository, '.editorconfig'))
  const session = createAuthoringSession({ mode: 'conform', repository, userHome: tmpdir(), configuration: {} }, () => ({ clean: true }))
  const context = session.subjects[0]?.context()
  const owned = ownedModule.OWNED.items[0]

  expect(context?.owned.files.find((file) => file.name === '.editorconfig')?.state).toBe('unsafe')
  owned?.mechanical?.conform?.run(context?.owned as NonNullable<typeof context>['owned'])

  expect(session.proposal().writes.some((write) => write.path === '.editorconfig')).toBe(false)
  expect(readFileSync(outside, 'utf8')).toBe('do not replace\n')
})
