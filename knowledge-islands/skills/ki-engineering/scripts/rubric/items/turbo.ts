import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import {
  auditEvidence,
  type EngineeringEvidence,
  type EngineeringRubricContext,
  type TurboRubricContext
} from '../contexts/engineering.ts'

const item = (
  code: string,
  title: string,
  description: string,
  evidence: (context: TurboRubricContext) => EngineeringEvidence
): RubricItem<TurboRubricContext> => ({
  code,
  title,
  description,
  sources: ['standards-engineering.md'],
  mechanical: {
    level: 'WARN',
    remediation: {
      class: 'diagnostic',
      guidance: 'Adopt or repair the Turborepo task graph described by the engineering standard, then rerun the audit.'
    },
    audit: { phase: 'INSPECT', run: (context) => auditEvidence(evidence(context), 'WARN') }
  }
})

export const TURBO: RubricFamily<EngineeringRubricContext, TurboRubricContext> = {
  code: 'TURBO',
  title: 'Workspace task graph',
  description: 'Turborepo adoption, task correspondence, and cache boundaries for Bun workspaces.',
  standard: 'standards-engineering.md',
  selectContext: (context) => context.turbo,
  items: [
    item(
      'TURBO-1',
      'Task-graph adoption',
      'A repository declaring workspaces has a readable turbo.json with a non-empty task graph.',
      (context) => context.turbo1
    ),
    item(
      'TURBO-2',
      'Task correspondence',
      'Every workspace declares the lifecycle scripts it has, build included where it emits output, and configured Turborepo tasks correspond in both directions.',
      (context) => context.turbo2
    ),
    item(
      'TURBO-3',
      'Cache boundaries',
      'Remote caching is explicit, local state is ignored, workspace packages stay out of root dependencies, and deployable builds hash their whole workspace.',
      (context) => context.turbo3
    )
  ]
}
