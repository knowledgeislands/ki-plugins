import { afterEach, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { inspectRoadmap, issueLedger, rootRoadmap } from './roadmap-evidence.ts'

const directories: string[] = []
afterEach(() => {
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

const findingsFor = (taskLinks: string): string[] => {
  const repository = mkdtempSync(join(tmpdir(), 'ki-task-links-'))
  directories.push(repository)
  mkdirSync(join(repository, 'docs', 'roadmap'), { recursive: true })
  writeFileSync(
    join(repository, '.ki.toml'),
    '[skills.ki-repo]\nrepo_code = "TEST"\n\n[skills.ki-work-roadmap]\nthemes = ["foundation-tooling"]\n'
  )
  writeFileSync(join(repository, 'ROADMAP.md'), rootRoadmap())
  writeFileSync(join(repository, 'docs', 'roadmap', '_ISSUES.md'), issueLedger(1))
  writeFileSync(
    join(repository, 'docs', 'roadmap', 'TEST-001-build-foundation.md'),
    `---
id: TEST-001
title: Build foundation
theme: foundation-tooling
horizon: next
status: draft
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-13T12:00:00Z
updated_at: 2026-09-13T12:00:00Z
${taskLinks}
---

## Goal

Build the foundation.
`
  )
  return inspectRoadmap(repository)
    .filter((finding) => finding.area === 'ITEM-1' && finding.msg.includes('task_links'))
    .map((finding) => finding.msg)
}

const reference = `task_links:
  paperclip:
    - authority: http://127.0.0.1:3100
      scope: 558dd49e-7615-409f-b7b2-7f19e22171d9
      id: b76a4ec9-be48-4a3c-8568-7885b5e6789b
      key: KIS-5
      url: http://127.0.0.1:3100/KIS/issues/KIS-5
      relation: implementation`

test('accepts a provider-neutral map with multiple tasks and providers', () => {
  const expanded = `${reference}
    - authority: http://127.0.0.1:3100
      scope: 558dd49e-7615-409f-b7b2-7f19e22171d9
      id: another-id
      key: KIS-6
      url: http://127.0.0.1:3100/KIS/issues/KIS-6
      relation: review
  linear:
    - authority: https://linear.app
      scope: team-a
      id: issue-1
      key: TEAM-1
      url: https://linear.app/team/issue/TEAM-1
      relation: related`
  expect(findingsFor(expanded)).toEqual([])
})

test('rejects an inline YAML provider map and an annotated task_links header', () => {
  const inline =
    'task_links: {paperclip: [{authority: "http://127.0.0.1:3100", scope: company, id: task, key: KIS-5, url: "http://127.0.0.1:3100/KIS/issues/KIS-5", relation: implementation}]}'
  expect(findingsFor(inline)).toContain('task_links must be a nested provider map')
  expect(findingsFor(reference.replace('task_links:', 'task_links: # delivery tasks'))).toContain(
    'task_links must be a nested provider map'
  )
})

test('accepts blank lines within and after the task map', () => {
  const spaced = reference.replace('  paperclip:\n', '  paperclip:\n\n').replace('      scope:', '\n      scope:')
  expect(findingsFor(`${spaced}\n`)).toEqual([])
})

test('accepts YAML comments without stripping URL fragments or quoted hashes', () => {
  const commented = reference
    .replace('  paperclip:', '  # provider identity\n  paperclip: # local instance')
    .replace('      scope:', '      # stable company\n      scope:')
    .replace(
      '      id: b76a4ec9-be48-4a3c-8568-7885b5e6789b',
      '      id: b76a4ec9-be48-4a3c-8568-7885b5e6789b # stable task'
    )
    .replace('      key: KIS-5', '      key: "KIS-5 # current"')
    .replace(
      '      url: http://127.0.0.1:3100/KIS/issues/KIS-5',
      '      url: http://127.0.0.1:3100/KIS/issues/KIS-5#document-plan'
    )
  expect(findingsFor(commented)).toEqual([])
})

test('rejects malformed provider, empty field, unknown relation, and duplicate task relation', () => {
  expect(findingsFor(reference.replace('paperclip:', 'Paperclip:'))).toContain(
    "task_links provider 'Paperclip' must be lowercase kebab-case"
  )
  expect(findingsFor(reference.replace('key: KIS-5', 'key: '))).toContain(
    'task_links reference fields must be non-empty strings'
  )
  expect(findingsFor(reference.replace('relation: implementation', 'relation: active'))).toContain(
    "task_links relation 'active' is invalid"
  )
  expect(findingsFor(`${reference}\n${reference.slice(reference.indexOf('    - authority:'))}`)).toContain(
    'task_links repeats a task identity and relation'
  )
})

test('rejects empty maps, missing and extra reference fields, and duplicate YAML keys', () => {
  expect(findingsFor('task_links:')).toContain('task_links must be a non-empty provider map')
  expect(findingsFor(reference.replace('      url: http://127.0.0.1:3100/KIS/issues/KIS-5\n', ''))).toContain(
    'task_links reference must have exactly six required fields'
  )
  expect(findingsFor(`${reference}\n      note: extra`)).toContain(
    'task_links reference must have exactly six required fields'
  )
  expect(
    findingsFor(`${reference}\n      id: duplicate`).some((message) => message.includes('Map keys must be unique'))
  ).toBe(true)
})

test('normalizes YAML escapes before checking duplicate task identity', () => {
  const duplicates = `${reference}\n${reference
    .slice(reference.indexOf('    - authority:'))
    .replace('id: b76a4ec9-be48-4a3c-8568-7885b5e6789b', 'id: "b76a4ec9-be48-4a3c-8568-7885b5e6789\\u0062"')}`
  expect(findingsFor(duplicates)).toContain('task_links repeats a task identity and relation')
})
