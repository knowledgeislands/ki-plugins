import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import { outcomesFor, type RoadmapAuditContext, type RoadmapRubricContext } from '../contexts/roadmap.ts'

const SOURCE = 'standards-repository-roadmaps.md'

const SCOPE_1: RubricItem<RoadmapAuditContext> = {
  code: 'SCOPE-1',
  title: 'KB scope',
  description: 'KB repositories use `ki-kb-streams`; repository-roadmap artifacts in a KB fail, while a KB without them is not applicable.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    audit: { phase: 'INSPECT', run: (context) => outcomesFor(context, 'SCOPE-1', 'The repository is in scope.') }
  }
}

export const SCOPE: RubricFamily<RoadmapRubricContext, RoadmapAuditContext> = {
  code: 'SCOPE',
  title: 'scope',
  description: 'Repository-roadmap profile applicability.',
  standard: SOURCE,
  selectContext: (context) => context.scope,
  items: [SCOPE_1]
}
