import { afterEach, describe, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { KI_SHAPE } from '../items/ki-shape.ts'
import { selectKiSkillsContext } from './contexts.ts'
import { createSkillRubricContext } from './skill.ts'

const temporaryDirectories: string[] = []

const validLocalSkill = `---
name: ki-self
ki-depends-on: []
ki-kind: governance
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

const createSkill = (relativeDirectory: string, frontmatter = ''): string => {
  const root = mkdtempSync(join(tmpdir(), 'ki-skills-local-governance-'))
  temporaryDirectories.push(root)
  const directory = join(root, relativeDirectory)
  mkdirSync(directory, { recursive: true })
  writeFileSync(
    join(directory, 'SKILL.md'),
    frontmatter ? validLocalSkill.replace('ki-depends-on: []', `ki-depends-on: []\n${frontmatter}`) : validLocalSkill
  )
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

describe('explicit skill kind metadata', () => {
  const outcomes = (directory: string) => {
    const shape = evidence(directory).shape
    const item = KI_SHAPE.items.find(({ code }) => code === 'KI-SHAPE-3')
    if (!item?.mechanical || !('audit' in item.mechanical))
      throw new Error('KI-SHAPE-3 mechanical audit is unavailable')
    return { skill: shape.skill, outcomes: item.mechanical.audit.run(shape) }
  }

  test('classifies a process skill from ki-kind rather than body wording', () => {
    const directory = createSkill('.agents/skills/ki-self')
    const skillFile = join(directory, 'SKILL.md')
    writeFileSync(skillFile, validLocalSkill.replace('ki-kind: governance', 'ki-kind: process'))

    const result = outcomes(directory)

    expect(result.skill?.governanceSkill).toBe(false)
    expect(result.outcomes).toEqual([
      { status: 'PASS', message: 'the skill declares an explicit governance or process kind' }
    ])
  })

  test('rejects a missing kind instead of inferring one from prose', () => {
    const directory = createSkill('.agents/skills/ki-self')
    const skillFile = join(directory, 'SKILL.md')
    writeFileSync(skillFile, validLocalSkill.replace('ki-kind: governance\n', ''))

    const result = outcomes(directory)

    expect(result.skill?.governanceSkill).toBe(false)
    expect(result.outcomes).toEqual([
      { status: 'VIOLATION', message: 'missing required `ki-kind: governance | process` frontmatter metadata' }
    ])
  })
})

describe('runtime compatibility metadata', () => {
  const outcomes = (frontmatter: string) => {
    const shape = evidence(createSkill('.agents/skills/ki-self', frontmatter)).shape
    const item = KI_SHAPE.items.find(({ code }) => code === 'KI-SHAPE-18')
    if (!item?.mechanical || !('audit' in item.mechanical))
      throw new Error('KI-SHAPE-18 mechanical audit is unavailable')
    return item.mechanical.audit.run(shape)
  }

  test('accepts one explicit runtime on a runtime-binding skill', () => {
    expect(outcomes('ki-runtime-binding: true\nki-supported-runtimes: [claude-code]')).toEqual([
      { status: 'PASS', message: 'runtime compatibility is explicit and bounded' }
    ])
  })

  test('treats an absent runtime list as portable', () => {
    expect(outcomes('')).toEqual([
      { status: 'PASS', message: 'the skill declares no runtime compatibility restriction' }
    ])
  })

  test.each([
    {
      frontmatter: 'ki-runtime-binding: true\nki-supported-runtimes: []',
      message: '`ki-supported-runtimes:` must be a non-empty single-line flow list'
    },
    {
      frontmatter: 'ki-runtime-binding: true\nki-supported-runtimes: [chatgpt-codex, chatgpt-codex]',
      message: '`ki-supported-runtimes:` must not repeat a runtime'
    },
    {
      frontmatter: 'ki-runtime-binding: true\nki-supported-runtimes: [codex]',
      message: '`ki-supported-runtimes:` names retired runtime(s): codex; use chatgpt-codex'
    },
    {
      frontmatter: 'ki-runtime-binding: true\nki-supported-runtimes: [unknown]',
      message: '`ki-supported-runtimes:` names unknown runtime(s): unknown'
    },
    {
      frontmatter: 'ki-supported-runtimes: [chatgpt-codex]',
      message: 'a runtime-restricted skill must also declare `ki-runtime-binding: true`'
    }
  ])('rejects invalid runtime metadata', ({ frontmatter, message }) => {
    expect(outcomes(frontmatter)).toEqual([{ status: 'VIOLATION', message }])
  })
})
