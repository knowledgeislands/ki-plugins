import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { GitRubricContext } from '../contexts/git.ts'

const BRANCH_1: RubricItem<GitRubricContext> = {
  code: 'BRANCH-1',
  title: 'branch choice matches the change boundary',
  description: 'Direct main and branch work each follow the repository policy and the change’s review needs.',
  sources: ['standards-git.md'],
  judgment: {
    scope: 'The selected repository, requested change, protection policy, and review boundary.',
    prompt:
      'Assess whether direct main or a branch is appropriate for this repository’s protection policy, the user’s request, and the value of an isolated review boundary.',
    outcomes: ['conforming', 'branch required', 'direct-main rationale required'],
    guidance:
      'Create an isolated branch where review or repository policy requires it, or record why a focused direct-main change is appropriate.'
  }
}

export const BRANCH: RubricFamily<GitRubricContext, GitRubricContext> = {
  code: 'BRANCH',
  title: 'branch choice',
  description: 'Branch use follows local protection and review needs without invented ceremony.',
  standard: 'standards-git.md',
  selectContext: (context) => context,
  items: [BRANCH_1]
}
