import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { GitRubricContext } from '../contexts/git.ts'

const LOCK_1: RubricItem<GitRubricContext> = {
  code: 'LOCK-1',
  title: 'stale-lock recovery preserves the safety boundary',
  description: 'Stale-lock recovery follows the guard’s worktree, process, containment, and file-type limits.',
  sources: ['standards-git.md'],
  judgment: {
    scope: 'Every stale-lock candidate and its repository, process, containment, and filesystem evidence.',
    prompt:
      'Assess whether stale-lock recovery remains best-effort: it must not interrupt Git, cross the current physical worktree boundary, remove ambiguous or symlinked candidates, or act when process inspection is inconclusive.',
    outcomes: ['conforming', 'safe removal authorised', 'leave untouched', 'investigation required'],
    guidance:
      'Remove only a clearly stale regular lock within the current physical worktree after process checks; otherwise leave it untouched and investigate through the repository owner.'
  }
}

export const LOCK: RubricFamily<GitRubricContext, GitRubricContext> = {
  code: 'LOCK',
  title: 'stale-lock semantics',
  description: 'The stale-lock guard remains bounded recovery rather than general cleanup.',
  standard: 'standards-git.md',
  selectContext: (context) => context,
  items: [LOCK_1]
}
