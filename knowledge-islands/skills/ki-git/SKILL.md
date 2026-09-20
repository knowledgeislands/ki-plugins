---
name: ki-git
ki-kind: governance
ki-applicability: declaration-only
ki-depends-on: []
ki-shared-dependencies: [ki-skills:rubric]
description: >
  Govern KI Git commits and shared-tree safety: Conventional Commits, touched-path tracking, explicit staging,
  branch or worktree choice, and stale locks. Use when preparing commits or coordinating concurrent edits;
  `ki-repo` owns GitHub settings.
argument-hint: 'audit <repo> | conform <repo> | help | educate <repo> | refresh'
---

# Knowledge Islands Git conventions

`ki-git` is the portable policy owner for Git and commit practice across Knowledge Islands repositories.

It names three working approaches so branch choice and working-copy topology are explicit: `single-working-copy-on-main`, `single-working-copy-on-branch-with-pr`, and `worktrees-with-pr`. A single working copy may be shared by human and agent threads: each thread tracks the files it may have changed, commits only its uncontested touched paths, and serialises the short Git write window that stages and advances shared `HEAD`.

Read [the Git standard](references/standards-git.md) before preparing a commit, choosing a branch boundary, or assessing a stale lock.

The hosted native rubric records the portable review prompts below. Its four policy families are **judgment-only**: an AUDIT renders them as unassessed review work, not as a clean Git result. Before recording a judgment, gather the named read-only evidence (for example `git status --short`, `git branch --show-current`, and the proposed commit diff/message) and retain its outcome with the review. It deliberately has no mechanical policy checks or private Git executor yet.

Package-backed repositories mechanically bind this skill's message vocabulary through the `ki-engineering` Husky and Commitlint contract. This skill does not install hooks, write runtime settings, or own the package toolchain; its native rubric retains the judgment that a proposed message accurately describes one completed unit.

## Boundaries

- `ki-repo` owns repository configuration and GitHub settings, including branch-protection choices.
- `ki-engineering` owns repository-local Husky and Commitlint wiring for package-backed repositories; `ki-git` owns the message policy that binding enforces.
- The harness owns the runtime `hooks/` payload layout; `ki-git` owns the stale-lock guard's portable safety semantics.
- `ki-repo-dotfiles-chezmoi` owns runtime-specific Claude Code settings registration after it has selected a compatible payload.

## Operating modes

### Mode AUDIT

Read the selected repository's commit history and working-state evidence against the Git standard.

Run `ki repo audit --skill ki-git --repo <repo>` to render the portable review prompts. Treat the result as an unassessed judgment checklist until a reviewer records outcomes against the focused read-only evidence; it is not a pass/fail audit of Git state. It does not infer a missing configuration table or run a private wrapper.

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
