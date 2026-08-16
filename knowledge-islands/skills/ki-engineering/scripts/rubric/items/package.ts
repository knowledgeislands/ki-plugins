import type { RubricFamily, RubricItem, ViolationLevel } from '../../shared/rubric.ts'
import {
  auditEvidence,
  type EngineeringEvidence,
  type EngineeringRubricContext,
  type PackageRubricContext
} from '../contexts/engineering.ts'

const mechanical = (
  code: string,
  title: string,
  description: string,
  level: ViolationLevel,
  evidence: (context: PackageRubricContext) => EngineeringEvidence,
  options: { overrideLevels?: readonly ViolationLevel[]; conform?: (context: PackageRubricContext) => void } = {}
): RubricItem<PackageRubricContext> => {
  const base = { code, title, description, sources: ['standards-engineering.md'] as const }
  const shared = {
    level,
    ...(options.overrideLevels ? { overrideLevels: options.overrideLevels } : {}),
    audit: {
      phase: 'INSPECT' as const,
      run: (context: PackageRubricContext) => auditEvidence(evidence(context), level, options.overrideLevels)
    }
  }
  return options.conform
    ? {
        ...base,
        mechanical: {
          ...shared,
          remediation: { class: 'automatic' },
          conform: { phase: 'PRIMARY', run: options.conform }
        }
      }
    : {
        ...base,
        mechanical: {
          ...shared,
          remediation: {
            class: 'diagnostic',
            guidance:
              'Correct the package manifest structure or declare the missing ownership before rerunning the audit.'
          }
        }
      }
}

const synchronise = (context: PackageRubricContext): void => context.synchronise?.()

export const PACKAGE: RubricFamily<EngineeringRubricContext, PackageRubricContext> = {
  code: 'PKG',
  title: 'Package metadata',
  description: 'The shared package metadata and toolchain dependency surface.',
  standard: 'standards-engineering.md',
  selectContext: (context) => context.package,
  items: [
    mechanical('PKG-1', 'Module package type', '`"type": "module"`.', 'WARN', (context) => context.pkg1, {
      conform: synchronise
    }),
    mechanical(
      'PKG-2',
      'Bun package-manager pin',
      '`"packageManager"` starts with `bun@` (pinned patch).',
      'WARN',
      (context) => context.pkg2,
      {
        conform: synchronise
      }
    ),
    mechanical('PKG-3', 'Node engine floor', '`"engines.node"` floor is `>= 22`.', 'WARN', (context) => context.pkg3, {
      conform: synchronise
    }),
    mechanical(
      'PKG-4',
      'Closed package coverage manifest',
      'Every top-level `package.json` key is in the engineering coverage manifest; an unknown key is drift. This is also the criterion for an unparseable `package.json`.',
      'FAIL',
      (context) => context.pkg4
    ),
    mechanical(
      'PKG-5',
      'Toolchain dependencies declared',
      'The toolchain devDependencies `@biomejs/biome`, `knip`, `rumdl`, `husky`, `lint-staged`, `syncpack`, and `typescript` are declared rather than implied.',
      'FAIL',
      (context) => context.pkg5,
      { conform: synchronise }
    ),
    mechanical(
      'PKG-6',
      'Lint-staged fan-out',
      '`lint-staged` is present and fans out to Biome on staged code and `rumdl check --fix` on staged authored Markdown.',
      'FAIL',
      (context) => context.pkg6,
      { overrideLevels: ['WARN'], conform: synchronise }
    )
  ]
}
