import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { ChezmoiRubricContext, GitContext } from '../contexts/chezmoi.ts'

const GIT_1: RubricItem<GitContext> = {
  code: 'GIT-1',
  title: 'Git lock hygiene',
  description: 'No stray physical `.git/*.lock` files remain in the repository.',
  sources: ['standards-chezmoi-dotfiles.md'],
  mechanical: {
    level: 'FAIL',
    remediation: {
      class: 'diagnostic',
      guidance:
        'Inspect the lock’s owning process and repository boundary, then use the governed stale-lock recovery procedure; do not remove it blindly.'
    },
    audit: {
      phase: 'INSPECT',
      run: ({ repositoryState, locks }) => {
        if (repositoryState !== 'physical')
          return [{ status: 'NOT_APPLICABLE', message: 'The target repository is not safely inspectable.' }]
        if (locks === null) return [{ status: 'NOT_APPLICABLE', message: 'No physical .git directory exists.' }]
        return locks.length
          ? locks.map((lock) => ({
              status: 'VIOLATION' as const,
              message: 'A stray Git lock file is present.',
              subject: lock
            }))
          : [{ status: 'PASS', message: 'No stray physical Git lock files are present.' }]
      }
    }
  }
}

export const GIT: RubricFamily<ChezmoiRubricContext, GitContext> = {
  code: 'GIT',
  title: 'Git hygiene',
  description: 'Stray lock files that block Git operations.',
  standard: 'standards-chezmoi-dotfiles.md',
  selectContext: (context) => context.git,
  items: [GIT_1]
}
