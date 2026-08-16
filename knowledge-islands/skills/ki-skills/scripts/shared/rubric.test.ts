#!/usr/bin/env bun
/** Focused contract tests for the generic structured-rubric model and catalogue. */
import { describe, expect, test } from 'bun:test'
import {
  AUTOMATIC_REMEDIATION,
  DIAGNOSTIC_REMEDIATION,
  defineRubricFamily,
  judgment,
  OUTCOME_STATUSES,
  RUBRIC_PHASES,
  type RubricContextOptions,
  type RubricDefinition,
  type RubricItem,
  rubricTypes,
  VIOLATION_LEVELS
} from './rubric.ts'

type RootContext = {
  document: { present: boolean }
  prose: { readable: boolean }
}

const hybrid: RubricItem<RootContext['document']> = {
  code: 'DOC-1',
  title: 'document is present and useful',
  description: 'The document exists and explains its subject usefully.',
  sources: ['STANDARD §1'],
  mechanical: {
    level: 'FAIL',
    remediation: AUTOMATIC_REMEDIATION,
    audit: {
      phase: 'INSPECT',
      run: ({ present }) => [
        { status: present ? 'PASS' : 'VIOLATION', message: present ? 'document is present' : 'document is absent' }
      ]
    },
    conform: {
      phase: 'PRIMARY',
      run: () => {}
    }
  },
  judgment: judgment('Does the document explain its subject usefully?')
}

const diagnostic: RubricItem<RootContext['document']> = {
  code: 'DOC-2',
  title: 'document diagnosis is explicit',
  description: 'A deterministic report-only check names its repair boundary.',
  sources: ['STANDARD §1'],
  mechanical: {
    level: 'WARN',
    remediation: DIAGNOSTIC_REMEDIATION,
    audit: { phase: 'INSPECT', run: () => [] }
  }
}

const guarded: RubricItem<RootContext['document']> = {
  code: 'DOC-3',
  title: 'document repair needs approval',
  description: 'A guarded repair remains a hybrid decision boundary.',
  sources: ['STANDARD §1'],
  mechanical: {
    level: 'WARN',
    remediation: { class: 'guarded', guidance: 'Obtain explicit approval before changing the document.' },
    audit: { phase: 'INSPECT', run: () => [] }
  },
  judgment: judgment('Has the document owner approved this change?')
}

const automaticWithoutConform: RubricItem<RootContext['document']> = {
  code: 'INVALID-1',
  title: 'invalid automatic item',
  description: 'Compile-time rejection fixture.',
  sources: ['STANDARD §1'],
  mechanical: {
    level: 'FAIL',
    // @ts-expect-error automatic remediation requires a conform execution
    remediation: AUTOMATIC_REMEDIATION,
    audit: { phase: 'INSPECT', run: () => [] }
  }
}

const diagnosticWithConform: RubricItem<RootContext['document']> = {
  code: 'INVALID-2',
  title: 'invalid diagnostic item',
  description: 'Compile-time rejection fixture.',
  sources: ['STANDARD §1'],
  mechanical: {
    level: 'FAIL',
    // @ts-expect-error diagnostic remediation forbids a conform execution
    remediation: DIAGNOSTIC_REMEDIATION,
    audit: { phase: 'INSPECT', run: () => [] },
    conform: { phase: 'PRIMARY', run: () => {} }
  }
}

// @ts-expect-error guarded remediation requires a judgment aspect
const guardedWithoutJudgment: RubricItem<RootContext['document']> = {
  code: 'INVALID-3',
  title: 'invalid guarded item',
  description: 'Compile-time rejection fixture.',
  sources: ['STANDARD §1'],
  mechanical: {
    level: 'FAIL',
    remediation: { class: 'guarded', guidance: 'Obtain approval.' },
    audit: { phase: 'INSPECT', run: () => [] }
  }
}

const diagnosticWithoutGuidance: RubricItem<RootContext['document']> = {
  code: 'INVALID-4',
  title: 'invalid diagnostic guidance',
  description: 'Compile-time rejection fixture.',
  sources: ['STANDARD §1'],
  mechanical: {
    level: 'FAIL',
    // @ts-expect-error diagnostic remediation requires specific guidance
    remediation: { class: 'diagnostic' },
    audit: { phase: 'INSPECT', run: () => [] }
  }
}

const documentFamily = defineRubricFamily<RootContext, RootContext['document']>({
  code: 'DOC',
  title: 'Document',
  description: 'Document existence and utility.',
  standard: 'Standard §1',
  selectContext: ({ document }) => document,
  items: [hybrid]
})

const proseFamily = defineRubricFamily<RootContext, RootContext['prose']>({
  code: 'PROSE',
  title: 'Prose',
  description: 'Human review of the prose.',
  standard: 'Standard §2',
  selectContext: ({ prose }) => prose,
  items: [
    {
      code: 'PROSE-1',
      title: 'prose is readable',
      description: 'The prose is readable for its intended audience.',
      sources: ['STANDARD §2'],
      judgment: judgment('Is the prose readable for its intended audience?')
    }
  ]
})

const definition: RubricDefinition<RootContext> = {
  name: 'fixture',
  concern: 'fixture quality',
  families: [documentFamily, proseFamily]
}

const repositorySkillRequests: string[][] = []
const contextOptions: RubricContextOptions = {
  mode: 'conform',
  repository: '/fixture',
  userHome: '/fixture-user',
  configuration: {},
  repositorySkills: {
    inspect: (names) =>
      names.map((name) => ({ name, status: name === 'active-skill' ? 'active' : 'missing', message: 'fixture' })),
    propose: (names) => repositorySkillRequests.push([...names])
  }
}

describe('structured rubric model', () => {
  test('accepts heterogeneous focused family contexts', () => {
    expect(definition.families.map(({ code }) => code)).toEqual(['DOC', 'PROSE'])
  })

  test('derives both aspects from a hybrid item', () => {
    expect(rubricTypes(hybrid)).toEqual(['MECHANICAL', 'JUDGMENT'])
    expect(rubricTypes(diagnostic)).toEqual(['MECHANICAL'])
    expect(rubricTypes(guarded)).toEqual(['MECHANICAL', 'JUDGMENT'])
  })

  test('preserves the phase, violation, and outcome vocabularies', () => {
    expect(RUBRIC_PHASES).toEqual(['PREPARE', 'INSPECT', 'PRIMARY', 'DERIVED', 'NORMALISE'])
    expect(VIOLATION_LEVELS).toEqual(['FAIL', 'WARN'])
    expect(OUTCOME_STATUSES).toEqual(['PASS', 'VIOLATION', 'NOT_APPLICABLE', 'INFO', 'FIXED'])
  })

  test('keeps conform actions distinct from host-owned publication and FIXED outcomes', () => {
    expect(hybrid.mechanical.audit.run({ present: true })).toHaveLength(1)
    expect(hybrid.mechanical.conform?.run({ present: false })).toBeUndefined()
  })

  test('keeps repository-skill activation behind one typed host capability', () => {
    const states = contextOptions.repositorySkills?.inspect(['active-skill', 'missing-skill'])
    contextOptions.repositorySkills?.propose(
      states?.filter(({ status }) => status === 'missing').map(({ name }) => name) ?? []
    )

    expect(states?.map(({ status }) => status)).toEqual(['active', 'missing'])
    expect(repositorySkillRequests).toEqual([['missing-skill']])
  })
})

void [automaticWithoutConform, diagnosticWithConform, guardedWithoutJudgment, diagnosticWithoutGuidance]
