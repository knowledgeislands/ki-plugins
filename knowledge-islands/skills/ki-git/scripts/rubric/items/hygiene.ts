import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { GitRubricContext } from '../contexts/git.ts'

const HYGIENE_1: RubricItem<GitRubricContext> = {
  code: 'HYGIENE-1',
  title: 'Git working hygiene preserves unrelated state',
  description:
    'Git work preserves a potentially shared working tree through thread-local touched paths, explicit staging, contested-path coordination, and serialized commit windows.',
  sources: ['standards-git.md'],
  judgment: {
    scope:
      'The pre-edit and current working tree (`git status --short`), expected `HEAD`, the thread-local touched-path set, touched and staged diffs, contested paths, and Git write operations for the selected work.',
    prompt:
      'After recording the pre-edit state and expected `HEAD`, assess whether the thread tracked every path it may have changed, withheld pre-existing or overlapping paths for coordination, staged only enumerated uncontested paths, preserved unrelated staged and unstaged work, and serialised the commit window that advances shared `HEAD`.',
    outcomes: [
      'conforming',
      'state inspection required',
      'staging correction required',
      'operation coordination required'
    ],
    guidance:
      'Maintain a thread-local touched-path set, re-check status, `HEAD`, touched diffs, and staged paths before committing, and use `git add -- <path>...` only for enumerated uncontested paths. Never use `git add -A`, `git add .`, `git add -u`, `git commit -a`, `git commit -am`, or broad wildcard pathspecs in a shared tree. Leave contested and unrelated work untouched, and serialize only the shared-index and commit window.'
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
