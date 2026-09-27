import { expect, test } from 'bun:test'
import type { RubricContextOptions } from '../../shared/rubric.ts'
import { createPaperclipCoordinationSession } from './coordination.ts'

const outcomes = (configuration: Record<string, unknown>) => {
  const options: RubricContextOptions = {
    mode: 'audit',
    repository: '.',
    userHome: '.',
    configuration
  }
  return createPaperclipCoordinationSession(options).subjects[0]?.context().organisation.outcomes
}

test('organisation code is mandatory and accepts two-letter codes', () => {
  expect(outcomes({ organisation_code: 'ER' })?.map((item) => item.status)).toEqual(['PASS'])
  expect(outcomes({})?.map((item) => item.status)).toEqual(['VIOLATION'])
  expect(outcomes({ organisation_code: 'er' })?.map((item) => item.status)).toEqual(['VIOLATION'])
})

test('unknown organisation configuration is rejected', () => {
  expect(outcomes({ organisation_code: 'KIS', agora: 'ki-all' })?.map((item) => item.message)).toEqual([
    'unrecognised ki-agent-coordination-paperclip configuration key agora'
  ])
})
