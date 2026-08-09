import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import { outcomesFor, type RoadmapAuditContext, type RoadmapRubricContext } from '../contexts/roadmap.ts'

const SOURCE = 'standards-repository-roadmaps.md'

const ROAD_1: RubricItem<RoadmapAuditContext> = {
  code: 'ROAD-1',
  title: 'root orientation',
  description:
    'Root ROADMAP.md is a concise orientation that points to canonical work items rather than duplicating their queue.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance:
        'Restore the concise root orientation and canonical roadmap structure without reconstructing or prioritizing the work queue.'
    },
    audit: {
      phase: 'INSPECT',
      run: (context) => outcomesFor(context, 'ROAD-1', 'Every authored roadmap has canonical structure.')
    }
  }
}

const ROAD_2: RubricItem<RoadmapAuditContext> = {
  code: 'ROAD-2',
  title: 'honest horizon placement',
  description:
    'Items sit in honest horizons; Waiting-for items name their external condition; speculative Future work carries `candidate: true`.',
  sources: [SOURCE],
  judgment: {
    scope: 'Every horizon, Waiting-for condition, and Future candidate declaration.',
    prompt: 'Review horizon placement, waiting conditions, and Future candidate marking.',
    outcomes: ['conforming', 'gap', 'exclusion'],
    guidance:
      'Confirm placement with the owning authority, record a gap, or record an explicit exclusion; do not move work automatically.'
  }
}

const ROAD_3: RubricItem<RoadmapAuditContext> = {
  code: 'ROAD-3',
  title: 'open finite work',
  description: 'Work-item indexes are open-only and contain finite work rather than continuous practice.',
  sources: [SOURCE],
  judgment: {
    scope: 'Every roadmap item represented in the open work queue.',
    prompt: 'Review that roadmap items are finite open work, not completed work or ongoing practice.',
    outcomes: ['conforming', 'gap', 'exclusion'],
    guidance:
      'Split, retain, close, or exclude work only after an owner confirms the intended record; otherwise record a gap.'
  }
}

const ROAD_4: RubricItem<RoadmapAuditContext> = {
  code: 'ROAD-4',
  title: 'horizon vocabulary',
  description:
    'Every work item uses the canonical horizon vocabulary; the root orientation carries no parallel horizon list.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance:
        'Use the canonical horizon vocabulary and remove duplicate root-horizon lists without changing any item placement.'
    },
    audit: {
      phase: 'INSPECT',
      run: (context) => outcomesFor(context, 'ROAD-4', 'Every horizon has its canonical blurb.')
    }
  }
}

const ROAD_5: RubricItem<RoadmapAuditContext> = {
  code: 'ROAD-5',
  title: 'horizon transitions and readiness',
  description:
    'Horizon promotion and deferral meet the readiness contract; execution state remains honest and CONFORM never chooses a move.',
  sources: [SOURCE],
  judgment: {
    scope: 'Every proposed promotion, deferral, and its readiness evidence.',
    prompt: 'Review each promotion or deferral against its readiness contract and plan state.',
    outcomes: ['conforming', 'gap', 'exclusion'],
    guidance:
      'Confirm the lifecycle move with its owner, record a gap, or record an explicit exclusion; never choose the move automatically.'
  }
}

const ROAD_6: RubricItem<RoadmapAuditContext> = {
  code: 'ROAD-6',
  title: 'repository work-item code',
  description:
    'The ki-repo table declares a valid stable repository code; roadmap configuration declares either repository-wide themes or fixed area-to-theme namespaces.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance:
        'Correct the configured repository code, theme vocabulary, or fixed area map from authoritative repository configuration.'
    },
    audit: {
      phase: 'INSPECT',
      run: (context) => outcomesFor(context, 'ROAD-6', 'The repository work-item code is valid.')
    }
  }
}

const ROAD_7: RubricItem<RoadmapAuditContext> = {
  code: 'ROAD-7',
  title: 'issue-allocation ledger',
  description:
    'docs/roadmap/_ISSUES.md records the repository-wide or fixed-area high-water marks, preventing a pruned issue number from being reused.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'automatic'
    },
    audit: {
      phase: 'INSPECT',
      run: (context) =>
        outcomesFor(context, 'ROAD-7', 'The issue-allocation ledger reserves every issued repository or area number.')
    },
    conform: { phase: 'DERIVED', run: (context) => context.scaffoldIssueLedger?.() }
  }
}

export const ROAD: RubricFamily<RoadmapRubricContext, RoadmapAuditContext> = {
  code: 'ROAD',
  title: 'roadmaps',
  description: 'Canonical generated-index structure, placement, and readiness.',
  standard: SOURCE,
  selectContext: (context) => context.roadmaps,
  items: [ROAD_1, ROAD_2, ROAD_3, ROAD_4, ROAD_5, ROAD_6, ROAD_7]
}
