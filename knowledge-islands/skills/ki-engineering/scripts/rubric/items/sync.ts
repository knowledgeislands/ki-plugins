import type { RubricFamily } from '../../shared/rubric.ts'
import { auditEvidence, type EngineeringRubricContext, type SyncRubricContext } from '../contexts/engineering.ts'

export const SYNC: RubricFamily<EngineeringRubricContext, SyncRubricContext> = {
  code: 'SYNC',
  title: 'Dependency synchronisation',
  description: 'Declared dependency ranges are canonically ordered and aligned.',
  standard: 'standards-engineering.md',
  selectContext: (context) => context.sync,
  items: [
    {
      code: 'SYNC-1',
      title: 'Dependency synchronisation passes',
      description: '`bunx syncpack format --check` exits clean.',
      sources: ['standards-engineering.md'],
      mechanical: {
        level: 'FAIL',
        cost: 2,
        remediation: { class: 'automatic' },
        audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.sync1, 'FAIL') },
        conform: { phase: 'NORMALISE', run: (context) => context.normalise?.() }
      }
    }
  ]
}
