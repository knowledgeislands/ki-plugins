import { describe, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createClaudeSession } from './claude.ts'

describe('Claude tokenomics context', () => {
  test('keeps repository evidence selected and writes nothing', () => {
    const home = mkdtempSync(join(tmpdir(), 'claude-tokenomics-'))
    try {
      const repo = join(home, 'repo')
      mkdirSync(join(home, '.claude'), { recursive: true })
      mkdirSync(join(repo, '.claude'), { recursive: true })
      writeFileSync(join(home, '.claude', 'settings.json'), JSON.stringify({ model: 'default' }))
      writeFileSync(join(repo, '.claude', 'settings.json'), JSON.stringify({ model: 'effective' }))
      const session = createClaudeSession({ mode: 'audit', repository: repo, userHome: home, configuration: {} })
      expect(
        session.subjects[0]
          ?.context()
          .claude.models.map((item) => item.message)
          .join(' ')
      ).toContain('effective')
      expect(session.proposal()).toEqual({ writes: [] })
    } finally {
      rmSync(home, { recursive: true, force: true })
    }
  })
})
