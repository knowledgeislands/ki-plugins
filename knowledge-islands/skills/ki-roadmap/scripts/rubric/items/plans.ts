import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import { outcomesFor, type RoadmapPlanContext, type RoadmapRubricContext } from '../contexts/roadmap.ts'

const SOURCE = 'standards-plan-format.md'

const mechanical = (code: string, title: string, description: string, passMessage: string): RubricItem<RoadmapPlanContext> => ({
  code,
  title,
  description,
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    audit: { phase: 'INSPECT', run: (context) => outcomesFor(context, code, passMessage) }
  }
})

const PLAN_1 = mechanical(
  'PLAN-1',
  'plan placement and shape',
  'Plans use the canonical thematic path, stable theme code and serial, required frontmatter, an optional non-empty transferred-from origin, matching filename and ID, and an immutable execution baseline commit.',
  'Every plan has canonical placement, identity, frontmatter, and body structure.'
)

const PLAN_2: RubricItem<RoadmapPlanContext> = {
  ...mechanical(
    'PLAN-2',
    'plan roadmap linkage',
    '`roadmap:` is a qualified locator in the same theme and resolves to a Blocking or Next item, except that an open plan with a non-empty transferred-from origin may preserve detail at another honest horizon; the item carries exactly one matching local plan reference.',
    'Every plan and roadmap item has a consistent inverse link.'
  ),
  mechanical: {
    level: 'FAIL',
    audit: {
      phase: 'INSPECT',
      run: (context) => outcomesFor(context, 'PLAN-2', 'Every plan and roadmap item has a consistent inverse link.')
    },
    conform: { phase: 'DERIVED', run: (context) => context.syncPlanReferences?.() }
  }
}

const PLAN_3 = mechanical(
  'PLAN-3',
  'plan dependencies',
  'Dependencies use canonical plan identifiers, exist, are reverse-consistent, and acyclic; a ready, in-progress, or acceptance plan has no non-done blocker.',
  'Every plan dependency is valid, reciprocal, and acyclic.'
)

const PLAN_4: RubricItem<RoadmapPlanContext> = {
  code: 'PLAN-4',
  title: 'ready plan content',
  description:
    'Ready, in-progress, and acceptance plans have concrete Steps, checkable Verify, honest Current state, and minimal Files touched.',
  sources: [SOURCE],
  judgment: { prompt: 'Review active plan content for concrete, checkable execution detail.' }
}

const PLAN_5: RubricItem<RoadmapPlanContext> = {
  code: 'PLAN-5',
  title: 'honest plan status',
  description:
    'Open awaits readiness approval or preserves transferred detail without implying readiness; ready awaits execution; in-progress reflects live work; acceptance awaits explicit user acceptance; done is a retained closure record. Every non-open plan resolves to Blocking or Next.',
  sources: [SOURCE],
  judgment: { prompt: 'Review whether the plan status honestly reflects its lifecycle gate or retained completion record.' }
}

export const PLAN: RubricFamily<RoadmapRubricContext, RoadmapPlanContext> = {
  code: 'PLAN',
  title: 'plans',
  description: 'Plan identity, linkage, dependencies, and lifecycle integrity.',
  standard: SOURCE,
  selectContext: (context) => context.plans,
  items: [PLAN_1, PLAN_2, PLAN_3, PLAN_4, PLAN_5]
}
