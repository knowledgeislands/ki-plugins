import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import { outcomesFor, type RoadmapAuditContext, type RoadmapRubricContext } from '../contexts/roadmap.ts'

const SOURCE = 'standards-repository-roadmaps.md'

const PROFILE_1: RubricItem<RoadmapAuditContext> = {
  code: 'PROFILE-1',
  title: 'profile structure',
  description:
    'A non-KB repository has a root `ROADMAP.md`; `docs/roadmap/` selects the thematic profile, otherwise simple. Missing roots or incomplete thematic structure fail.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    audit: { phase: 'INSPECT', run: (context) => outcomesFor(context, 'PROFILE-1', 'The roadmap profile is structurally valid.') }
  }
}

const PROFILE_2: RubricItem<RoadmapAuditContext> = {
  code: 'PROFILE-2',
  title: 'simple-profile suitability',
  description: 'Simple remains appropriate only while the work is understandable without theme isolation or execution plans.',
  sources: [SOURCE],
  judgment: { prompt: 'Review whether the simple profile remains appropriate for the repository work.' }
}

export const PROFILE: RubricFamily<RoadmapRubricContext, RoadmapAuditContext> = {
  code: 'PROFILE',
  title: 'profile',
  description: 'Simple and thematic roadmap profile structure.',
  standard: SOURCE,
  selectContext: (context) => context.profile,
  items: [PROFILE_1, PROFILE_2]
}
