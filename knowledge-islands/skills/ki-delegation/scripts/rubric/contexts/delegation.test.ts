import { afterEach, describe, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createDelegationSession } from './delegation.ts'

const roots: string[] = []

const repository = (packet: string, adapter: 'project' | 'kb' = 'project'): string => {
  const root = mkdtempSync(join(tmpdir(), 'ki-delegation-'))
  roots.push(root)
  const roadmap = adapter === 'project' ? join(root, 'docs', 'roadmap') : join(root, 'Streams', 'Roadmap')
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

### Worker: research

- **Deliverable:** Source evidence.
- **Inputs:** The approved work record and named sources.
- **Scope:** Named sources only; no repository or external writes.
- **Authority:** Read only; perform no external writes.
- **Isolation:** Read-only worker context.
- **Verify:** Coordinator reads the source.
- **Return:** Findings, citations, and remaining uncertainty.
- **Checkpoint:** Return when complete.
`

describe('ki-delegation session', () => {
  for (const [adapter, subject] of [
    ['project', 'docs/roadmap/KI-TEST-GOV-001-packet.md'],
    ['kb', 'Streams/Roadmap/KI-TEST-GOV-001-packet.md']
  ] as const)
    test(`accepts a complete opted-in packet in the ${adapter} adapter`, () => {
      const session = createDelegationSession({
        mode: 'audit',
        repository: repository(validPacket, adapter),
        userHome: '',
        configuration: {}
      })
      expect(session.subjects[0]?.context().packets.outcomes).toEqual([
        {
          status: 'PASS',
          message: 'Delegation packet has the required durable brief structure.',
          subject
        }
      ])
    })

  test('requires the exact Escalate heading', () => {
    const session = createDelegationSession({
      mode: 'audit',
      repository: repository(validPacket.replace('### Escalate', '### Escalation')),
      userHome: '',
      configuration: {}
    })
    expect(session.subjects[0]?.context().packets.outcomes).toContainEqual({
      status: 'VIOLATION',
      message: 'Delegation packet requires a non-empty `Escalate` section.',
      subject: 'docs/roadmap/KI-TEST-GOV-001-packet.md'
    })
  })

  test('rejects the retired Files boundary label', () => {
    const session = createDelegationSession({
      mode: 'audit',
      repository: repository(validPacket.replace('**Scope:**', '**Files:**')),
      userHome: '',
      configuration: {}
    })
    expect(session.subjects[0]?.context().packets.outcomes).toContainEqual({
      status: 'VIOLATION',
      message: 'Delegation worker is missing a non-empty `Scope` field.',
      subject: 'docs/roadmap/KI-TEST-GOV-001-packet.md'
    })
  })

  for (const field of ['Deliverable', 'Inputs', 'Scope', 'Authority', 'Isolation', 'Verify', 'Return', 'Checkpoint'])
    test(`rejects a worker without ${field}`, () => {
      const packet = validPacket.replace(new RegExp(`^- \\*\\*${field}:\\*\\*.*\\n`, 'm'), '')
      const session = createDelegationSession({
        mode: 'audit',
        repository: repository(packet),
        userHome: '',
        configuration: {}
      })
      expect(session.subjects[0]?.context().packets.outcomes).toContainEqual({
        status: 'VIOLATION',
        message: `Delegation worker is missing a non-empty \`${field}\` field.`,
        subject: 'docs/roadmap/KI-TEST-GOV-001-packet.md'
      })
    })

  test('rejects empty required packet sections and a missing worker', () => {
    const packet = `## Delegation

### Locked decisions

### Escalate

`
    const session = createDelegationSession({
      mode: 'audit',
      repository: repository(packet),
      userHome: '',
      configuration: {}
    })
    expect(session.subjects[0]?.context().packets.outcomes).toEqual([
      {
        status: 'VIOLATION',
        message: 'Delegation packet requires a non-empty `Locked decisions` section.',
        subject: 'docs/roadmap/KI-TEST-GOV-001-packet.md'
      },
      {
        status: 'VIOLATION',
        message: 'Delegation packet requires a non-empty `Escalate` section.',
        subject: 'docs/roadmap/KI-TEST-GOV-001-packet.md'
      },
      {
        status: 'VIOLATION',
        message: 'Delegation packet requires at least one `### Worker: <name>` subsection.',
        subject: 'docs/roadmap/KI-TEST-GOV-001-packet.md'
      }
    ])
  })

  test('keeps an ordinary delegation note outside the durable-packet rubric', () => {
    const session = createDelegationSession({
      mode: 'audit',
      repository: repository('## Delegation\n\nKeep this task with the coordinator.\n'),
      userHome: '',
      configuration: {}
    })
    expect(session.subjects[0]?.context().packets.outcomes).toEqual([
      {
        status: 'NOT_APPLICABLE',
        message: 'The delegation note is not an opted-in delegation packet.',
        subject: 'docs/roadmap/KI-TEST-GOV-001-packet.md'
      }
    ])
  })
})
