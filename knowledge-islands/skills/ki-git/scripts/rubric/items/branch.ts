import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { GitRubricContext } from '../contexts/git.ts'

const BRANCH_1: RubricItem<GitRubricContext> = {
  code: 'BRANCH-1',
  title: 'working approach matches the delivery boundary',
  description:
    'Primary-checkout, branch-with-PR, worktree-with-PR, and local worktree integration approaches follow repository policy, review needs, concurrency, and unattended isolation.',
  sources: ['standards-git.md#working-copy-and-review-approaches', 'standards-git.md#local-integration-write-boundary'],
  judgment: {
    scope:
      'The selected repository, requested change, current `git branch --show-current` and `git worktree list` evidence, protection policy, concurrency, and review boundary.',
    prompt:
      'Does the selected approach satisfy isolation and review needs, and does local worktree integration use an authorised owner and serialised destination write without imposing remote publication?',
    outcomes: [
      'conforming',
      'use single-working-copy-on-main',
      'use single-working-copy-on-branch-with-pr',
      'use worktrees-with-pr',
      'use worktrees-with-local-integration'
    ],
    guidance:
      'Use the primary checkout for ordinary interactive work. Isolate unattended implementation. When delivery is local-only, independently review the candidate and integrate through the authorised serialised write boundary without requiring a push or pull request.'
  }
}

const BRANCH_3: RubricItem<GitRubricContext> = {
  code: 'BRANCH-3',
  title: 'linked worktrees use a safe runtime-owned root',
  description:
    'Linked working files stay outside the primary working tree and Git common directory under a collision-safe runtime-owned root.',
  sources: ['standards-git.md#worktree-location'],
  judgment: {
    scope:
      'Every linked worktree path, the repository primary working tree, Git common directory, estate discovery roots, and the runtime that owns creation and retirement.',
    prompt:
      'Is each linked worktree contained under an explicit runtime-owned root outside the repository and its Git common directory, excluded from estate discovery, and uniquely keyed to avoid collisions?',
    outcomes: ['conforming', 'relocate worktree root', 'define runtime ownership', 'collision risk'],
    guidance:
      'Use one runtime-owned application-state or XDG root with repository and task identity. Do not place working files inside the repository, under `.git`, or in an estate-scanned workspace tree.'
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
  items: [BRANCH_1, BRANCH_2, BRANCH_3]
}
