import { afterEach, describe, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { RubricContextOptions } from '../../shared/rubric.ts'
import { GATE } from '../items/gate.ts'
import definition from '../items/index.ts'
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

const targetFixture = (): string => {
  const root = repository()
  mkdirSync(join(root, 'Streams', 'Roadmap'), { recursive: true })
  mkdirSync(join(root, 'Streams', 'Housekeeping'), { recursive: true })
  writeFileSync(join(root, 'Streams', 'Roadmap', '_ISSUES.md'), '# Streams issue ledger\n')
  writeFileSync(
    join(root, '.ki-config.toml'),
    '[skills.ki-repo-kb-streams]\nprocess_note = "Admin/Operations/Processes/Enactment Process"\n'
  )
  return root
}

const rootContext = (session: ReturnType<typeof createStreamsSession>) => {
  const [subject] = session.subjects
  if (!subject) throw new Error('ki-repo-kb-streams session did not expose its repository subject')
  return subject.context()
}

describe('ki-repo-kb-streams session', () => {
  test('assigns only declared rubric families to every subject', () => {
    const session = createStreamsSession(options(repository(), 'audit'))
    const declared = new Set(definition.families.map((family) => family.code))

    for (const subject of session.subjects) expect(subject.families.every((family) => declared.has(family))).toBe(true)
  })

  test('keeps conform read-only because record shape belongs to the roadmap and housekeeping adapters', () => {
    const session = createStreamsSession(options(targetFixture(), 'conform'))

    expect(session.proposal()).toEqual({ writes: [] })
  })

  test('reports an absent Streams zone as not applicable', () => {
    const root = repository()
    const session = createStreamsSession(options(root, 'audit'))
    const context = STREAM.selectContext(rootContext(session))

    expect(context.operationalAreas).toEqual([
      { level: 'NOT_APPLICABLE', message: 'No Streams/ zone; its presence is owned by ki-repo-kb.' }
    ])
    expect(session.proposal()).toEqual({ writes: [] })
  })

  test('recognises the initial operational areas and no legacy folders', () => {
    const session = createStreamsSession(options(targetFixture(), 'audit'))
    const context = STREAM.selectContext(rootContext(session))

    expect(context.operationalAreas).toEqual([
      {
        level: 'PASS',
        message: 'Streams contains the configured Roadmap and Housekeeping operational areas.',
        subject: 'Streams'
      }
    ])
    expect(context.legacyFolders).toEqual([
      { level: 'PASS', message: 'No legacy Streams state or Focus folders are present.', subject: 'Streams' }
    ])
  })

  test('reports a legacy Focus folder without deriving a replacement record', () => {
    const root = targetFixture()
    mkdirSync(join(root, 'Streams', 'Now'), { recursive: true })
    const session = createStreamsSession(options(root, 'conform'))
    const context = STREAM.selectContext(rootContext(session))

    expect(context.legacyFolders).toEqual([
      { level: 'WARN', message: 'Legacy Streams state or Focus folders: Now.', subject: 'Streams' }
    ])
    expect(session.proposal()).toEqual({ writes: [] })
  })

  test('rejects inert area configuration rather than silently accepting it', () => {
    const root = targetFixture()
    writeFileSync(join(root, '.ki-config.toml'), '[skills.ki-repo-kb-streams.areas]\nOPS = "repository-operations"\n')
    const context = rootContext(createStreamsSession(options(root, 'audit')))
    const config = definition.families.find((family) => family.code === 'CONFIG')?.selectContext(context) as {
      knownKeys: readonly { level: string; message: string }[]
    }

    expect(config.knownKeys[0]).toMatchObject({ level: 'WARN', message: expect.stringContaining('areas') })
  })

  test('consumes process_note as a contained regular-file binding', () => {
    const root = targetFixture()
    const session = createStreamsSession(options(root, 'audit'))
    const context = rootContext(session)
    const config = definition.families.find((family) => family.code === 'CONFIG')?.selectContext(context) as {
      processNote: readonly { level: string; message: string }[]
    }

    expect(config.processNote[0]).toMatchObject({ level: 'WARN', message: expect.stringContaining('missing') })
  })

  test('allows the documented extensionless process-note binding', () => {
    const root = targetFixture()
    mkdirSync(join(root, 'Admin', 'Operations', 'Processes'), { recursive: true })
    writeFileSync(join(root, 'Admin', 'Operations', 'Processes', 'Enactment Process.md'), '# Enactment Process\n')
    const context = rootContext(createStreamsSession(options(root, 'audit')))
    const config = definition.families.find((family) => family.code === 'CONFIG')?.selectContext(context) as {
      processNote: readonly { level: string }[]
    }

    expect(config.processNote[0]).toMatchObject({ level: 'PASS' })
  })

  test('requires an always-loaded anchor only after a roadmap record exists', () => {
    const root = targetFixture()
    writeFileSync(join(root, 'Streams', 'Roadmap', 'KB-OPS-001-test.md'), '# Test\n')
    writeFileSync(join(root, 'AGENTS.md'), 'Canonical changes use Streams/Roadmap through ki-repo-kb-streams.\n')
    const session = createStreamsSession(options(root, 'audit'))
    const context = GATE.selectContext(rootContext(session))

    expect(context.anchor).toEqual([{ level: 'PASS', message: 'Enactment gate is anchored.', subject: 'AGENTS.md' }])
  })
})
