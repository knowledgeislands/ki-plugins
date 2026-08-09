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
  const root = mkdtempSync(join(tmpdir(), 'ki-repo-kb-streams-session-'))
  roots.push(root)
  return root
}

const options = (root: string, mode: 'audit' | 'conform'): RubricContextOptions => ({
  mode,
  repository: root,
  userHome: root,
  configuration: {}
})

const proposal = (title: string, code?: string): string => `---
title: ${title}
type: stream-proposal
status: draft - working
priority: high (raised)
dependencies: []
${code === undefined ? '' : `code: ${code}\n`}---
# ${title}
`

const streamsFixture = (): { root: string; files: string[] } => {
  const root = repository()
  mkdirSync(join(root, 'Streams', 'Now', 'Alpha Proposal'), { recursive: true })
  mkdirSync(join(root, 'Streams', 'Future', 'Beta Proposal'), { recursive: true })
  writeFileSync(join(root, 'Streams', 'Now', 'Now.md'), '# Now\n')
  writeFileSync(join(root, 'Streams', 'Future', 'Future.md'), '# Future\n')
  const files = [
    join(root, 'Streams', 'Now', 'Alpha Proposal', 'Alpha Proposal.md'),
    join(root, 'Streams', 'Future', 'Beta Proposal', 'Beta Proposal.md')
  ]
  writeFileSync(files[0] as string, proposal('Alpha Proposal', 'KBS-001'))
  writeFileSync(files[1] as string, proposal('Beta Proposal', 'KBS-002'))
  writeFileSync(join(root, 'AGENTS.md'), 'Canonical changes use a proposal governed by ki-repo-kb-streams.\n')
  return { root, files }
}

const rootContext = (session: ReturnType<typeof createStreamsSession>) => {
  const [subject] = session.subjects
  if (!subject) throw new Error('ki-repo-kb-streams session did not expose its repository subject')
  return subject.context()
}

const proposalCodes = (session: ReturnType<typeof createStreamsSession>) => {
  const item = ENACT.items.find((candidate) => candidate.code === 'ENACT-6')
  if (!item?.mechanical) throw new Error('ENACT-6 mechanical audit is unavailable')
  return {
    item,
    outcomes: item.mechanical.audit.run(ENACT.selectContext(rootContext(session)))
  }
}

describe('ki-repo-kb-streams session', () => {
  test('coalesces controlled-vocabulary normalisation into one read-only proposal', () => {
    const { root, files } = streamsFixture()
    const originals = files.map((file) => readFileSync(file, 'utf8'))
    const session = createStreamsSession(options(root, 'conform'))
    const context = ENACT.selectContext(rootContext(session))
    const lifecycle = ENACT.items.find((item) => item.code === 'ENACT-2')
    lifecycle?.mechanical?.conform?.run(context)

    const writes = session.proposal().writes
    expect(writes.map((write) => write.path)).toEqual([
      'Streams/Now/Alpha Proposal/Alpha Proposal.md',
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

    expect(context.focusFolders).toEqual([
      { level: 'NOT_APPLICABLE', message: 'No Streams/ zone; its presence is owned by ki-repo-kb.' }
    ])
    expect(session.proposal()).toEqual({ writes: [] })
  })

  test('recognises every canonical Focus', () => {
    const root = repository()
    const foci = ['Now', 'Next', 'Soon', 'Waiting for', 'Parked', 'Future', 'Housekeeping']
    for (const focus of foci) {
      mkdirSync(join(root, 'Streams', focus), { recursive: true })
      writeFileSync(join(root, 'Streams', focus, `${focus}.md`), `# ${focus}\n`)
    }

    const session = createStreamsSession(options(root, 'audit'))
    const context = STREAM.selectContext(rootContext(session))

    expect(context.focusFolders).toEqual([
      { level: 'PASS', message: 'All direct folders are Focus folders.', subject: 'Streams' }
    ])
    expect(context.focusIndexes).toEqual(
      foci.map((focus) => ({
        level: 'PASS',
        message: 'Focus index is present.',
        subject: `Streams/${focus}/${focus}.md`
      }))
    )
  })

  test('passes explicit valid proposal codes without a conform identity write', () => {
    const { root } = streamsFixture()
    const session = createStreamsSession(options(root, 'conform'))
    const { item, outcomes } = proposalCodes(session)

    expect(item.mechanical?.level).toBe('FAIL')
    expect(outcomes).toEqual([
      {
        status: 'PASS',
        message: 'Proposal codes are present, well-formed, and unique across the Knowledge Base.'
      }
    ])
    expect(item.mechanical?.conform).toBeUndefined()
    expect(session.proposal()).toEqual({ writes: [] })
  })

  test('fails missing proposal codes without inventing an identity', () => {
    const { root, files } = streamsFixture()
    writeFileSync(files[0] as string, proposal('Alpha Proposal'))
    const session = createStreamsSession(options(root, 'conform'))
    const { item, outcomes } = proposalCodes(session)

    expect(item.mechanical?.level).toBe('FAIL')
    expect(outcomes).toEqual([
      {
        status: 'VIOLATION',
        message: 'Missing proposal code: Streams/Now/Alpha Proposal/Alpha Proposal.md.'
      }
    ])
    expect(session.proposal()).toEqual({ writes: [] })
  })

  test('fails malformed proposal codes without rewriting an identity', () => {
    const { root, files } = streamsFixture()
    writeFileSync(files[0] as string, proposal('Alpha Proposal', 'kbs-000'))
    const session = createStreamsSession(options(root, 'conform'))
    const { item, outcomes } = proposalCodes(session)

    expect(item.mechanical?.level).toBe('FAIL')
    expect(outcomes).toEqual([
      {
        status: 'VIOLATION',
        message: 'Malformed proposal code: Streams/Now/Alpha Proposal/Alpha Proposal.md (kbs-000).'
      }
    ])
    expect(session.proposal()).toEqual({ writes: [] })
  })

  test('fails a duplicate code across Focus folders without renumbering either proposal', () => {
    const { root, files } = streamsFixture()
    writeFileSync(files[1] as string, proposal('Beta Proposal', 'KBS-001'))
    const session = createStreamsSession(options(root, 'conform'))
    const { item, outcomes } = proposalCodes(session)

    expect(item.mechanical?.level).toBe('FAIL')
    expect(outcomes).toEqual([
      {
        status: 'VIOLATION',
        message:
          'Duplicate proposal code: KBS-001 (Streams/Now/Alpha Proposal/Alpha Proposal.md, Streams/Future/Beta Proposal/Beta Proposal.md).'
      }
    ])
    expect(session.proposal()).toEqual({ writes: [] })
  })
})
