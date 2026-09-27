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
    'The guide index and any locally useful audience grouping give each intended reader a clear route, and each guide contains practical procedure rather than duplicated rationale, behaviour specification, or future work; stable behaviour reaches its existing Specification or a routed `ki-specs` gap.',
  sources: [SOURCE],
  judgment: {
    scope:
      'The Guides index, every guide below `docs/guides/`, and their linked Decision Records, Specifications, `ki-specs` gaps, and roadmap records where applicable.',
    prompt:
      'Can each intended reader find the guide through a clear index route, with open-vocabulary audience directories where stable reader groups make the collection easier to navigate and root-level placement retained for small, shared, or cross-audience material? Do specialised exact-role paths preserve that route? Can the reader complete the stated outcome, verify success, and recover from the failures described? Are why, what, and when statements held by their Decision Record, existing Specification, routed `ki-specs` gap, and roadmap owners instead?',
    outcomes: ['conforming', 'guide revision', 'reclassify material'],
    guidance:
      'Revise the index or guide for its intended reader and outcome, group by audience only where that improves navigation, or move rationale, behaviour, and future work to their owning record. Do not invent a fixed directory taxonomy, fail a flat guide mechanically, relocate authored guides through CONFORM, or infer a documentation or product decision from the check alone.'
  }
}

const ROUTE_3: RubricItem<GuidesRubricContext> = {
  code: 'ROUTE-3',
  title: 'a guide cites only what its reader can reach',
  description:
    "Each guide names internal governance artefacts only where its intended reader holds the repository; a guide written for somebody using what the repository produces is bounded by the product, its configuration, the files it leaves on that reader's machine, and its sibling guides.",
  sources: ['standards-guides.md#what-a-reader-can-be-expected-to-reach'],
  judgment: {
    scope:
      'Every guide below `docs/guides/`, read against the audience its collection declares by grouping or by its own framing.',
    prompt:
      'For each guide, who is the reader, and does every artefact the guide names sit within their reach? A reader working in this repository can open a Decision Record or a roadmap item that is named. A reader using what the repository produces holds the product and not `docs/decisions/` or `docs/roadmap/`, so naming a record there cites something they cannot open and did not ask about.',
    outcomes: ['conforming', 'guide revision', 'reclassify material'],
    guidance:
      'State the substance the record decided, in the guide, in terms of what the reader does — or move the material to a guide whose reader can reach it. Do not infer audience from a directory name alone where the guide itself says otherwise, and do not mechanically fail a named identifier: whether a reader can reach it is a judgment about that reader.'
  }
}

export const ROUTE: RubricFamily<GuidesRubricContext, GuidesRubricContext> = {
  code: 'ROUTE',
  title: 'documentation routing',
  description: 'Guides are the durable how without creating parallel documentation systems.',
  standard: SOURCE,
  selectContext: (context) => context,
  items: [ROUTE_1, ROUTE_2, ROUTE_3]
}
