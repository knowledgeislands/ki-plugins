import { afterEach, describe, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { RubricContextOptions } from '../../shared/rubric.ts'
import { createTokenomicsSession } from './user.ts'

const roots: string[] = []

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

const userHome = (): string => {
  const root = mkdtempSync(join(tmpdir(), 'ki-tokenomics-session-'))
  roots.push(root)
  return root
}

const options = (home: string, mode: 'audit' | 'conform'): RubricContextOptions => ({
  mode,
  repository: join(home, 'repository'),
  userHome: home,
  configuration: {}
})

const context = (session: ReturnType<typeof createTokenomicsSession>) => {
  const [subject] = session.subjects
  if (!subject) throw new Error('ki-tokenomics session did not expose a subject')
  return subject.context()
}

describe('ki-tokenomics session', () => {
  test('reports the bounded user layer once and remains read-only in conform', () => {
    const home = userHome()
    mkdirSync(join(home, '.claude', 'skills', 'example'), { recursive: true })
    writeFileSync(join(home, '.claude', 'CLAUDE.md'), '# User instructions\n')
    writeFileSync(join(home, '.claude', 'skills', 'example', 'SKILL.md'), '---\nname: example\ndescription: Example skill\n---\n')
    writeFileSync(join(home, '.claude.json'), JSON.stringify({ mcpServers: { headroom: { command: 'headroom', args: ['mcp', 'serve'] } } }))

    const session = createTokenomicsSession(options(home, 'conform'))
    const evidence = context(session)

    expect(session.subjects).toHaveLength(1)
    expect(evidence.surface.instructions[0]?.status).toBe('PASS')
    expect(evidence.surface.skills[0]?.status).toBe('PASS')
    expect(evidence.mcp.servers[0]?.message).toContain('headroom')
    expect(evidence.tooling.detected[0]?.status).toBe('PASS')
    expect(session.proposal()).toEqual({ writes: [] })
  })

  test('does not traverse a symlinked Claude root', () => {
    const home = userHome()
    const outside = join(home, 'outside')
    mkdirSync(join(outside, 'skills', 'example'), { recursive: true })
    writeFileSync(join(outside, 'CLAUDE.md'), '# Outside\n')
    writeFileSync(join(outside, 'skills', 'example', 'SKILL.md'), '---\nname: example\ndescription: Outside\n---\n')
    symlinkSync(outside, join(home, '.claude'))

    const evidence = context(createTokenomicsSession(options(home, 'audit')))

    expect(evidence.surface.instructions[0]?.status).toBe('NOT_APPLICABLE')
    expect(evidence.surface.skills[0]?.status).toBe('NOT_APPLICABLE')
  })

  test('reports an out-of-scope instruction import without reading it', () => {
    const home = userHome()
    mkdirSync(join(home, '.claude'), { recursive: true })
    writeFileSync(join(home, 'outside.md'), '# Outside\n')
    writeFileSync(join(home, '.claude', 'CLAUDE.md'), '# User instructions\n@~/outside.md\n')

    const evidence = context(createTokenomicsSession(options(home, 'audit')))

    expect(evidence.surface.instructions.map((result) => result.status)).toEqual(['PASS', 'VIOLATION'])
    expect(evidence.surface.instructions[1]?.message).toContain('out-of-scope')
  })

  test('refuses symlinked user settings and desktop configuration', () => {
    const home = userHome()
    mkdirSync(join(home, '.claude'), { recursive: true })
    writeFileSync(join(home, 'outside.json'), JSON.stringify({ mcpServers: { headroom: { command: 'headroom' } } }))
    symlinkSync(join(home, 'outside.json'), join(home, '.claude', 'settings.json'))
    symlinkSync(join(home, 'outside.json'), join(home, '.claude.json'))

    const evidence = context(createTokenomicsSession(options(home, 'audit')))

    expect(evidence.mcp.servers[0]?.message).toBe('No user MCP servers configured.')
    expect(evidence.tooling.detected[0]?.status).toBe('INFO')
    expect(evidence.tooling.expectation[0]?.level).toBe('WARN')
  })
})
