import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { GuidesLayoutContext, GuidesRubricContext } from '../contexts/guides.ts'

const SOURCE = 'standards-guides.md#guide-root-and-index'

const GUIDE_1: RubricItem<GuidesLayoutContext> = {
  code: 'GUIDE-1',
  title: 'docs/guides is a regular directory',
  description: '`docs/guides/` exists as a regular directory inside the repository.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance: 'Create a regular `docs/guides/` directory inside the repository, then rerun the audit.'
    },
    audit: {
      phase: 'INSPECT',
      run: (context) => [
        context.directoryExists
          ? { status: 'PASS', message: 'The controlled docs/guides directory exists.', subject: 'docs/guides' }
          : {
              status: 'VIOLATION',
              message: 'The controlled docs/guides directory is missing or unsafe.',
              subject: 'docs/guides'
            }
      ]
    }
  }
}

const GUIDE_2: RubricItem<GuidesLayoutContext> = {
  code: 'GUIDE-2',
  title: 'docs/guides/README.md is the collection entry point',
  description: '`docs/guides/README.md` exists as a regular file and is the collection entry point.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance: 'Add a regular `docs/guides/README.md` collection entry point, then rerun the audit.'
    },
    audit: {
      phase: 'INSPECT',
      run: (context) => [
        !context.directoryExists
          ? {
              status: 'NOT_APPLICABLE',
              message: 'The collection entry point cannot exist until docs/guides exists.',
              subject: 'docs/guides/README.md'
            }
          : context.indexExists
            ? { status: 'PASS', message: 'The Guides collection entry point exists.', subject: 'docs/guides/README.md' }
            : {
                status: 'VIOLATION',
                message: 'The Guides collection entry point is missing or unsafe.',
                subject: 'docs/guides/README.md'
              }
      ]
    }
  }
}

const GUIDE_3: RubricItem<GuidesLayoutContext> = {
  code: 'GUIDE-3',
  title: 'each guide has exactly one H1',
  description: 'Every Markdown guide below `docs/guides/`, except its root `README.md`, has exactly one H1.',
  sources: [SOURCE],
  mechanical: {
    level: 'FAIL',
    remediation: { class: 'diagnostic', guidance: 'Give each affected guide exactly one H1, then rerun the audit.' },
    audit: {
      phase: 'INSPECT',
      run: (context) =>
        context.headingIssues.length === 0
          ? [{ status: 'PASS', message: 'Every guide has exactly one H1.' }]
          : context.headingIssues.map((file) => ({
              status: 'VIOLATION',
              message: 'A guide must have exactly one H1.',
              subject: file
            }))
    }
  }
}

export const GUIDE: RubricFamily<GuidesRubricContext, GuidesLayoutContext> = {
  code: 'GUIDE',
  title: 'guide layout',
  description: 'The controlled guide root has an entry point and identifiable guide documents.',
  standard: SOURCE,
  selectContext: (context) => context.layout,
  items: [GUIDE_1, GUIDE_2, GUIDE_3]
}
