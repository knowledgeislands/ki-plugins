import type { RubricFamily } from '../../shared/rubric.ts'
import { auditEvidence, type EngineeringRubricContext, type GeneratedRubricContext } from '../contexts/engineering.ts'

export const GENERATED: RubricFamily<EngineeringRubricContext, GeneratedRubricContext> = {
  code: 'GEN',
  title: 'Generated surfaces',
  description: 'Managed discovery surfaces carry consistent tool exclusions.',
  standard: 'standards-engineering.md',
  selectContext: (context) => context.generated,
  items: [
    {
      code: 'GEN-1',
      title: 'Managed discovery surfaces share exclusions',
      description:
        'Known generated or managed discovery surfaces have matching Biome, Knip, and Markdown exclusions, and no legacy `.ki` runtime exclusion remains.',
      sources: ['standards-engineering.md'],
      mechanical: {
        level: 'FAIL',
        remediation: {
          class: 'diagnostic',
          guidance:
            'Align the generated-surface exclusions with the managed paths and remove the legacy runtime exclusion, then rerun the audit.'
        },
        audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.gen1, 'FAIL') }
      }
    }
  ]
}
