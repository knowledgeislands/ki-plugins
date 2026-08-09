import { expect, test } from 'bun:test'
import { createTokenomicsSession } from '../contexts/tokenomics.ts'
import { RUBRIC } from './publication.ts'

test('the session supplies one focused generated-rubric publication subject', () => {
  const publication = {
    target: 'references/rubric.md',
    rendered: '',
    state: 'stale' as const,
    propose: () => undefined
  }
  const session = createTokenomicsSession({
    mode: 'audit',
    repository: process.cwd(),
    userHome: process.cwd(),
    configuration: {},
    publication
  })
  const subjects = session.subjects.filter(({ families }) => families.length === 1 && families[0] === 'RUBRIC')

  expect(subjects).toHaveLength(1)
  expect(subjects[0]?.context().rubric.publication).toBe(publication)
  expect(RUBRIC.items[0]?.code).toBe('RUBRIC-1')
})
