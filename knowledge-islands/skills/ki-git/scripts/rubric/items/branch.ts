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

const BRANCH_2: RubricItem<GitRubricContext> = {
  code: 'BRANCH-2',
  title: 'finished worktrees are integrated or disposed',
  description:
    'Finished linked worktrees are inspected, deliberately integrated or disposed, removed, and pruned without losing unmerged work.',
  sources: ['standards-git.md'],
  judgment: {
    scope:
      'Every linked worktree in `git worktree list --porcelain`, its branch, `git status --short`, commits not reachable from the intended integration branch, branch diff, and delivery authority.',
    prompt:
      'For each finished linked worktree, is its work deliberately integrated or explicitly disposed before the worktree and any proven-redundant local branch are removed?',
    outcomes: ['conforming', 'integrate worktree', 'dispose worktree', 'ownership decision required'],
    guidance:
      'Inspect before removal. Integrate coherent authorised work; dispose only confirmed unwanted work. Delete a branch only after proving reachability or no remaining diff, prune stale metadata, and retain only intentionally active worktrees.'
  }
}

export const BRANCH: RubricFamily<GitRubricContext, GitRubricContext> = {
  code: 'BRANCH',
  title: 'working approach',
  description: 'Working-copy topology and review flow follow local protection, review, and concurrency needs.',
  standard: 'standards-git.md',
  selectContext: (context) => context,
  items: [BRANCH_1, BRANCH_2]
}
