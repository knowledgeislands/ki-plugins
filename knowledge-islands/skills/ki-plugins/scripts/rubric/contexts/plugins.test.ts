import { afterEach, describe, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { RubricContextOptions } from '../../shared/rubric.ts'
import { PLUG } from '../items/plugins.ts'
import { createPluginsSession } from './plugins.ts'

const roots: string[] = []

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

const temporaryRoot = (): string => {
  const root = mkdtempSync(join(tmpdir(), 'ki-plugins-session-'))
  roots.push(root)
  return root
}

const options = (repository: string, mode: 'audit' | 'conform'): RubricContextOptions => ({
  mode,
  repository,
  userHome: temporaryRoot(),
  configuration: {}
})

const json = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`

const fixture = (): string => {
  const repository = temporaryRoot()
  mkdirSync(join(repository, '.claude-plugin'), { recursive: true })
  mkdirSync(join(repository, 'knowledge-islands', '.claude-plugin'), { recursive: true })
  mkdirSync(join(repository, 'knowledge-islands', 'skills', 'example'), { recursive: true })
  mkdirSync(join(repository, 'knowledge-islands', 'agents'), { recursive: true })
  writeFileSync(
    join(repository, '.claude-plugin', 'marketplace.json'),
    json({
      name: 'ki-plugins',
      owner: { name: 'Knowledge Islands' },
      plugins: [{ name: 'knowledge-islands', source: './knowledge-islands', description: 'Knowledge Islands governance' }]
    })
  )
  writeFileSync(
    join(repository, 'knowledge-islands', '.claude-plugin', 'plugin.json'),
    json({
      name: 'knowledge-islands',
      version: '1.0.0',
      description: 'Knowledge Islands governance',
      author: { name: 'Knowledge Islands' }
    })
  )
  writeFileSync(join(repository, 'knowledge-islands', 'skills', 'example', 'SKILL.md'), '---\nname: example\n---\n')
  writeFileSync(join(repository, 'knowledge-islands', 'agents', 'example.md'), '# Example\n')
  writeFileSync(join(repository, '.ki-config.toml'), '[ki-plugins]\n')
  writeFileSync(join(repository, 'CLAUDE.md'), '# Generated projection\n\nDo not hand-edit generated content.\n')
  writeFileSync(join(repository, 'README.md'), '# Plugin marketplace\n')
  writeFileSync(join(repository, 'LICENSE'), 'Proprietary\n')
  writeFileSync(join(repository, '.gitignore'), '.DS_Store\n')
  return repository
}

const context = (session: ReturnType<typeof createPluginsSession>) => {
  const [subject] = session.subjects
  if (!subject) throw new Error('ki-plugins session did not expose a subject')
  return subject.context()
}

describe('ki-plugins session', () => {
  test('audits one canonical projection and remains report-only in conform', () => {
    const repository = fixture()
    const session = createPluginsSession(options(repository, 'conform'))
    const evidence = context(session)
    const mechanical = PLUG.items.flatMap((item) => (item.mechanical ? item.mechanical.audit.run(evidence) : []))

    expect(session.subjects).toHaveLength(1)
    expect(mechanical.some((outcome) => outcome.status === 'VIOLATION')).toBe(false)
    expect(session.proposal()).toEqual({ writes: [] })
  })

  test('reports an unrelated repository as not applicable', () => {
    const repository = temporaryRoot()
    const evidence = context(createPluginsSession(options(repository, 'audit')))
    const outcome = PLUG.items[0]?.mechanical?.audit.run(evidence)

    expect(outcome?.[0]?.status).toBe('NOT_APPLICABLE')
  })

  test('does not read a symlinked marketplace manifest', () => {
    const repository = temporaryRoot()
    mkdirSync(join(repository, '.claude-plugin'), { recursive: true })
    writeFileSync(join(repository, '.ki-config.toml'), '[ki-plugins]\n')
    writeFileSync(
      join(repository, 'outside.json'),
      json({
        name: 'ki-plugins',
        owner: { name: 'Knowledge Islands' },
        plugins: [{ name: 'knowledge-islands', source: './knowledge-islands', description: 'Outside' }]
      })
    )
    symlinkSync(join(repository, 'outside.json'), join(repository, '.claude-plugin', 'marketplace.json'))
    const evidence = context(createPluginsSession(options(repository, 'audit')))
    const outcome = PLUG.items[0]?.mechanical?.audit.run(evidence)

    expect(outcome?.[0]?.status).toBe('VIOLATION')
    expect(outcome?.[0]?.message).toContain('unsafe')
  })

  test('does not traverse a symlinked repository root', () => {
    const outside = fixture()
    const parent = temporaryRoot()
    const repository = join(parent, 'repository')
    symlinkSync(outside, repository)
    const evidence = context(createPluginsSession(options(repository, 'audit')))
    const outcome = PLUG.items[0]?.mechanical?.audit.run(evidence)

    expect(outcome?.[0]?.status).toBe('VIOLATION')
    expect(outcome?.[0]?.message).toContain('not a physical directory')
  })
})
