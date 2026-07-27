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
  const root = mkdtempSync(join(tmpdir(), 'ki-housekeeping-session-'))
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

const fixture = (): { home: string; directory: string; alpha: string; index: string } => {
  const home = userHome()
  const directory = join(home, '.claude', 'projects', '-work-repository', 'memory')
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
  if (!subject) throw new Error('ki-housekeeping session did not expose a subject')
  return subject.context()
}

describe('ki-housekeeping session', () => {
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
      '.claude/projects/-work-repository/memory/alpha.md',
      '.claude/projects/-work-repository/memory/MEMORY.md'
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

  test('reports no physical project memories as not applicable', () => {
    const home = userHome()
    const session = createHousekeepingSession(options(home, 'audit'))
    const context = memoryContext(session)

    expect(context.index.exists[0]?.status).toBe('NOT_APPLICABLE')
    expect(session.subjects.find(({ families }) => families.includes('IDX'))?.subject).toBe('.claude/projects')
  })

  test('does not traverse a symlinked project memory directory', () => {
    const home = userHome()
    const outside = join(home, 'outside-memory')
    mkdirSync(outside)
    writeFileSync(join(outside, 'alpha.md'), memory('wrong-name'))
    mkdirSync(join(home, '.claude', 'projects', '-work-repository'), { recursive: true })
    symlinkSync(outside, join(home, '.claude', 'projects', '-work-repository', 'memory'))
    const session = createHousekeepingSession(options(home, 'conform'))

    expect(session.subjects.find(({ families }) => families.includes('IDX'))?.subject).toBe('.claude/projects')
    expect(session.proposal()).toEqual({ writes: [] })
  })

  test('does not traverse a symlinked Claude root', () => {
    const home = userHome()
    const outside = join(home, 'outside-claude')
    mkdirSync(join(outside, 'projects', '-work-repository', 'memory'), { recursive: true })
    writeFileSync(join(outside, 'projects', '-work-repository', 'memory', 'alpha.md'), memory('wrong-name'))
    symlinkSync(outside, join(home, '.claude'))
    const session = createHousekeepingSession(options(home, 'conform'))

    expect(session.subjects.find(({ families }) => families.includes('IDX'))?.subject).toBe('.claude/projects')
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

  test('checks the selected repository ki-self source and Claude projection once', () => {
    const home = userHome()
    const repository = join(home, 'repository')
    mkdirSync(join(repository, '.agents', 'skills', 'ki-self'), { recursive: true })
    mkdirSync(join(repository, '.claude', 'skills'), { recursive: true })
    writeFileSync(join(repository, '.agents', 'skills', 'ki-self', 'SKILL.md'), '---\nname: ki-self\n---\n')
    writeFileSync(join(repository, '.ki-config.toml'), '[ki-repo]\nsupported_runtimes = ["claude-code"]\n')
    symlinkSync('../../.agents/skills/ki-self', join(repository, '.claude', 'skills', 'ki-self'))

    const session = createHousekeepingSession(options(home, 'audit'))
    const subject = session.subjects.find(({ families }) => families.includes('SELF'))
    const context = subject?.context()

    expect(session.subjects.filter(({ families }) => families.includes('SELF'))).toHaveLength(1)
    expect(context?.self.source[0]?.status).toBe('PASS')
    expect(context?.self.sourceName[0]?.status).toBe('PASS')
    expect(context?.self.projection[0]?.status).toBe('PASS')
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
