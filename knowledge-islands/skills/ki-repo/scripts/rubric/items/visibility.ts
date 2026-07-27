import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import { auditEvidence, type EvidenceRubricContext, type RepoRubricContext } from '../contexts/repository.ts'

const VIS_1: RubricItem<EvidenceRubricContext> = {
  code: 'VIS-1',
  title: 'Declared visibility',
  description: 'Live GitHub visibility matches the valid visibility declared in .ki-config.toml.',
  sources: ['standards-repository.md'],
  mechanical: { level: 'FAIL', audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.evidence, 'FAIL') } }
}

export const VIS: RubricFamily<RepoRubricContext, EvidenceRubricContext> = {
  code: 'VIS',
  title: 'Visibility',
  description: 'Declared and live repository visibility.',
  standard: 'standards-repository.md',
  selectContext: (context) => context.visibility,
  items: [VIS_1]
}
