import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import { auditEvidence, type EvidenceRubricContext, type RepoRubricContext } from '../contexts/repository.ts'

const CHECKS_1: RubricItem<EvidenceRubricContext> = {
  code: 'CHECKS-1',
  title: 'Override keys',
  description: 'Every ki-repo checks override names a supported overridable concern.',
  sources: ['standards-configuration.md'],
  mechanical: { level: 'WARN', audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.evidence, 'WARN') } }
}

export const CHECKS: RubricFamily<RepoRubricContext, EvidenceRubricContext> = {
  code: 'CHECKS',
  title: 'Check overrides',
  description: 'Per-repository override schema.',
  standard: 'standards-configuration.md',
  selectContext: (context) => context.checks,
  items: [CHECKS_1]
}
