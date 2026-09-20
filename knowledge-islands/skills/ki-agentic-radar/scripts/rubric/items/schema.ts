import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { AgenticRadarRubricContext, RadarOutcomeContext } from '../contexts/radar.ts'

const SOURCE = 'standards-agentic-radar.md#snapshot-schema'

const SCHEMA_1: RubricItem<RadarOutcomeContext> = {
  code: 'SCHEMA-1',
  title: 'snapshot schema and owners are valid',
  description:
    'The radar parses as schema 1 TOML with only declared maps and fields, stable lower-case hyphenated identities, complete subject records, and explicit non-empty owner, uncertainty, and return-trigger values.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance:
        'Correct authored structure only after confirming intended subject identity, owner, uncertainty, and return trigger.'
    },
    audit: { phase: 'INSPECT', run: ({ outcomes }) => outcomes }
  }
}

export const SCHEMA: RubricFamily<AgenticRadarRubricContext, RadarOutcomeContext> = {
  code: 'SCHEMA',
  title: 'Snapshot schema',
  description: 'The TOML snapshot has one stable, attributable, mechanically valid representation.',
  standard: SOURCE,
  selectContext: (context) => context.schema,
  items: [SCHEMA_1]
}
