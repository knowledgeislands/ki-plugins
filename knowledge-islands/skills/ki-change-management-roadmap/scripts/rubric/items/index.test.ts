import { afterEach, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { RoadmapRubricContext } from '../contexts/roadmap.ts'
import { ISSUE_LEDGER, inspectRoadmap, issueLedger, rootRoadmap } from '../contexts/roadmap-evidence.ts'
import catalogue from './index.ts'

const temporaryDirectories: string[] = []
const families = catalogue.families.filter((family) => family.code !== 'RUBRIC') as unknown as readonly RubricFamily<
  RoadmapRubricContext,
  unknown
>[]
const items = families.flatMap((family) => family.items) as readonly RubricItem<unknown>[]

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

const createFixture = (): string => {
  const repository = mkdtempSync(join(tmpdir(), 'ki-change-management-roadmap-flat-'))
  temporaryDirectories.push(repository)
  mkdirSync(join(repository, 'docs', 'roadmap'), { recursive: true })
  writeFileSync(
    join(repository, '.ki-config.toml'),
    '[skills.ki-repo]\nrepo_code = "TEST"\n\n[skills.ki-change-management-roadmap]\nthemes = ["foundation-tooling"]\n'
  )
  writeFileSync(
    join(repository, 'docs', 'roadmap', 'TEST-001-build-the-foundation.md'),
    `---
id: TEST-001
title: Build the foundation
theme: foundation-tooling
horizon: next
status: draft
blocks: []
blocked-by: []
baseline-ref: null
---

## Goal

Give users a working foundation.

## Context

The foundation needs implementation.

## Boundary

Do not broaden the work beyond the first slice.

## Current state

The first slice is not implemented.

## Steps

- [ ] Implement the first slice.

## Files touched

- \`src/foundation.ts\`

## Verify

- \`bun test\`

## Dependencies / blocks

No dependencies.

## Discussion

### Open questions

No open questions are recorded.
`
  )
  writeFileSync(join(repository, 'docs', 'roadmap', ISSUE_LEDGER), issueLedger(1))
  writeFileSync(join(repository, 'ROADMAP.md'), rootRoadmap())
  return repository
}

test('the structured catalogue represents the flat work-item standard', () => {
  expect(catalogue.contract).toBe(1)
  expect(catalogue.name).toBe('ki-change-management-roadmap')
  expect(catalogue.createSession).toBeFunction()
  expect(catalogue.families.map((family) => family.code)).toEqual([
    'RUBRIC',
    'SCOPE',
    'ROAD',
    'ITEM',
    'INDEX',
    'EXEC',
    'SAFE',
    'TRADE'
  ])
  expect(items.map((item) => item.code)).toEqual([
    'SCOPE-1',
    'ROAD-1',
    'ROAD-2',
    'ROAD-3',
    'ROAD-4',
    'ROAD-5',
    'ROAD-6',
    'ROAD-7',
    'ITEM-1',
    'ITEM-2',
    'ITEM-3',
    'ITEM-4',
    'ITEM-5',
    'ROOT-1',
    'EXEC-1',
    'EXEC-2',
    'EXEC-3',
    'SAFE-1',
    'TRADE-1',
    'TRADE-2'
  ])
})

test('every criterion declares its v1 remediation or review evidence', () => {
  for (const family of catalogue.families) {
    for (const item of family.items) {
      if (item.mechanical) {
        expect(item.mechanical.remediation).toBeDefined()
        if (item.mechanical.conform) expect(item.mechanical.remediation.class).toBe('automatic')
        if (item.mechanical.remediation.class === 'guarded') expect(item.judgment).toBeDefined()
      }
      if (item.judgment) {
        expect(item.judgment.scope).not.toBe('')
        expect(item.judgment.prompt).not.toBe('')
        expect(item.judgment.outcomes.length).toBeGreaterThan(0)
        expect(item.judgment.guidance).not.toBe('')
      }
    }
  }
})

test('a flat work item and concise root orientation conform', () => {
  const repository = createFixture()
  expect(inspectRoadmap(repository).filter((finding) => finding.level === 'FAIL')).toEqual([])
  expect(readFileSync(join(repository, 'ROADMAP.md'), 'utf8')).toContain('canonical structured Markdown work items')
  expect(readFileSync(join(repository, 'ROADMAP.md'), 'utf8')).not.toContain('TEST-001')
})

test('invalid lifecycle placement and missing execution sections fail', () => {
  const repository = createFixture()
  const item = join(repository, 'docs', 'roadmap', 'TEST-001-build-the-foundation.md')
  writeFileSync(
    item,
    readFileSync(item, 'utf8')
      .replace('horizon: next\nstatus: draft', 'horizon: future\nstatus: in-progress\ncandidate: true')
      .replace('## Current state', '## Baseline')
  )
  const failures = inspectRoadmap(repository).filter((finding) => finding.level === 'FAIL')
  expect(failures).toContainEqual(
    expect.objectContaining({ area: 'ITEM-2', msg: 'non-draft item must be in now or next' })
  )
  expect(failures).toContainEqual(expect.objectContaining({ area: 'ITEM-3' }))
})

test('every item ends with Discussion', () => {
  const repository = createFixture()
  const item = join(repository, 'docs', 'roadmap', 'TEST-001-build-the-foundation.md')
  writeFileSync(item, readFileSync(item, 'utf8').replace('\n## Discussion\n', '\n## Discussion moved\n'))
  expect(inspectRoadmap(repository)).toContainEqual(
    expect.objectContaining({ area: 'ITEM-3', msg: '## Discussion must be the final top-level section' })
  )
})

test('Soon work carries shaping detail', () => {
  const repository = createFixture()
  const item = join(repository, 'docs', 'roadmap', 'TEST-001-build-the-foundation.md')
  writeFileSync(
    item,
    readFileSync(item, 'utf8')
      .replace('horizon: next', 'horizon: soon')
      .replace(
        '\n## Current state\n\nThe first slice is not implemented.\n\n## Steps\n\n- [ ] Implement the first slice.\n\n## Files touched\n\n- `src/foundation.ts`\n\n## Verify\n\n- `bun test`\n\n## Dependencies / blocks\n\nNo dependencies.\n',
        ''
      )
  )
  expect(inspectRoadmap(repository)).toContainEqual(
    expect.objectContaining({
      area: 'ITEM-3',
      msg: 'body must contain Goal → Context → Boundary → Shaping → Discussion in order'
    })
  )
})

test('a Goal is mandatory and non-empty', () => {
  const repository = createFixture()
  const item = join(repository, 'docs', 'roadmap', 'TEST-001-build-the-foundation.md')
  writeFileSync(item, readFileSync(item, 'utf8').replace('Give users a working foundation.', ''))
  expect(inspectRoadmap(repository)).toContainEqual(
    expect.objectContaining({ area: 'ITEM-3', msg: '## Goal must be non-empty' })
  )
})

test('a title has at most four words', () => {
  const repository = createFixture()
  const item = join(repository, 'docs', 'roadmap', 'TEST-001-build-the-foundation.md')
  writeFileSync(
    item,
    readFileSync(item, 'utf8').replace('title: Build the foundation', 'title: Build a foundation for every user')
  )
  expect(inspectRoadmap(repository)).toContainEqual(
    expect.objectContaining({ area: 'ITEM-1', msg: 'title must contain at most 4 words' })
  )
})

test('execution Steps use lifecycle-appropriate task lists', () => {
  const repository = createFixture()
  const item = join(repository, 'docs', 'roadmap', 'TEST-001-build-the-foundation.md')
  writeFileSync(
    item,
    readFileSync(item, 'utf8').replace('- [ ] Implement the first slice.', '1. [ ] Implement the first slice.')
  )
  expect(inspectRoadmap(repository)).toContainEqual(
    expect.objectContaining({
      area: 'ITEM-3',
      msg: '## Steps must contain only task-list entries using - [ ] or - [x]'
    })
  )
})

test('awaiting-review Steps are all checked', () => {
  const repository = createFixture()
  const item = join(repository, 'docs', 'roadmap', 'TEST-001-build-the-foundation.md')
  writeFileSync(
    item,
    readFileSync(item, 'utf8')
      .replace('status: draft', 'status: awaiting-review')
      .replace('baseline-ref: null', 'baseline-ref: 0123456789abcdef0123456789abcdef01234567')
      .replace('- [ ] Implement the first slice.', '- [x] Implement the first slice.')
      .replace(
        '## Discussion',
        '## Review\n\n### Delivered\n\nThe first slice is delivered.\n\n### Summary of changes\n\nOne change.\n\n### Verification\n\n`bun test` passes.\n\n### Outstanding concerns\n\nNone.\n\n### Post-change review\n\nReady for the user review.\n\n### Mini recap\n\nNo learning route proposed.\n\n## Discussion'
      )
  )
  expect(inspectRoadmap(repository).filter((finding) => finding.area === 'ITEM-3')).toEqual([])
  writeFileSync(
    item,
    readFileSync(item, 'utf8').replace('- [x] Implement the first slice.', '- [ ] Implement the first slice.')
  )
  expect(inspectRoadmap(repository)).toContainEqual(
    expect.objectContaining({ area: 'ITEM-3', msg: 'awaiting-review and done items must mark every Step as - [x]' })
  )
})

test('conform repairs only a stale root orientation', () => {
  const repository = createFixture()
  writeFileSync(join(repository, 'ROADMAP.md'), '# stale\n')
  const session = catalogue.createSession({ mode: 'conform', repository, userHome: '/tmp', configuration: {} })
  const context = session.subjects[1]?.context() as RoadmapRubricContext
  const family = catalogue.families.find((candidate) => candidate.code === 'INDEX')
  const item = family?.items[0] as unknown as RubricItem<typeof context.index> | undefined
  item?.mechanical?.conform?.run(context.index)
  expect(session.proposal().writes).toEqual([{ path: 'ROADMAP.md', content: rootRoadmap() }])
})

test('conform scaffolds a missing issue ledger from the highest retained issue', () => {
  const repository = createFixture()
  unlinkSync(join(repository, 'docs', 'roadmap', ISSUE_LEDGER))
  const session = catalogue.createSession({ mode: 'conform', repository, userHome: '/tmp', configuration: {} })
  const context = session.subjects[1]?.context() as RoadmapRubricContext
  const family = catalogue.families.find((candidate) => candidate.code === 'ROAD')
  const item = family?.items.find((candidate) => candidate.code === 'ROAD-7') as
    | RubricItem<typeof context.roadmaps>
    | undefined
  item?.mechanical?.conform?.run(context.roadmaps)
  expect(session.proposal().writes).toEqual([{ path: `docs/roadmap/${ISSUE_LEDGER}`, content: issueLedger(1) }])
})

test('the issue ledger prevents a retained issue from exceeding the allocated range', () => {
  const repository = createFixture()
  writeFileSync(join(repository, 'docs', 'roadmap', ISSUE_LEDGER), issueLedger(0))
  expect(inspectRoadmap(repository)).toContainEqual(
    expect.objectContaining({ area: 'ROAD-7', msg: 'issue ledger last_id 0 is below retained issue 1' })
  )
})

test('conform never overwrites a malformed issue ledger', () => {
  const repository = createFixture()
  writeFileSync(join(repository, 'docs', 'roadmap', ISSUE_LEDGER), '# stale ledger\n')
  const session = catalogue.createSession({ mode: 'conform', repository, userHome: '/tmp', configuration: {} })
  expect(session.proposal().writes).toEqual([])
})

test('dependency links must be reciprocal', () => {
  const repository = createFixture()
  const item = join(repository, 'docs', 'roadmap', 'TEST-001-build-the-foundation.md')
  writeFileSync(item, readFileSync(item, 'utf8').replace('blocks: []', 'blocks: [TEST-002]'))
  expect(inspectRoadmap(repository)).toContainEqual(
    expect.objectContaining({ area: 'ITEM-4', msg: "dependency 'TEST-002' does not exist" })
  )
})

test('item themes must be declared by the repository roadmap configuration', () => {
  const repository = createFixture()
  const item = join(repository, 'docs', 'roadmap', 'TEST-001-build-the-foundation.md')
  writeFileSync(item, readFileSync(item, 'utf8').replace('theme: foundation-tooling', 'theme: other-theme'))
  expect(inspectRoadmap(repository)).toContainEqual(
    expect.objectContaining({
      area: 'ITEM-2',
      msg: 'item theme must be declared by ki-change-management-roadmap configuration'
    })
  )
})

test('trade waits use a flat canonical identity array only at Waiting for', () => {
  const repository = createFixture()
  const item = join(repository, 'docs', 'roadmap', 'TEST-001-build-the-foundation.md')
  writeFileSync(
    item,
    readFileSync(item, 'utf8')
      .replace('horizon: next', 'horizon: waiting-for')
      .replace('blocked-by: []', 'blocked-by: []\nwaiting-on-trades: [TRD-1234abcd]')
      .replace(
        '\n## Current state\n\nThe first slice is not implemented.\n\n## Steps\n\n- [ ] Implement the first slice.\n\n## Files touched\n\n- `src/foundation.ts`\n\n## Verify\n\n- `bun test`\n\n## Dependencies / blocks\n\nNo dependencies.\n',
        '\n'
      )
  )
  expect(inspectRoadmap(repository).filter((finding) => finding.area === 'TRADE-2')).toEqual([])

  writeFileSync(item, readFileSync(item, 'utf8').replace('horizon: waiting-for', 'horizon: soon'))
  expect(inspectRoadmap(repository)).toContainEqual(
    expect.objectContaining({ area: 'TRADE-2', msg: 'waiting-on-trades is valid only at the waiting-for horizon' })
  )

  writeFileSync(
    item,
    readFileSync(item, 'utf8')
      .replace('horizon: soon', 'horizon: waiting-for')
      .replace('waiting-on-trades: [TRD-1234abcd]', 'waiting-on-trades: [TRD-INVALID, TRD-INVALID]')
  )
  expect(inspectRoadmap(repository)).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        area: 'TRADE-2',
        msg: 'waiting-on-trades must contain only canonical trade identities'
      }),
      expect.objectContaining({ area: 'TRADE-2', msg: 'waiting-on-trades must not repeat a trade identity' })
    ])
  )
})
