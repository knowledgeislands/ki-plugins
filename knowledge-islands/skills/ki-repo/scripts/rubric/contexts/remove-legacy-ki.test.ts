import { afterEach, describe, expect, test } from 'bun:test'
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const roots: string[] = []
const script = fileURLToPath(new URL('../../remove-legacy-ki.mjs', import.meta.url))

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

const repository = (): string => {
  const root = mkdtempSync(join(tmpdir(), 'ki-legacy-cleanup-'))
  roots.push(root)
  execFileSync('git', ['init', '--quiet', root])
  return root
}

const run = (root: string) => spawnSync('node', [script, root], { encoding: 'utf8' })

describe('legacy .ki cleanup', () => {
  test('removes only untracked audits and conform output plus empty parent', () => {
    const root = repository()
    mkdirSync(join(root, '.ki', 'audits'), { recursive: true })
    mkdirSync(join(root, '.ki', 'conform', 'nested'), { recursive: true })
    writeFileSync(join(root, '.ki', 'audits', 'audit.json'), '{}')
    writeFileSync(join(root, '.ki', 'conform', 'nested', 'proposal.json'), '{}')

    const result = run(root)

    expect(result.status).toBe(0)
    expect(result.stdout).toContain('removed untracked legacy')
    expect(existsSync(join(root, '.ki'))).toBe(false)
  })

  test('refuses an unrecognised path without removing recognised output', () => {
    const root = repository()
    mkdirSync(join(root, '.ki', 'audits'), { recursive: true })
    mkdirSync(join(root, '.ki', 'other'), { recursive: true })
    writeFileSync(join(root, '.ki', 'audits', 'audit.json'), '{}')
    writeFileSync(join(root, '.ki', 'other', 'keep.txt'), 'keep')

    const result = run(root)

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('unrecognised path')
    expect(existsSync(join(root, '.ki', 'audits', 'audit.json'))).toBe(true)
    expect(existsSync(join(root, '.ki', 'other', 'keep.txt'))).toBe(true)
  })

  test('refuses tracked legacy output', () => {
    const root = repository()
    mkdirSync(join(root, '.ki', 'audits'), { recursive: true })
    writeFileSync(join(root, '.ki', 'audits', 'tracked.json'), '{}')
    execFileSync('git', ['-C', root, 'add', '.ki/audits/tracked.json'])

    const result = run(root)

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('contains tracked paths')
    expect(existsSync(join(root, '.ki', 'audits', 'tracked.json'))).toBe(true)
  })

  test('refuses symlinks inside a recognised output root', () => {
    const root = repository()
    mkdirSync(join(root, '.ki', 'audits'), { recursive: true })
    writeFileSync(join(root, 'outside.txt'), 'keep')
    symlinkSync(join(root, 'outside.txt'), join(root, '.ki', 'audits', 'linked.txt'))

    const result = run(root)

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('symlink found')
    expect(existsSync(join(root, 'outside.txt'))).toBe(true)
  })
})
