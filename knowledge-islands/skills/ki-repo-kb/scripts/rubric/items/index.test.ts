import { afterEach, expect, test } from 'bun:test'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import { collectKbAuditEvidence, type KbRubricContext, ZONES } from '../contexts/kb.ts'
import catalogue from './index.ts'

const temporaryDirectories: string[] = []
const families = catalogue.families.filter((family) => family.code !== 'RUBRIC') as unknown as readonly RubricFamily<
  KbRubricContext,
  unknown
>[]
const items = families.flatMap((family) => family.items) as readonly RubricItem<unknown>[]
const familyModules = readdirSync(import.meta.dir)
  .filter((file) => file.endsWith('.ts') && file !== 'index.ts' && !file.endsWith('.test.ts'))
  .sort()

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

const createBase = (): string => {
  const repository = mkdtempSync(join(tmpdir(), 'ki-repo-kb-session-'))
  temporaryDirectories.push(repository)
  writeFileSync(join(repository, '.ki.toml'), '[skills.ki-repo-kb]\n')
  writeFileSync(join(repository, 'AGENTS.md'), '# Base guidance\n\nLoad Admin/MEMORY.md before work.\n')
  for (const zone of ZONES) mkdirSync(join(repository, zone), { recursive: true })
  return repository
}

test('the structured catalogue preserves every KB criterion', () => {
  expect(catalogue.contract).toBe(1)
  expect(catalogue.name).toBe('ki-repo-kb')
  expect(catalogue.createSession).toBeFunction()
  expect(catalogue.families.map((family) => family.code)).toEqual([
    'RUBRIC',
    'ZONE',
    'CONFIG',
    'ADMIN',
    'ROUTE',
    'NOTE',
    'MEM',
    'LINK'
  ])
  expect(items.map((item) => item.code)).toEqual([
    'ZONE-1',
    'ZONE-2',
    'ZONE-3',
    'ZONE-4',
    'ZONE-5',
    'CONFIG-0',
    'CONFIG-1',
    'CONFIG-2',
    'CONFIG-3',
    'CONFIG-4',
    'CONFIG-5',
    'ADMIN-1',
    'ADMIN-2',
    'ADMIN-3',
    'ROUTE-1',
    'NOTE-1',
    'NOTE-1a',
    'NOTE-1b',
    'NOTE-1c',
    'NOTE-2',
    'NOTE-3',
    'MEM-1',
    'MEM-2',
    'LINK-1'
  ])
  expect(items.filter((item) => item.judgment)).toHaveLength(6)
  expect(items.filter((item) => item.judgment).every((item) => Boolean(item.judgment?.prompt.trim()))).toBe(true)
})

test('each family module exports one complete family', async () => {
  for (const file of familyModules) {
    const module = (await import(`./${file}`)) as Record<string, unknown>
    expect(Object.keys(module)).toHaveLength(1)
    const family = Object.values(module)[0] as { code?: unknown; items?: unknown }
    expect(typeof family.code).toBe('string')
    expect(Array.isArray(family.items)).toBe(true)
  }
})

test('audit is read-only and returns one stable focused context', () => {
  const repository = createBase()
  const session = catalogue.createSession({ mode: 'audit', repository, userHome: tmpdir(), configuration: {} })
  const subject = session.subjects[1]
  const context = subject?.context()

  expect(subject?.context()).toBe(context)
  for (const family of families) {
    const familyContext = family.selectContext(context as KbRubricContext)
    for (const item of family.items) item.mechanical?.audit.run(familyContext)
  }

  expect(session.proposal()).toEqual({ writes: [] })
  expect(existsSync(join(repository, 'Admin', 'Admin.md'))).toBe(false)
  expect(existsSync(join(repository, 'Admin', 'MEMORY.md'))).toBe(false)
})

test('index and MEMORY actions aggregate safe creates behind one session proposal', () => {
  const repository = createBase()
  const session = catalogue.createSession({ mode: 'conform', repository, userHome: tmpdir(), configuration: {} })
  const context = session.subjects[1]?.context() as KbRubricContext
  const zone = families.find((family) => family.code === 'ZONE')
  const zoneContext = zone?.selectContext(context)
  for (const code of ['ZONE-2', 'ZONE-3'])
    zone?.items.find((item) => item.code === code)?.mechanical?.conform?.run(zoneContext)

  expect(session.proposal().writes).toEqual([
    { path: 'Admin/Admin.md', content: '# Admin\n', create: true },
    {
      path: 'Admin/MEMORY.md',
      content: '# MEMORY\n\n## Active Pillars\n\n<!-- list active Pillars here -->\n',
      create: true
    },
    { path: 'Calendar/Calendar.md', content: '# Calendar\n', create: true },
    { path: 'Pillars/Pillars.md', content: '# Pillars\n', create: true },
    { path: 'Resources/Resources.md', content: '# Resources\n', create: true },
    { path: 'Streams/Streams.md', content: '# Streams\n', create: true }
  ])
  expect(existsSync(join(repository, 'Admin', 'Admin.md'))).toBe(false)
  expect(existsSync(join(repository, 'Admin', 'MEMORY.md'))).toBe(false)
})

test('a symlinked output is never proposed or followed', () => {
  const repository = createBase()
  const outside = join(repository, 'outside.md')
  writeFileSync(outside, 'outside\n')
  symlinkSync(outside, join(repository, 'Admin', 'Admin.md'))
  const session = catalogue.createSession({ mode: 'conform', repository, userHome: tmpdir(), configuration: {} })
  const context = session.subjects[1]?.context() as KbRubricContext
  const zone = families.find((family) => family.code === 'ZONE')
  zone?.items.find((item) => item.code === 'ZONE-2')?.mechanical?.conform?.run(zone.selectContext(context))

  expect(session.proposal().writes.some((write) => write.path === 'Admin/Admin.md')).toBe(false)
  expect(readFileSync(outside, 'utf8')).toBe('outside\n')
})

