import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { AgoraRubricContext, OutcomeContext } from '../contexts/agora.ts'

const SOURCE = 'standards-agora.md'

const CONFIG_1: RubricItem<OutcomeContext> = {
  code: 'CONFIG-1',
  title: 'Agora homes are canonical',
  description:
    'A declared Agora home uses a stable identifier and records only its non-empty purpose, duplicate-free permitted target-policy categories, and canonical HTTPS GitHub member repositories with lower-case hyphenated roles. The home itself is never an implicit member.',
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
  description: 'Home identity, purpose, target policy, and approved member roles are explicit and portable.',
  standard: SOURCE,
  selectContext: (context) => context.configuration,
  items: [CONFIG_1]
}
