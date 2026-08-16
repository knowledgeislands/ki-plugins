import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { AgoraRubricContext, OutcomeContext } from '../contexts/agora.ts'

const SOURCE = 'standards-agora.md'

const MEMBERSHIP_1: RubricItem<OutcomeContext> = {
  code: 'MEMBERSHIP-1',
  title: 'member consent is canonical',
  description:
    'Each declared membership names one stable Agora identifier, canonical HTTPS GitHub home, and lower-case hyphenated role with no unknown fields. A repository may declare multiple memberships; local shape never infers peer agreement.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    overrideLevels: ['WARN'],
    remediation: {
      class: 'diagnostic',
      guidance: 'Correct the local ki-agora membership declaration, then rerun the audit.'
    },
    audit: { phase: 'INSPECT', run: ({ outcomes }) => outcomes }
  }
}

export const MEMBERSHIP: RubricFamily<AgoraRubricContext, OutcomeContext> = {
  code: 'MEMBERSHIP',
  title: 'Member declaration',
  description: 'Every membership is a local, portable consent declaration.',
  standard: SOURCE,
  selectContext: (context) => context.memberships,
  items: [MEMBERSHIP_1]
}
