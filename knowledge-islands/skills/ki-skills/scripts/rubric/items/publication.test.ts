import { describe, expect, test } from 'bun:test'
import type { RubricPublicationContext } from '../../shared/rubric.ts'
import { RUBRIC } from './publication.ts'

const publication = (state: 'in-sync' | 'missing' | 'stale', propose = () => {}): RubricPublicationContext => ({
  publication: { target: 'references/rubric.md', rendered: '', state, propose }
})

const item = RUBRIC.items[0]

if (!item?.mechanical) throw new Error('RUBRIC-1 must expose its mechanical policy')

describe('RUBRIC-1 generated publication policy', () => {
  test('maps host evidence to exact, missing, stale, and absent outcomes', () => {
    expect(item.mechanical?.audit.run(publication('in-sync'))).toEqual([
      { status: 'PASS', message: 'the structured catalogue publication is exact' }
    ])
    expect(item.mechanical?.audit.run(publication('missing'))).toEqual([
      { status: 'VIOLATION', message: '`references/rubric.md` is missing from the structured catalogue' }
    ])
    expect(item.mechanical?.audit.run(publication('stale'))).toEqual([
      { status: 'VIOLATION', message: '`references/rubric.md` differs from the structured catalogue' }
    ])
    expect(item.mechanical?.audit.run({})).toEqual([
      {
        status: 'VIOLATION',
        message: 'the host did not provide generated-publication evidence for this structured catalogue'
      }
    ])
  })

  test('requests only the host-owned derived write during conform', () => {
    let proposals = 0
    item.mechanical?.conform?.run(publication('stale', () => proposals++))
    item.mechanical?.conform?.run(publication('missing', () => proposals++))
    item.mechanical?.conform?.run(publication('in-sync', () => proposals++))

    expect(proposals).toBe(2)
  })
})
