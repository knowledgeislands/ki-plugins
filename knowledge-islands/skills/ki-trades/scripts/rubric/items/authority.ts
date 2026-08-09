import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { OutcomeContext, TradesRubricContext } from '../contexts/trades.ts'

const SOURCE = 'standards-trades.md'

const AUTH_1: RubricItem<OutcomeContext> = {
  code: 'AUTH-1',
  title: 'sender and receiver write boundaries are preserved',
  description:
    "Preparations and outbound records belong to the local sender, retain their declared export route, and contain no receiver-local fields; inbound records belong to the local receiver, retain an active receipt route, and preserve the submitted sender projection. That projection is compared against the registered peer's counterpart by meaning rather than by byte, so a formatter run is not reported as tampering while any change to the words is; where no registered peer holds the counterpart, the comparison reports as unverifiable rather than passing silently.",
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance:
        'Correct only the locally owned record or route; do not alter a peer repository or the immutable sender projection.'
    },
    audit: { phase: 'INSPECT', run: ({ outcomes }) => outcomes }
  }
}

export const AUTH: RubricFamily<TradesRubricContext, OutcomeContext> = {
  code: 'AUTH',
  title: 'Write authority',
  description:
    'A trade remains a local copy protocol with an immutable raw sender projection and receiver-only local fields.',
  standard: SOURCE,
  selectContext: (context) => context.authority,
  items: [AUTH_1]
}
