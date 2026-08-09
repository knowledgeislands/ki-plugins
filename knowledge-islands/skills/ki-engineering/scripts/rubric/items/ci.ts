import type { RubricFamily, RubricItem, ViolationLevel } from '../../shared/rubric.ts'
import { auditEvidence, type CiRubricContext, type EngineeringRubricContext } from '../contexts/engineering.ts'

const item = (
  code: string,
  title: string,
  description: string,
  level: ViolationLevel,
  evidence: (context: CiRubricContext) => CiRubricContext['ci1'],
  overrideLevels?: readonly ViolationLevel[]
): RubricItem<CiRubricContext> => ({
  code,
  title,
  description,
  sources: ['standards-engineering.md'],
  mechanical: {
    level,
    ...(overrideLevels ? { overrideLevels } : {}),
    remediation: {
      class: 'diagnostic',
      guidance:
        'Align the CI workflow with the declared toolchain and canonical repository gates, then rerun the audit.'
    },
    audit: { phase: 'INSPECT', run: (context) => auditEvidence(evidence(context), level, overrideLevels) }
  }
})

export const CI: RubricFamily<EngineeringRubricContext, CiRubricContext> = {
  code: 'CI',
  title: 'Continuous integration',
  description: 'CI installs the declared toolchain and runs canonical repository gates.',
  standard: 'standards-engineering.md',
  selectContext: (context) => context.ci,
  items: [
    item(
      'CI-1',
      'CI installs the declared toolchain',
      'Where `.github/workflows/ci.yml` exists, it uses `jdx/mise-action` and hardcodes no Bun or Node version.',
      'WARN',
      (context) => context.ci1
    ),
    item(
      'CI-2',
      'CI runs the canonical gates',
      '`ci.yml` runs `ki repo audit --repo .`, then `bun run test` when tests exist, and does not route governance through package scripts.',
      'FAIL',
      (context) => context.ci2,
      ['WARN']
    )
  ]
}
