import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import { auditEvidence, type EvidenceRubricContext, type RepoRubricContext } from '../contexts/repository.ts'

const COV_1: RubricItem<EvidenceRubricContext> = {
  code: 'COV-1',
  title: 'Governance coverage cascade',
  description:
    'Detected governance applicability and declared opt-in tables agree, subject to explicit coverage overrides.',
  sources: ['standards-configuration.md'],
  mechanical: {
    level: 'WARN',
    remediation: {
      class: 'diagnostic',
      guidance:
        'Align the declared coverage table with detected applicability or record an explicit override, then rerun the audit.'
    },
    audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.evidence, 'WARN') }
  }
}

export const COV: RubricFamily<RepoRubricContext, EvidenceRubricContext> = {
  code: 'COV',
  title: 'Governance coverage',
  description: 'Detected and declared governance coverage.',
  standard: 'standards-configuration.md',
  selectContext: (context) => context.coverage,
  items: [COV_1]
}
