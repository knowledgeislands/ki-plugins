import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import { auditEvidence, type EvidenceRubricContext, type RepoRubricContext } from '../contexts/repository.ts'

const ACCESS_1: RubricItem<EvidenceRubricContext> = {
  code: 'ACCESS-1',
  title: 'GitHub access and archive state',
  description: 'GitHub reachability is reported without manufacturing drift when offline, and archived repositories are skipped.',
  sources: ['standards-repository.md'],
  mechanical: {
    level: 'WARN',
    overrideLevels: ['FAIL'],
    audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.evidence, 'WARN', ['FAIL']) }
  }
}

export const ACCESS: RubricFamily<RepoRubricContext, EvidenceRubricContext> = {
  code: 'ACCESS',
  title: 'Repository access',
  description: 'GitHub reachability and archive state.',
  standard: 'standards-repository.md',
  selectContext: (context) => context.access,
  items: [ACCESS_1]
}
