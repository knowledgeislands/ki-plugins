import type { AuditOutcome, RubricFamily, RubricItem, RubricOutcomes } from '../../shared/rubric.ts'
import type { FeatureDefinitionsRubricContext, FeatureIdentityContext } from '../contexts/feature-definitions.ts'

const SOURCE = 'standards-feature-definitions.md'
const outcomes = (values: readonly AuditOutcome[], pass: string): RubricOutcomes<AuditOutcome> => {
  if (values.length > 0) return values
  return [{ status: 'PASS', message: pass }]
}

const ID_1: RubricItem<FeatureIdentityContext> = {
  code: 'ID-1',
  title: 'requirement headings use canonical IDs',
  description:
    'Every level-3 heading outside a `## Gaps …` section matches `### <PREFIX>-NNN — <title>`: uppercase prefix, at least a three-digit serial, and an em-dash separator.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    audit: {
      phase: 'INSPECT',
      run: (context) =>
        outcomes(
          context.headingIssues.map((issue) => ({
            status: 'VIOLATION',
            message: `Level-3 heading is not a valid requirement ID: “${issue.heading}”.`,
            subject: issue.file
          })),
          'Every level-3 heading outside Gaps has canonical requirement-ID form.'
        )
    },
    conform: {
      phase: 'NORMALISE',
      run: (context) => context.normaliseHeadings?.()
    }
  }
}

const ID_2: RubricItem<FeatureIdentityContext> = {
  code: 'ID-2',
  title: 'requirement prefixes are registered to their file',
  description: "Each requirement's prefix is registered in an areas table and assigned to its containing file.",
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    audit: {
      phase: 'INSPECT',
      run: (context) =>
        outcomes(
          context.requirements
            .filter((requirement) => requirement.owner !== requirement.file)
            .map((requirement) => ({
              status: 'VIOLATION',
              message: requirement.owner
                ? `${requirement.id} uses prefix ${requirement.prefix}, registered to ${requirement.owner} rather than this file.`
                : `${requirement.id} uses prefix ${requirement.prefix}, which no areas-table row registers.`,
              subject: requirement.file
            })),
          'Every requirement prefix is registered to its containing area file.'
        )
    }
  }
}

const ID_3: RubricItem<FeatureIdentityContext> = {
  code: 'ID-3',
  title: 'requirement IDs are unique across the corpus',
  description: 'Requirement IDs are append-only, never reused, and unique across the corpus.',
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    audit: {
      phase: 'INSPECT',
      run: (context) =>
        outcomes(
          context.requirements
            .filter((requirement) => requirement.duplicateOf)
            .map((requirement) => ({
              status: 'VIOLATION',
              message: `${requirement.id} is already defined by ${requirement.duplicateOf}; IDs are append-only and never reused.`,
              subject: requirement.file
            })),
          'Requirement IDs are unique across the corpus.'
        )
    }
  }
}

export const ID: RubricFamily<FeatureDefinitionsRubricContext, FeatureIdentityContext> = {
  code: 'ID',
  title: 'requirement identity',
  description: 'Requirement headings, prefixes, and append-only IDs form a coherent registry.',
  standard: SOURCE,
  selectContext: (context) => context.identity,
  items: [ID_1, ID_2, ID_3]
}
