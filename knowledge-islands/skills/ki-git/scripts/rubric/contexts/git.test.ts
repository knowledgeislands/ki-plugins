import { expect, test } from 'bun:test'
import { resolve } from 'node:path'
import { createGitSession } from './git.ts'

test('the Git session exposes a dedicated publication subject and immutable review subject', () => {
  const session = createGitSession({
    mode: 'audit',
    repository: '.',
    userHome: '/unused',
    configuration: {}
  })

  expect(session.subjects).toHaveLength(2)
  expect(session.subjects[0]?.families).toEqual(['RUBRIC'])
  expect(session.subjects[1]?.families).toEqual(['COMMIT', 'BRANCH', 'HYGIENE', 'LOCK'])
  expect(session.subjects[1]?.subject).toBe(resolve('.'))
  expect(session.subjects[1]?.context()).toEqual({
    rubric: { publication: undefined },
    repository: resolve('.'),
    mode: 'audit'
  })
  expect(session.proposal()).toEqual({ writes: [] })
})
