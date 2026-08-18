import type { AuditOutcome, RubricFamily, RubricItem, RubricOutcomes } from '../../shared/rubric.ts'
import type { SpecIdentityContext, SpecsRubricContext } from '../contexts/specs.ts'

const SOURCE = 'standards-specs.md'
const outcomes = (values: readonly AuditOutcome[], pass: string): RubricOutcomes<AuditOutcome> => {
  if (values.length > 0) return values
  return [{ status: 'PASS', message: pass }]
}

const ID_1: RubricItem<SpecIdentityContext> = {
  code: 'ID-1',
  title: 'requirement headings use canonical IDs',
  description:
    'Every level-3 heading outside a `## Gaps …` section matches `### <PREFIX>-NNN — <title>`: uppercase prefix, at least a three-digit serial, and an em-dash separator.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: { class: 'automatic' },
    audit: {
      phase: 'INSPECT',
      run: (context) =>
        !context.applicable
          ? [{ status: 'NOT_APPLICABLE', message: 'ki-specs is not declared for this repository.' }]
          : outcomes(
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

const ID_2: RubricItem<SpecIdentityContext> = {
  code: 'ID-2',
  title: 'requirement prefixes are registered to their file',
  description: "Each requirement's prefix is registered in an areas table and assigned to its containing file.",
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance: 'Register the prefix to its owning file or correct the requirement identifier, then rerun the audit.'
    },
    audit: {
      phase: 'INSPECT',
      run: (context) =>
        !context.applicable
          ? [{ status: 'NOT_APPLICABLE', message: 'ki-specs is not declared for this repository.' }]
          : outcomes(
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

const ID_3: RubricItem<SpecIdentityContext> = {
  code: 'ID-3',
  title: 'requirement IDs are sequential per prefix and unique across the corpus',
  description:
    'Requirement IDs are append-only, sequential within each registered prefix, never reused, and unique across the corpus.',
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    remediation: {
      class: 'diagnostic',
      guidance:
        'Allocate the next unused serial for the requirement prefix and update the duplicate or gap, then rerun the audit.'
    },
    audit: {
      phase: 'INSPECT',
      run: (context) =>
        !context.applicable
          ? [{ status: 'NOT_APPLICABLE', message: 'ki-specs is not declared for this repository.' }]
          : outcomes(
              [
                ...context.requirements
                  .filter((requirement) => requirement.duplicateOf)
                  .map((requirement) => ({
                    status: 'VIOLATION' as const,
                    message: `${requirement.id} is already defined by ${requirement.duplicateOf}; IDs are append-only and never reused.`,
                    subject: requirement.file
                  })),
                ...[...new Set(context.requirements.map((requirement) => requirement.prefix))].flatMap((prefix) => {
                  const serials = context.requirements
                    .filter((requirement) => requirement.prefix === prefix)
                    .map((requirement) => requirement.serial)
                    .sort((left, right) => left - right)
                  const present = new Set(serials)
                  const missing = Array.from({ length: Math.max(...serials, 0) }, (_, index) => index + 1).filter(
                    (serial) => !present.has(serial)
                  )
                  return missing.map((serial) => ({
                    status: 'VIOLATION' as const,
                    message: `${prefix}-${String(serial).padStart(3, '0')} is missing; serials are append-only and sequential per prefix.`,
                    subject: context.requirements.find((requirement) => requirement.prefix === prefix)?.file
                  }))
                })
              ],
              'Requirement IDs are sequential within each prefix and unique across the corpus.'
            )
    }
  }
}

export const ID: RubricFamily<SpecsRubricContext, SpecIdentityContext> = {
  code: 'ID',
  title: 'requirement identity',
  description: 'Requirement headings, prefixes, and append-only IDs form a coherent registry.',
  standard: SOURCE,
  selectContext: (context) => context.identity,
  items: [ID_1, ID_2, ID_3]
}
