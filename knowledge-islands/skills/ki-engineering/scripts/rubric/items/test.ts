import type { RubricFamily, RubricItem, ViolationLevel } from '../../shared/rubric.ts'
import {
  auditEvidence,
  type EngineeringEvidence,
  type EngineeringRubricContext,
  type TestRubricContext
} from '../contexts/engineering.ts'

const mechanical = (
  code: string,
  title: string,
  description: string,
  level: ViolationLevel,
  evidence: (context: TestRubricContext) => EngineeringEvidence,
  { overrideLevels, cost }: { overrideLevels?: readonly ViolationLevel[]; cost?: number } = {}
): RubricItem<TestRubricContext> => ({
  code,
  title,
  description,
  sources: ['standards-engineering.md'],
  mechanical: {
    level,
    ...(overrideLevels ? { overrideLevels } : {}),
    ...(cost ? { cost } : {}),
    remediation: {
      class: 'diagnostic',
      guidance:
        'Align the test runner or Vitest coverage configuration with the declared test capability, then rerun the audit.'
    },
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
      { overrideLevels: ['FAIL'] }
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
      (context) => context.test5,
      // The dearest criterion in the catalogue by an order of magnitude: a full suite under
      // coverage instrumentation, against the sub-second gates that are its nearest siblings.
      { cost: 60 }
    ),
    {
      code: 'TEST-6',
      title: 'Tests are colocated and genuinely complete',
      description:
        'Under the Vitest profile, tests are colocated with the source they cover and genuinely reach the 100% bar.',
      sources: ['standards-engineering.md'],
      judgment: {
        scope: 'The Vitest test files, covered source files, and coverage evidence.',
        prompt: 'Are tests colocated with their source and does their coverage evidence substantiate the 100% claim?',
        outcomes: ['conforming', 'gap', 'exclusion'],
        guidance: 'Colocate or strengthen the tests, record a named Gap, or record an explicit capability exclusion.'
      }
    },
    {
      code: 'TEST-7',
      title: 'Coverage follows observable contracts',
      description:
        'Coverage evidence starts from supported observable behaviour: reachable paths are proven through their public boundary, unreachable paths are removed, and fault injection stays at a documented interface boundary.',
      sources: ['standards-engineering.md#testing-capability-the-repo-ships-tests'],
      judgment: {
        scope:
          'The supported public contract, covered implementation paths, tests, and any documented interface-level fault injection.',
        prompt:
          'Does each reachable path have evidence through the nearest supported public boundary, with unsupported paths removed rather than preserved for coverage, and is any fault injection a documented interface failure that cannot be exercised deterministically through that boundary?',
        outcomes: ['conforming', 'gap', 'exception'],
        guidance:
          'Add or strengthen an observable-contract case, remove unsupported unreachable code, or document why a necessary interface-level fault injection cannot be exercised through the ordinary public entrypoint.'
      }
    }
  ]
}
