import { judgment, type RubricFamily, type RubricItem } from '../../shared/rubric.ts'
import type { ModelRadarRubricContext, RadarLifecycleContext } from '../contexts/radar.ts'

const SOURCE = 'standards-model-radar.md#dates-and-freshness'

const LIFECYCLE_1: RubricItem<RadarLifecycleContext> = {
  code: 'LIFECYCLE-1',
  title: 'vocabulary and review dates are valid',
  description:
    'Model, route, benchmark, and evidence classifications use the closed vocabularies; dates are real, non-future ISO calendar dates; reviews older than 9 days warn without invalidating historical evidence.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    overrideLevels: ['WARN'],
    remediation: {
      class: 'diagnostic',
      guidance:
        'Refresh stale evidence or correct malformed vocabulary and dates only after checking the authored source and intended classification.'
    },
    audit: { phase: 'INSPECT', run: ({ vocabularyAndDates }) => vocabularyAndDates }
  }
}

const LIFECYCLE_2: RubricItem<RadarLifecycleContext> = {
  code: 'LIFECYCLE-2',
  title: 'support and lifecycle combinations are coherent',
  description:
    'Default routes are adopted and use active models; retired models have only hold and not-integrated routes; benchmark retirement and applicability agree; successors resolve. Mechanical contradictions are reported, but their repair requires an explicit recommendation or lifecycle decision.',
  sources: ['standards-model-radar.md#executable-routes', 'standards-model-radar.md#benchmarks'],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'guarded',
      guidance:
        'Review the supporting evidence and decide which recommendation, support, retirement, or benchmark state is authoritative before editing.'
    },
    audit: { phase: 'INSPECT', run: ({ consistency }) => consistency }
  },
  judgment: judgment(
    'Do recommendation, support, retirement, benchmark lifecycle, and recorded movement express a defensible reviewed decision rather than merely a mechanically consistent tuple?'
  )
}

export const LIFECYCLE: RubricFamily<ModelRadarRubricContext, RadarLifecycleContext> = {
  code: 'LIFECYCLE',
  title: 'Review lifecycle',
  description: 'Dates, classifications, and consequential state combinations remain current and coherent.',
  standard: SOURCE,
  selectContext: (context) => context.lifecycle,
  items: [LIFECYCLE_1, LIFECYCLE_2]
}
