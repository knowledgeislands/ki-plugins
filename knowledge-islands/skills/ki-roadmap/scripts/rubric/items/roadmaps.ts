import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import { outcomesFor, type RoadmapBlurbsContext, type RoadmapRubricContext } from '../contexts/roadmap.ts'

const SOURCE = 'standards-repository-roadmaps.md'

const ROAD_1: RubricItem<RoadmapBlurbsContext> = {
  code: 'ROAD-1',
  title: 'roadmap structure',
  description: 'Every authored roadmap has one H1 and the five horizons exactly once, in canonical order.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    audit: { phase: 'INSPECT', run: (context) => outcomesFor(context, 'ROAD-1', 'Every authored roadmap has canonical structure.') }
  }
}

const ROAD_2: RubricItem<RoadmapBlurbsContext> = {
  code: 'ROAD-2',
  title: 'honest horizon placement',
  description: 'Items sit in honest horizons; Waiting-for items name their external condition; speculative Future work says `(candidate)`.',
  sources: [SOURCE],
  judgment: { prompt: 'Review horizon placement, waiting conditions, and Future candidate marking.' }
}

const ROAD_3: RubricItem<RoadmapBlurbsContext> = {
  code: 'ROAD-3',
  title: 'open finite work',
  description: 'Roadmaps are open-only and contain finite work rather than continuous practice.',
  sources: [SOURCE],
  judgment: { prompt: 'Review that roadmap items are finite open work, not completed work or ongoing practice.' }
}

const ROAD_4: RubricItem<RoadmapBlurbsContext> = {
  code: 'ROAD-4',
  title: 'canonical horizon blurbs',
  description:
    'Every horizon heading is followed immediately by its exact canonical blurb; CONFORM inserts a missing blurb without removing existing authored content.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    audit: { phase: 'INSPECT', run: (context) => outcomesFor(context, 'ROAD-4', 'Every horizon has its canonical blurb.') },
    conform: { phase: 'PRIMARY', run: (context) => context.normaliseHorizonBlurbs?.() }
  }
}

const ROAD_5: RubricItem<RoadmapBlurbsContext> = {
  code: 'ROAD-5',
  title: 'promotion and readiness',
  description:
    'Horizon placement and transitions meet the readiness contract; ordinary and non-open plans require Blocking or Next, while an open plan with a non-empty transferred-from origin may preserve detail at another honest horizon without implying readiness. CONFORM never chooses a move.',
  sources: [SOURCE],
  judgment: { prompt: 'Review each horizon transition against its readiness contract.' }
}

export const ROAD: RubricFamily<RoadmapRubricContext, RoadmapBlurbsContext> = {
  code: 'ROAD',
  title: 'roadmaps',
  description: 'Canonical horizon structure, placement, and readiness.',
  standard: SOURCE,
  selectContext: (context) => context.roadmaps,
  items: [ROAD_1, ROAD_2, ROAD_3, ROAD_4, ROAD_5]
}
