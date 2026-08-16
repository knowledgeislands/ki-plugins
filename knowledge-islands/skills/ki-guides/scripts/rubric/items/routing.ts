import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { GuidesRubricContext } from '../contexts/guides.ts'

const SOURCE = 'standards-guides.md#boundary-and-migration-rules'

const ROUTE_1: RubricItem<GuidesRubricContext> = {
  code: 'ROUTE-1',
  title: 'retired parallel documentation roots are absent',
  description:
    'A repository declaring this skill has no `docs/spec/` or `docs/developer/` parallel root; their durable material is reclassified into the owned documentation concern. A specialised operational owner decides whether a `docs/logs/` area is generic.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance:
        'Reclassify durable material from the retired root into its owning documentation concern, then remove the retired root and rerun the audit.'
    },
    audit: {
      phase: 'INSPECT',
      run: (context) =>
        context.boundary.retiredRoots.length === 0
          ? [{ status: 'PASS', message: 'No retired parallel documentation roots are present.' }]
          : context.boundary.retiredRoots.map((path) => ({
              status: 'VIOLATION',
              message: 'Reclassify this retired documentation root before adopting ki-guides.',
              subject: path
            }))
    }
  }
}

const ROUTE_2: RubricItem<GuidesRubricContext> = {
  code: 'ROUTE-2',
  title: 'guides are discoverable, actionable, and correctly placed',
  description:
    'The guide index gives each intended reader a useful route, and each guide contains practical procedure rather than duplicated rationale, behaviour specification, or future work; stable behaviour reaches its existing Specification or a routed `ki-specs` gap.',
  sources: [SOURCE],
  judgment: {
    scope:
      'The Guides index, every guide below `docs/guides/`, and their linked Decision Records, Specifications, `ki-specs` gaps, and roadmap records where applicable.',
    prompt:
      'Can the intended reader find the guide, complete its stated outcome, verify success, and recover from the failures it describes? Are why, what, and when statements held by their Decision Record, existing Specification, routed `ki-specs` gap, and roadmap owners instead?',
    outcomes: ['conforming', 'guide revision', 'reclassify material'],
    guidance:
      'Revise the guide for its intended reader and outcome, or move rationale, behaviour, and future work to their owning record. Do not infer a documentation or product decision from the check alone.'
  }
}

export const ROUTE: RubricFamily<GuidesRubricContext, GuidesRubricContext> = {
  code: 'ROUTE',
  title: 'documentation routing',
  description: 'Guides are the durable how without creating parallel documentation systems.',
  standard: SOURCE,
  selectContext: (context) => context,
  items: [ROUTE_1, ROUTE_2]
}
