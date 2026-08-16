import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import { outcomesFor, type RoadmapAuditContext, type RoadmapRubricContext } from '../contexts/roadmap.ts'

const SOURCE = 'standards-repository-roadmaps.md'

const TRADE_1: RubricItem<RoadmapAuditContext> = {
  code: 'TRADE-1',
  title: 'trade review',
  description:
    'Where declared ki-trades records exist, report structural guidance and proposed local roadmap action without setting disposition, inferring adoption, prioritizing work, pruning records, or changing remote state.',
  sources: [SOURCE],
  judgment: {
    scope: 'Declared inbound and outbound trade records in the local repository.',
    prompt:
      'Inspect declared trade records read-only: identify submissions needing receiver review or a separately confirmed local roadmap proposal and outbound progress needing follow-up; report proposals only.',
    outcomes: ['conforming', 'proposal', 'exclusion'],
    guidance:
      'Record read-only observations and proposals only; the receiver owns disposition, prioritization, adoption, and pruning decisions.'
  }
}

const TRADE_2: RubricItem<RoadmapAuditContext> = {
  code: 'TRADE-2',
  title: 'trade-aware waiting and pruning',
  description:
    'Trade waits use one flat canonical identity array only at Waiting for, name the exact observed condition in prose, and retain done work referenced by unresolved completion observation.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'guarded',
      guidance:
        'Correct evidenced wait identities or prose only after confirming the relevant trade state; do not prune or release records automatically.'
    },
    audit: {
      phase: 'INSPECT',
      run: (context) =>
        outcomesFor(context, 'TRADE-2', 'Every declared trade wait has valid flat identity and horizon fields.')
    }
  },
  judgment: {
    scope: 'Every trade-aware wait and candidate for done-work pruning.',
    prompt:
      'Review each trade-aware wait and pruning candidate: confirm the trade exists and is relevant, the prose names receipt, terminal decision, or linked-work completion precisely, and no done work is pruned before completion-observation sender release is observable.',
    outcomes: ['conforming', 'gap', 'exclusion'],
    guidance:
      'Retain the record until the responsible receiver or sender has made and observed the required decision; record a gap or exclusion when evidence is incomplete.'
  }
}

export const TRADE: RubricFamily<RoadmapRubricContext, RoadmapAuditContext> = {
  code: 'TRADE',
  title: 'trade review',
  description: 'Read-only judgment guidance for declared cross-repository trade submissions.',
  standard: SOURCE,
  selectContext: (context) => context.trades,
  items: [TRADE_1, TRADE_2]
}
