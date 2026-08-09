import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import { auditEvidence, type EvidenceRubricContext, type RepoRubricContext } from '../contexts/repository.ts'

const DEP_1: RubricItem<EvidenceRubricContext> = {
  code: 'DEP-1',
  title: 'Dependabot and branch freshness',
  description: 'Dependabot alerts and updates are enabled and pull-request branches may be updated.',
  sources: ['standards-repository.md'],
  mechanical: {
    // Three GitHub round trips where its siblings each make one.
    level: 'FAIL',
    cost: 12,
    overrideLevels: ['WARN'],
    remediation: {
      class: 'diagnostic',
      guidance:
        'Enable the required Dependabot and branch-update settings or record an explicit override, then rerun the audit.'
    },
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
