import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import { auditEvidence, type EvidenceRubricContext, type RepoRubricContext } from '../contexts/repository.ts'

const DEP_1: RubricItem<EvidenceRubricContext> = {
  code: 'DEP-1',
  title: 'Dependabot and branch freshness',
  description: 'Dependabot alerts and updates are enabled and pull-request branches may be updated.',
  sources: ['standards-repository.md'],
  mechanical: {
    level: 'FAIL',
    overrideLevels: ['WARN'],
    audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.evidence, 'FAIL', ['WARN']) }
  }
}

export const DEP: RubricFamily<RepoRubricContext, EvidenceRubricContext> = {
  code: 'DEP',
  title: 'Dependency security',
  description: 'Dependabot and branch freshness.',
  standard: 'standards-repository.md',
  selectContext: (context) => context.dependencies,
  items: [DEP_1]
}
