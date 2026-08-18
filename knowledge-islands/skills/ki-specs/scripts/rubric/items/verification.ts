import type { AuditOutcome, RubricFamily, RubricItem, RubricOutcomes } from '../../shared/rubric.ts'
import type { SpecsRubricContext, SpecVerificationContext } from '../contexts/specs.ts'

const SOURCE = 'standards-specs.md'
const outcomes = (values: readonly AuditOutcome[], pass: string): RubricOutcomes<AuditOutcome> => {
  if (values.length > 0) return values
  return [{ status: 'PASS', message: pass }]
}

const VERIFY_1: RubricItem<SpecVerificationContext> = {
  code: 'VERIFY-1',
  title: 'requirements carry a Verify hook',
  description: 'Each active requirement has a `_Verify:_` line.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance: 'Add a concrete _Verify:_ hook for the requirement, then rerun the audit.'
    },
    audit: {
      phase: 'INSPECT',
      run: (context) =>
        !context.applicable
          ? [{ status: 'NOT_APPLICABLE', message: 'ki-specs is not declared for this repository.' }]
          : outcomes(
              context.requirements
                .filter((requirement) => !requirement.deprecated && !requirement.hasVerify)
                .map((requirement) => ({
                  status: 'VIOLATION',
                  message: `${requirement.id} has no _Verify:_ line.`,
                  subject: requirement.file
                })),
              'Every active requirement carries a _Verify:_ hook.'
            )
    }
  }
}

const VERIFY_2: RubricItem<SpecVerificationContext> = {
  code: 'VERIFY-2',
  title: 'Verify hooks are concrete and checkable',
  description:
    'The `_Verify:_` hook names a concrete built-output assertion, test, or source symbol rather than restating the requirement.',
  sources: [SOURCE],
  judgment: {
    scope: 'Every active requirement and its _Verify:_ hook in the Specifications corpus.',
    prompt:
      'Assess whether each `_Verify:_` hook names a concrete built-output assertion, test, or source symbol rather than restating the requirement.',
    outcomes: ['conforming', 'gap', 'exclusion'],
    guidance: 'Record the result as a requirement improvement, a named Gap, or an explicit area-level exclusion.'
  }
}

export const VERIFY: RubricFamily<SpecsRubricContext, SpecVerificationContext> = {
  code: 'VERIFY',
  title: 'verification hooks',
  description: 'Active requirements carry a verification hook whose quality is reviewed.',
  standard: SOURCE,
  selectContext: (context) => context.verification,
  items: [VERIFY_1, VERIFY_2]
}
