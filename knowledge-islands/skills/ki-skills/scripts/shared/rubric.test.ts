#!/usr/bin/env bun
/** Focused contract tests for the generic structured-rubric model and catalogue. */
import { describe, expect, test } from 'bun:test'
import {
  defineRubricFamily,
  OUTCOME_STATUSES,
  RUBRIC_PHASES,
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
    audit: {
      phase: 'INSPECT',
      run: ({ present }) => [{ status: present ? 'PASS' : 'VIOLATION', message: present ? 'document is present' : 'document is absent' }]
    },
    conform: {
      phase: 'PRIMARY',
      run: () => {}
    }
  },
  judgment: { prompt: 'Does the document explain its subject usefully?' }
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
      judgment: { prompt: 'Is the prose readable for its intended audience?' }
    }
  ]
})

const definition: RubricDefinition<RootContext> = {
  name: 'fixture',
  concern: 'fixture quality',
  families: [documentFamily, proseFamily]
}

describe('structured rubric model', () => {
  test('accepts heterogeneous focused family contexts', () => {
    expect(definition.families.map(({ code }) => code)).toEqual(['DOC', 'PROSE'])
  })

  test('derives both aspects from a hybrid item', () => {
    expect(rubricTypes(hybrid)).toEqual(['MECHANICAL', 'JUDGMENT'])
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
})
