import type { RubricFamily, RubricItem, ViolationLevel } from '../../shared/rubric.ts'
import {
  auditEvidence,
  type BuildRubricContext,
  type EngineeringEvidence,
  type EngineeringRubricContext
} from '../contexts/engineering.ts'

const item = (
  code: string,
  title: string,
  description: string,
  level: ViolationLevel,
  evidence: (context: BuildRubricContext) => EngineeringEvidence,
  overrideLevels?: readonly ViolationLevel[]
): RubricItem<BuildRubricContext> => ({
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
        'Align the compiled-build configuration and package surface with the declared build capability, then rerun the audit.'
    },
    audit: { phase: 'INSPECT', run: (context) => auditEvidence(evidence(context), level, overrideLevels) }
  }
})

export const BUILD: RubricFamily<EngineeringRubricContext, BuildRubricContext> = {
  code: 'BUILD',
  title: 'Compiled builds',
  description: 'The conditional compiled-TypeScript profile and CLI executable bit.',
  standard: 'standards-engineering.md',
  selectContext: (context) => context.build,
  items: [
    item(
      'BUILD-1',
      'Compiled-build shape',
      '`build` is `tsc -p tsconfig.build.json` (optionally with CLI chmod), `files` includes the scoped `dist`, and repos without compiled build are not applicable.',
      'FAIL',
      (context) => context.build1
    ),
    item(
      'BUILD-2',
      'Build TypeScript configuration',
      '`tsconfig.build.json` extends the base with the required emit, declaration, output, import, index-access, and test-exclusion settings.',
      'WARN',
      (context) => context.build2
    ),
    item(
      'BUILD-3',
      'Compiled shared TypeScript base',
      'Compiled repos set the richer shared TypeScript base: es2024 target, verbatimModuleSyntax, and noUnusedLocals.',
      'WARN',
      (context) => context.build3
    ),
    item(
      'BUILD-4',
      'CLI chmod iff rule',
      '`build` chmods `dist/cli/cli.js` iff `src/cli/` exists and chmods no other path.',
      'FAIL',
      (context) => context.build4,
      ['WARN']
    )
  ]
}
