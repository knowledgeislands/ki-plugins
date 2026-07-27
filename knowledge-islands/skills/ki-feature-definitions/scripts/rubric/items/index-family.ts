import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { FeatureDefinitionsRubricContext, FeatureIndexContext } from '../contexts/feature-definitions.ts'

const SOURCE = 'standards-feature-definitions.md'

const INDEX_1: RubricItem<FeatureIndexContext> = {
  code: 'INDEX-1',
  title: 'docs/features/index.md exists',
  description: '`docs/features/index.md` exists. Missing is a FAIL — there is no registry to validate against.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    audit: {
      phase: 'INSPECT',
      run: (context) => [
        context.exists
          ? { status: 'PASS', message: 'The Feature Definitions index exists.', subject: 'index.md' }
          : { status: 'VIOLATION', message: 'The Feature Definitions index is missing.', subject: 'index.md' }
      ]
    }
  }
}

const INDEX_2: RubricItem<FeatureIndexContext> = {
  code: 'INDEX-2',
  title: 'index.md contains a populated areas table',
  description: '`index.md` contains at least one areas table with `Prefix` and `File` columns and at least one row.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    audit: {
      phase: 'INSPECT',
      run: (context) => [
        !context.exists
          ? { status: 'NOT_APPLICABLE', message: 'The areas table cannot be inspected until index.md exists.', subject: 'index.md' }
          : context.prefixToFile.size > 0
            ? { status: 'PASS', message: 'The index contains a populated Prefix and File areas table.', subject: 'index.md' }
            : { status: 'VIOLATION', message: 'No populated areas table with Prefix and File columns was found.', subject: 'index.md' }
      ]
    }
  }
}

export const INDEX: RubricFamily<FeatureDefinitionsRubricContext, FeatureIndexContext> = {
  code: 'INDEX',
  title: 'feature index',
  description: 'The corpus has a populated registry that maps prefixes to area files.',
  standard: SOURCE,
  selectContext: (context) => context.index,
  items: [INDEX_1, INDEX_2]
}
