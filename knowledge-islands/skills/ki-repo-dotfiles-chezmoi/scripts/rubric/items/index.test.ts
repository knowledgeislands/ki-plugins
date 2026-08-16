import { afterEach, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { RubricFamily } from '../../shared/rubric.ts'
import { type ChezmoiRubricContext, type ChezmoiShapeContext, createChezmoiSession } from '../contexts/chezmoi.ts'
import catalogue from './index.ts'

const temporaryDirectories: string[] = []
const familyModules = readdirSync(import.meta.dir)
  .filter((file) => file.endsWith('.ts') && file !== 'index.ts' && !file.endsWith('.test.ts'))
  .sort()

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

const fixture = (): string => {
  const repository = mkdtempSync(join(tmpdir(), 'ki-repo-dotfiles-chezmoi-'))
  temporaryDirectories.push(repository)
  mkdirSync(join(repository, '.chezmoidata'))
  mkdirSync(join(repository, 'bin'))
  writeFileSync(join(repository, '.ki-config.toml'), '[skills.ki-repo-dotfiles-chezmoi]\n')
  writeFileSync(join(repository, 'dot_zshrc.tmpl'), '{{ .chezmoi.os }}\n')
  writeFileSync(join(repository, 'bin', 'executable_setup'), '#!/bin/sh\n')
  return repository
}

const shapeFamily = (): RubricFamily<ChezmoiRubricContext, ChezmoiShapeContext> =>
  catalogue.families.find((family) => family.code === 'CHEZMOI') as RubricFamily<
    ChezmoiRubricContext,
    ChezmoiShapeContext
  >

test('the catalogue preserves every chezmoi criterion in family order', () => {
  expect(catalogue.contract).toBe(1)
  expect(catalogue.name).toBe('ki-repo-dotfiles-chezmoi')
  expect(catalogue.createSession).toBeFunction()
  expect(catalogue.families.map((family) => family.code)).toEqual([
    'CHEZMOI',
    'BIN',
    'GIT',
    'PATTERN',
    'CONFIG',
    'LAYER',
    'SHELL',
    'ETIQ',
    'SYNC',
    'RUBRIC'
  ])
  const codes = catalogue.families.flatMap((family) =>
    (family.items as readonly { code: string }[]).map((item) => item.code)
  )
  expect(codes).toEqual([
    'CHEZMOI-0',
    'CHEZMOI-1',
    'CHEZMOI-2',
    'CHEZMOI-J1',
    'BIN-1',
    'GIT-1',
    'PATTERN-J1',
    'PATTERN-J2',
    'CONFIG-J1',
    'LAYER-J1',
    'SHELL-J1',
    'ETIQ-J1',
    'SYNC-1',
    'RUBRIC-1'
  ])
  expect(new Set(codes).size).toBe(codes.length)
})

test('criteria declare complete v1 remediation and review metadata', () => {
  const items = catalogue.families.flatMap((family) => family.items as readonly unknown[]) as readonly {
    mechanical?: { remediation: unknown }
    judgment?: { scope: string; outcomes: readonly string[]; guidance: string }
  }[]
  const mechanical = items.filter((item) => item.mechanical)
  const judgment = items.filter((item) => item.judgment)

  expect(mechanical).toHaveLength(6)
  expect(mechanical.every((item) => item.mechanical?.remediation)).toBe(true)
  expect(judgment).toHaveLength(8)
  for (const item of judgment) {
    expect(item.judgment?.scope).not.toBeEmpty()
    expect(item.judgment?.outcomes.length).toBeGreaterThan(0)
    expect(item.judgment?.guidance).not.toBeEmpty()
  }
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

test('conform coalesces repeated explicit-create requests for a missing ignore file', () => {
  const repository = fixture()
  const session = createChezmoiSession({ mode: 'conform', repository, userHome: tmpdir(), configuration: {} })
  const root = session.subjects[0]?.context() as ChezmoiRubricContext
  expect(session.subjects[0]?.context()).toBe(root)
  expect(root.shape.hasTemplateFiles).toBe(true)
  expect(root.shape.hasTemplateSupport).toBe(true)
  expect(root.bin.entries).toEqual([{ name: 'executable_setup', physical: true }])

  const context = shapeFamily().selectContext(root)
  const item = shapeFamily().items.find((candidate) => candidate.code === 'CHEZMOI-1')
  expect(item?.mechanical?.audit.run(context)[0]?.status).toBe('VIOLATION')
  item?.mechanical?.conform?.run(context)
  item?.mechanical?.conform?.run(context)

  expect(session.proposal().writes).toEqual([
    {
      path: '.chezmoiignore',
      content:
        '# Files/directories chezmoi should never manage.\n# Add repository-specific ignore patterns deliberately.\n',
      create: true
    }
  ])
})

test('audit is read-only and an existing ignore file is never proposed for replacement', () => {
  const repository = fixture()
  writeFileSync(join(repository, '.chezmoiignore'), '# keep\n')
  const session = createChezmoiSession({ mode: 'audit', repository, userHome: tmpdir(), configuration: {} })
  const root = session.subjects[0]?.context() as ChezmoiRubricContext
  expect(root.shape.ignoreState).toBe('physical')
  expect(root.shape.requestIgnoreCreate).toBeUndefined()
  expect(session.proposal().writes).toEqual([])
})

test('detected chezmoi shape without the declaration is not applicable and proposes no write', () => {
  const repository = fixture()
  writeFileSync(join(repository, '.ki-config.toml'), '[skills.ki-repo]\n')
  const session = createChezmoiSession({ mode: 'conform', repository, userHome: tmpdir(), configuration: {} })
  const root = session.subjects[0]?.context() as ChezmoiRubricContext
  const declaration = shapeFamily().items.find((candidate) => candidate.code === 'CHEZMOI-0')

  expect(declaration?.mechanical?.audit.run(shapeFamily().selectContext(root))[0]?.status).toBe('NOT_APPLICABLE')
  expect(root.shape.requestIgnoreCreate).toBeUndefined()
  expect(session.proposal().writes).toEqual([])
})

test('conform refuses a symlinked or dangling ignore target', () => {
  for (const dangling of [false, true]) {
    const repository = fixture()
    const target = join(repository, dangling ? 'missing-ignore-source' : 'ignore-source')
    if (!dangling) writeFileSync(target, '# source\n')
    symlinkSync(target, join(repository, '.chezmoiignore'))
    const session = createChezmoiSession({ mode: 'conform', repository, userHome: tmpdir(), configuration: {} })
    const root = session.subjects[0]?.context() as ChezmoiRubricContext
    expect(root.shape.ignoreState).toBe('unsafe')
    expect(root.shape.requestIgnoreCreate).toBeUndefined()
    expect(session.proposal().writes).toEqual([])
  }
})
