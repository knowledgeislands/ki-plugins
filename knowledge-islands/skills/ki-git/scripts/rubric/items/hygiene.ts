import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { GitRubricContext } from '../contexts/git.ts'

const HYGIENE_1: RubricItem<GitRubricContext> = {
  code: 'HYGIENE-1',
  title: 'Git working hygiene preserves unrelated state',
  description: 'Git work preserves shared state through explicit paths, worker-local indexes, and serialized commits.',
  sources: ['standards-git.md'],
  judgment: {
    scope:
      'The shared working tree (`git status --short`), worker-local Git indexes, staged paths, expected HEAD, and Git write operations for the selected work.',
    prompt:
      'After recording current working-tree and expected-HEAD evidence, assess whether each delegated worker used its assigned Git index, staging is limited to intended paths, unrelated changes remain untouched, and shared-HEAD commits are safely serialised.',
    outcomes: [
      'conforming',
      'state inspection required',
      'staging correction required',
      'operation coordination required'
    ],
    guidance:
      'Inspect the working tree, pass the assigned `GIT_INDEX_FILE` on every worker Git write, stage only explicit intended paths, leave unrelated work untouched, and have the orchestrator serialize commits after re-checking HEAD.'
  }
}

export const HYGIENE: RubricFamily<GitRubricContext, GitRubricContext> = {
  code: 'HYGIENE',
  title: 'Git working hygiene',
  description: 'Git operations preserve shared worktree state and recoverability.',
  standard: 'standards-git.md',
  selectContext: (context) => context,
  items: [HYGIENE_1]
}
