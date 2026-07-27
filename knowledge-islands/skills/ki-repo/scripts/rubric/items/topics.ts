import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import { auditEvidence, type EvidenceRubricContext, type RepoRubricContext } from '../contexts/repository.ts'

const TOPICS_1: RubricItem<EvidenceRubricContext> = {
  code: 'TOPICS-1',
  title: 'Public repository topics',
  description: 'A public repository carries the standard topic set unless explicitly overridden.',
  sources: ['standards-repository.md'],
  mechanical: { level: 'FAIL', audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.evidence, 'FAIL') } }
}

export const TOPICS: RubricFamily<RepoRubricContext, EvidenceRubricContext> = {
  code: 'TOPICS',
  title: 'Topics',
  description: 'Public repository topic conventions.',
  standard: 'standards-repository.md',
  selectContext: (context) => context.topics,
  items: [TOPICS_1]
}
