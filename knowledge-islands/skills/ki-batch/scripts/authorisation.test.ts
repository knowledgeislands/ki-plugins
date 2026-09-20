import { expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { approvedPayloadSha256, parseBatchAuthorisation, resolveBatchAuthorisation } from './internal/authorisation.ts'

const repository = 'https://github.com/knowledgeislands/ki-agentic-harness'
const now = new Date('2026-08-09T12:00:00Z')

const record = (overrides: readonly string[] = [], ledger = '', body = '# KI-HARNESS-BATCH-001'): string => {
  const unsigned = `---\nid: KI-HARNESS-BATCH-001\nrepository: ${repository}\napproved: true\napproved_at: 2026-08-09T11:00:00Z\nauthority_mode: reviewed-items\napproved_payload_sha256: <payload>\nexpires_at: 2026-08-09T13:00:00Z\nitem_ids: [KI-HARNESS-FND-013]\ncompletion_target: awaiting-review\npolicy: safe-local-v1\n${overrides.join('\n')}\n---\n\n${body}\n`
  const hash = approvedPayloadSha256(unsigned.replace('<payload>', '0'.repeat(64)))
  return `${unsigned.replace('<payload>', hash as string)}${ledger}`
}

const fixture = (contents = record()): { root: string; path: string } => {
  const root = mkdtempSync(join(tmpdir(), 'ki-batch-authorisation-'))
  const directory = join(root, '+', '_BATCHES')
  mkdirSync(directory, { recursive: true })
  const path = join(directory, 'KI-HARNESS-BATCH-001.md')
  writeFileSync(path, contents)
  return { root, path }
}

test('rejects the retired storage path even when a valid batch exists there', () => {
  const { root } = fixture()
  const directory = join(root, '+', '_AUTHORISATIONS')
  mkdirSync(directory)
  const path = join(directory, 'KI-HARNESS-BATCH-001.md')
  writeFileSync(path, record())
  expect(
    resolveBatchAuthorisation({ repositoryRoot: root, authorisationPath: path, repositoryIdentity: repository, now })
  ).toMatchObject({ kind: 'stop', reason: 'batch authorisation is not a canonical local record', writes: false })
})

const resolveFixture = (contents?: string) => {
  const { root, path } = fixture(contents)
  return resolveBatchAuthorisation({
    repositoryRoot: root,
    authorisationPath: path,
    repositoryIdentity: repository,
    now
  })
}

test('resolves one approved, local, active canonical batch authorisation without writes', () => {
  expect(resolveFixture()).toEqual({
    kind: 'resolved',
    authorisation: {
      id: 'KI-HARNESS-BATCH-001',
      repository,
      approved: true,
      approvedAt: '2026-08-09T11:00:00Z',
      authorityMode: 'reviewed-items',
      authorityEvidence: null,
      approvedPayloadSha256: expect.stringMatching(/^[0-9a-f]{64}$/),
      runId: 'KI-HARNESS-BATCH-001-RUN-001',
      runBinding: null,
      expiresAt: '2026-08-09T13:00:00Z',
      itemIds: ['KI-HARNESS-FND-013'],
      completionTarget: 'awaiting-review',
      policy: 'safe-local-v1'
    },
    writes: false
  })
})

test('binds a later append-only run ledger to the exact approved payload', () => {
  const approved = record()
  const hash = approvedPayloadSha256(approved) as string
  const resolved = resolveFixture(
    `${approved}\n## Run ledger\n\n<!-- ki-batch-run: KI-HARNESS-BATCH-001-RUN-001 ${hash} -->\n\n| Item | Result |\n| --- | --- |\n`
  )
  expect(resolved).toMatchObject({
    kind: 'resolved',
    authorisation: { runBinding: { id: 'KI-HARNESS-BATCH-001-RUN-001', approvedPayloadSha256: hash } },
    writes: false
  })
})

test('retains compatibility with a ledger appended without the Markdown separator', () => {
  const approved = record()
  const hash = approvedPayloadSha256(approved) as string
  expect(
    resolveFixture(`${approved}## Run ledger\n\n<!-- ki-batch-run: KI-HARNESS-BATCH-001-RUN-001 ${hash} -->\n`)
  ).toMatchObject({ kind: 'resolved' })
})

test('stops without writes for absent, malformed, foreign, expired, or unapproved authority', () => {
  const { root } = fixture()
  expect(
    resolveBatchAuthorisation({
      repositoryRoot: root,
      authorisationPath: join(root, 'missing.md'),
      repositoryIdentity: repository,
      now
    })
  ).toMatchObject({ kind: 'stop', reason: 'batch authorisation is not a canonical local record', writes: false })
  expect(resolveFixture('not frontmatter\n')).toMatchObject({
    kind: 'stop',
    reason: 'batch authorisation has invalid frontmatter',
    writes: false
  })
  expect(resolveFixture(record().replace(repository, 'https://github.com/example/foreign'))).toMatchObject({
    kind: 'stop',
    reason: 'batch authorisation payload no longer matches its approval',
    writes: false
  })
  expect(
    resolveFixture(record().replace('expires_at: 2026-08-09T13:00:00Z', 'expires_at: 2026-08-09T11:00:00Z'))
  ).toMatchObject({ kind: 'stop', reason: 'batch authorisation payload no longer matches its approval', writes: false })
  expect(
    resolveFixture(
      record()
        .replace('approved: true', 'approved: false')
        .replace('approved_at: 2026-08-09T11:00:00Z', 'approved_at: null')
    )
  ).toMatchObject({ kind: 'stop', reason: 'batch authorisation payload no longer matches its approval', writes: false })
})

test('stops without writes for a non-canonical file, altered payload, duplicate items, or mismatched run record', () => {
  const { root } = fixture()
  expect(
    resolveBatchAuthorisation({
      repositoryRoot: root,
      authorisationPath: join(root, 'outside.md'),
      repositoryIdentity: repository,
      now
    })
  ).toMatchObject({ kind: 'stop', reason: 'batch authorisation is not a canonical local record', writes: false })
  expect(resolveFixture(record().replace('# KI-HARNESS-BATCH-001', '# KI-HARNESS-BATCH-001 — Widened'))).toMatchObject({
    kind: 'stop',
    reason: 'batch authorisation body must contain only its matching identity heading before the run ledger',
    writes: false
  })
  expect(resolveFixture(record(['item_ids: [KI-HARNESS-FND-013, KI-HARNESS-FND-013]']))).toMatchObject({
    kind: 'stop',
    reason: 'batch authorisation repeats an item identifier',
    writes: false
  })
  expect(
    resolveFixture(record([], '## Run ledger\n\n<!-- ki-batch-run: KI-HARNESS-BATCH-001-RUN-001 bad -->\n'))
  ).toMatchObject({
    kind: 'stop',
    reason: 'batch run ledger lacks an approval binding',
    writes: false
  })
})

test('derives exact consolidated acceptance from the completion target', () => {
  const outcome = record([
    'authority_mode: outcome',
    'authority_evidence: User explicitly authorised autonomous roadmap delivery in the current session.',
    'completion_target: done'
  ])

  expect(resolveFixture(outcome)).toMatchObject({
    kind: 'resolved',
    authorisation: {
      authorityMode: 'outcome',
      authorityEvidence: 'User explicitly authorised autonomous roadmap delivery in the current session.',
      completionTarget: 'done',
      policy: 'safe-local-v1'
    },
    writes: false
  })
})

test('stops outcome authority without evidence and rejects retired fields from the current shape', () => {
  expect(resolveFixture(record(['authority_mode: outcome']))).toMatchObject({
    kind: 'stop',
    reason: 'outcome-authorised batch lacks current human authority evidence',
    writes: false
  })

  expect(resolveFixture(record(['mandatory_stops: [unapproved-decision]']))).toMatchObject({
    kind: 'stop',
    reason: 'batch authorisation has unsupported fields',
    writes: false
  })

  expect(resolveFixture(record([], '', '# KI-HARNESS-BATCH-001\n\n## Scope\n\nDuplicated plan.'))).toMatchObject({
    kind: 'stop',
    reason: 'batch authorisation body must contain only its matching identity heading before the run ledger',
    writes: false
  })
})

test('retains the pre-change shape as integrity evidence until cleanup', () => {
  const unsigned = `---
id: KI-HARNESS-BATCH-001
repository: ${repository}
approved: true
approved_at: 2026-08-09T11:00:00Z
authority_mode: reviewed-items
approved_payload_sha256: pending
run_id: KI-HARNESS-BATCH-001-RUN-001
timebox_ends_at: 2026-08-09T13:00:00Z
item_ids: [KI-HARNESS-FND-013]
completion_target: awaiting-review
mandatory_stops: [unapproved-decision]
---

# Retained batch
`
  const hash = approvedPayloadSha256(unsigned) as string
  expect(
    parseBatchAuthorisation({
      contents: unsigned.replace('pending', hash),
      filename: 'KI-HARNESS-BATCH-001.md',
      repositoryIdentity: repository
    })
  ).toMatchObject({
    kind: 'resolved',
    authorisation: {
      expiresAt: '2026-08-09T13:00:00Z',
      policy: 'retained-legacy'
    },
    writes: false
  })

  expect(resolveFixture(unsigned.replace('pending', hash))).toMatchObject({
    kind: 'stop',
    reason: 'retained pre-change batch authorisation is not executable',
    writes: false
  })
})
