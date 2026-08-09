---
name: ki-git
ki-kind: governance
ki-depends-on: []
ki-shared-dependencies: [ki-skills:rubric]
description: >
  Governs portable Knowledge Islands Git working and commit conventions: Conventional Commit messages, direct-main versus branch selection, safe Git hygiene, and the stale-lock guard's semantics. Use when preparing or reviewing a commit, deciding whether work needs a branch, recovering a stale Git lock, or clarifying who owns hook payload versus runtime registration. Does not configure GitHub repository settings, install hooks, or write agent settings; use ki-repo for repository configuration and ki-repo-dotfiles-chezmoi for runtime bindings.
argument-hint: 'audit <repo> | conform <repo> | help | educate <repo> | refresh'
---

# Knowledge Islands Git conventions

`ki-git` is the portable policy owner for Git and commit practice across Knowledge Islands repositories.

For concurrent delegated work in one worktree, it also owns the split between worker-local staging and coordinated commits: a worker uses its assigned `GIT_INDEX_FILE` on each Git write command, while the orchestrator serialises commits that advance shared `HEAD`.

Read [the Git standard](references/standards-git.md) before preparing a commit, choosing a branch boundary, or assessing a stale lock.

The hosted native rubric records the portable review prompts below. It deliberately has no mechanical policy checks yet.

It does not install a hook, write runtime settings, or add a compatibility execution path.

## Boundaries

- `ki-repo` owns repository configuration and GitHub settings, including branch-protection choices.
- The harness owns `hooks/` payload layout; `ki-git` owns the stale-lock guard's portable safety semantics.
- `ki-repo-dotfiles-chezmoi` owns runtime-specific Claude Code settings registration after it has selected a compatible payload.

## Operating modes

### Mode AUDIT

Read the selected repository's commit history and working-state evidence against the Git standard.

Run `ki repo audit --skill ki-git --repo <repo>` to render the portable review prompts. It does not infer a missing configuration table or run a private wrapper.

### Mode CONFORM

Apply the standard through reviewable Git actions: choose an appropriate commit boundary, use the documented message shape, and leave uncertain or unsafe lock state untouched.

Do not add a compatibility checker or automate commit-message rewriting.

### Mode EDUCATE

Explain the portable Git boundary and route repository configuration to `ki-repo`, hook payload layout to the harness, and runtime binding to `ki-repo-dotfiles-chezmoi`.

EDUCATE creates no repository or user-state artifact.

### Mode HELP

Explain the policy boundary, the available guidance modes, and the off-ramps above without inspecting or changing state.

### Mode REFRESH

**Precondition:** REFRESH writes only to this skill's canonical files in `ki-agentic-harness`. Invoked from an installed copy, stop and name the harness as the place to run it.

Read [the source list](references/sources.md), re-check the Git and Conventional Commits sources and current Knowledge Islands practice, then propose any change to this skill and its standard.

Record the review date and findings in the source list; record implementation history in Git rather than a changelog.
