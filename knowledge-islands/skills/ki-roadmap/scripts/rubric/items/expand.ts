import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { RoadmapAuditContext, RoadmapRubricContext } from '../contexts/roadmap.ts'

const SOURCE = 'standards-repository-roadmaps.md'

const EXPAND_1: RubricItem<RoadmapAuditContext> = {
  code: 'EXPAND-1',
  title: 'conservative expansion',
  description: 'EXPAND conserves every open item exactly once and preserves its horizon and prose.',
  sources: [SOURCE],
  judgment: { prompt: 'Review expansion conservation against the source roadmap.' }
}

export const EXPAND: RubricFamily<RoadmapRubricContext, RoadmapAuditContext> = {
  code: 'EXPAND',
  title: 'expansion',
  description: 'Judgment-led migration from the simple profile to coherent themes.',
  standard: SOURCE,
  selectContext: (context) => context.expansion,
  items: [EXPAND_1]
}
