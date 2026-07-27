import { afterEach, describe, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createKiSkillsSession } from './subjects.ts'

const temporaryDirectories: string[] = []

const createRepository = (): string => {
  const repository = mkdtempSync(join(tmpdir(), 'ki-skills-session-'))
  temporaryDirectories.push(repository)
  const skillDirectory = join(repository, 'skills', 'ki-example')
  mkdirSync(skillDirectory, { recursive: true })
  writeFileSync(
    join(skillDirectory, 'SKILL.md'),
    `---
name: ki-example
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
    configuration: {}
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
    const subject = session.subjects.find((candidate) => candidate.subject?.endsWith('SKILL.md') && candidate.families.includes('KI-LINK'))

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

    expect(session.proposal().writes[0]?.content).toContain("argument-hint: 'audit | conform | educate | refresh | help'")
  })
})
