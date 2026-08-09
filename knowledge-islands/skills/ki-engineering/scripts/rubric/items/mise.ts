import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import { auditEvidence, type EngineeringRubricContext, type MiseRubricContext } from '../contexts/engineering.ts'

const item = (
  code: string,
  title: string,
  description: string,
  evidence: (context: MiseRubricContext) => MiseRubricContext['mise1'],
  conform = false
): RubricItem<MiseRubricContext> => ({
  code,
  title,
  description,
  sources: ['standards-engineering.md'],
  mechanical: {
    level: 'WARN',
    remediation: conform
      ? { class: 'automatic' }
      : {
          class: 'diagnostic',
          guidance: 'Align the declared toolchain pins and remove obsolete pin files, then rerun the audit.'
        },
    audit: { phase: 'INSPECT', run: (context) => auditEvidence(evidence(context), 'WARN') },
    ...(conform
      ? { conform: { phase: 'PREPARE' as const, run: (context: MiseRubricContext) => context.scaffold?.() } }
      : {})
  }
})

export const MISE: RubricFamily<EngineeringRubricContext, MiseRubricContext> = {
  code: 'MISE',
  title: 'Toolchain pins',
  description: 'The single root Node and Bun toolchain declaration.',
  standard: 'standards-engineering.md',
  selectContext: (context) => context.mise,
  items: [
    item(
      'MISE-1',
      'Root toolchain pin',
      'A root `mise.toml` pins both `node` and `bun` under `[tools]`.',
      (context) => context.mise1,
      true
    ),
    item(
      'MISE-2',
      'Bun pin drift pair',
      'The `mise.toml` Bun version equals the `packageManager` Bun version.',
      (context) => context.mise2
    ),
    item(
      'MISE-3',
      'No legacy tool pins',
      'No legacy `.node-version`, `.nvmrc`, or `.bun-version` file lingers beside `mise.toml`.',
      (context) => context.mise3
    )
  ]
}
