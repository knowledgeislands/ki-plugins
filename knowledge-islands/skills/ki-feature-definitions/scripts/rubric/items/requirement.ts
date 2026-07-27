import type { AuditOutcome, RubricFamily, RubricItem, RubricOutcomes } from '../../shared/rubric.ts'
import type { FeatureDefinitionsRubricContext, FeatureRequirementContext } from '../contexts/feature-definitions.ts'

const SOURCE = 'standards-feature-definitions.md'
const outcomes = (values: readonly AuditOutcome[], pass: string): RubricOutcomes<AuditOutcome> => {
  if (values.length > 0) return values
  return [{ status: 'PASS', message: pass }]
}

const REQ_1: RubricItem<FeatureRequirementContext> = {
  code: 'REQ-1',
  title: 'requirements carry an RFC-2119 keyword',
  description: 'Each active requirement contains an uppercase RFC-2119 keyword so its statement is normative and testable.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    audit: {
      phase: 'INSPECT',
      run: (context) =>
        outcomes(
          context.requirements
            .filter((requirement) => !requirement.deprecated && !requirement.hasNormativeKeyword)
            .map((requirement) => ({
              status: 'VIOLATION',
              message: `${requirement.id} has no RFC-2119 keyword in its statement.`,
              subject: requirement.file
            })),
          'Every active requirement carries an RFC-2119 keyword.'
        )
    }
  }
}

export const REQ: RubricFamily<FeatureDefinitionsRubricContext, FeatureRequirementContext> = {
  code: 'REQ',
  title: 'normative requirement shape',
  description: 'Active requirements state normative behaviour.',
  standard: SOURCE,
  selectContext: (context) => context.requirement,
  items: [REQ_1]
}
