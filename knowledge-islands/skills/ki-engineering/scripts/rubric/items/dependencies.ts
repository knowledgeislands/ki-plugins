import type { RubricFamily } from '../../shared/rubric.ts'
import {
  auditEvidence,
  type DependenciesRubricContext,
  type EngineeringRubricContext
} from '../contexts/engineering.ts'

export const DEPENDENCIES: RubricFamily<EngineeringRubricContext, DependenciesRubricContext> = {
  code: 'DEPS',
  title: 'Dependency freshness',
  description: 'Available dependency updates are surfaced and deliberately applied.',
  standard: 'standards-engineering.md',
  selectContext: (context) => context.dependencies,
  items: [
    {
      code: 'DEPS-1',
      title: 'Dependencies are current',
      description:
        '`bun outdated` reports no available updates; available updates are reviewed through `ki repo conform`.',
      sources: ['standards-engineering.md'],
      mechanical: {
        level: 'WARN',
        overrideLevels: ['FAIL'],
        remediation: {
          class: 'guarded',
          guidance:
            'Review each available dependency update and apply the selected versions deliberately, then rerun the audit.'
        },
        audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.deps1, 'WARN', ['FAIL']) }
      },
      judgment: {
        scope: 'Every available dependency update and its release notes, compatibility impact, and lockfile change.',
        prompt:
          'Should each available update be adopted now without violating repository compatibility or release commitments?',
        outcomes: ['adopt', 'defer', 'exclusion'],
        guidance:
          'Apply the approved update, record a deliberate deferral with its owner, or record an explicit exclusion.'
      }
    }
  ]
}
