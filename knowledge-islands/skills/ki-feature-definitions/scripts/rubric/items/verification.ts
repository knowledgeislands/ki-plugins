import type { AuditOutcome, RubricFamily, RubricItem, RubricOutcomes } from '../../shared/rubric.ts'
import type { FeatureDefinitionsRubricContext, FeatureVerificationContext } from '../contexts/feature-definitions.ts'

const SOURCE = 'standards-feature-definitions.md'
const outcomes = (values: readonly AuditOutcome[], pass: string): RubricOutcomes<AuditOutcome> => {
  if (values.length > 0) return values
  return [{ status: 'PASS', message: pass }]
}

const VERIFY_1: RubricItem<FeatureVerificationContext> = {
  code: 'VERIFY-1',
  title: 'requirements carry a Verify hook',
  description: 'Each active requirement has a `_Verify:_` line.',
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    audit: {
      phase: 'INSPECT',
      run: (context) =>
        outcomes(
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

const VERIFY_2: RubricItem<FeatureVerificationContext> = {
  code: 'VERIFY-2',
  title: 'Verify hooks are concrete and checkable',
  description:
    'The `_Verify:_` hook names a concrete built-output assertion, test, or source symbol rather than restating the requirement.',
  sources: [SOURCE],
  judgment: {
    prompt:
      'Assess whether each `_Verify:_` hook names a concrete built-output assertion, test, or source symbol rather than restating the requirement.'
  }
}

export const VERIFY: RubricFamily<FeatureDefinitionsRubricContext, FeatureVerificationContext> = {
  code: 'VERIFY',
  title: 'verification hooks',
  description: 'Active requirements carry a verification hook whose quality is reviewed.',
  standard: SOURCE,
  selectContext: (context) => context.verification,
  items: [VERIFY_1, VERIFY_2]
}
