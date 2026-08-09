import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import { outcomesFor, type RoadmapAuditContext, type RoadmapRubricContext } from '../contexts/roadmap.ts'

const SOURCE = 'standards-repository-roadmaps.md'
const FORMAT = 'standards-work-item-format.md'

const ITEM_1: RubricItem<RoadmapAuditContext> = {
  code: 'ITEM-1',
  title: 'flat work-item identity',
  description:
    'Each canonical item lives directly under docs/roadmap with a unique stable identifier, matching filename, and title of at most four words.',
  sources: [SOURCE, FORMAT],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance:
        'Correct the item filename, frontmatter identity, or title to match the canonical flat work-item contract.'
    },
    audit: {
      phase: 'INSPECT',
      run: (context) => outcomesFor(context, 'ITEM-1', 'Every work item has a canonical identity and frontmatter.')
    }
  }
}

export const ITEM: RubricFamily<RoadmapRubricContext, RoadmapAuditContext> = {
  code: 'ITEM',
  title: 'items',
  description: 'Flat work-item identity, grouping, lifecycle, and dependencies.',
  standard: SOURCE,
  selectContext: (context) => context.items,
  items: [
    ITEM_1,
    {
      code: 'ITEM-2',
      title: 'item state and theme grouping',
      description: 'Each item has valid theme, horizon, candidate, status, baseline, and dependency fields.',
      sources: [SOURCE],
      mechanical: {
        level: 'FAIL',
        remediation: {
          class: 'diagnostic',
          guidance:
            'Correct the item state fields or dependency declarations; do not choose a priority or lifecycle transition automatically.'
        },
        audit: {
          phase: 'INSPECT',
          run: (context) => outcomesFor(context, 'ITEM-2', 'Every item has valid state fields.')
        }
      }
    },
    {
      code: 'ITEM-3',
      title: 'item body shape',
      description:
        'Every item has a non-empty Goal, ends with Discussion, carries the deterministic sections required by its horizon and lifecycle state, and uses task-list Steps.',
      sources: [FORMAT],
      mechanical: {
        level: 'FAIL',
        remediation: {
          class: 'diagnostic',
          guidance:
            'Restore the lifecycle-appropriate canonical sections and task-list shape from the work-item format standard.'
        },
        audit: {
          phase: 'INSPECT',
          run: (context) => outcomesFor(context, 'ITEM-3', 'Every item body matches its lifecycle state.')
        }
      }
    },
    {
      code: 'ITEM-4',
      title: 'plain-language goal',
      description: 'Each work item states a concise user or system outcome before its technical context.',
      sources: [FORMAT],
      judgment: {
        scope: 'The Goal and Context sections of every active roadmap item.',
        prompt:
          'Review that Goal explains the intended user or system outcome in plain language, while Context holds the supporting evidence and technical rationale.',
        outcomes: ['conforming', 'gap', 'exclusion'],
        guidance:
          'Rewrite the Goal or Context, record a named gap, or record an explicit exclusion in the item discussion.'
      }
    },
    {
      code: 'ITEM-5',
      title: 'item dependencies',
      description:
        'Dependencies name existing work items, are reverse-consistent and acyclic, and do not permit active blocked work.',
      sources: [SOURCE],
      mechanical: {
        level: 'FAIL',
        remediation: {
          class: 'guarded',
          guidance:
            'Correct only the evidenced dependency declarations after confirming the intended relationship; do not infer or create work dependencies.'
        },
        audit: {
          phase: 'INSPECT',
          run: (context) => outcomesFor(context, 'ITEM-5', 'Every item dependency is valid and reciprocal.')
        }
      },
      judgment: {
        scope: 'Every declared roadmap dependency and its reciprocal work item.',
        prompt:
          'Review whether each dependency represents a real execution relationship without hiding a priority or acceptance decision.',
        outcomes: ['conforming', 'gap', 'exclusion'],
        guidance:
          'Correct the declared relationship with the owning work-item decision, record a gap, or record an explicit exclusion.'
      }
    }
  ]
}
