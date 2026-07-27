import type { RubricFamily, RubricItem, ViolationLevel } from '../../shared/rubric.ts'
import { auditEvidence, type EngineeringEvidence, type EngineeringRubricContext, type TestRubricContext } from '../contexts/engineering.ts'

const mechanical = (
  code: string,
  title: string,
  description: string,
  level: ViolationLevel,
  evidence: (context: TestRubricContext) => EngineeringEvidence,
  overrideLevels?: readonly ViolationLevel[]
): RubricItem<TestRubricContext> => ({
  code,
  title,
  description,
  sources: ['standards-engineering.md'],
  mechanical: {
    level,
    ...(overrideLevels ? { overrideLevels } : {}),
    audit: { phase: 'INSPECT', run: (context) => auditEvidence(evidence(context), level, overrideLevels) }
  }
})

export const TEST: RubricFamily<EngineeringRubricContext, TestRubricContext> = {
  code: 'TEST',
  title: 'Tests',
  description: 'Runner-neutral tests and the conditional Vitest coverage profile.',
  standard: 'standards-engineering.md',
  selectContext: (context) => context.test,
  items: [
    mechanical(
      'TEST-1',
      'Test capability and Vitest profile',
      'Test-capable repos expose bare `test`; a recognised root Vitest config requires the canonical test, coverage, and watch scripts, while no capability is not applicable.',
      'WARN',
      (context) => context.test1,
      ['FAIL']
    ),
    mechanical(
      'TEST-2',
      'Vitest coverage thresholds',
      'Under the Vitest profile, coverage thresholds are exactly 100% for lines, functions, branches, and statements.',
      'FAIL',
      (context) => context.test2
    ),
    mechanical(
      'TEST-3',
      'Vitest test-source exclusion',
      'Under the Vitest profile, coverage excludes `src/**/*.test.ts`.',
      'WARN',
      (context) => context.test3
    ),
    mechanical(
      'TEST-4',
      'Vitest monorepo scoping',
      'Under the Vitest profile, workspace repos scope include, exclude, and reportsDirectory to the workspace rather than a flat root.',
      'WARN',
      (context) => context.test4
    ),
    mechanical(
      'TEST-5',
      'Vitest coverage command passes',
      'Under the Vitest profile, `bun run test:coverage` exits clean when the companion script exists.',
      'FAIL',
      (context) => context.test5
    ),
    {
      code: 'TEST-6',
      title: 'Tests are colocated and genuinely complete',
      description: 'Under the Vitest profile, tests are colocated with the source they cover and genuinely reach the 100% bar.',
      sources: ['standards-engineering.md'],
      judgment: { prompt: 'Are tests colocated with their source and does their coverage evidence substantiate the 100% claim?' }
    }
  ]
}
