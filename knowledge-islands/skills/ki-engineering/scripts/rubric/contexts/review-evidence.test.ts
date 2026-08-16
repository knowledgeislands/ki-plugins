import { afterEach, expect, test } from 'bun:test'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { inspectConsistencyReviewEvidence } from './review-evidence.ts'

const temporaryDirectories: string[] = []

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

const git = (repository: string, arguments_: readonly string[]): string =>
  execFileSync('git', arguments_, { cwd: repository, encoding: 'utf8' }).trim()

const fixture = (): string => {
  const repository = mkdtempSync(join(tmpdir(), 'ki-engineering-review-'))
  temporaryDirectories.push(repository)
  git(repository, ['init', '--quiet'])
  git(repository, ['config', 'user.name', 'KI test'])
  git(repository, ['config', 'user.email', 'test@example.invalid'])
  return repository
}

const commit = (repository: string, name: string, body?: string): string => {
  writeFileSync(join(repository, name), `${name}\n`)
  git(repository, ['add', '--', name])
  const arguments_ = ['commit', '--quiet', '-m', `test: ${name}`]
  if (body) arguments_.push('-m', body)
  git(repository, arguments_)
  return git(repository, ['rev-parse', 'HEAD'])
}

const trailer = (base: string, scope = 'repository', outcome = 'consistent'): string =>
  [
    `KI-Consistency-Review-Base: ${base}`,
    `KI-Consistency-Review-Scope: ${scope}`,
    `KI-Consistency-Review-Outcome: ${outcome}`
  ].join('\n')

test('selects the newest valid review boundary from fixture-backed Git history', async () => {
  const repository = fixture()
  const firstBase = commit(repository, 'initial.ts')
  const firstReview = commit(repository, 'first-review.ts', trailer(firstBase, 'src/'))
  commit(repository, 'ordinary-change.ts')
  const secondReview = commit(repository, 'second-review.ts', trailer(firstReview, 'src/, package.json'))

  await expect(inspectConsistencyReviewEvidence(repository)).resolves.toEqual([
    {
      level: 'INFO',
      code: 'REVIEW-1',
      message: `Selected consistency review ${secondReview}: base ${firstReview}; scope src/, package.json; outcome consistent.`
    }
  ])
})

test('does not count malformed trailer evidence as a completed review', async () => {
  const repository = fixture()
  const base = commit(repository, 'initial.ts')
  const valid = commit(repository, 'valid-review.ts', trailer(base, 'repository', 'follow-up:KI-HARNESS-FND-008'))
  commit(
    repository,
    'malformed-review.ts',
    [
      `KI-Consistency-Review-Base: ${valid}`,
      'KI-Consistency-Review-Outcome: consistent',
      'KI-Consistency-Review-Scope: repository'
    ].join('\n')
  )

  const evidence = await inspectConsistencyReviewEvidence(repository)
  expect(evidence[0]).toEqual({
    level: 'INFO',
    code: 'REVIEW-1',
    message: `Selected consistency review ${valid}: base ${base}; scope repository; outcome follow-up:KI-HARNESS-FND-008.`
  })
  expect(evidence[1]?.message).toContain('Ignored unavailable consistency-review evidence')
  expect(evidence[1]?.message).toContain('the three trailers are not one final contiguous block')
})

test('reports absent and unreachable trailer evidence as unavailable instead of guessing', async () => {
  const repository = fixture()
  commit(repository, 'ordinary-change.ts')
  await expect(inspectConsistencyReviewEvidence(repository)).resolves.toEqual([
    {
      level: 'NOT_APPLICABLE',
      code: 'REVIEW-1',
      message: 'No consistency-review trailer block is reachable from HEAD; review-boundary evidence is unavailable.'
    }
  ])

  const unreachable = '0123456789012345678901234567890123456789'
  commit(repository, 'unreachable-review.ts', trailer(unreachable))
  const evidence = await inspectConsistencyReviewEvidence(repository)
  expect(evidence).toHaveLength(1)
  expect(evidence[0]?.level).toBe('NOT_APPLICABLE')
  expect(evidence[0]?.message).toContain('No valid consistency-review boundary is available')
  expect(evidence[0]?.message).toContain('Base 0123456789012345678901234567890123456789 is unresolved')
})
