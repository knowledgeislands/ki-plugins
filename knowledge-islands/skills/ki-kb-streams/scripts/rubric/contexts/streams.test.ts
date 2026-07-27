import { afterEach, describe, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { RubricContextOptions } from '../../shared/rubric.ts'
import { ENACT } from '../items/enactment.ts'
import { STREAM } from '../items/stream.ts'
import { createStreamsSession } from './streams.ts'

const roots: string[] = []

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

const repository = (): string => {
  const root = mkdtempSync(join(tmpdir(), 'ki-kb-streams-session-'))
  roots.push(root)
  return root
}

const options = (root: string, mode: 'audit' | 'conform'): RubricContextOptions => ({
  mode,
  repository: root,
  userHome: root,
  configuration: {}
})

const proposal = (title: string): string => `---
title: ${title}
type: stream-proposal
status: draft - working
priority: high (raised)
dependencies: []
---
# ${title}
`

const streamsFixture = (): { root: string; files: string[] } => {
  const root = repository()
  mkdirSync(join(root, 'Streams', 'Active', 'Alpha Proposal'), { recursive: true })
  mkdirSync(join(root, 'Streams', 'Future', 'Beta Proposal'), { recursive: true })
  writeFileSync(join(root, 'Streams', 'Active', 'Active.md'), '# Active\n')
  writeFileSync(join(root, 'Streams', 'Future', 'Future.md'), '# Future\n')
  const files = [
    join(root, 'Streams', 'Active', 'Alpha Proposal', 'Alpha Proposal.md'),
    join(root, 'Streams', 'Future', 'Beta Proposal', 'Beta Proposal.md')
  ]
  writeFileSync(files[0] as string, proposal('Alpha Proposal'))
  writeFileSync(files[1] as string, proposal('Beta Proposal'))
  writeFileSync(join(root, 'AGENTS.md'), 'Canonical changes use a proposal governed by ki-kb-streams.\n')
  return { root, files }
}

const rootContext = (session: ReturnType<typeof createStreamsSession>) => {
  const [subject] = session.subjects
  if (!subject) throw new Error('ki-kb-streams session did not expose its repository subject')
  return subject.context()
}

describe('ki-kb-streams session', () => {
  test('coalesces controlled-vocabulary normalisation into one read-only proposal', () => {
    const { root, files } = streamsFixture()
    const originals = files.map((file) => readFileSync(file, 'utf8'))
    const session = createStreamsSession(options(root, 'conform'))
    const context = ENACT.selectContext(rootContext(session))
    const lifecycle = ENACT.items.find((item) => item.code === 'ENACT-2')
    lifecycle?.mechanical?.conform?.run(context)

    const writes = session.proposal().writes
    expect(writes.map((write) => write.path)).toEqual([
      'Streams/Active/Alpha Proposal/Alpha Proposal.md',
      'Streams/Future/Beta Proposal/Beta Proposal.md'
    ])
    expect(writes.every((write) => write.content.includes('status: draft\npriority: high\n'))).toBe(true)
    expect(files.map((file) => readFileSync(file, 'utf8'))).toEqual(originals)
    expect(session.proposal()).toEqual({ writes })
  })

  test('audit exposes evidence without a conform capability or proposal', () => {
    const { root } = streamsFixture()
    const session = createStreamsSession(options(root, 'audit'))
    const context = ENACT.selectContext(rootContext(session))

    expect(context.normaliseLifecycle).toBeUndefined()
    expect(session.proposal()).toEqual({ writes: [] })
  })

  test('reports an absent Streams zone as not applicable', () => {
    const root = repository()
    const session = createStreamsSession(options(root, 'audit'))
    const context = STREAM.selectContext(rootContext(session))

    expect(context.focusFolders).toEqual([{ level: 'NOT_APPLICABLE', message: 'No Streams/ zone; its presence is owned by ki-kb.' }])
    expect(session.proposal()).toEqual({ writes: [] })
  })
})
