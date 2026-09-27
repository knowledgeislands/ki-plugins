import type { RubricFamily, RubricItem } from '../../shared/rubric.ts'
import type { GitRubricContext } from '../contexts/git.ts'

const COMMIT_1: RubricItem<GitRubricContext> = {
  code: 'COMMIT-1',
  title: 'commit shape expresses the completed unit',
  description:
    'A commit uses the portable Conventional Commit shape and accurately represents one completed unit of work.',
  sources: ['standards-git.md'],
  judgment: {
    scope: 'Each proposed commit, its `git diff --cached` (or explicit patch) evidence, and its proposed subject line.',
    prompt:
      'After inspecting the proposed diff and subject line, assess whether the commit type, optional scope, and imperative summary accurately describe one completed unit, using the established vocabulary without combining unrelated changes.',
    outcomes: ['conforming', 'split required', 'message revision required'],
    guidance:
      'Split unrelated changes into separately reviewable commits, then revise the Conventional Commit type, scope, or imperative summary to describe the completed unit.'
  }
}

const COMMIT_2: RubricItem<GitRubricContext> = {
  code: 'COMMIT-2',
  title: 'publication and integration retain separate authority',
  description:
    'Commits, task-branch publication, pull-request review, approval, merge, and primary-branch integration use explicit separable authority.',
  sources: ['standards-git.md#commit-publication-and-integration-authority'],
  judgment: {
    scope:
      'The requested change, repository instructions, stable actor identity, selected branch or worktree, proposed commit, push target, pull-request action, integration target, required gates, and any explicit or standing authority.',
    prompt:
      'Does the actor have independently evidenced authority for each push, review, approval, merge, or auto-merge action, scoped to the named repository, refs, work domain, gates, and lifetime, without inferring it from assignment, autonomy, credentials, or task completion? A local commit of a verified unit on the authorised branch is the ordinary default and needs no separate grant; withholding it requires a repository instruction that says so.',
    outcomes: [
      'conforming',
      'commit authority required',
      'push authority required',
      'review authority required',
      'integration authority required',
      'authority scope incomplete'
    ],
    guidance:
      'Commit the verified unit to the authorised branch rather than leaving it dirty; flag a commit only where the repository gates commits or the branch is wrong. A bounded unattended workflow may publish its task branch and draft pull request. Review, approval, merge, and auto-merge require separately named capabilities with actor, repository, ref, domain, gate, and revocation scope.'
  }
}

export const COMMIT: RubricFamily<GitRubricContext, GitRubricContext> = {
  code: 'COMMIT',
  title: 'commit shape',
  description: 'Commit messages express one completed unit through the portable convention.',
  standard: 'standards-git.md',
  selectContext: (context) => context,
  items: [COMMIT_1, COMMIT_2]
}
