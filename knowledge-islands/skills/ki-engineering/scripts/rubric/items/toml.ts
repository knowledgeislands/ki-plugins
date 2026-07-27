import type { RubricFamily } from '../../shared/rubric.ts'
import { auditEvidence, type EngineeringRubricContext, type TomlRubricContext } from '../contexts/engineering.ts'

export const TOML: RubricFamily<EngineeringRubricContext, TomlRubricContext> = {
  code: 'TOML',
  title: 'Engineering configuration',
  description: 'The repository selector and validate-down configuration boundary.',
  standard: 'standards-engineering.md',
  selectContext: (context) => context.toml,
  items: [
    {
      code: 'TOML-1',
      title: 'Engineering selector table',
      description: 'A `[ki-engineering]` table is present.',
      sources: ['standards-engineering.md'],
      mechanical: {
        level: 'WARN',
        audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.toml1, 'WARN') },
        conform: { phase: 'PRIMARY', run: (context) => context.declare?.() }
      }
    },
    {
      code: 'TOML-2',
      title: 'Engineering configuration validates down',
      description: 'Every key under `[ki-engineering]` is known to the checker; an unknown key is drift.',
      sources: ['standards-engineering.md'],
      mechanical: {
        level: 'WARN',
        audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.toml2, 'WARN') }
      }
    }
  ]
}
