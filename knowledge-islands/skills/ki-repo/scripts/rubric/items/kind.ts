import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import { auditEvidence, type KindRubricContext, type RepoRubricContext } from '../contexts/repository.ts'

const SOURCE = 'standards-repository.md'

const KIND_1: RubricItem<KindRubricContext> = {
  code: 'KIND-1',
  title: 'Repository kind and store roles',
  description:
    'ki-repo owns the optional KB discriminator and validates its closed named-store vocabulary without accepting legacy locations.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance: 'Declare a supported repository kind and compatible store roles, then rerun the audit.'
    },
    audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.kind1, 'FAIL') }
  }
}

const KIND_2: RubricItem<KindRubricContext> = {
  code: 'KIND-2',
  title: 'Kind and structure compatibility',
  description:
    'A KB kind declares the KB structure and Streams planning model; a non-KB does not declare the KB structure.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance: 'Align the repository kind with its declared structure and planning model, then rerun the audit.'
    },
    audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.kind2, 'FAIL') }
  }
}

export const KIND: RubricFamily<RepoRubricContext, KindRubricContext> = {
  code: 'KIND',
  title: 'Repository kind',
  description: 'The selected repository operating model and named Knowledge Base store roles.',
  standard: SOURCE,
  selectContext: (context) => context.kind,
  items: [KIND_1, KIND_2]
}
