import { afterEach, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { RubricItem } from '../../shared/rubric.ts'
import { createSpecsSession } from '../contexts/specs.ts'
import { CONFORMANCE } from './conformance.ts'

const temporaryDirectories: string[] = []

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

const repositoryWith = (body: string): string => {
  const repository = mkdtempSync(join(tmpdir(), 'ki-specs-conformance-'))
  temporaryDirectories.push(repository)
  const directory = join(repository, 'docs', 'specs')
  mkdirSync(directory, { recursive: true })
  writeFileSync(join(repository, '.ki.toml'), '[skills.ki-specs]\n')
  writeFileSync(
    join(directory, 'index.md'),
    ['# Specifications', '', '| File | Prefix |', '| --- | --- |', '| feature.md | FEATURE |', ''].join('\n')
  )
  writeFileSync(
    join(directory, 'feature.md'),
    ['# Feature — FEATURE', '', '## User-observable behaviours', '', '### FEATURE-001 — Outcome', '', body, ''].join(
      '\n'
    )
  )
  return repository
}

const run = (repository: string, code: 'CONFORMANCE-1' | 'CONFORMANCE-2') => {
  const session = createSpecsSession({
    mode: 'audit',
    repository,
    userHome: tmpdir(),
    configuration: {}
  })
  const context = CONFORMANCE.selectContext(session.subjects[0]?.context() as never)
  const item = CONFORMANCE.items.find((candidate) => candidate.code === code) as RubricItem<typeof context> | undefined
  if (!item?.mechanical) throw new Error(`${code} is not mechanical`)
  return item.mechanical.audit.run(context)
}

test('accepted requirements may be pending without evidence', () => {
  const repository = repositoryWith(
    ['The feature MUST be available.', '', '_Conformance:_ pending', '', '_Verify:_ exercise the public feature.'].join(
      '\n'
    )
  )

  expect(run(repository, 'CONFORMANCE-1')[0]?.status).toBe('PASS')
  expect(run(repository, 'CONFORMANCE-2')[0]?.status).toBe('PASS')
})

test('invalid conformance states fail', () => {
  const repository = repositoryWith(
    [
      'The feature MUST be available.',
      '',
      '_Conformance:_ complete',
      '',
      '_Verify:_ exercise the public feature.'
    ].join('\n')
  )

  expect(run(repository, 'CONFORMANCE-1')[0]).toMatchObject({
    status: 'VIOLATION',
    message: expect.stringContaining('invalid')
  })
})

test('multiple conformance states fail', () => {
  const repository = repositoryWith(
    [
      'The feature MUST be available.',
      '',
      '_Conformance:_ conforming',
      '',
      '_Conformance:_ pending',
      '',
      '_Verify:_ exercise the public feature.',
      '',
      '_Evidence:_ `feature.test.ts` covers the public outcome.'
    ].join('\n')
  )

  expect(run(repository, 'CONFORMANCE-1')[0]).toMatchObject({
    status: 'VIOLATION',
    message: expect.stringContaining('invalid')
  })
})

test('a conforming requirement needs current evidence', () => {
  const repository = repositoryWith(
    [
      'The feature MUST be available.',
      '',
      '_Conformance:_ conforming',
      '',
      '_Verify:_ exercise the public feature.'
    ].join('\n')
  )

  expect(run(repository, 'CONFORMANCE-2')[0]).toMatchObject({
    status: 'VIOLATION',
    message: expect.stringContaining('no _Evidence:_')
  })
})

test('a conforming requirement with evidence passes', () => {
  const repository = repositoryWith(
    [
      'The feature MUST be available.',
      '',
      '_Conformance:_ conforming',
      '',
      '_Verify:_ exercise the public feature.',
      '',
      '_Evidence:_ `feature.test.ts` covers the public outcome.'
    ].join('\n')
  )

  expect(run(repository, 'CONFORMANCE-2')[0]?.status).toBe('PASS')
})
