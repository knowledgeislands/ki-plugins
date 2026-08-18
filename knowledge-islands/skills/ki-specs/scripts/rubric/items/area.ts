import type { AuditOutcome, RubricFamily, RubricItem, RubricOutcomes } from '../../shared/rubric.ts'
import type { SpecAreaContext, SpecsRubricContext } from '../contexts/specs.ts'

const SOURCE = 'standards-specs.md'
const outcomes = (values: readonly AuditOutcome[], pass: string): RubricOutcomes<AuditOutcome> => {
  if (values.length > 0) return values
  return [{ status: 'PASS', message: pass }]
}

const AREA_1: RubricItem<SpecAreaContext> = {
  code: 'AREA-1',
  title: 'every file named in an areas table exists',
  description:
    'Every file named in an areas table exists as a safe physical file. A missing or unsafe file fails closed because the registry cannot establish its corpus.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance: 'Restore the missing safe area file or correct the areas table, then rerun the audit.'
    },
    audit: {
      phase: 'INSPECT',
      run: (context) =>
        !context.applicable
          ? [{ status: 'NOT_APPLICABLE', message: 'ki-specs is not declared for this repository.' }]
          : outcomes(
              context.registeredMissingFiles.map(({ prefix, file }) => ({
                status: 'VIOLATION',
                message: `The areas table lists ${file} for prefix ${prefix}, but the file is missing.`,
                subject: 'index.md'
              })),
              'Every file registered by the areas table exists.'
            )
    }
  }
}

const AREA_2: RubricItem<SpecAreaContext> = {
  code: 'AREA-2',
  title: 'every area file is registered',
  description:
    'Every Markdown file in `docs/specs/`, except `index.md`, is registered under at least one prefix in an areas table.',
  sources: [SOURCE],
  mechanical: {
    level: 'WARN',
    remediation: {
      class: 'diagnostic',
      guidance: 'Add the area file to the appropriate areas table, then rerun the audit.'
    },
    audit: {
      phase: 'INSPECT',
      run: (context) =>
        !context.applicable
          ? [{ status: 'NOT_APPLICABLE', message: 'ki-specs is not declared for this repository.' }]
          : outcomes(
              context.unregisteredFiles.map((file) => ({
                status: 'VIOLATION',
                message: 'The area file is not registered in the index.md areas table.',
                subject: file
              })),
              'Every area file is registered by the areas table.'
            )
    }
  }
}

export const AREA: RubricFamily<SpecsRubricContext, SpecAreaContext> = {
  code: 'AREA',
  title: 'area registration',
  description: 'Area-table files and corpus files agree.',
  standard: SOURCE,
  selectContext: (context) => context.area,
  items: [AREA_1, AREA_2]
}
