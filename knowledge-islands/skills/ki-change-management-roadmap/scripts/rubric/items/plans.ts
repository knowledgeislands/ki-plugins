import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import { outcomesFor, type RoadmapAuditContext, type RoadmapRubricContext } from '../contexts/roadmap.ts'

const SOURCE = 'standards-work-item-format.md'

const mechanical = (
  code: string,
  title: string,
  description: string,
  passMessage: string
): RubricItem<RoadmapAuditContext> => ({
  code,
  title,
  description,
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance:
        'Restore the required in-place execution sections without changing the item priority, acceptance, or lifecycle decision.'
    },
    audit: { phase: 'INSPECT', run: (context) => outcomesFor(context, code, passMessage) }
  }
})

const EXEC_1 = mechanical(
  'EXEC-1',
  'in-place execution record',
  'A work item entering execution retains its concise issue context and adds the required execution sections in the same file.',
  'Every execution record is an enriched canonical work item.'
)

const EXEC_2: RubricItem<RoadmapAuditContext> = {
  code: 'EXEC-2',
  title: 'stage-appropriate work-item detail',
  description:
    'Future items preserve the issue and its discussion; Soon adds useful shaping; immediate and active items have concrete Steps, checkable Verify, honest Current state, and minimal Files touched.',
  sources: [SOURCE],
  judgment: {
    scope: 'The stage-appropriate detail in every canonical work item.',
    prompt:
      'Review whether each work item has useful detail for its stage, including topic-oriented Discussion and concrete, checkable execution detail when immediate.',
    outcomes: ['conforming', 'gap', 'exclusion'],
    guidance:
      'Add or refine only the detail supported by the work; record a gap or explicit exclusion where evidence is insufficient.'
  }
}

const EXEC_3: RubricItem<RoadmapAuditContext> = {
  code: 'EXEC-3',
  title: 'honest execution status',
  description:
    'Draft awaits readiness approval; ready awaits execution; in-progress reflects live work; awaiting-review carries the required review packet; done is a retained closure record. Every non-draft item is Now or Next.',
  sources: [SOURCE],
  judgment: {
    scope: 'The declared lifecycle status and retained evidence of every work item.',
    prompt: 'Review whether work-item status honestly reflects its lifecycle gate or retained completion record.',
    outcomes: ['conforming', 'gap', 'exclusion'],
    guidance:
      'Select or confirm lifecycle transitions with the owning authority; otherwise record a gap or explicit exclusion.'
  }
}

export const EXEC: RubricFamily<RoadmapRubricContext, RoadmapAuditContext> = {
  code: 'EXEC',
  title: 'execution',
  description: 'In-place execution shape and lifecycle integrity.',
  standard: SOURCE,
  selectContext: (context) => context.execution,
  items: [EXEC_1, EXEC_2, EXEC_3]
}
