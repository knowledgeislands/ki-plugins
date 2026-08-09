import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import { auditEvidence, type EvidenceRubricContext, type RepoRubricContext } from '../contexts/repository.ts'

const PKG_1: RubricItem<EvidenceRubricContext> = {
  code: 'PKG-1',
  title: 'Package identity metadata',
  description: 'package.json carries coherent identity and repository metadata when present.',
  sources: ['standards-repository.md'],
  mechanical: {
    level: 'FAIL',
    overrideLevels: ['WARN'],
    remediation: {
      class: 'diagnostic',
      guidance: 'Correct package identity metadata or record an explicit override, then rerun the audit.'
    },
    audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.evidence, 'FAIL', ['WARN']) }
  }
}

export const PKG: RubricFamily<RepoRubricContext, EvidenceRubricContext> = {
  code: 'PKG',
  title: 'Package metadata',
  description: 'Package identity and repository metadata.',
  standard: 'standards-repository.md',
  selectContext: (context) => context.pkg,
  items: [PKG_1]
}
