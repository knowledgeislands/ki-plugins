import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type { EngineeringEvidenceFinding } from './audit-evidence.ts'

type ConsistencyReview = {
  commit: string
  base: string
  scope: string
  outcome: string
}

type TrailerParse =
  | { kind: 'absent' }
  | { kind: 'malformed'; reason: string }
  | { kind: 'valid'; base: string; scope: string; outcome: string }

const run = promisify(execFile)
const trailerPrefix = 'KI-Consistency-Review-'
const fullCommit = /^[0-9a-f]{40}$/
const workItem = /^[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)*-\d{3,}$/

const parseTrailers = (body: string): TrailerParse => {
  if (!body.includes(trailerPrefix)) return { kind: 'absent' }
  const lines = body.replace(/\r/g, '').replace(/\n+$/, '').split('\n')
  const block = lines.slice(-3)
  if (
    block.length !== 3 ||
    (lines.length > 3 && lines.at(-4) !== '') ||
    !block[0]?.startsWith('KI-Consistency-Review-Base: ') ||
    !block[1]?.startsWith('KI-Consistency-Review-Scope: ') ||
    !block[2]?.startsWith('KI-Consistency-Review-Outcome: ')
  )
    return {
      kind: 'malformed',
      reason: 'the three trailers are not one final contiguous block in Base, Scope, Outcome order'
    }

  const base = block[0].slice('KI-Consistency-Review-Base: '.length).trim()
  const scope = block[1].slice('KI-Consistency-Review-Scope: '.length).trim()
  const outcome = block[2].slice('KI-Consistency-Review-Outcome: '.length).trim()
  if (!fullCommit.test(base))
    return { kind: 'malformed', reason: 'Base is not a full 40-character lowercase commit ID' }
  if (!scope?.split(',').every((pathspec) => pathspec.trim()))
    return { kind: 'malformed', reason: 'Scope is neither repository nor a non-empty comma-separated pathspec list' }
  if (
    outcome !== 'consistent' &&
    !(outcome.startsWith('follow-up:') && workItem.test(outcome.slice('follow-up:'.length)))
  )
    return { kind: 'malformed', reason: 'Outcome is neither consistent nor follow-up:<canonical-work-item-id>' }
  return { kind: 'valid', base, scope, outcome }
}

const git = async (repository: string, arguments_: readonly string[]): Promise<string | undefined> => {
  try {
    return (await run('git', arguments_, { cwd: repository, encoding: 'utf8' })).stdout
  } catch {
    return undefined
  }
}

const baseIsUsable = async (repository: string, review: ConsistencyReview): Promise<boolean> => {
  if (review.base === review.commit) return false
  if ((await git(repository, ['rev-parse', '--verify', `${review.base}^{commit}`])) === undefined) return false
  return (await git(repository, ['merge-base', '--is-ancestor', review.base, review.commit])) !== undefined
}

/**
 * Finds durable engineering-review evidence without deciding whether another review is due.
 * A bad or unreachable trailer is deliberately unavailable evidence, never a freshness proxy.
 */
export const inspectConsistencyReviewEvidence = async (
  repository: string
): Promise<readonly EngineeringEvidenceFinding[]> => {
  const output = await git(repository, ['log', '--format=%H%x00%B%x00', 'HEAD'])
  if (output === undefined)
    return [
      {
        level: 'NOT_APPLICABLE',
        code: 'REVIEW-1',
        message: 'Git history is unavailable, so no consistency-review boundary can be selected.'
      }
    ]

  const entries = output.split('\0')
  const unavailable: string[] = []
  for (let index = 0; index + 1 < entries.length; index += 2) {
    const commit = entries[index]?.trim()
    const body = entries[index + 1] ?? ''
    if (!commit) continue
    const parsed = parseTrailers(body)
    if (parsed.kind === 'absent') continue
    if (parsed.kind === 'malformed') {
      unavailable.push(`${commit}: ${parsed.reason}`)
      continue
    }
    const review = { commit, ...parsed }
    if (!(await baseIsUsable(repository, review))) {
      unavailable.push(
        `${commit}: Base ${review.base} is unresolved or is not an earlier ancestor of the review commit`
      )
      continue
    }
    return [
      {
        level: 'INFO',
        code: 'REVIEW-1',
        message: `Selected consistency review ${review.commit}: base ${review.base}; scope ${review.scope}; outcome ${review.outcome}.`
      },
      ...unavailable.map((message) => ({
        level: 'INFO' as const,
        code: 'REVIEW-1',
        message: `Ignored unavailable consistency-review evidence: ${message}.`
      }))
    ]
  }

  return [
    {
      level: 'NOT_APPLICABLE',
      code: 'REVIEW-1',
      message: unavailable.length
        ? `No valid consistency-review boundary is available: ${unavailable.join('; ')}.`
        : 'No consistency-review trailer block is reachable from HEAD; review-boundary evidence is unavailable.'
    }
  ]
}
