import { expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import type { RubricItem } from '../../shared/rubric.ts'
import { BOUNDARY } from '../items/boundary.ts'
import { RECORD } from '../items/records.ts'
import { checkpointReadme, createCheckpointsSession } from './checkpoints.ts'

const mechanical = <Context>(family: { items: readonly RubricItem<Context>[] }, code: string) => {
  const item = family.items.find((candidate) => candidate.code === code)
  if (!item?.mechanical) throw new Error(`${code} mechanical item is missing`)
  return item.mechanical
}

test('fresh agent can reconstruct a portable hand-off without transcript or runtime state', () => {
  const repository = mkdtempSync(join(tmpdir(), 'ki-checkpoint-handoff-'))
  const checkpointDirectory = join(repository, '+', '_CHECKPOINTS')

  try {
    mkdirSync(checkpointDirectory, { recursive: true })
    writeFileSync(join(repository, checkpointReadme.path), checkpointReadme.content)
    writeFileSync(
      join(checkpointDirectory, 'remote-agent-proof.md'),
      [
        '---',
        'type: ki-checkpoint',
        'thread: remote-agent-proof',
        'state: active',
        'created_at: 2026-09-15T12:00:00Z',
        'updated_at: 2026-09-15T13:00:00Z',
        '---',
        '',
        '# remote-agent-proof',
        '',
        '## Objective',
        '',
        'Deliver the approved remote-agent proof.',
        '',
        '## Current state',
        '',
        `Repository ${repository} is at immutable baseline ${'a'.repeat(40)}.`,
        '',
        '## Decisions made',
        '',
        'Follow the accepted roadmap boundary; no provider choice is authorised.',
        '',
        '## Files touched',
        '',
        'No uncommitted files; the immutable baseline contains the complete work state.',
        '',
        '## Open questions',
        '',
        'None.',
        '',
        '## Next step',
        '',
        'Return the result to the roadmap review packet after running `bun test`.',
        ''
      ].join('\n')
    )

    const session = createCheckpointsSession({
      mode: 'audit',
      repository,
      userHome: tmpdir(),
      configuration: { skills: { 'ki-checkpoint': {} } }
    })
    const context = session.subjects[0]?.context()
    if (!context) throw new Error('ki-checkpoint session did not expose its repository subject')

    expect(mechanical(RECORD, 'RECORD-2').audit.run(RECORD.selectContext(context))[0]?.status).toBe('PASS')
    expect(mechanical(BOUNDARY, 'BOUNDARY-1').audit.run(BOUNDARY.selectContext(context))[0]?.status).toBe('PASS')
  } finally {
    rmSync(repository, { recursive: true, force: true })
  }
})
