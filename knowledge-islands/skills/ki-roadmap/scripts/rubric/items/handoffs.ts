import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { RoadmapAuditContext, RoadmapRubricContext } from '../contexts/roadmap.ts'

const SOURCE = 'standards-repository-roadmaps.md'

const HANDOFF_1: RubricItem<RoadmapAuditContext> = {
  code: 'HANDOFF-1',
  title: 'handoff review',
  description:
    'Where `+/_HANDOFFS/` or `-/_HANDOFFS/` exists, review incoming adoption and outgoing receiving-repository progress without inferring or changing remote state.',
  sources: [SOURCE],
  judgment: {
    prompt:
      'Inspect the handoff areas: identify any inbound material that needs a local roadmap decision and any outbound material needing follow-up or closure; report proposals only.'
  }
}

export const HANDOFF: RubricFamily<RoadmapRubricContext, RoadmapAuditContext> = {
  code: 'HANDOFF',
  title: 'handoff review',
  description: 'Judgment-led inbound adoption and outbound follow-up review.',
  standard: SOURCE,
  selectContext: (context) => context.handoffs,
  items: [HANDOFF_1]
}
