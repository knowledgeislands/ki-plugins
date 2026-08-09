# Exemplars

Shapes to adapt when authoring a repository-local guide collection. They illustrate the [Guides standard](standards-guides.md) but do not add requirements.

## A guide index

```markdown
# Guides

Practical instructions for contributors and operators of this repository. Decisions explain why, Specifications explain what, and these guides explain how.

## Start here

- [Developer workflow](developer/workflow.md) — set up the repository, run its gates, and verify a change locally.
- [Release](operations/release.md) — publish a verified release and recover from a failed publication.
```

## A focused guide

```markdown
# Local development workflow

Use this guide when preparing a source change locally.

## Before you begin

- Install the repository's declared toolchain.
- Confirm the working tree does not contain unrelated changes.

## Run the checks

1. Run the repository's focused check while iterating.
2. Run the complete gate before handing off the change.
3. Record any known limitation with the owning roadmap item.

## Verify

The relevant check exits successfully and the working tree contains only the intended change.

## Recovery

If a generated output differs, inspect its source-of-truth and rerun the owned generator; do not edit generated content by hand.
```
