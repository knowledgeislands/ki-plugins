import type { RubricFamily } from '../../shared/rubric.ts'
import { auditEvidence, type EngineeringRubricContext, type KnipRubricContext } from '../contexts/engineering.ts'

export const KNIP: RubricFamily<EngineeringRubricContext, KnipRubricContext> = {
  code: 'KNIP',
  title: 'Knip',
  description: 'The unused-code configuration and gate.',
  standard: 'standards-engineering.md',
  selectContext: (context) => context.knip,
  items: [
    {
      code: 'KNIP-1',
      title: 'Knip configuration exists',
      description: '`knip.json` exists with per-repo entry points and ignores.',
      sources: ['standards-engineering.md'],
      mechanical: {
        level: 'FAIL',
        audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.knip1, 'FAIL') },
        conform: { phase: 'PREPARE', run: (context) => context.scaffold?.() }
      }
    },
    {
      code: 'KNIP-2',
      title: 'Knip gate passes',
      description: '`bunx knip` exits clean.',
      sources: ['standards-engineering.md'],
      mechanical: {
        level: 'FAIL',
        audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.knip2, 'FAIL') },
        conform: { phase: 'PRIMARY', run: (context) => context.repair?.() }
      }
    }
  ]
}
