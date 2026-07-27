import { afterEach, describe, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { selectKiSkillsContext } from './contexts.ts'
import { createSkillRubricContext } from './skill.ts'

const temporaryDirectories: string[] = []

const validLocalSkill = `---
name: ki-self
ki-depends-on: []
description: Repository-local governance.
argument-hint: 'audit | conform | educate | refresh | help'
---

# KI Self

## Operating modes

HELP describes this local boundary.

### Mode AUDIT

Check the repository.

### Mode CONFORM

Apply safe fixes.

### Mode EDUCATE

Explain the local workflow.

### Mode REFRESH

Refresh only this committed .agents/skills/ki-self/ source. If a rule is reusable, stop and promote it to its shared owner.

### Mode HELP

Describe this local boundary.
`

const createSkill = (relativeDirectory: string): string => {
  const root = mkdtempSync(join(tmpdir(), 'ki-skills-local-governance-'))
  temporaryDirectories.push(root)
  const directory = join(root, relativeDirectory)
  mkdirSync(directory, { recursive: true })
  writeFileSync(join(directory, 'SKILL.md'), validLocalSkill)
  return directory
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

const evidence = (directory: string) => {
  const context = createSkillRubricContext(directory).context
  return {
    name: selectKiSkillsContext(context, 'name'),
    shape: selectKiSkillsContext(context, 'shape')
  }
}

describe('repository-local ki-self source', () => {
  test('recognises only the canonical .agents/skills/ki-self shape', () => {
    const result = evidence(createSkill('.agents/skills/ki-self'))

    expect(result.name.name).toBe(result.name.directoryName)
    expect(result.name.localGovernanceSource).toBe(true)
    expect(result.shape.skill?.localGovernanceSource).toBe(true)
    expect(result.shape.skill?.refreshText).toContain('.agents/skills/ki-self/')
  })

  test.each([
    { relativeDirectory: 'ki-self', nameMatchesDirectory: true },
    { relativeDirectory: '.agents/skills/not-ki-self', nameMatchesDirectory: false }
  ])('does not mark an invalid lookalike as the local source', ({ relativeDirectory, nameMatchesDirectory }) => {
    const result = evidence(createSkill(relativeDirectory))

    expect(result.name.name === result.name.directoryName).toBe(nameMatchesDirectory)
    expect(result.name.localGovernanceSource).toBe(false)
    expect(result.shape.skill?.localGovernanceSource).toBe(false)
  })
})
