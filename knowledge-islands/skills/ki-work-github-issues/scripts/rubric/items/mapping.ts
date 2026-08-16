import type { RubricFamily } from '../../shared/rubric.ts'
import type { GitHubIssuesRubricContext } from '../types.ts'

export const MAP: RubricFamily<GitHubIssuesRubricContext, GitHubIssuesRubricContext['mapping']> = {
  code: 'MAP',
  title: 'GitHub Issues lifecycle mapping',
  description: 'Inspectable local lifecycle metadata, conflict owner, and separate relationship meanings.',
  standard: 'standards-github-issues.md',
  selectContext: (context) => context.mapping,
  items: [
    {
      code: 'MAP-1',
      title: 'inspectable GitHub lifecycle mapping',
      description:
        'The local configuration names exact queue, ready, review, and done values, a metadata conflict owner, and distinct dependency and hierarchy mappings; it does not assert remote verification.',
      sources: ['standards-github-issues.md'],
      mechanical: {
        level: 'FAIL',
        remediation: {
          class: 'diagnostic',
          guidance:
            'Declare the exact metadata mapping and owner locally, then have an authorised future resolver verify it remotely before any process execution.'
        },
        audit: { phase: 'INSPECT', run: (context) => context.outcomes }
      }
    }
  ]
}
