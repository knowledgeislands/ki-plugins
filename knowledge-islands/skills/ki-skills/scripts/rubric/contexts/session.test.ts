import { afterEach, describe, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { NAME } from '../items/name.ts'
import { createKiSkillsSession } from './subjects.ts'

const temporaryDirectories: string[] = []

const createRepository = (name = 'ki-example'): string => {
  const repository = mkdtempSync(join(tmpdir(), 'ki-skills-session-'))
  temporaryDirectories.push(repository)
  const skillDirectory = join(repository, 'skills', name)
  mkdirSync(skillDirectory, { recursive: true })
  writeFileSync(
    join(skillDirectory, 'SKILL.md'),
    `---
name: ${name}
ki-depends-on: []
description: Checks a small example skill.
argument-hint: 'audit'
---

# Example
`
  )
  return repository
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

const createSession = (mode: 'audit' | 'conform') =>
  createKiSkillsSession({
    mode,
    repository: createRepository(),
    userHome: tmpdir(),
    configuration: {},
    publication: {
      target: 'references/rubric.md',
      rendered: '',
      state: 'in-sync',
      propose: () => {}
    }
  })

describe('ki-skills session evidence', () => {
  test('builds each audit subject context once', () => {
    const session = createSession('audit')
    const initialContexts = session.subjects.map((subject) => subject.context())

    for (const [index, subject] of session.subjects.entries()) {
      expect(subject.context()).toBe(initialContexts[index])
    }
  })

  test('keeps conform draft capabilities on the cached subject context', () => {
    const session = createSession('conform')
    const subject = session.subjects.find(
      (candidate) => candidate.subject?.endsWith('SKILL.md') && candidate.families.includes('KI-LINK')
    )

    expect(subject).toBeDefined()
    const initial = subject?.context()
    const repeated = subject?.context()
    expect(repeated).toBe(initial)
    expect(repeated?.layout?.writeMarkdown).toBe(initial?.layout?.writeMarkdown)

    const content = `${initial?.layout?.sourceMarkdown ?? ''}\nUpdated in the shared draft.\n`
    initial?.layout?.writeMarkdown?.(content)

    expect(session.proposal().writes).toEqual([
      {
        path: 'skills/ki-example/SKILL.md',
        content
      }
    ])
  })

  test('coalesces item-owned argument-hint changes in the shared draft', () => {
    const session = createSession('conform')
    const subject = session.subjects.find((candidate) => candidate.subject === 'skills/ki-example')
    const shape = subject?.context().shape

    shape?.addArgumentHintVerbs?.(['conform', 'educate'])
    shape?.addArgumentHintVerbs?.(['refresh', 'help'])

    expect(session.proposal().writes[0]?.content).toContain(
      "argument-hint: 'audit | conform | educate | refresh | help'"
    )
  })

  test('inserts the physical directory name without changing unrelated skill bytes', () => {
    const repository = createRepository()
    const skillFile = join(repository, 'skills', 'ki-example', 'SKILL.md')
    const original = readFileSync(skillFile, 'utf8').replace('name: ki-example\n', '')
    writeFileSync(skillFile, original)
    const session = createKiSkillsSession({
      mode: 'conform',
      repository,
      userHome: tmpdir(),
      configuration: {}
    })
    const subject = session.subjects.find((candidate) => candidate.subject === 'skills/ki-example')
    const context = subject?.context().name
    const item = NAME.items.find(({ code }) => code === 'NAME-1')
    if (!context || !item?.mechanical?.conform) throw new Error('NAME-1 conform context is unavailable')

    item.mechanical.conform.run(context)

    const [write] = session.proposal().writes
    expect(write?.path).toBe('skills/ki-example/SKILL.md')
    expect(write?.content).toBe(original.replace('ki-depends-on: []', 'ki-depends-on: []\nname: ki-example'))
    if (!write) throw new Error('NAME-1 did not produce its expected write')
    writeFileSync(skillFile, write.content)

    const repeated = createKiSkillsSession({
      mode: 'conform',
      repository,
      userHome: tmpdir(),
      configuration: {}
    })
    const repeatedSubject = repeated.subjects.find((candidate) => candidate.subject === 'skills/ki-example')
    const repeatedContext = repeatedSubject?.context().name
    if (!repeatedContext) throw new Error('repeated NAME-1 context is unavailable')
    item.mechanical.conform.run(repeatedContext)
    expect(item.mechanical.audit.run(repeatedContext)).toEqual([{ status: 'PASS', message: 'name is present' }])
    expect(repeated.proposal()).toEqual({ writes: [] })
  })

  test('does not expose name conformance through a symbolic SKILL.md', () => {
    const repository = createRepository()
    const skillFile = join(repository, 'skills', 'ki-example', 'SKILL.md')
    const outside = join(repository, 'outside.md')
    const content = readFileSync(skillFile, 'utf8').replace('name: ki-example\n', '')
    writeFileSync(outside, content)
    rmSync(skillFile)
    symlinkSync('../../outside.md', skillFile)

    const session = createKiSkillsSession({
      mode: 'conform',
      repository,
      userHome: tmpdir(),
      configuration: {}
    })
    const subject = session.subjects.find((candidate) => candidate.subject === 'skills/ki-example')
    expect(subject?.context().name?.setName).toBeUndefined()
    expect(session.proposal()).toEqual({ writes: [] })
    expect(readFileSync(outside, 'utf8')).toBe(content)
  })

  test('routes the host publication capability to one dedicated rubric subject', () => {
    const publication = {
      target: 'references/rubric.md',
      rendered: '# Rubric\n',
      state: 'stale' as const,
      propose: () => {}
    }
    const session = createKiSkillsSession({
      mode: 'audit',
      repository: createRepository('ki-skills'),
      userHome: tmpdir(),
      configuration: {},
      publication
    })
    const rubricSubjects = session.subjects.filter((subject) => subject.families.includes('RUBRIC'))

    expect(rubricSubjects).toHaveLength(1)
    expect(rubricSubjects[0]?.subject).toBe('skills/ki-skills')
    expect(rubricSubjects[0]?.context().rubric?.publication).toBe(publication)
  })
})
