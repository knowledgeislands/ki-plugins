import { expect, test } from 'bun:test'
import { projectSharedDecisionRecord } from './shared-projection.ts'

const body = '# GDR-KI-SHARED-001: Shared decision\n\n## Context\n\nContext.\n'

const record = (metadata: string, content = body): string => `---\n${metadata}\n---\n${content}`

const canonical = [
  'id: GDR-KI-SHARED-001',
  "title: 'Shared decision'",
  'date: 2026-09-16',
  'status: current',
  'decision_type: governance',
  'decision_type_url: https://knowledgeislands.info/specifications/decision-records/gdr',
  'shared_record: true'
]

test('projects decision-owned fields in deterministic order', () => {
  const first = projectSharedDecisionRecord(record(canonical.join('\n')))
  const second = projectSharedDecisionRecord(record([...canonical].reverse().join('\n')))
  expect(first.issue).toBeUndefined()
  expect(first.projection).toBe(second.projection)
})

test('excludes only note_type from shared identity', () => {
  const plain = projectSharedDecisionRecord(record(canonical.join('\n')))
  const classified = projectSharedDecisionRecord(
    record(`note_type: admin/governance/decision\n${canonical.join('\n')}`)
  )
  expect(classified.projection).toBe(plain.projection)
})

test('fails closed on every unknown frontmatter field', () => {
  const result = projectSharedDecisionRecord(record(`${canonical.join('\n')}\nrepository_note: local`))
  expect(result.projection).toBeUndefined()
  expect(result.issue).toContain('unknown frontmatter field: repository_note')
})

test('keeps the complete body in shared identity', () => {
  const first = projectSharedDecisionRecord(record(canonical.join('\n')))
  const second = projectSharedDecisionRecord(record(canonical.join('\n'), body.replace('Context.', 'Changed.')))
  expect(first.projection).not.toBe(second.projection)
})
