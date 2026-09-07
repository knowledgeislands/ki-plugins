import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { AgoraRubricContext, OutcomeContext } from '../contexts/agora.ts'

const SOURCE = 'standards-agora.md'

const CONFIG_1: RubricItem<OutcomeContext> = {
  code: 'CONFIG-1',
  title: 'Agora homes are canonical',
  description:
    'A declared Agora home uses a stable identifier, explicitly names the canonical identity of its declaring owner repository, and records only its non-empty purpose, optional duplicate-free ordered projection prefix, optional duplicate-free canonical HTTPS GitHub references, and canonical member repositories with lower-case hyphenated roles. Owner, member, and reference identities are mutually exclusive; ordered identities name one of those classes and affect projection order only. References are owner-selected non-members requiring no reciprocal declaration. Unknown fields fail closed, and local declaration shape is not reciprocal-consent evidence.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    overrideLevels: ['WARN'],
    remediation: {
      class: 'diagnostic',
      guidance: 'Correct the local ki-agora home declaration, then rerun the audit.'
    },
    audit: { phase: 'INSPECT', run: ({ outcomes }) => outcomes }
  }
}

export const CONFIG: RubricFamily<AgoraRubricContext, OutcomeContext> = {
  code: 'CONFIG',
  title: 'Agora home declaration',
  description: 'Owner identity, purpose, ordered projection, and approved member roles are explicit and portable.',
  standard: SOURCE,
  selectContext: (context) => context.configuration,
  items: [CONFIG_1]
}
