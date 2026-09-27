import type { AuditOutcome, RubricFamily, RubricItem, RubricOutcomes } from '../../shared/rubric.ts'
import type { SpecRequirementContext, SpecsRubricContext } from '../contexts/specs.ts'

const SOURCE = 'standards-specs.md'
const outcomes = (values: readonly AuditOutcome[], pass: string): RubricOutcomes<AuditOutcome> => {
  if (values.length > 0) return values
  return [{ status: 'PASS', message: pass }]
}

const REQ_1: RubricItem<SpecRequirementContext> = {
  code: 'REQ-1',
  title: 'requirement statements carry a BCP 14 keyword',
  description: 'The opening statement paragraph of each active requirement contains an uppercase BCP 14 keyword.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance: 'Add the intended BCP 14 keyword to the requirement statement, then rerun the audit.'
    },
    audit: {
      phase: 'INSPECT',
      run: (context) =>
        !context.applicable
          ? [{ status: 'NOT_APPLICABLE', message: 'ki-specs is not declared for this repository.' }]
          : outcomes(
              context.requirements
                .filter((requirement) => !requirement.deprecated && !requirement.hasNormativeKeyword)
                .map((requirement) => ({
                  status: 'VIOLATION',
                  message: `${requirement.id} has no BCP 14 keyword in its statement.`,
                  subject: requirement.file
                })),
              'Every active requirement statement carries a BCP 14 keyword.'
            )
    }
  }
}

export const REQ: RubricFamily<SpecsRubricContext, SpecRequirementContext> = {
  code: 'REQ',
  title: 'normative requirement shape',
  description: 'Active requirements state normative behaviour.',
  standard: SOURCE,
  selectContext: (context) => context.requirement,
  items: [REQ_1]
}
