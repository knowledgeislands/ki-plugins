import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import { auditEvidence, type EvidenceRubricContext, type RepoRubricContext } from '../contexts/repository.ts'

const SEC_1: RubricItem<EvidenceRubricContext> = {
  code: 'SEC-1',
  title: 'Secret scanning protection',
  description: 'Public repositories enable secret scanning and push protection unless explicitly overridden.',
  sources: ['standards-repository.md'],
  mechanical: {
    level: 'FAIL',
    overrideLevels: ['WARN'],
    audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.evidence, 'FAIL', ['WARN']) }
  }
}

export const SEC: RubricFamily<RepoRubricContext, EvidenceRubricContext> = {
  code: 'SEC',
  title: 'Secret protection',
  description: 'Secret scanning and push protection.',
  standard: 'standards-repository.md',
  selectContext: (context) => context.secrets,
  items: [SEC_1]
}
