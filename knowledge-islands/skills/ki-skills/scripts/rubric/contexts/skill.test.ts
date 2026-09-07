import { afterEach, describe, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { KI_SHAPE } from '../items/ki-shape.ts'
import { OPTIONAL } from '../items/optional.ts'
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

const sourceSkill = (owner: string, options: { declaresHarness?: boolean; refreshOwner?: string } = {}): string => {
  const root = mkdtempSync(join(tmpdir(), 'ki-skills-source-harness-'))
  temporaryDirectories.push(root)
  writeFileSync(
    join(root, '.ki.toml'),
    [
      '[skills.ki-repo]',
      `repository = "https://github.com/example/${owner}"`,
      ...(options.declaresHarness === false ? [] : ['', '[skills.ki-repo-harness]', 'prefix = "example"']),
      ''
    ].join('\n')
  )
  const directory = join(root, 'skills', 'ki-example')
  mkdirSync(directory, { recursive: true })
  const refreshOwner = options.refreshOwner ?? owner
  writeFileSync(
    join(directory, 'SKILL.md'),
    `---
name: ki-example
ki-depends-on: []
ki-kind: governance
description: Example source capability.
argument-hint: 'audit | conform | educate | refresh | help'
---

# KI Example

## Operating modes

### Mode AUDIT

Inspect the selected repository.

### Mode CONFORM

Apply safe corrections.

### Mode EDUCATE

Explain the capability.

### Mode REFRESH

Refresh only the canonical files in ${refreshOwner}. When invoked from an installed copy, stop and redirect to ${refreshOwner}.

### Mode HELP

Describe this capability.
`
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
    shape: selectKiSkillsContext(context, 'shape'),
    optional: selectKiSkillsContext(context, 'optional')
  }
}

const refreshOutcomes = (directory: string) => {
  const shape = evidence(directory).shape
  const item = KI_SHAPE.items.find(({ code }) => code === 'KI-SHAPE-14')
  if (!item?.mechanical || !('audit' in item.mechanical)) throw new Error('KI-SHAPE-14 mechanical audit is unavailable')
  return { skill: shape.skill, outcomes: item.mechanical.audit.run(shape) }
}

const directShapeOutcomes = (directory: string) => {
  const shape = evidence(directory).shape
  const item = KI_SHAPE.items.find(({ code }) => code === 'KI-SHAPE-15')
  if (!item?.mechanical || !('audit' in item.mechanical)) throw new Error('KI-SHAPE-15 mechanical audit is unavailable')
  return item.mechanical.audit.run(shape)
}

describe('repository-local ki-self source', () => {
  test('recognises only the canonical .agents/skills/ki-self shape', () => {
    const result = evidence(createSkill('.agents/skills/ki-self'))

    expect(result.name.name).toBe(result.name.directoryName)
    expect(result.name.localGovernanceSource).toBe(true)
    expect(result.shape.skill?.localGovernanceSource).toBe(true)
    expect(result.shape.skill?.refreshText).toContain('.agents/skills/ki-self/')
  })

  test('requires the native direct catalogue without allowing legacy runners', () => {
    const directory = createSkill('.agents/skills/ki-self')

    expect(directShapeOutcomes(directory)).toContainEqual({
      status: 'VIOLATION',
      message: '`scripts/rubric/items/index.ts` catalogue is required for direct governance operations'
    })

    mkdirSync(join(directory, 'scripts/rubric/items'), { recursive: true })
    writeFileSync(join(directory, 'scripts/rubric/items/index.ts'), 'export default {}\n')

    expect(directShapeOutcomes(directory)).toEqual([
      { status: 'PASS', message: 'governance skills expose no legacy runner entrypoints' }
    ])
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

describe('compatible Harness refresh ownership', () => {
  test.each(['ki-agentic-harness', 'hnr-agentic-harness'])(
    'accepts a declared source Harness naming %s as its configured repository identity',
    (owner) => {
      const result = refreshOutcomes(sourceSkill(owner))

      expect(result.skill?.sourceHarnessName).toBe(owner)
      expect(result.outcomes).toEqual([
        { status: 'PASS', message: `REFRESH states its ${owner} ownership precondition` }
      ])
    }
  )

  test('rejects an unconfigured, malformed, or wrongly named compatible source owner', () => {
    const undeclared = refreshOutcomes(sourceSkill('hnr-agentic-harness', { declaresHarness: false }))
    const malformedDirectory = sourceSkill('hnr-agentic-harness')
    writeFileSync(join(malformedDirectory, '..', '..', '.ki.toml'), '[skills.ki-repo\n')
    const malformed = refreshOutcomes(malformedDirectory)
    const wrongName = refreshOutcomes(sourceSkill('hnr-agentic-harness', { refreshOwner: 'other-agentic-harness' }))

    expect(undeclared.skill?.sourceHarnessName).toBeUndefined()
    expect(undeclared.outcomes[0]?.status).toBe('VIOLATION')
    expect(malformed.skill?.sourceHarnessName).toBeUndefined()
    expect(malformed.outcomes[0]?.status).toBe('VIOLATION')
    expect(wrongName.skill?.sourceHarnessName).toBe('hnr-agentic-harness')
    expect(wrongName.outcomes[0]?.status).toBe('VIOLATION')
  })

  test('reads the compatible owner from the source of an installed copy', () => {
    const source = sourceSkill('hnr-agentic-harness')
    const consumer = mkdtempSync(join(tmpdir(), 'ki-skills-installed-copy-'))
    temporaryDirectories.push(consumer)
    const installed = join(consumer, '.agents', 'skills', 'ki-example')
    mkdirSync(join(consumer, '.agents', 'skills'), { recursive: true })
    symlinkSync(source, installed)

    const result = refreshOutcomes(installed)

    expect(result.skill?.sourceHarnessName).toBe('hnr-agentic-harness')
    expect(result.outcomes[0]?.status).toBe('PASS')
  })
})

describe('tool declaration authority', () => {
  const outcomes = (frontmatter: string) => {
    const optional = evidence(createSkill('.agents/skills/ki-self', frontmatter)).optional
    const item = OPTIONAL.items.find(({ code }) => code === 'OPT-3')
    if (!item?.mechanical || !('audit' in item.mechanical)) throw new Error('OPT-3 mechanical audit is unavailable')
    return item.mechanical.audit.run(optional)
  }

  test('rejects a runtime-only YAML list for portable allowed-tools', () => {
    expect(outcomes('allowed-tools: [Read, Grep]')).toEqual([
      {
        status: 'VIOLATION',
        message: '`allowed-tools` must be a non-empty YAML string scalar of valid tool rules'
      }
    ])
  })

  test('accepts a Claude Code list only for disallowed-tools', () => {
    expect(outcomes('disallowed-tools: [AskUserQuestion, WebSearch]')).toEqual([
      { status: 'PASS', message: 'tool declarations use their portable or runtime-specific shape' }
    ])
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
