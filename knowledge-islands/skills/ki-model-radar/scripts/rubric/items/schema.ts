import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { ModelRadarRubricContext, RadarOutcomeContext } from '../contexts/radar.ts'

const SOURCE = 'standards-model-radar.md#snapshot-schema'

const SCHEMA_1: RubricItem<RadarOutcomeContext> = {
  code: 'SCHEMA-1',
  title: 'snapshot schema and record identities are valid',
  description:
    'The radar parses as TOML schema 1, contains only the required map tables, uses stable lower-case hyphenated record identities, repeats each identity exactly in its record, and includes the required typed fields without unknown keys.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance:
        'Correct the authored radar structure or identity after confirming the intended record; do not infer missing model facts.'
    },
    audit: { phase: 'INSPECT', run: ({ outcomes }) => outcomes }
  }
}

export const SCHEMA: RubricFamily<ModelRadarRubricContext, RadarOutcomeContext> = {
  code: 'SCHEMA',
  title: 'Snapshot schema',
  description: 'The TOML snapshot has one stable, mechanically valid representation.',
  standard: SOURCE,
  selectContext: (context) => context.schema,
  items: [SCHEMA_1]
}
