import type { AuditOutcome, RubricFamily, RubricItem, RubricOutcomes } from '../../shared/rubric.ts'
import type { SpecRequirementContext, SpecsRubricContext } from '../contexts/specs.ts'

const SOURCE = 'standards-specs.md'

const outcomes = (values: readonly AuditOutcome[], pass: string): RubricOutcomes<AuditOutcome> =>
  values.length === 0 ? [{ status: 'PASS', message: pass }] : values

const CONFORMANCE_1: RubricItem<SpecRequirementContext> = {
  code: 'CONFORMANCE-1',
  title: 'accepted requirements declare conformance',
  description: 'Each active requirement declares exactly one `_Conformance:_ conforming | pending | divergent` state.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance:
        'Add the truthful conformance state. Do not move an accepted requirement to Gaps merely because implementation is pending or divergent.'
    },
    audit: {
      phase: 'INSPECT',
      run: (context) =>
        !context.applicable
          ? [
              {
                status: 'NOT_APPLICABLE',
                message: 'ki-specs is not declared in this repository.'
              }
            ]
          : outcomes(
              context.requirements
                .filter((requirement) => !requirement.deprecated && !requirement.conformance)
                .map((requirement) => ({
                  status: 'VIOLATION',
                  message: requirement.hasConformanceLabel
                    ? `${requirement.id} has an invalid _Conformance:_ value.`
                    : `${requirement.id} has no _Conformance:_ line.`,
                  subject: requirement.file
                })),
              'Every active requirement declares a valid conformance state.'
            )
    }
  }
}

const CONFORMANCE_2: RubricItem<SpecRequirementContext> = {
  code: 'CONFORMANCE-2',
  title: 'conforming requirements carry evidence',
  description: 'A requirement declared conforming carries an `_Evidence:_` line naming current proof.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance:
        'Add current evidence for a conforming requirement, or declare the requirement pending or divergent when proof does not exist.'
    },
    audit: {
      phase: 'INSPECT',
      run: (context) =>
        !context.applicable
          ? [
              {
                status: 'NOT_APPLICABLE',
                message: 'ki-specs is not declared in this repository.'
              }
            ]
          : outcomes(
              context.requirements
                .filter(
                  (requirement) =>
                    !requirement.deprecated && requirement.conformance === 'conforming' && !requirement.hasEvidence
                )
                .map((requirement) => ({
                  status: 'VIOLATION',
                  message: `${requirement.id} is conforming but has no _Evidence:_ line.`,
                  subject: requirement.file
                })),
              'Every conforming requirement carries current evidence.'
            )
    }
  }
}

export const CONFORMANCE: RubricFamily<SpecsRubricContext, SpecRequirementContext> = {
  code: 'CONFORMANCE',
  title: 'accepted-contract conformance',
  description: 'Active requirements declare implementation conformance and conforming claims carry evidence.',
  standard: SOURCE,
  selectContext: (context) => context.requirement,
  items: [CONFORMANCE_1, CONFORMANCE_2]
}
