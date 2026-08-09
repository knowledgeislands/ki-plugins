import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { TokenomicsConfigContext, TokenomicsRubricContext } from '../contexts/tokenomics.ts'

const SOURCE = 'standards-tokenomics.md'
const CFG_1: RubricItem<TokenomicsConfigContext> = {
  code: 'CFG-1',
  title: 'Selected configuration validates down',
  description:
    'Only the selected repository’s [skills.ki-tokenomics] table is validated; malformed recognised values FAIL and unknown keys WARN.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    overrideLevels: ['WARN'],
    remediation: {
      class: 'diagnostic',
      guidance: 'Correct the selected repository tokenomics declaration, then rerun the audit.'
    },
    audit: { phase: 'INSPECT', run: (context) => context.validates }
  }
}
export const CFG: RubricFamily<TokenomicsRubricContext, TokenomicsConfigContext> = {
  code: 'CFG',
  title: 'Portable configuration',
  description: 'Selected-repository tokenomics configuration.',
  standard: SOURCE,
  selectContext: (context) => context.config,
  items: [CFG_1]
}
