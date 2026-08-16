import { expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { approvedPayloadSha256, resolveBatchAuthorisation } from './internal/authorisation.ts'

const repository = 'https://github.com/knowledgeislands/ki-agentic-harness'
const now = new Date('2026-08-09T12:00:00Z')

const record = (overrides: readonly string[] = [], ledger = ''): string => {
  const unsigned = `---\nid: KI-HARNESS-BATCH-001\nrepository: ${repository}\napproved: true\napproved_at: 2026-08-09T11:00:00Z\napproved_payload_sha256: <payload>\nrun_id: KI-HARNESS-BATCH-001-RUN-001\ntimebox_ends_at: 2026-08-09T13:00:00Z\nitem_ids: [KI-HARNESS-FND-013]\ncompletion_target: awaiting-review\nmandatory_stops: [unapproved-decision]\n${overrides.join('\n')}\n---\n\n# KI-HARNESS-BATCH-001 — Test batch\n\n## Scope\n\n- Repository: ${repository}\n`
  const hash = approvedPayloadSha256(unsigned.replace('<payload>', '0'.repeat(64)))
  return `${unsigned.replace('<payload>', hash as string)}${ledger}`
}

const fixture = (contents = record()): { root: string; path: string } => {
  const root = mkdtempSync(join(tmpdir(), 'ki-batch-authorisation-'))
  const directory = join(root, '+', '_AUTHORISATIONS')
  mkdirSync(directory, { recursive: true })
  const path = join(directory, 'KI-HARNESS-BATCH-001.md')
  writeFileSync(path, contents)
  return { root, path }
}

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
      approvedPayloadSha256: expect.stringMatching(/^[0-9a-f]{64}$/),
      runId: 'KI-HARNESS-BATCH-001-RUN-001',
      runBinding: null,
      timeboxEndsAt: '2026-08-09T13:00:00Z',
      itemIds: ['KI-HARNESS-FND-013'],
      completionTarget: 'awaiting-review',
      mandatoryStops: ['unapproved-decision'],
      closureItemIds: []
    },
    writes: false
  })
})

test('binds a later append-only run ledger to the exact approved payload', () => {
  const approved = record()
  const hash = approvedPayloadSha256(approved) as string
  const resolved = resolveFixture(
    `${approved}## Run ledger\n\n<!-- ki-batch-run: KI-HARNESS-BATCH-001-RUN-001 ${hash} -->\n\n| Item | Result |\n| --- | --- |\n`
  )
  expect(resolved).toMatchObject({
    kind: 'resolved',
    authorisation: { runBinding: { id: 'KI-HARNESS-BATCH-001-RUN-001', approvedPayloadSha256: hash } },
    writes: false
  })
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
    resolveFixture(record().replace('timebox_ends_at: 2026-08-09T13:00:00Z', 'timebox_ends_at: 2026-08-09T11:00:00Z'))
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
  expect(resolveFixture(record().replace('Test batch', 'Widened batch'))).toMatchObject({
    kind: 'stop',
    reason: 'batch authorisation payload no longer matches its approval',
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
