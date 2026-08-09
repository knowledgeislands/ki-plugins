# Project repository standard

## Primary structure

A KI repository declares exactly one primary structure. `ki-repo-project` is the explicit default for a non-Knowledge-Base repository; `ki-repo-kb` is the mutually exclusive Knowledge Base primary structure. Other `ki-repo-*` skills are composable specialisations, not alternate primaries.

```toml
[skills.ki-repo-project]
```

Project does not select a work tracker. `[skills.ki-change-management]` separately selects `roadmap`, `github-issues`, or `linear`. A Knowledge Base selects its Streams process through `ki-repo-kb-streams`.

## Inheritance

Every Project repository inherits the `ki-repo` baseline. A specialised structure may add layout, toolchain, deployment, or publication rules, but it must not silently redefine the primary classification or install a second change tracker.

## Change boundary

Changing Project to KB or KB to Project changes the repository's primary contract. Treat it as an explicit migration: decide the destination tracker, migrate canonical records, update configuration atomically, and verify the destination structure before removing the source declaration.
