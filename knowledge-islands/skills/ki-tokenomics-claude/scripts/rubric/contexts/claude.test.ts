import { describe, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createClaudeSession } from './claude.ts'

describe('Claude tokenomics context', () => {
  test('observes only selected repository sources and writes nothing', () => {
    const root = mkdtempSync(join(tmpdir(), 'claude-tokenomics-'))
    try {
      mkdirSync(join(root, '.claude', 'rules'), { recursive: true })
      writeFileSync(join(root, 'CLAUDE.md'), '@./notes.md\n```\n@./ignored.md\n```\n')
      writeFileSync(join(root, 'notes.md'), 'Grounding.\n')
      writeFileSync(join(root, '.claude', 'settings.json'), '{}')
      writeFileSync(join(root, '.mcp.json'), '{}')
      const session = createClaudeSession({
        mode: 'audit',
        repository: root,
        userHome: join(root, 'forbidden-home'),
        configuration: {}
      })
      const evidence = session.subjects[0]?.context().claude
      expect(evidence?.surface.some((item) => item.message.includes('ignored.md'))).toBe(false)
      expect(evidence?.surface.some((item) => item.status === 'PASS')).toBe(true)
      expect(evidence?.unavailable.map((item) => item.message).join(' ')).toContain('Effective model')
      expect(session.proposal()).toEqual({ writes: [] })
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('rejects importer-relative escape and malformed project sources', () => {
    const root = mkdtempSync(join(tmpdir(), 'claude-tokenomics-'))
    try {
      writeFileSync(join(root, 'CLAUDE.md'), '@../outside.md\n')
      mkdirSync(join(root, '.claude'), { recursive: true })
      writeFileSync(join(root, '.claude', 'settings.json'), '{bad')
      const session = createClaudeSession({ mode: 'audit', repository: root, userHome: root, configuration: {} })
      const evidence = session.subjects[0]?.context().claude.surface
      expect(evidence?.some((item) => item.status === 'VIOLATION' && item.message.includes('out-of-scope'))).toBe(true)
      expect(evidence?.some((item) => item.status === 'VIOLATION' && item.message.includes('malformed'))).toBe(true)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})
