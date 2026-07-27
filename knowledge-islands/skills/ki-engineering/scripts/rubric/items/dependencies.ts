import type { RubricFamily } from '../../shared/rubric.ts'
import { auditEvidence, type DependenciesRubricContext, type EngineeringRubricContext } from '../contexts/engineering.ts'

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
      description: '`bun outdated` reports no available updates; available updates are reviewed through `ki repo conform`.',
      sources: ['standards-engineering.md'],
      mechanical: {
        level: 'WARN',
        overrideLevels: ['FAIL'],
        audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.deps1, 'WARN', ['FAIL']) },
        conform: { phase: 'PREPARE', run: (context) => context.update?.() }
      }
    }
  ]
}
