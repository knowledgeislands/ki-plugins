import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { SpecIndexContext, SpecsRubricContext } from '../contexts/specs.ts'

const SOURCE = 'standards-specs.md'

const INDEX_1: RubricItem<SpecIndexContext> = {
  code: 'INDEX-1',
  title: 'docs/specs/index.md exists',
  description: '`docs/specs/index.md` exists. Missing is a FAIL — there is no registry to validate against.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance: 'Create the Specifications index with an authoritative areas table, then rerun the audit.'
    },
    audit: {
      phase: 'INSPECT',
      run: (context) => [
        context.exists
          ? { status: 'PASS', message: 'The Specifications index exists.', subject: 'index.md' }
          : { status: 'VIOLATION', message: 'The Specifications index is missing.', subject: 'index.md' }
      ]
    }
  }
}

const INDEX_2: RubricItem<SpecIndexContext> = {
  code: 'INDEX-2',
  title: 'index.md contains a populated areas table',
  description: '`index.md` contains at least one areas table with `Prefix` and `File` columns and at least one row.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance: 'Add a populated Prefix and File areas table to the index, then rerun the audit.'
    },
    audit: {
      phase: 'INSPECT',
      run: (context) => [
        !context.exists
          ? {
              status: 'NOT_APPLICABLE',
              message: 'The areas table cannot be inspected until index.md exists.',
              subject: 'index.md'
            }
          : context.prefixToFile.size > 0
            ? {
                status: 'PASS',
                message: 'The index contains a populated Prefix and File areas table.',
                subject: 'index.md'
              }
            : {
                status: 'VIOLATION',
                message: 'No populated areas table with Prefix and File columns was found.',
                subject: 'index.md'
              }
      ]
    }
  }
}

const INDEX_3: RubricItem<SpecIndexContext> = {
  code: 'INDEX-3',
  title: 'each prefix has one registered area-file owner',
  description:
    'A prefix appears in one areas-table file cell only; duplicate registrations are reported rather than silently overwritten.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance:
        'Choose the prefix’s one owning area file and remove the duplicate registration before rerunning the audit.'
    },
    audit: {
      phase: 'INSPECT',
      run: (context) =>
        context.duplicatePrefixRegistrations.length === 0
          ? [{ status: 'PASS', message: 'Every specification prefix has one registered area-file owner.' }]
          : context.duplicatePrefixRegistrations.map(({ prefix, firstFile, duplicateFile }) => ({
              status: 'VIOLATION' as const,
              message: `Prefix ${prefix} is registered to both ${firstFile} and ${duplicateFile}.`,
              subject: 'index.md'
            }))
    }
  }
}

export const INDEX: RubricFamily<SpecsRubricContext, SpecIndexContext> = {
  code: 'INDEX',
  title: 'specifications index',
  description: 'The corpus has a populated registry that maps prefixes to area files.',
  standard: SOURCE,
  selectContext: (context) => context.index,
  items: [INDEX_1, INDEX_2, INDEX_3]
}
