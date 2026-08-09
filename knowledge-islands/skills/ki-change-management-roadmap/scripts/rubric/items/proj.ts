import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import { outcomesFor, type RoadmapIndexContext, type RoadmapRubricContext } from '../contexts/roadmap.ts'

const SOURCE = 'standards-repository-roadmaps.md'

const INDEX_1: RubricItem<RoadmapIndexContext> = {
  code: 'ROOT-1',
  title: 'root work-item orientation',
  description: 'Root `ROADMAP.md` is the canonical concise orientation and does not duplicate the work-item queue.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: { class: 'automatic' },
    audit: {
      phase: 'INSPECT',
      run: (context) => outcomesFor(context, 'ROOT-1', 'The root work-item orientation is current.')
    },
    conform: { phase: 'DERIVED', run: (context) => context.normaliseRoot?.() }
  }
}

export const INDEX: RubricFamily<RoadmapRubricContext, RoadmapIndexContext> = {
  code: 'INDEX',
  title: 'root orientation',
  description: 'The exact concise root orientation for flat work items.',
  standard: SOURCE,
  selectContext: (context) => context.index,
  items: [INDEX_1]
}
