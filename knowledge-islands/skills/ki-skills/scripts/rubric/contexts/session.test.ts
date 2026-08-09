import { afterEach, describe, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
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
