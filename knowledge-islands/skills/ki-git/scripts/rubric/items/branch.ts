import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { GitRubricContext } from '../contexts/git.ts'

const BRANCH_1: RubricItem<GitRubricContext> = {
  code: 'BRANCH-1',
  title: 'working approach matches the delivery boundary',
  description:
    'Single-main, branch-with-PR, and worktree-with-PR approaches follow repository policy, review needs, and concurrency.',
  sources: ['standards-git.md'],
  judgment: {
    scope:
      'The selected repository, requested change, current `git branch --show-current` and `git worktree list` evidence, protection policy, concurrency, and review boundary.',
    prompt:
      'After checking branch, worktree, protection, concurrency, and review evidence, assess whether `single-working-copy-on-main`, `single-working-copy-on-branch-with-pr`, or `worktrees-with-pr` is the appropriate approach.',
    outcomes: [
      'conforming',
      'use single-working-copy-on-main',
      'use single-working-copy-on-branch-with-pr',
      'use worktrees-with-pr'
    ],
    guidance:
      'Use the least ceremonial approach that preserves the selected protection, review, and concurrency boundary; use separate worktrees when concurrent deliveries need isolated working files.'
  }
}

export const BRANCH: RubricFamily<GitRubricContext, GitRubricContext> = {
  code: 'BRANCH',
  title: 'working approach',
  description: 'Working-copy topology and review flow follow local protection, review, and concurrency needs.',
  standard: 'standards-git.md',
  selectContext: (context) => context,
  items: [BRANCH_1]
}
