import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import { auditEvidence, type EvidenceRubricContext, type RepoRubricContext } from '../contexts/repository.ts'

const MERGE_1: RubricItem<EvidenceRubricContext> = {
  code: 'MERGE-1',
  title: 'Merge policy',
  description: 'The repository permits squash merges only and deletes merged head branches.',
  sources: ['standards-repository.md'],
  mechanical: { level: 'FAIL', audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.evidence, 'FAIL') } }
}

export const MERGE: RubricFamily<RepoRubricContext, EvidenceRubricContext> = {
  code: 'MERGE',
  title: 'Merge policy',
  description: 'GitHub merge and branch-cleanup behaviour.',
  standard: 'standards-repository.md',
  selectContext: (context) => context.merge,
  items: [MERGE_1]
}