test('a zone alias through an intermediate symlink produces no unsafe proposal', () => {
  const repository = createBase()
  const outside = mkdtempSync(join(tmpdir(), 'ki-repo-kb-outside-'))
  temporaryDirectories.push(outside)
  mkdirSync(join(outside, 'Resources', 'linked'), { recursive: true })
  symlinkSync(outside, join(repository, 'linked'))
  writeFileSync(
    join(repository, '.ki.toml'),
    ['[skills.ki-repo-kb]', '', '[skills.ki-repo-kb.zones]', 'Resources = "linked/Resources"', ''].join('\n')
  )
  const session = catalogue.createSession({ mode: 'conform', repository, userHome: tmpdir(), configuration: {} })
  const context = session.subjects[1]?.context() as KbRubricContext
  const zone = families.find((family) => family.code === 'ZONE')
  zone?.items.find((item) => item.code === 'ZONE-2')?.mechanical?.conform?.run(zone.selectContext(context))

  expect(session.proposal().writes.some((write) => write.path.startsWith('linked/'))).toBe(false)
  expect(existsSync(join(outside, 'Resources', 'linked', 'Resources.md'))).toBe(false)
})

test('ZONE-1 accepts a readable zone symlink resolving to a directory', () => {
  const repository = createBase()
  const outside = mkdtempSync(join(tmpdir(), 'ki-repo-kb-resources-'))
  temporaryDirectories.push(outside)
  rmSync(join(repository, 'Resources'), { recursive: true })
  symlinkSync(outside, join(repository, 'Resources'))

  expect(
    collectKbAuditEvidence(repository).filter(
      (finding) => finding.code === 'ZONE-1' && finding.subject === 'Resources/'
    )
  ).toEqual([
    {
      level: 'PASS',
      code: 'ZONE-1',
      message: 'Required zone Resources is present.',
      subject: 'Resources/'
    }
  ])
})

test('ZONE-1 rejects dangling and file-valued zone symlinks', () => {
  for (const target of ['missing', 'file']) {
    const repository = createBase()
    const destination = join(repository, `${target}-target`)
    if (target === 'file') writeFileSync(destination, 'not a directory\n')
    rmSync(join(repository, 'Resources'), { recursive: true })
    symlinkSync(destination, join(repository, 'Resources'))

    expect(
      collectKbAuditEvidence(repository).filter(
        (finding) => finding.code === 'ZONE-1' && finding.subject === 'Resources/'
      )
    ).toEqual([
      {
        level: 'FAIL',
        code: 'ZONE-1',
        message: 'Required zone Resources is missing.',
        subject: 'Resources/'
      }
    ])
  }
})

test('governed note frontmatter requires note_type and rejects the generic type field', () => {
  const repository = createBase()
  const note = join(repository, 'Pillars', 'Note.md')
  writeFileSync(note, '---\nnote_type: pillars/note\n---\n\n# Note\n')

  expect(collectKbAuditEvidence(repository).filter((finding) => finding.code === 'NOTE-1c')).toEqual([
    {
      level: 'PASS',
      code: 'NOTE-1c',
      message: 'Frontmatter uses note_type and does not use the legacy type field.'
    }
  ])

  writeFileSync(note, '---\ntype: pillars/note\n---\n\n# Note\n')

  expect(collectKbAuditEvidence(repository).filter((finding) => finding.code === 'NOTE-1c')).toEqual([
    {
      level: 'FAIL',
      code: 'NOTE-1c',
      message: 'Invalid note-type metadata: missing note_type: Pillars/Note.md; legacy type: Pillars/Note.md.'
    }
  ])
})

test('adapter and protocol records delegate note-type metadata to their owning skills', () => {
  const repository = createBase()
  const records = [
    'Streams/Roadmap/ITEM.md',
    'Streams/Housekeeping/TEMPLATE.md',
    '+/_AUTHORISATIONS/KI-EXAMPLE-BATCH-001.md',
    '+/_TRADES/sender/repository/TRD-01234567.md',
    '-/_TRADES/receiver/repository/TRD-89abcdef.md'
  ]
  for (const relativePath of records) {
    const path = join(repository, relativePath)
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, '---\nstatus: active\n---\n\n# Delegated record\n')
  }

  expect(collectKbAuditEvidence(repository).filter((finding) => finding.code === 'NOTE-1c')).toEqual([
    {
      level: 'PASS',
      code: 'NOTE-1c',
      message: 'Frontmatter uses note_type and does not use the legacy type field.'
    }
  ])
})

test('direct KB digest and handoff notes remain governed by note_type', () => {
  const repository = createBase()
  const digest = join(repository, '-', '_DIGESTS', 'Digest.md')
  const handoff = join(repository, '-', '_TRADES', 'Handoff.md')
  mkdirSync(dirname(digest), { recursive: true })
  mkdirSync(dirname(handoff), { recursive: true })
  writeFileSync(digest, '---\ntype: session-digest\n---\n\n# Digest\n')
  writeFileSync(handoff, '---\nstatus: ready\n---\n\n# Handoff\n')

  const finding = collectKbAuditEvidence(repository).find((candidate) => candidate.code === 'NOTE-1c')
  expect(finding).toMatchObject({ level: 'FAIL', code: 'NOTE-1c' })
  expect(finding?.message).toContain('missing note_type:')
  expect(finding?.message).toContain('-/_DIGESTS/Digest.md')
  expect(finding?.message).toContain('-/_TRADES/Handoff.md')
  expect(finding?.message).toContain('legacy type: -/_DIGESTS/Digest.md')
})
