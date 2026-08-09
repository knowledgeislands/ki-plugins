---
name: ki-plan
ki-kind: process
ki-depends-on: []
ki-optional-depends-on: [ki-delegation]
description: >
  Shapes selected Now or Next draft work through readiness in either repository adapter. It enriches a roadmap item in place for non-KB repositories or iterates a Streams proposal in a Knowledge Base, then stops at ready. Use when asked "plan this", "make this ready", or "prepare this work for implementation". It does not capture work, implement it, or close it.
argument-hint: 'plan <work>... | help'
---

# ki-plan

**Kind:** process.

Shapes one or more selected Now or Next drafts through Ready.

The class-level standard—horizons, identity, and file shape—is owned by `ki-change-management-roadmap`; read [the lifecycle procedure](references/standards-plan-lifecycle.md) for the complete operation.

## What this skill does

`ki-plan` resolves the selected record through the repository adapter and enriches it in place. `ki-next` captures and promotes drafts; this skill never creates a duplicate plan record.

In a non-KB repository it adds the work-item execution sections. In a KB it invokes the Streams iteration and readiness rules over the same proposal. Readiness is explicit and all-or-nothing: validate every named record before publishing any `ready` transition, then commit the coherent transition once.

## Responsibility boundary

```text
ki-next
  selection and horizon placement
    └─> ki-plan
          create, shape, and mark Ready
            └─> ki-implement
                  Ready → In progress → Awaiting review
                    └─> ki-accept
                          Awaiting review → Done and explicit prune selection
```

`ki-plan` does not implement work, assemble a review packet, close delivery, mark an item Done, or prune retained records.

Those responsibilities move cleanly to the dedicated process skills; `ki-plan` carries no compatibility verbs or fallback path for them.

## Planning is repo-first

In a KI code repository the canonical record is `docs/roadmap/<REPO>-<NNN>-<slug>.md`, or `docs/roadmap/<REPO>-<AREA>-<NNN>-<slug>.md` where the repository declares fixed issuing areas, authored through this skill—not a runtime-native Plan Mode scratch file.

`ki-change-management-roadmap` owns the stable `<REPO>` code and any fixed `<AREA>` namespace in `.ki-config.toml`; `theme` remains the human-readable grouping in frontmatter.

A native scratch file is only a draft.

Where one exists, prefer to leave it a pointer to the governed item rather than duplicate content.

When referring to a specific work item in prose, link its canonical document using the host’s Markdown-link convention; use a bare identifier only in structured fields or lifecycle commands.

## Invocation

`help` / `-h` / `?` explains this skill and stops, taking no action. `plan <work>...` resolves one or more explicit selected records; with no target, identify that `ki-next` must first select or capture a Now or Next draft and stop.

## Preflight

1. Run `git rev-parse --show-toplevel` and physically resolve the result.
2. Resolve the repository adapter: a KB uses `ki-repo-kb-streams`; every other repository uses `ki-change-management-roadmap`.
3. Run the relevant adapter audit and stop on any failure or warning.
4. Resolve each record only inside its canonical adapter root; never follow a symlink outside the physical git root or infer an alternate tree.

## Notes

- This is a process skill, not a universal AUDIT / CONFORM / EDUCATE / REFRESH checker.
- Installed as a core user skill by `ki bootstrap`; it is not a repository-governance root.
- This skill has no capture, status, import, or runtime scratch-plan verb. `ki-next` owns queue changes and capture; an adapter may preserve a native scratch record only as a pointer to its governed record.
