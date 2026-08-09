import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import { auditEvidence, type EvidenceRubricContext, type RepoRubricContext } from '../contexts/repository.ts'

const BP_1: RubricItem<EvidenceRubricContext> = {
  code: 'BP-1',
  title: 'Branch protection',
  description:
    'Main has the configured branch-protection posture, including required PR, build check, and linear history when enabled.',
  sources: ['standards-repository.md'],
  mechanical: {
    level: 'FAIL',
    cost: 4,
    remediation: {
      class: 'diagnostic',
      guidance: 'Configure the required branch-protection posture or record an explicit override, then rerun the audit.'
    },
    audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.evidence, 'FAIL') }
  }
}

export const BP: RubricFamily<RepoRubricContext, EvidenceRubricContext> = {
  code: 'BP',
  title: 'Branch protection',
  description: 'Optional main-branch protection.',
  standard: 'standards-repository.md',
  selectContext: (context) => context.branchProtection,
  items: [BP_1]
}
