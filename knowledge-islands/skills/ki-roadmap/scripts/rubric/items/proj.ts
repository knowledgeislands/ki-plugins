import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import { outcomesFor, type RoadmapProjectionContext, type RoadmapRubricContext } from '../contexts/roadmap.ts'

const SOURCE = 'standards-repository-roadmaps.md'

const PROJ_1: RubricItem<RoadmapProjectionContext> = {
  code: 'PROJ-1',
  title: 'root portfolio projection',
  description: 'The thematic root `ROADMAP.md` exactly matches the generated linked portfolio and repeats no item prose.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    audit: { phase: 'INSPECT', run: (context) => outcomesFor(context, 'PROJ-1', 'The root portfolio projection is current.') },
    conform: { phase: 'DERIVED', run: (context) => context.rebuildProjection?.() }
  }
}

export const PROJ: RubricFamily<RoadmapRubricContext, RoadmapProjectionContext> = {
  code: 'PROJ',
  title: 'portfolio projection',
  description: 'The exact generated root portfolio for a thematic roadmap.',
  standard: SOURCE,
  selectContext: (context) => context.projection,
  items: [PROJ_1]
}
