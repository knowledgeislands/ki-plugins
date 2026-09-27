import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import { auditEvidence, type EvidenceRubricContext, type RepoRubricContext } from '../contexts/repository.ts'

const TOGGLE_1: RubricItem<EvidenceRubricContext> = {
  code: 'TOGGLE-1',
  title: 'Repository feature toggles',
  description:
    'Issues are enabled exactly when ki-work-github-issues is declared; Wiki and Projects are disabled unless explicitly overridden.',
  sources: ['standards-repository.md'],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance:
        'Align Issues with the selected work adapter and the other repository feature settings with their overrides, then rerun the audit.'
    },
    audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.evidence, 'FAIL') }
  }
}

export const TOGGLE: RubricFamily<RepoRubricContext, EvidenceRubricContext> = {
  code: 'TOGGLE',
  title: 'Repository features',
  description: 'Issues, Wiki, and Projects settings.',
  standard: 'standards-repository.md',
  selectContext: (context) => context.toggle,
  items: [TOGGLE_1]
}
