import { afterEach, describe, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { RubricContextOptions } from '../../shared/rubric.ts'
import { FILES } from '../items/files.ts'
import { createRepoSession, type FilesRubricContext } from './repository.ts'

const roots: string[] = []

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

const repository = (): string => {
  const root = mkdtempSync(join(tmpdir(), 'ki-repo-session-'))
  roots.push(root)
  mkdirSync(join(root, '.git'))
  return root
}

const options = (root: string, mode: 'audit' | 'conform'): RubricContextOptions => ({
  mode,
  repository: root,
  userHome: root,
  configuration: {}
})

const inspect = (root: string) => ({
  target: root,
  findings: [
    { level: 'FAIL' as const, code: 'FILES-1', message: 'required files are absent' },
    { level: 'FAIL' as const, code: 'FILES-3', message: 'authoring marker is absent' }
  ]
})

const runFilesConform = (context: FilesRubricContext): void => {
  for (const item of FILES.items) item.mechanical?.conform?.run(context)
}

const filesContext = (session: ReturnType<typeof createRepoSession>): FilesRubricContext => {
  const [subject] = session.subjects
  if (!subject) throw new Error('ki-repo session did not expose its repository subject')
  return FILES.selectContext(subject.context())
}

describe('ki-repo session', () => {
  test('coalesces two item actions into one explicit config create plus one gitignore create', () => {
    const root = repository()
    const session = createRepoSession(options(root, 'conform'), inspect)
    const context = filesContext(session)
    runFilesConform(context)

    const proposal = session.proposal()
    expect(proposal.writes.map((write) => write.path)).toEqual(['.ki-config.toml', '.gitignore'])
    expect(proposal.writes[0]?.create).toBe(true)
    expect(proposal.writes[0]?.content).toContain('[ki-repo]')
    expect(proposal.writes[0]?.content).toContain('[ki-authoring]')
  })

  test('appends only a missing exact root marker and preserves the original bytes', () => {
    const root = repository()
    const original = '# retained\n[ki-repo.checks]\nwiki = false\n'
    writeFileSync(join(root, '.ki-config.toml'), original)
    const session = createRepoSession(options(root, 'conform'), inspect)
    runFilesConform(filesContext(session))

    const config = session.proposal().writes.find((write) => write.path === '.ki-config.toml')
    expect(config?.create).toBeUndefined()
    expect(config?.content.startsWith(original)).toBe(true)
    expect(config?.content).toContain('\n[ki-repo]\n')
    expect(config?.content).toContain('\n[ki-authoring]\n')
  })

  test('audit is read-only and unsafe configuration leaves expose no write capability', () => {
    const root = repository()
    writeFileSync(join(root, 'outside.toml'), '[ki-repo]\n')
    symlinkSync('outside.toml', join(root, '.ki-config.toml'))

    const audit = createRepoSession(options(root, 'audit'), inspect)
    expect(audit.proposal()).toEqual({ writes: [] })

    const conform = createRepoSession(options(root, 'conform'), inspect)
    const context = filesContext(conform)
    expect(context.ensureRepoConfiguration).toBeUndefined()
    expect(context.ensureAuthoringConfiguration).toBeUndefined()
  })
})
