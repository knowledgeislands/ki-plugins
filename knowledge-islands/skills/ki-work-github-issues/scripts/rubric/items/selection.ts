import type { RubricFamily } from '../../shared/rubric.ts'
import type { GitHubIssuesRubricContext } from '../types.ts'

export const SELECT: RubricFamily<GitHubIssuesRubricContext, GitHubIssuesRubricContext['selection']> = {
  code: 'SELECT',
  title: 'GitHub Issues configuration',
  description: 'One declared GitHub Issues repository with matching shared selection.',
  standard: 'standards-github-issues.md',
  selectContext: (context) => context.selection,
  items: [
    {
      code: 'SELECT-1',
      title: 'explicit GitHub Issues adapter',
      description: 'The repository selects and configures one GitHub Issues namespace.',
      sources: ['standards-github-issues.md'],
      mechanical: {
        level: 'FAIL',
        remediation: {
          class: 'diagnostic',
          guidance: 'Select github-issues and declare one owner/repository namespace.'
        },
        audit: { phase: 'INSPECT', run: (context) => context.outcomes }
      }
    }
  ]
}
