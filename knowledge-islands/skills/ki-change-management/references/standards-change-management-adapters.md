# Change-management adapter standard

## Scope

Change management uses one configured adapter per repository. The adapter is the authoritative source of forward-work records; the selector and process skills do not duplicate its queue or synchronise a second tracker.

## Selection

The repository declares exactly one supported value:

```toml
[skills.ki-change-management]
adapter = "roadmap" # or kb-streams, github-issues, linear
```

`roadmap` selects `ki-change-management-roadmap` and is the default for `ki-repo-project`. `kb-streams` selects `ki-repo-kb-streams` and is the default for `ki-repo-kb`. `github-issues` selects `ki-change-management-github-issues`; `linear` selects `ki-change-management-linear`. The remote adapters are explicit alternatives for either primary structure. Missing or unknown values are failures, not opportunities for shape-based inference.

## Common adapter boundary

Every adapter provides one canonical record reference and supports the shared lifecycle vocabulary: capture, queue placement, readiness, delivery evidence, review evidence, closure, and an explicitly selected prune path. The adapter owns its own identity, storage, and local rules. A process skill may ask the selector to resolve that adapter but never assumes a filesystem path, remote issue API, or KB zone.

Every adapter carries an explicit mapping for record identity, status/lifecycle translation, authority for writes, conflict handling, and closure semantics. Local adapters may use the repository's configured identifier and, where declared, fixed issuing areas; remote adapters retain the remote system's native identity. It is never an implicit alias for another tracker.
