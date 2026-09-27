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

const options = (
  home: string,
  mode: 'audit' | 'conform',
  configuration: Readonly<Record<string, unknown>> = {}
): RubricContextOptions => ({
  mode,
  repository: join(home, 'repository'),
  userHome: home,
  configuration
})

const enabledOptions = (home: string, mode: 'audit' | 'conform'): RubricContextOptions =>
  options(home, mode, { auto_memory: 'enabled' })

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

const settings = (home: string, contents = '{}'): void => {
  mkdirSync(join(home, '.claude'), { recursive: true })
  writeFileSync(join(home, '.claude', 'settings.json'), contents)
}

const projectSettings = (home: string, contents: Record<string, unknown>, local = true): void => {
  const directory = join(home, 'repository', '.claude')
  mkdirSync(directory, { recursive: true })
  writeFileSync(join(directory, local ? 'settings.local.json' : 'settings.json'), JSON.stringify(contents))
}

const fixture = (): { home: string; directory: string; alpha: string; index: string } => {
  const home = userHome()
  const directory = selectedMemoryDirectory(home)
  mkdirSync(directory, { recursive: true })
  settings(home, JSON.stringify({ autoMemoryEnabled: false }))
  projectSettings(home, { autoMemoryEnabled: true })
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
    const session = createHousekeepingSession(enabledOptions(home, 'conform'))
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
    const session = createHousekeepingSession(enabledOptions(home, 'audit'))
    const context = memoryContext(session)

    expect(context.frontmatter.alignNames).toBeUndefined()
    expect(context.index.appendUnindexed).toBeUndefined()
    expect(session.proposal()).toEqual({ writes: [] })
  })

  test('reports a missing selected repository memory as not applicable', () => {
    const home = userHome()
    settings(home)
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
    settings(home)
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
    writeFileSync(join(outside, 'settings.json'), '{}')
    symlinkSync(outside, join(home, '.claude'))
    const session = createHousekeepingSession(options(home, 'conform'))
    const context = memoryContext(session)

    expect(session.subjects.find(({ families }) => families.includes('IDX'))?.subject).toBe(
      `.claude/projects/${repositorySlug(home)}/memory`
    )
    expect(context.selection.selected[0]?.status).toBe('VIOLATION')
    expect(session.proposal()).toEqual({ writes: [] })
  })

  test('does not replace a symlinked MEMORY index', () => {
    const { home, directory } = fixture()
    rmSync(join(directory, 'MEMORY.md'))
    writeFileSync(join(home, 'outside.md'), '# Outside\n')
    symlinkSync(join(home, 'outside.md'), join(directory, 'MEMORY.md'))
    const session = createHousekeepingSession(enabledOptions(home, 'conform'))
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
    settings(home, JSON.stringify({ autoMemoryEnabled: false }))
    projectSettings(home, { autoMemoryEnabled: true })
    writeFileSync(join(selected, 'MEMORY.md'), '')
    writeFileSync(join(foreign, 'foreign.md'), memory('wrong-name'))

    const session = createHousekeepingSession(enabledOptions(home, 'audit'))
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
    const session = createHousekeepingSession(enabledOptions(home, 'conform'))
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
    settings(home, JSON.stringify({ autoMemoryEnabled: false }))
    projectSettings(home, { autoMemoryEnabled: true })
    writeFileSync(
      join(directory, 'MEMORY.md'),
      '<!-- headroom:learn:start -->\n_Auto-generated by `headroom learn` on 2026-08-12 — do not edit manually_\n- Learned from knowledgeislands/other-repository\n<!-- headroom:learn:end -->\n'
    )

    const session = createHousekeepingSession(enabledOptions(home, 'audit'))
    const context = memoryContext(session)

    expect(context.index.learnedEntries[0]?.status).toBe('VIOLATION')
    expect(context.index.learnedEntries[0]?.message).toContain('other-repository')
    expect(context.index.entriesResolve[0]?.status).toBe('PASS')
  })

  test('reports an implicit runtime enable without a scoped opt-in', () => {
    const home = userHome()
    const session = createHousekeepingSession(options(home, 'audit', { auto_memory: 'disabled' }))
    const context = memoryContext(session)

    expect(session.subjects.find(({ families }) => families.includes('RUNTIME'))?.families).toContain('RUNTIME')
    expect(context.selection.selected[0]?.status).toBe('VIOLATION')
    expect(context.selection.selected[0]?.message).toContain('without a project-scoped opt-in')
    expect(context.index.exists[0]?.status).toBe('NOT_APPLICABLE')
    expect(context.runtime.server[0]?.status).toBe('NOT_APPLICABLE')
    expect(context.runtime.server[0]?.message).toContain('No server registration')
  })

  test('uses the documented default for a project-scoped opt-in', () => {
    const home = userHome()
    settings(home, JSON.stringify({ autoMemoryEnabled: false }))
    projectSettings(home, { autoMemoryEnabled: true })
    mkdirSync(selectedMemoryDirectory(home), { recursive: true })
    writeFileSync(join(selectedMemoryDirectory(home), 'MEMORY.md'), '')
    const session = createHousekeepingSession(options(home, 'audit', { auto_memory: 'enabled' }))
    const context = memoryContext(session)

    expect(context.selection.selected[0]?.status).toBe('PASS')
    expect(context.index.exists[0]?.status).toBe('PASS')
  })

  test('treats an absent documented default directory as no native memories', () => {
    const home = userHome()
    settings(home, JSON.stringify({ autoMemoryEnabled: false }))
    projectSettings(home, { autoMemoryEnabled: true })
    const context = memoryContext(createHousekeepingSession(options(home, 'audit', { auto_memory: 'enabled' })))

    expect(context.selection.selected[0]?.status).toBe('PASS')
    expect(context.index.exists[0]?.status).toBe('NOT_APPLICABLE')
  })

  test('does not inspect existing memory when default-off is effective', () => {
    const home = userHome()
    settings(home, JSON.stringify({ autoMemoryEnabled: false }))
    mkdirSync(selectedMemoryDirectory(home), { recursive: true })
    writeFileSync(join(selectedMemoryDirectory(home), 'orphan.md'), memory('wrong-name'))
    const session = createHousekeepingSession(options(home, 'conform', { auto_memory: 'disabled' }))
    const context = memoryContext(session)

    expect(context.selection.selected[0]?.status).toBe('PASS')
    expect(context.index.exists[0]?.status).toBe('NOT_APPLICABLE')
    expect(context.frontmatter.present[0]?.status).toBe('NOT_APPLICABLE')
    expect(context.selection.reconciliation[0]?.status).toBe('VIOLATION')
    expect(context.selection.reconciliation[0]?.message).toContain('reviewed reconciliation')
    expect(session.proposal()).toEqual({ writes: [] })
  })

  test('fails an unset policy and warns for an empty selected memory directory', () => {
    const home = userHome()
    settings(home, JSON.stringify({ autoMemoryEnabled: false }))
    mkdirSync(selectedMemoryDirectory(home), { recursive: true })
    const context = memoryContext(createHousekeepingSession(options(home, 'audit')))

    expect(context.selection.selected[0]?.status).toBe('VIOLATION')
    expect(context.selection.selected[0]?.message).toContain('auto_memory is unset')
    expect(context.selection.reconciliation[0]?.status).toBe('VIOLATION')
    expect(context.selection.reconciliation[0]?.message).toContain('directory exists')
    expect(context.index.exists[0]?.status).toBe('NOT_APPLICABLE')
  })

  test('fails an unset policy even when no selected memory directory exists', () => {
    const home = userHome()
    settings(home, JSON.stringify({ autoMemoryEnabled: false }))
    const context = memoryContext(createHousekeepingSession(options(home, 'audit')))

    expect(context.selection.selected[0]?.status).toBe('VIOLATION')
    expect(context.selection.reconciliation[0]?.status).toBe('PASS')
    expect(context.index.exists[0]?.status).toBe('NOT_APPLICABLE')
  })

  test('runtime enable conflicts with disabled KI policy without producing an index failure', () => {
    const home = userHome()
    settings(home)
    mkdirSync(selectedMemoryDirectory(home), { recursive: true })
    const context = memoryContext(createHousekeepingSession(options(home, 'audit')))

    expect(context.selection.selected[0]?.status).toBe('VIOLATION')
    expect(context.selection.reconciliation[0]?.status).toBe('VIOLATION')
    expect(context.index.exists[0]?.status).toBe('NOT_APPLICABLE')
  })

  test('transition warns while legacy enabled memory remains available for review', () => {
    const home = userHome()
    settings(home)
    mkdirSync(selectedMemoryDirectory(home), { recursive: true })
    writeFileSync(join(selectedMemoryDirectory(home), 'MEMORY.md'), '- [Legacy](legacy.md) — Review this\n')
    writeFileSync(join(selectedMemoryDirectory(home), 'legacy.md'), memory('legacy'))
    const context = memoryContext(createHousekeepingSession(options(home, 'audit', { auto_memory: 'transition' })))

    expect(context.selection.selected[0]?.status).toBe('PASS')
    expect(context.selection.reconciliation[0]?.status).toBe('VIOLATION')
    expect(context.index.exists[0]?.status).toBe('PASS')
  })

  test('transition remains visible until explicitly closed, then disabled and empty is clean', () => {
    const home = userHome()
    settings(home, JSON.stringify({ autoMemoryEnabled: false }))
    const transitioning = memoryContext(
      createHousekeepingSession(options(home, 'audit', { auto_memory: 'transition' }))
    )
    const disabled = memoryContext(createHousekeepingSession(options(home, 'audit', { auto_memory: 'disabled' })))

    expect(transitioning.selection.reconciliation[0]?.status).toBe('VIOLATION')
    expect(disabled.selection.reconciliation[0]?.status).toBe('PASS')
    expect(disabled.index.exists[0]?.status).toBe('NOT_APPLICABLE')
  })

  test('disabled custom memory location warns without inspecting the default directory', () => {
    const home = userHome()
    const custom = join(home, '.claude', 'custom-memory')
    mkdirSync(custom, { recursive: true })
    writeFileSync(join(custom, 'legacy.md'), memory('legacy'))
    settings(home, JSON.stringify({ autoMemoryEnabled: false, autoMemoryDirectory: '~/.claude/custom-memory' }))
    const context = memoryContext(createHousekeepingSession(options(home, 'audit', { auto_memory: 'disabled' })))

    expect(context.selection.selected[0]?.status).toBe('PASS')
    expect(context.selection.reconciliation[0]?.subject).toBe('.claude/custom-memory')
    expect(context.selection.reconciliation[0]?.status).toBe('VIOLATION')
    expect(context.index.exists[0]?.status).toBe('NOT_APPLICABLE')
  })

  test('an empty custom memory directory warns only at the selected location', () => {
    const home = userHome()
    const custom = join(home, '.claude', 'custom-memory')
    mkdirSync(custom, { recursive: true })
    mkdirSync(selectedMemoryDirectory(home), { recursive: true })
    writeFileSync(join(selectedMemoryDirectory(home), 'foreign.md'), memory('wrong-name'))
    settings(home, JSON.stringify({ autoMemoryEnabled: false, autoMemoryDirectory: '~/.claude/custom-memory' }))
    const context = memoryContext(createHousekeepingSession(options(home, 'audit')))

    expect(context.selection.reconciliation[0]?.subject).toBe('.claude/custom-memory')
    expect(context.selection.reconciliation[0]?.message).toContain('directory exists')
    expect(JSON.stringify(context)).not.toContain('foreign.md')
    expect(context.index.exists[0]?.status).toBe('NOT_APPLICABLE')
  })

  test('project-local opt-in outranks user default-off and shared project off', () => {
    const home = userHome()
    settings(home, JSON.stringify({ autoMemoryEnabled: false }))
    projectSettings(home, { autoMemoryEnabled: false }, false)
    projectSettings(home, { autoMemoryEnabled: true })
    mkdirSync(selectedMemoryDirectory(home), { recursive: true })
    const context = memoryContext(createHousekeepingSession(options(home, 'audit', { auto_memory: 'enabled' })))

    expect(context.selection.selected[0]?.status).toBe('PASS')
    expect(context.selection.reconciliation[0]?.status).toBe('PASS')
    expect(context.index.exists[0]?.status).toBe('VIOLATION')
  })

  test('project-local off outranks shared project opt-in', () => {
    const home = userHome()
    settings(home, JSON.stringify({ autoMemoryEnabled: false }))
    projectSettings(home, { autoMemoryEnabled: true }, false)
    projectSettings(home, { autoMemoryEnabled: false })
    mkdirSync(selectedMemoryDirectory(home), { recursive: true })
    const context = memoryContext(createHousekeepingSession(options(home, 'audit', { auto_memory: 'disabled' })))

    expect(context.selection.selected[0]?.status).toBe('PASS')
    expect(context.index.exists[0]?.status).toBe('NOT_APPLICABLE')
  })

  test('environment overrides effective settings in either direction', () => {
    const home = userHome()
    settings(home, JSON.stringify({ autoMemoryEnabled: false }))
    projectSettings(home, { autoMemoryEnabled: true })
    mkdirSync(selectedMemoryDirectory(home), { recursive: true })
    const previous = process.env.CLAUDE_CODE_DISABLE_AUTO_MEMORY
    try {
      process.env.CLAUDE_CODE_DISABLE_AUTO_MEMORY = '1'
      expect(
        memoryContext(createHousekeepingSession(options(home, 'audit', { auto_memory: 'transition' }))).index.exists[0]
          ?.status
      ).toBe('NOT_APPLICABLE')
      process.env.CLAUDE_CODE_DISABLE_AUTO_MEMORY = '0'
      expect(
        memoryContext(createHousekeepingSession(options(home, 'audit', { auto_memory: 'transition' }))).index.exists[0]
          ?.status
      ).toBe('VIOLATION')
    } finally {
      if (previous === undefined) delete process.env.CLAUDE_CODE_DISABLE_AUTO_MEMORY
      else process.env.CLAUDE_CODE_DISABLE_AUTO_MEMORY = previous
    }
  })

  test('settings env can disable memory, and a shell override can force it on', () => {
    const home = userHome()
    settings(home, JSON.stringify({ autoMemoryEnabled: false }))
    projectSettings(home, { autoMemoryEnabled: true, env: { CLAUDE_CODE_DISABLE_AUTO_MEMORY: '1' } })
    mkdirSync(selectedMemoryDirectory(home), { recursive: true })
    expect(
      memoryContext(createHousekeepingSession(options(home, 'audit', { auto_memory: 'transition' }))).index.exists[0]
        ?.status
    ).toBe('NOT_APPLICABLE')
    const previous = process.env.CLAUDE_CODE_DISABLE_AUTO_MEMORY
    try {
      process.env.CLAUDE_CODE_DISABLE_AUTO_MEMORY = '0'
      expect(
        memoryContext(createHousekeepingSession(options(home, 'audit', { auto_memory: 'transition' }))).index.exists[0]
          ?.status
      ).toBe('VIOLATION')
    } finally {
      if (previous === undefined) delete process.env.CLAUDE_CODE_DISABLE_AUTO_MEMORY
      else process.env.CLAUDE_CODE_DISABLE_AUTO_MEMORY = previous
    }
  })

  test('does not inspect a guessed directory under a changed Claude project name', () => {
    const home = userHome()
    settings(home, JSON.stringify({ autoMemoryEnabled: false }))
    projectSettings(home, { autoMemoryEnabled: true, env: { CLAUDE_CODE_PROJECT_DIR_NAME: 'elsewhere' } })
    mkdirSync(selectedMemoryDirectory(home), { recursive: true })
    const context = memoryContext(createHousekeepingSession(options(home, 'audit')))

    expect(context.selection.selected[0]?.status).toBe('VIOLATION')
    expect(context.index.exists[0]?.status).toBe('NOT_APPLICABLE')
  })

  test('a user-wide enable is not a scoped opt-in', () => {
    const home = userHome()
    settings(home, JSON.stringify({ autoMemoryEnabled: true }))
    const context = memoryContext(createHousekeepingSession(options(home, 'audit', { auto_memory: 'disabled' })))

    expect(context.selection.selected[0]?.status).toBe('VIOLATION')
    expect(context.selection.selected[0]?.message).toContain('without a project-scoped opt-in')
  })

  test('KI disabled and enabled declarations must match effective project settings', () => {
    const home = userHome()
    settings(home, JSON.stringify({ autoMemoryEnabled: false }))
    mkdirSync(selectedMemoryDirectory(home), { recursive: true })
    writeFileSync(join(selectedMemoryDirectory(home), 'legacy.md'), memory('legacy'))
    const declaredEnabled = memoryContext(createHousekeepingSession(options(home, 'audit', { auto_memory: 'enabled' })))
    expect(declaredEnabled.selection.selected[0]?.status).toBe('VIOLATION')
    expect(declaredEnabled.selection.reconciliation[0]?.status).toBe('PASS')

    projectSettings(home, { autoMemoryEnabled: true })
    const declaredDisabled = memoryContext(
      createHousekeepingSession(options(home, 'audit', { auto_memory: 'disabled' }))
    )
    expect(declaredDisabled.selection.selected[0]?.status).toBe('VIOLATION')
    expect(declaredDisabled.selection.selected[0]?.message).toContain('KI policy declares disabled')
    expect(declaredDisabled.selection.reconciliation[0]?.status).toBe('VIOLATION')
    expect(declaredDisabled.index.exists[0]?.status).toBe('NOT_APPLICABLE')
  })

  test('rejects an unsupported KI lifecycle value without inspecting memory', () => {
    const home = userHome()
    settings(home, JSON.stringify({ autoMemoryEnabled: false }))
    const context = memoryContext(createHousekeepingSession(options(home, 'audit', { auto_memory: 'on' })))

    expect(context.selection.selected[0]?.status).toBe('VIOLATION')
    expect(context.index.exists[0]?.status).toBe('NOT_APPLICABLE')
  })

  test('resolves a contained native override for a worktree without inspecting the default path', () => {
    const home = userHome()
    const worktreeMemory = join(home, '.claude', 'worktrees', 'feature', 'memory')
    mkdirSync(worktreeMemory, { recursive: true })
    writeFileSync(join(worktreeMemory, 'MEMORY.md'), '')
    settings(home, JSON.stringify({ autoMemoryEnabled: false }))
    projectSettings(home, { autoMemoryEnabled: true, autoMemoryDirectory: '~/.claude/worktrees/feature/memory' })
    const session = createHousekeepingSession(options(home, 'audit', { auto_memory: 'enabled' }))
    const context = memoryContext(session)

    expect(session.subjects.find(({ families }) => families.includes('SELECT'))?.subject).toBe(
      '.claude/worktrees/feature/memory'
    )
    expect(context.selection.selected[0]?.status).toBe('PASS')
    expect(context.index.exists[0]?.status).toBe('PASS')
  })

  test('does not treat a disabled or malformed native override as a default-path clean result', () => {
    const home = userHome()
    settings(home, JSON.stringify({ autoMemoryDirectory: false }))
    const disabled = memoryContext(createHousekeepingSession(options(home, 'audit')))
    expect(disabled.selection.selected[0]?.status).toBe('VIOLATION')
    expect(disabled.selection.selected[0]?.message).toContain('unavailable rather than defaulted')

    settings(home, '{')
    const malformed = memoryContext(createHousekeepingSession(options(home, 'audit')))
    expect(malformed.selection.selected[0]?.status).toBe('VIOLATION')
    expect(malformed.selection.selected[0]?.message).toContain('malformed')

    settings(home, JSON.stringify({ autoMemoryDirectory: '.claude/relative-memory' }))
    const relative = memoryContext(createHousekeepingSession(options(home, 'audit')))
    expect(relative.selection.selected[0]?.status).toBe('VIOLATION')
    expect(relative.index.exists[0]?.status).toBe('NOT_APPLICABLE')
  })

  test('rejects an out-of-bounds override and reports malformed index, marker-date, and frontmatter evidence', () => {
    const home = userHome()
    settings(home, JSON.stringify({ autoMemoryDirectory: join(home, 'outside') }))
    const unsafe = memoryContext(createHousekeepingSession(options(home, 'audit')))
    expect(unsafe.selection.selected[0]?.status).toBe('VIOLATION')
    expect(unsafe.selection.selected[0]?.message).toContain('outside')

    const { home: fixtureHome, directory } = fixture()
    writeFileSync(join(directory, 'broken.md'), '---\nname: [\n---\n')
    writeFileSync(
      join(directory, 'MEMORY.md'),
      '- malformed\n<!-- headroom:learn:start -->\n_Auto-generated by `headroom learn` on not-a-date_\n<!-- headroom:learn:end -->\n'
    )
    const context = memoryContext(createHousekeepingSession(enabledOptions(fixtureHome, 'audit')))
    expect(context.index.entriesResolve[0]?.status).toBe('VIOLATION')
    expect(context.index.markers[0]?.status).toBe('VIOLATION')
    expect(context.frontmatter.present.find(({ subject }) => subject?.endsWith('broken.md'))?.status).toBe('VIOLATION')
  })

  test('reports aggregate index bytes without treating a long entry as a native-limit violation', () => {
    const { home, index } = fixture()
    writeFileSync(index, `- [Beta](beta.md) — ${'x'.repeat(500)}\n`)
    const context = memoryContext(createHousekeepingSession(enabledOptions(home, 'audit')))

    expect(context.index.sizeEvidence[0]?.status).toBe('INFO')
    expect(context.index.sizeEvidence[0]?.message).toContain('no effective native aggregate loading limit')
  })
})

test("accepts the Headroom renderer's asterisk-emphasized generation date", () => {
  const { home, directory } = fixture()
  writeFileSync(
    join(directory, 'MEMORY.md'),
    '<!-- headroom:learn:start -->\n*Auto-generated by `headroom learn` on 2026-08-19 — do not edit manually*\n<!-- headroom:learn:end -->\n'
  )
  const context = memoryContext(createHousekeepingSession(enabledOptions(home, 'audit')))
  expect(context.index.markers[0]?.status).toBe('PASS')
})
