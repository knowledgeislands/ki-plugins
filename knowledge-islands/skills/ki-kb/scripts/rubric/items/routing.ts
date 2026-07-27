import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { KbRoutingContext, KbRubricContext } from '../contexts/kb.ts'

const SOURCE = 'standards-knowledge-base.md'

const ROUTE_1: RubricItem<KbRoutingContext> = {
  code: 'ROUTE-1',
  title: 'notes follow the routing test',
  description: 'Notes are placed in the zone selected by their time-bound, active-work, settled-knowledge, or external-reference role.',
  sources: [SOURCE],
  judgment: { prompt: 'Does each sampled note sit in the zone selected by the routing test?' }
}

export const ROUTE: RubricFamily<KbRubricContext, KbRoutingContext> = {
  code: 'ROUTE',
  title: 'routing and placement',
  description: 'Judgment review of the knowledge-base routing test.',
  standard: SOURCE,
  selectContext: (context) => context.routing,
  items: [ROUTE_1]
}
