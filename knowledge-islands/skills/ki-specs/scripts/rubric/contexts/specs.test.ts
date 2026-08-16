import { afterEach, expect, test } from 'bun:test'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { RubricContextOptions, RubricItem } from '../../shared/rubric.ts'
import { ID } from '../items/identity.ts'
import { INDEX } from '../items/index-family.ts'
import { REQ } from '../items/requirement.ts'
import { VERIFY } from '../items/verification.ts'
import { createSpecsSession } from './specs.ts'

const temporaryDirectories: string[] = []

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

const temporaryDirectory = (prefix: string): string => {
  const directory = mkdtempSync(join(tmpdir(), prefix))
  temporaryDirectories.push(directory)
  return directory
}

const options = (repository: string, mode: 'audit' | 'conform'): RubricContextOptions => ({
  mode,
  repository,
  userHome: tmpdir(),
  configuration: {}
})

const fixture = (): { repository: string; area: string; original: string } => {
  const repository = temporaryDirectory('ki-specs-')
  const directory = join(repository, 'docs', 'specs')
  mkdirSync(directory, { recursive: true })
  writeFileSync(
    join(directory, 'index.md'),
    ['# Specifications', '', '| File | Prefix |', '| --- | --- |', '| authentication.md | AUTH |', ''].join('\n')
  )
  const area = join(directory, 'authentication.md')
  const original = [
    '# Authentication — AUTH',
    '',
    '## Sessions',
    '',
    '### AUTH-001 - Session lifetime',
    '',
    'A session MUST expire.',
    '',
    '_Verify:_ session.test.ts checks expiry.',
    '',
    '### AUTH-002 – Secure cookie',
    '',
    'A cookie MUST be secure.',
    '',
    '_Verify:_ cookie.test.ts checks flags.',
    '',
    '## Gaps',
    '',
    '### This heading is deliberately outside the contract',
    ''
  ].join('\n')
  writeFileSync(area, original)
  return { repository, area, original }
}

const identityContext = (session: ReturnType<typeof createSpecsSession>) => {
  const subject = session.subjects[0]
  if (!subject) throw new Error('ki-specs session did not expose its repository subject')
  return ID.selectContext(subject.context())
}

const identityItem = () => {
  const item = ID.items.find((candidate) => candidate.code === 'ID-1')
  if (!item?.mechanical) throw new Error('ID-1 mechanical item is missing')
  return item.mechanical
}

const mechanicalItem = <Context>(family: { items: readonly RubricItem<Context>[] }, code: string) => {
  const item = family.items.find((candidate) => candidate.code === code)
  if (!item?.mechanical) throw new Error(`${code} mechanical item is missing`)
  return item.mechanical
}

test('audit is read-only and returns one stable prepared context', () => {
  const { repository, area, original } = fixture()
  const session = createSpecsSession(options(repository, 'audit'))
  const subject = session.subjects[0]
  const context = identityContext(session)

  expect(subject?.context()).toBe(subject?.context())
  expect(context.normaliseHeadings).toBeUndefined()
  expect(identityItem().audit.run(context)).toHaveLength(2)
  expect(session.proposal()).toEqual({ writes: [] })
  expect(readFileSync(area, 'utf8')).toBe(original)
})

test('the ID item coalesces heading normalization into one session-owned proposal', () => {
  const { repository, area, original } = fixture()
  const session = createSpecsSession(options(repository, 'conform'))
  const context = identityContext(session)

  identityItem().conform?.run(context)
  identityItem().conform?.run(context)

  expect(session.proposal()).toEqual({
    writes: [
      {
        path: 'docs/specs/authentication.md',
        content: original
          .replace('### AUTH-001 - Session lifetime', '### AUTH-001 — Session lifetime')
          .replace('### AUTH-002 – Secure cookie', '### AUTH-002 — Secure cookie')
      }
    ]
  })
  expect(readFileSync(area, 'utf8')).toBe(original)
})

test('a symlinked area file is not read or proposed for replacement', () => {
  const repository = temporaryDirectory('ki-specs-root-')
  const directory = join(repository, 'docs', 'specs')
  mkdirSync(directory, { recursive: true })
  writeFileSync(
    join(directory, 'index.md'),
    ['# Specifications', '', '| File | Prefix |', '| --- | --- |', '| authentication.md | AUTH |', ''].join('\n')
  )
  const outside = join(temporaryDirectory('ki-specs-outside-'), 'outside.md')
  writeFileSync(outside, '### AUTH-001 - Outside\n')
  symlinkSync(outside, join(directory, 'authentication.md'))
  const session = createSpecsSession(options(repository, 'conform'))

  identityItem().conform?.run(identityContext(session))

  expect(session.proposal()).toEqual({ writes: [] })
  expect(readFileSync(outside, 'utf8')).toBe('### AUTH-001 - Outside\n')
})

test('a symlinked specifications directory is not traversed', () => {
  const repository = temporaryDirectory('ki-specs-linked-root-')
  const outside = temporaryDirectory('ki-specs-linked-target-')
  mkdirSync(join(repository, 'docs'), { recursive: true })
  writeFileSync(join(outside, 'authentication.md'), '### AUTH-001 - Outside\n')
  symlinkSync(outside, join(repository, 'docs', 'specs'))
  const session = createSpecsSession(options(repository, 'conform'))

  identityItem().conform?.run(identityContext(session))

  expect(session.proposal()).toEqual({ writes: [] })
  expect(existsSync(join(outside, 'index.md'))).toBe(false)
  expect(readFileSync(join(outside, 'authentication.md'), 'utf8')).toBe('### AUTH-001 - Outside\n')
})

test('a requirement cannot borrow a keyword or Verify hook from a later H2 or Gaps section', () => {
  const { repository, area } = fixture()
  writeFileSync(
    area,
    [
      '# Authentication — AUTH',
      '',
      '## Sessions',
      '',
      '### AUTH-001 — Session lifetime',
      '',
      'A session expires after issue.',
      '',
      '## Other material',
      '',
      'This text MUST not satisfy AUTH-001.',
      '',
      '_Verify:_ this hook does not belong to AUTH-001.',
      '',
      '## Gaps',
      '',
      '_Verify:_ gaps are outside the numbered contract.',
      ''
    ].join('\n')
  )
  const session = createSpecsSession(options(repository, 'audit'))
  const rootContext = session.subjects[0]?.context()
  const requirementContext = REQ.selectContext(rootContext as never)
  const verificationContext = VERIFY.selectContext(rootContext as never)

  expect(mechanicalItem(REQ, 'REQ-1').audit.run(requirementContext as never)[0]?.status).toBe('VIOLATION')
  expect(mechanicalItem(VERIFY, 'VERIFY-1').audit.run(verificationContext as never)[0]?.status).toBe('VIOLATION')
})

test('duplicate areas-table prefix ownership is reported rather than overwritten', () => {
  const { repository } = fixture()
  writeFileSync(
    join(repository, 'docs/specs/index.md'),
    [
      '# Specifications',
      '',
      '| File | Prefix |',
      '| --- | --- |',
      '| authentication.md | AUTH |',
      '| another.md | AUTH |',
      ''
    ].join('\n')
  )
  const session = createSpecsSession(options(repository, 'audit'))
  const indexContext = INDEX.selectContext(session.subjects[0]?.context() as never)

  expect(mechanicalItem(INDEX, 'INDEX-3').audit.run(indexContext as never)[0]).toMatchObject({
    status: 'VIOLATION',
    message: expect.stringContaining('AUTH')
  })
})
