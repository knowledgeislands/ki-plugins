import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import { auditEvidence, type EvidenceRubricContext, type RepoRubricContext } from '../contexts/repository.ts'

const ACT_1: RubricItem<EvidenceRubricContext> = {
  code: 'ACT-1',
  title: 'Actions policy',
  description: 'GitHub Actions allowed_actions is all; tighter deliberate policies are reported as warnings.',
  sources: ['standards-repository.md'],
  mechanical: {
    level: 'WARN',
    cost: 4,
    overrideLevels: ['FAIL'],
    remediation: {
      class: 'diagnostic',
      guidance: 'Set the intended GitHub Actions policy or record an explicit override, then rerun the audit.'
    },
    audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.evidence, 'WARN', ['FAIL']) }
  }
}

export const ACT: RubricFamily<RepoRubricContext, EvidenceRubricContext> = {
  code: 'ACT',
  title: 'Actions policy',
  description: 'GitHub Actions permissions.',
  standard: 'standards-repository.md',
  selectContext: (context) => context.actions,
  items: [ACT_1]
}
