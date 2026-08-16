import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import { auditEvidence, type EngineeringRubricContext, type MiseRubricContext } from '../contexts/engineering.ts'

const item = (
  code: string,
  title: string,
  description: string,
  evidence: (context: MiseRubricContext) => MiseRubricContext['mise1'],
  conform = false
): RubricItem<MiseRubricContext> => {
  const base = { code, title, description, sources: ['standards-engineering.md'] as const }
  const audit = {
    phase: 'INSPECT' as const,
    run: (context: MiseRubricContext) => auditEvidence(evidence(context), 'WARN')
  }
  return conform
    ? {
        ...base,
        mechanical: {
          level: 'WARN',
          remediation: { class: 'automatic' },
          audit,
          conform: { phase: 'PREPARE', run: (context) => context.scaffold?.() }
        }
      }
    : {
        ...base,
        mechanical: {
          level: 'WARN',
          remediation: {
            class: 'diagnostic',
            guidance: 'Align the declared toolchain pins and remove obsolete pin files, then rerun the audit.'
          },
          audit
        }
      }
}

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
