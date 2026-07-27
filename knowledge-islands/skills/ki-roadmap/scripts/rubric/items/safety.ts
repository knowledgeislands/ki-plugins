import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import { outcomesFor, type RoadmapAuditContext, type RoadmapRubricContext } from '../contexts/roadmap.ts'

const SOURCE = 'standards-repository-roadmaps.md'

const SAFE_1: RubricItem<RoadmapAuditContext> = {
  code: 'SAFE-1',
  title: 'safe mechanics',
  description:
    'Governed roadmap inputs and outputs are regular local files; CONFORM changes session-owned drafts and leaves dry-run, validation, atomic publication, and rollback to the host.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    audit: { phase: 'INSPECT', run: (context) => outcomesFor(context, 'SAFE-1', 'Roadmap files satisfy the safe local-file boundary.') }
  }
}

export const SAFE: RubricFamily<RoadmapRubricContext, RoadmapAuditContext> = {
  code: 'SAFE',
  title: 'safe mechanics',
  description: 'Regular-file boundaries and host-owned transactional publication.',
  standard: SOURCE,
  selectContext: (context) => context.safety,
  items: [SAFE_1]
}
