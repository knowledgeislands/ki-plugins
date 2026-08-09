import { afterEach, describe, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { RubricContextOptions } from '../../shared/rubric.ts'
import { FRONTMATTER } from '../items/frontmatter.ts'
import { INDEX } from '../items/indexing.ts'
import { createHousekeepingSession } from './housekeeping.ts'

const roots: string[] = []

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

const userHome = (): string => {
  const root = mkdtempSync(join(tmpdir(), 'ki-housekeeping-claude-session-'))
  roots.push(root)
  return root
}

const options = (home: string, mode: 'audit' | 'conform'): RubricContextOptions => ({
  mode,
  repository: join(home, 'repository'),
  userHome: home,
  configuration: {}
})

const memory = (name: string): string => `---
name: ${name}
description: Useful project memory
metadata:
  type: project
---
Project fact.
`

const repositorySlug = (home: string): string => join(home, 'repository').replace(/[/.]/g, '-')

const selectedMemoryDirectory = (home: string): string =>
  join(home, '.claude', 'projects', repositorySlug(home), 'memory')

const fixture = (): { home: string; directory: string; alpha: string; index: string } => {
  const home = userHome()
  const directory = selectedMemoryDirectory(home)
  mkdirSync(directory, { recursive: true })
  const alpha = join(directory, 'alpha.md')
  const index = join(directory, 'MEMORY.md')
  writeFileSync(alpha, memory('wrong-name'))
  writeFileSync(join(directory, 'beta.md'), memory('beta'))
  writeFileSync(index, '- [Beta](beta.md) — Existing entry\n')
  return { home, directory, alpha, index }
}

const memoryContext = (session: ReturnType<typeof createHousekeepingSession>) => {
  const subject = session.subjects.find(({ families }) => families.includes('IDX'))
  if (!subject) throw new Error('ki-housekeeping-claude session did not expose a subject')
  return subject.context()
}

describe('ki-housekeeping-claude session', () => {
  test('coalesces contained name and index repairs without publishing directly', () => {
    const { home, alpha, index } = fixture()
    const originalAlpha = readFileSync(alpha, 'utf8')
    const originalIndex = readFileSync(index, 'utf8')
    const session = createHousekeepingSession(options(home, 'conform'))
    const context = memoryContext(session)
    FRONTMATTER.items.find((item) => item.code === 'FM-2')?.mechanical?.conform?.run(FRONTMATTER.selectContext(context))
    INDEX.items.find((item) => item.code === 'IDX-3')?.mechanical?.conform?.run(INDEX.selectContext(context))

    const proposal = session.proposal()
    expect(proposal.writes.map((write) => write.path)).toEqual([
      `.claude/projects/${repositorySlug(home)}/memory/alpha.md`,
      `.claude/projects/${repositorySlug(home)}/memory/MEMORY.md`
    ])
    expect(proposal.writes[0]?.content).toContain('name: alpha')
    expect(proposal.writes[1]?.content).toContain('[alpha](alpha.md) — Useful project memory')
    expect(proposal.writes.every((write) => write.path.startsWith('.claude/projects/'))).toBe(true)
    expect(proposal.commands).toBeUndefined()
    expect(readFileSync(alpha, 'utf8')).toBe(originalAlpha)
    expect(readFileSync(index, 'utf8')).toBe(originalIndex)
    expect(session.proposal()).toEqual(proposal)
  })

  test('audit is read-only and exposes no repair capabilities', () => {
    const { home } = fixture()
    const session = createHousekeepingSession(options(home, 'audit'))
    const context = memoryContext(session)

    expect(context.frontmatter.alignNames).toBeUndefined()
    expect(context.index.appendUnindexed).toBeUndefined()
    expect(session.proposal()).toEqual({ writes: [] })
  })

  test('reports a missing selected repository memory as not applicable', () => {
    const home = userHome()
    const session = createHousekeepingSession(options(home, 'audit'))
    const context = memoryContext(session)

    expect(context.index.exists[0]?.status).toBe('NOT_APPLICABLE')
    expect(session.subjects.find(({ families }) => families.includes('IDX'))?.subject).toBe(
      `.claude/projects/${repositorySlug(home)}/memory`
    )
  })

  test('does not traverse a symlinked project memory directory', () => {
    const home = userHome()
    const outside = join(home, 'outside-memory')
    mkdirSync(outside)
    writeFileSync(join(outside, 'alpha.md'), memory('wrong-name'))
    mkdirSync(join(home, '.claude', 'projects', repositorySlug(home)), { recursive: true })
    symlinkSync(outside, selectedMemoryDirectory(home))
    const session = createHousekeepingSession(options(home, 'conform'))

    expect(session.subjects.find(({ families }) => families.includes('IDX'))?.subject).toBe(
      `.claude/projects/${repositorySlug(home)}/memory`
    )
    expect(session.proposal()).toEqual({ writes: [] })
  })

  test('does not traverse a symlinked Claude root', () => {
    const home = userHome()
    const outside = join(home, 'outside-claude')
    mkdirSync(join(outside, 'projects', repositorySlug(home), 'memory'), { recursive: true })
    writeFileSync(join(outside, 'projects', repositorySlug(home), 'memory', 'alpha.md'), memory('wrong-name'))
    symlinkSync(outside, join(home, '.claude'))
    const session = createHousekeepingSession(options(home, 'conform'))

    expect(session.subjects.find(({ families }) => families.includes('IDX'))?.subject).toBe(
      `.claude/projects/${repositorySlug(home)}/memory`
    )
    expect(session.proposal()).toEqual({ writes: [] })
  })

  test('does not replace a symlinked MEMORY index', () => {
    const { home, directory } = fixture()
    rmSync(join(directory, 'MEMORY.md'))
    writeFileSync(join(home, 'outside.md'), '# Outside\n')
    symlinkSync(join(home, 'outside.md'), join(directory, 'MEMORY.md'))
    const session = createHousekeepingSession(options(home, 'conform'))
    const context = memoryContext(session)

    expect(context.index.exists[0]?.status).toBe('VIOLATION')
    expect(context.index.appendUnindexed).toBeUndefined()
  })

  test('audits only the selected repository memory and ignores foreign memory failures', () => {
    const home = userHome()
    const selected = selectedMemoryDirectory(home)
    const foreign = join(home, '.claude', 'projects', '-foreign-repository', 'memory')
    mkdirSync(selected, { recursive: true })
    mkdirSync(foreign, { recursive: true })
    writeFileSync(join(selected, 'MEMORY.md'), '')
    writeFileSync(join(foreign, 'foreign.md'), memory('wrong-name'))

    const session = createHousekeepingSession(options(home, 'audit'))
    const context = memoryContext(session)

    expect(session.subjects).toHaveLength(2)
    expect(context.index.exists[0]?.status).toBe('PASS')
    expect(context.frontmatter.present[0]?.status).toBe('NOT_APPLICABLE')
    expect(JSON.stringify(context)).not.toContain('foreign')
  })

  test('conform proposes repairs only inside the selected repository memory', () => {
    const { home, alpha, index } = fixture()
    const foreign = join(home, '.claude', 'projects', '-foreign-repository', 'memory')
    mkdirSync(foreign, { recursive: true })
    const foreignFile = join(foreign, 'foreign.md')
    const foreignIndex = join(foreign, 'MEMORY.md')
    writeFileSync(foreignFile, memory('wrong-name'))
    writeFileSync(foreignIndex, '')
    const originalForeignFile = readFileSync(foreignFile, 'utf8')
    const originalForeignIndex = readFileSync(foreignIndex, 'utf8')
    const session = createHousekeepingSession(options(home, 'conform'))
    const context = memoryContext(session)
    FRONTMATTER.items.find((item) => item.code === 'FM-2')?.mechanical?.conform?.run(FRONTMATTER.selectContext(context))
    INDEX.items.find((item) => item.code === 'IDX-3')?.mechanical?.conform?.run(INDEX.selectContext(context))

    expect(session.proposal().writes.map((write) => write.path)).toEqual([
      `.claude/projects/${repositorySlug(home)}/memory/alpha.md`,
      `.claude/projects/${repositorySlug(home)}/memory/MEMORY.md`
    ])
    expect(readFileSync(alpha, 'utf8')).toContain('name: wrong-name')
    expect(readFileSync(index, 'utf8')).toBe('- [Beta](beta.md) — Existing entry\n')
    expect(readFileSync(foreignFile, 'utf8')).toBe(originalForeignFile)
    expect(readFileSync(foreignIndex, 'utf8')).toBe(originalForeignIndex)
  })

  test('checks foreign learned entries only for the selected repository memory', () => {
    const home = userHome()
    const repository = join(home, 'repository')
    const slug = repository.replace(/[/.]/g, '-')
    const directory = join(home, '.claude', 'projects', slug, 'memory')
    mkdirSync(directory, { recursive: true })
    writeFileSync(
      join(directory, 'MEMORY.md'),
      '<!-- headroom:learn:start -->\nknowledgeislands/other-repository\n<!-- headroom:learn:end -->\n'
    )

    const session = createHousekeepingSession(options(home, 'audit'))
    const context = memoryContext(session)

    expect(context.index.learnedEntries[0]?.status).toBe('VIOLATION')
    expect(context.index.learnedEntries[0]?.message).toContain('other-repository')
  })
})
