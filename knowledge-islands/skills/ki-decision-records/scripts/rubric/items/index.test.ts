import { afterEach, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { DecisionRecordsRubricContext } from '../contexts/decision-records.ts'
import catalogue from './index.ts'

const temporaryDirectories: string[] = []
const families = catalogue.families.filter((family) => family.code !== 'RUBRIC') as unknown as readonly RubricFamily<
  DecisionRecordsRubricContext,
  unknown
>[]
const items = families.flatMap((family) => family.items) as readonly RubricItem<unknown>[]
const familyModules = readdirSync(import.meta.dir)
  .filter((file) => file.endsWith('.ts') && file !== 'index.ts' && !file.endsWith('.test.ts'))
  .sort()

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

test('the structured catalogue preserves every decision-record criterion', () => {
  expect(catalogue.contract).toBe(1)
  expect(catalogue.name).toBe('ki-decision-records')
  expect(catalogue.createSession).toBeFunction()
  expect(catalogue.families.map((family) => family.code)).toEqual([
    'RUBRIC',
    'FILENAME',
    'ROOT',
    'FM',
    'TYPE-FIT',
    'BODY',
    'INDEX'
  ])
  expect(items.map((item) => item.code)).toEqual([
    'FILENAME-0',
    'FILENAME-1',
    'FILENAME-2',
    'FILENAME-3',
    'ROOT-1',
    'FM-0',
    'FM-3',
    'FM-4',
    'FM-5',
    'FM-6',
    'TYPE-FIT-1',
    'BODY-1',
    'BODY-3',
    'BODY-4',
    'BODY-5',
    'BODY-6',
    'BODY-7',
    'BODY-8',
    'BODY-9',
    'BODY-10',
    'INDEX-1',
    'INDEX-2',
    'INDEX-3',
    'INDEX-4',
    'INDEX-6',
    'INDEX-7',
    'INDEX-8'
  ])
  expect(items.filter((item) => item.judgment)).toHaveLength(9)
  expect(items.filter((item) => item.mechanical).every((item) => Boolean(item.mechanical?.remediation))).toBe(true)
  expect(
    items.filter((item) => item.mechanical?.conform).every((item) => item.mechanical?.remediation.class === 'automatic')
  ).toBe(true)
  expect(
    items
      .filter((item) => item.judgment)
      .every(
        (item) =>
          Boolean(item.judgment?.scope.trim()) &&
          Boolean(item.judgment?.prompt.trim()) &&
          item.judgment?.outcomes.length &&
          Boolean(item.judgment?.guidance.trim())
      )
  ).toBe(true)
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

test('the session keeps one index draft and proposes all missing entries once', () => {
  const repository = mkdtempSync(join(tmpdir(), 'ki-decision-records-session-'))
  temporaryDirectories.push(repository)
  const directory = join(repository, 'docs', 'decisions')
  mkdirSync(directory, { recursive: true })
  writeFileSync(join(repository, '.ki-config.toml'), '[skills.ki-decision-records]\n')
  writeFileSync(join(directory, 'README.md'), '# Decisions\n')

  for (const [serial, title] of [
    ['001', 'First decision'],
    ['002', 'Second decision']
  ]) {
    const id = `ADR-EXAMPLE-${serial}`
    const slug = title.toLowerCase().replaceAll(' ', '-')
    writeFileSync(
      join(directory, `${id}-${slug}.md`),
      `---
id: ${id}
title: '${title}'
date: 2026-07-27
status: current
decision_type_url: https://knowledgeislands.info/specifications/decision-records/adr
decision_type: architecture
---

# ${id}: ${title}

## Context

The collection needs a record.

## Decision

The repository records the decision.

## Consequences

The decision is available.
`
    )
  }

  const session = catalogue.createSession({ mode: 'conform', repository, userHome: tmpdir(), configuration: {} })
  const subject = session.subjects[1]
  const rootContext = subject?.context()
  const family = families.find((candidate) => candidate.code === 'INDEX')
  const indexContext = family?.selectContext(rootContext as NonNullable<typeof rootContext>)
  const indexItem = family?.items.find((candidate) => candidate.code === 'INDEX-2')

  expect(subject?.context()).toBe(rootContext)
  expect(indexItem?.mechanical?.audit.run(indexContext as NonNullable<typeof indexContext>)[0]?.status).toBe(
    'VIOLATION'
  )

  indexItem?.mechanical?.conform?.run(indexContext as NonNullable<typeof indexContext>)

  expect(session.proposal().writes).toEqual([
    {
      path: 'docs/decisions/README.md',
      content: expect.stringContaining(
        '1. [ADR-EXAMPLE-001](ADR-EXAMPLE-001-first-decision.md) — First decision\n' +
          '2. [ADR-EXAMPLE-002](ADR-EXAMPLE-002-second-decision.md) — Second decision'
      )
    }
  ])
})

test('repository-root Markdown is not treated as decision records', () => {
  const repository = mkdtempSync(join(tmpdir(), 'ki-decision-records-no-directory-'))
  temporaryDirectories.push(repository)
  writeFileSync(join(repository, '.ki-config.toml'), '[skills.ki-decision-records]\n')
  writeFileSync(join(repository, 'README.md'), '# Repository\n')
  writeFileSync(join(repository, 'CHANGELOG.md'), '# Changelog\n')

  const session = catalogue.createSession({ mode: 'audit', repository, userHome: tmpdir(), configuration: {} })
  const rootContext = session.subjects[1]?.context()
  const family = families.find((candidate) => candidate.code === 'FILENAME')
  const filenameContext = family?.selectContext(rootContext as NonNullable<typeof rootContext>)
  const filenameItem = family?.items.find((candidate) => candidate.code === 'FILENAME-0')

  expect(filenameItem?.mechanical?.audit.run(filenameContext as NonNullable<typeof filenameContext>)).toEqual([
    expect.objectContaining({ status: 'PASS' })
  ])
})
