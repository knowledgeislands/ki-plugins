import { afterEach, describe, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createDelegationSession } from './delegation.ts'

const roots: string[] = []

const repository = (packet: string): string => {
  const root = mkdtempSync(join(tmpdir(), 'ki-delegation-'))
  roots.push(root)
  const roadmap = join(root, 'docs', 'roadmap')
  mkdirSync(roadmap, { recursive: true })
  writeFileSync(join(roadmap, 'KI-TEST-GOV-001-packet.md'), packet)
  return root
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

const validPacket = `## Delegation

### Locked decisions

- The scope is fixed.

### Escalate

- Return unresolved policy questions.

### Rounds

- Round 1: research.

### Worker: research

- **Deliverable:** Source evidence.
- **Files:** None.
- **Definition of done:** The source is cited.
- **Model:** fast.
- **Verify:** Orchestrator reads the source.
- **Checkpoint:** Return when complete.
`

describe('ki-delegation session', () => {
  test('accepts a complete opted-in packet', () => {
    const session = createDelegationSession({
      mode: 'audit',
      repository: repository(validPacket),
      userHome: '',
      configuration: {}
    })
    expect(session.subjects[0]?.context().packets.outcomes).toEqual([
      {
        status: 'PASS',
        message: 'Delegation packet has the required durable brief structure.',
        subject: 'docs/roadmap/KI-TEST-GOV-001-packet.md'
      }
    ])
  })
})
