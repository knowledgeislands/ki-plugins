import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import { auditEvidence, type EvidenceRubricContext, type RepoRubricContext } from '../contexts/repository.ts'

const TOPICS_1: RubricItem<EvidenceRubricContext> = {
  code: 'TOPICS-1',
  title: 'Public repository topics',
  description:
    'A public repository carries a non-empty topic set, and where `package.json` declares "keywords" the topics agree with them modulo GitHub normalisation, unless explicitly overridden.',
  sources: ['standards-repository.md'],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance:
        'Set the repository\'s discovery topics — syncing `package.json` "keywords" where present — or record an explicit override, then rerun the audit.'
    },
    audit: { phase: 'INSPECT', run: (context) => auditEvidence(context.evidence, 'FAIL') }
  }
}

const TOPICS_2: RubricItem<EvidenceRubricContext> = {
  code: 'TOPICS-2',
  title: 'Topic fit',
  description:
    'The topic set accurately describes the repository, and each common estate topic that applies is present.',
  sources: ['standards-repository.md'],
  judgment: {
    scope:
      'The public topic set (and any `package.json` "keywords") against the repository purpose and the common estate topics.',
    prompt:
      'Judge whether the topics describe what this repository actually is, and whether any common estate topic applies but is missing.',
    outcomes: ['conforming', 'gap', 'exclusion'],
    guidance: 'Adjust the topics and keywords, record a named gap, or record why a common topic does not apply.'
  }
}

export const TOPICS: RubricFamily<RepoRubricContext, EvidenceRubricContext> = {
  code: 'TOPICS',
  title: 'Topics',
  description: 'Public repository discovery-topic conventions.',
  standard: 'standards-repository.md',
  selectContext: (context) => context.topics,
  items: [TOPICS_1, TOPICS_2]
}
