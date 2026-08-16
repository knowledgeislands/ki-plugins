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
      description: 'A `[skills.ki-engineering]` table is present.',
      sources: ['standards-engineering.md'],
      mechanical: {
        level: 'WARN',
        remediation: { class: 'automatic' },
        audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.toml1, 'WARN') },
        conform: { phase: 'PRIMARY', run: (context) => context.declare?.() }
      }
    },
    {
      code: 'TOML-2',
      title: 'Engineering configuration validates down',
      description: 'Every key under `[skills.ki-engineering]` is known to the checker; an unknown key is drift.',
      sources: ['standards-engineering.md'],
      mechanical: {
        level: 'WARN',
        remediation: {
          class: 'diagnostic',
          guidance: 'Remove or correct the unknown engineering configuration key, then rerun the audit.'
        },
        audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.toml2, 'WARN') }
      }
    },
    {
      code: 'TOML-3',
      title: 'Engineering check records validate',
      description:
        'Every optional `[skills.ki-engineering.checks]` entry names a known mechanical rubric ID and has a boolean value; entries remain diagnostic records, not audit waivers.',
      sources: ['standards-engineering.md'],
      mechanical: {
        level: 'WARN',
        remediation: {
          class: 'diagnostic',
          guidance:
            'Remove or correct the check-record key or value; retain any exception rationale in the repository change record, then rerun the audit.'
        },
        audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.toml3, 'WARN') }
      }
    }
  ]
}
