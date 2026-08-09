import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { KbRubricContext, KbZoneContext } from '../contexts/kb.ts'

const SOURCE = 'standards-knowledge-base.md'

const mechanical = (
  code: string,
  title: string,
  description: string,
  level: 'FAIL' | 'WARN',
  evidence: (context: KbZoneContext) => KbZoneContext['requiredLayout']
): RubricItem<KbZoneContext> => ({
  code,
  title,
  description,
  sources: [SOURCE],
  mechanical: {
    level,
    remediation: {
      class: 'diagnostic',
      guidance: 'Correct the required zone layout or placement, then rerun the audit.'
    },
    audit: { phase: 'INSPECT', run: evidence }
  }
})

const ZONE_1 = mechanical(
  'ZONE-1',
  'required zone layout',
  'Calendar/, Pillars/, Resources/, Streams/, and Admin/ are present, resolving each through a declared zone alias.',
  'FAIL',
  (context) => context.requiredLayout
)

const ZONE_2: RubricItem<KbZoneContext> = {
  code: 'ZONE-2',
  title: 'same-name zone indexes',
  description: 'Each present zone has its same-name index note.',
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    remediation: { class: 'automatic' },
    audit: { phase: 'INSPECT', run: (context) => context.zoneIndexes },
    conform: { phase: 'DERIVED', run: (context) => context.scaffoldZoneIndexes?.() }
  }
}

const ZONE_3: RubricItem<KbZoneContext> = {
  code: 'ZONE-3',
  title: 'root memory index',
  description: 'The resolved Admin zone carries MEMORY.md.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: { class: 'automatic' },
    audit: { phase: 'INSPECT', run: (context) => context.memoryIndex },
    conform: { phase: 'DERIVED', run: (context) => context.scaffoldMemoryIndex?.() }
  }
}

const ZONE_4 = mechanical(
  'ZONE-4',
  'staging areas are not zones',
  '+/ and -/ are reported as staging only and are exempt from the zone-index rule.',
  'WARN',
  (context) => context.stagingAreas
)

const ZONE_5 = mechanical(
  'ZONE-5',
  'produced outputs use outbound staging',
  'Notes with type session-digest or handoff reside under the resolved -/ staging area.',
  'FAIL',
  (context) => context.outboundPlacement
)

export const ZONE: RubricFamily<KbRubricContext, KbZoneContext> = {
  code: 'ZONE',
  title: 'zone layout',
  description: 'Required zones, indexes, staging, and output placement.',
  standard: SOURCE,
  selectContext: (context) => context.zones,
  items: [ZONE_1, ZONE_2, ZONE_3, ZONE_4, ZONE_5]
}
