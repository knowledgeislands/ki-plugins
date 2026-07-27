import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import { outcomesFor, type RoadmapAuditContext, type RoadmapRubricContext } from '../contexts/roadmap.ts'

const SOURCE = 'standards-repository-roadmaps.md'

const ITEM_1: RubricItem<RoadmapAuditContext> = {
  code: 'ITEM-1',
  title: 'unique qualified item locator',
  description: 'Each thematic item has one unique qualified `<theme>/<item-slug>` locator. Duplicate derived locators fail.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    audit: { phase: 'INSPECT', run: (context) => outcomesFor(context, 'ITEM-1', 'Every thematic item has a unique locator.') }
  }
}

export const ITEM: RubricFamily<RoadmapRubricContext, RoadmapAuditContext> = {
  code: 'ITEM',
  title: 'items',
  description: 'Stable thematic roadmap-item identity.',
  standard: SOURCE,
  selectContext: (context) => context.items,
  items: [ITEM_1]
}
