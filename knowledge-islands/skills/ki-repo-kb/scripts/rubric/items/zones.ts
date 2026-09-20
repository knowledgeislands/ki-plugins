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
  'Calendar/, Pillars/, Resources/, Streams/, and Admin/ resolve through any declared zone alias to readable directories, including directory symlinks.',
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
  'Notes with note_type session-digest reside under the resolved -/ staging area; cross-repository handoffs belong to ki-trades.',
  'FAIL',
  (context) => context.outboundPlacement
)

const ZONE_6: RubricItem<KbZoneContext> = {
  code: 'ZONE-6',
  title: 'session-digest scaffold is canonical',
  description:
    'A declared ki-repo-kb capability retains the exact -/_DIGESTS/README.md scaffold after digest records are removed.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: { class: 'automatic' },
    audit: { phase: 'INSPECT', run: (context) => context.digestScaffold },
    conform: { phase: 'PRIMARY', run: (context) => context.scaffoldDigestArea?.() }
  }
}

export const ZONE: RubricFamily<KbRubricContext, KbZoneContext> = {
  code: 'ZONE',
  title: 'zone layout',
  description: 'Required zones, indexes, staging, output placement, and retained digest scaffold.',
  standard: SOURCE,
  selectContext: (context) => context.zones,
  items: [ZONE_1, ZONE_2, ZONE_3, ZONE_4, ZONE_5, ZONE_6]
}
