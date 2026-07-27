import { afterEach, describe, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { RubricContextOptions } from '../../shared/rubric.ts'
import { LA_FRONTMATTER } from '../items/frontmatter.ts'
import { LA_STRUCTURE } from '../items/structure.ts'
import { createLiveArtifactsSession } from './live-artifacts.ts'

const roots: string[] = []

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

const repository = (): string => {
  const root = mkdtempSync(join(tmpdir(), 'ki-kb-live-artifacts-session-'))
  roots.push(root)
  return root
}

const options = (root: string, mode: 'audit' | 'conform'): RubricContextOptions => ({
  mode,
  repository: root,
  userHome: root,
  configuration: {}
})

const rootContext = (session: ReturnType<typeof createLiveArtifactsSession>) => {
  const [subject] = session.subjects
  if (!subject) throw new Error('ki-kb-live-artifacts session did not expose its repository subject')
  return subject.context()
}

const fixture = (): { root: string; directory: string; source: string } => {
  const root = repository()
  const directory = join(root, 'Admin', 'Operations', 'Live Artifacts')
  mkdirSync(directory, { recursive: true })
  const source = join(directory, 'Status Board.md')
  writeFileSync(
    source,
    `---
status: active
author: Operations
---
# Status Board
`
  )
  writeFileSync(join(directory, 'Orphan.html'), '<p>orphan</p>\n')
  return { root, directory, source }
}

describe('ki-kb-live-artifacts session', () => {
  test('coalesces safe index and frontmatter drafts without rendering or deleting', () => {
    const { root, source } = fixture()
    const original = readFileSync(source, 'utf8')
    const session = createLiveArtifactsSession(options(root, 'conform'))
    const context = rootContext(session)
    LA_STRUCTURE.items.find((item) => item.code === 'LA-S-1')?.mechanical?.conform?.run(LA_STRUCTURE.selectContext(context))
    LA_FRONTMATTER.items.find((item) => item.code === 'LA-F-2')?.mechanical?.conform?.run(LA_FRONTMATTER.selectContext(context))

    const proposal = session.proposal()
    expect(proposal.writes.map((write) => write.path)).toEqual([
      'Admin/Operations/Live Artifacts/Live Artifacts.md',
      'Admin/Operations/Live Artifacts/Status Board.md'
    ])
    expect(proposal.writes[0]?.create).toBe(true)
    expect(proposal.writes[0]?.content).toContain('[Status Board](Status Board.md)')
    expect(proposal.writes[1]?.content).toContain('renders: html')
    expect(readFileSync(source, 'utf8')).toBe(original)
    expect(proposal.writes.some((write) => write.path.endsWith('.html'))).toBe(false)
    expect(session.proposal()).toEqual(proposal)
  })

  test('audit is read-only and exposes no draft capabilities', () => {
    const { root } = fixture()
    const session = createLiveArtifactsSession(options(root, 'audit'))
    const context = rootContext(session)

    expect(context.structure.ensureIndex).toBeUndefined()
    expect(context.frontmatter.ensureRenders).toBeUndefined()
    expect(session.proposal()).toEqual({ writes: [] })
  })

  test('reports and safely appends mechanically missing index entries', () => {
    const { root, directory } = fixture()
    writeFileSync(join(directory, 'Live Artifacts.md'), '# Live Artifacts\n')
    const session = createLiveArtifactsSession(options(root, 'conform'))
    const context = rootContext(session)

    expect(context.structure.index[0]?.status).toBe('INFO')
    context.structure.ensureIndex?.()
    expect(session.proposal().writes).toEqual([
      {
        path: 'Admin/Operations/Live Artifacts/Live Artifacts.md',
        content: '# Live Artifacts\n- [Status Board](Status Board.md) — _(description — see manual TODO)_\n'
      }
    ])
  })

  test('refuses to replace a symlinked index', () => {
    const { root, directory } = fixture()
    writeFileSync(join(root, 'outside.md'), '# Outside\n')
    symlinkSync(join(root, 'outside.md'), join(directory, 'Live Artifacts.md'))
    const session = createLiveArtifactsSession(options(root, 'conform'))
    const context = rootContext(session)

    expect(context.structure.ensureIndex).toBeUndefined()
    expect(session.proposal()).toEqual({ writes: [] })
  })

  test('does not duplicate an existing empty renders key', () => {
    const { root, source } = fixture()
    writeFileSync(source, '---\nstatus: active\nrenders:\nauthor: Operations\n---\n')
    const session = createLiveArtifactsSession(options(root, 'conform'))
    const context = rootContext(session)

    expect(context.frontmatter.renders[0]?.status).toBe('VIOLATION')
    expect(context.frontmatter.ensureRenders).toBeUndefined()
    expect(session.proposal()).toEqual({ writes: [] })
  })

  test('honours a safe configured artifacts directory', () => {
    const root = repository()
    writeFileSync(join(root, '.ki-config.toml'), '[ki-kb-live-artifacts]\nartifacts_dir = "Operational/Boards"\n')
    mkdirSync(join(root, 'Operational', 'Boards'), { recursive: true })
    writeFileSync(join(root, 'Operational', 'Boards', 'Queue.md'), '---\nstatus: active\nrenders: html\nauthor: Ops\n---\n')
    const session = createLiveArtifactsSession(options(root, 'conform'))
    const context = rootContext(session)
    context.structure.ensureIndex?.()

    expect(session.proposal().writes[0]?.path).toBe('Operational/Boards/Live Artifacts.md')
  })
})
