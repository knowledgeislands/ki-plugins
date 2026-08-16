# Change-management adapter standard

## Scope

Change management uses one configured adapter per repository. The adapter is the authoritative source of forward-work records; the selector and process skills do not duplicate its queue or synchronise a second tracker.

## Selection

The repository declares exactly one supported value:

```toml
[skills.ki-work]
adapter = "roadmap" # or kb-streams, github-issues, linear
```

`roadmap` resolves to `ki-work-roadmap` and is the default for an ordinary Project repository. `kb-streams` resolves to `ki-repo-kb-streams` and is the default for a Knowledge Base. `github-issues` resolves to `ki-work-github-issues`; `linear` resolves to `ki-work-linear`. The remote adapters are explicit alternatives for either primary structure.

The selected adapter's `[skills.<skill-name>]` table must be declared in the same configuration. `roadmap` is valid only when `[skills.ki-repo] repo_type` is omitted or `repository`; `kb-streams` is valid only when it is `kb`. Remote adapters have no local-kind restriction. Missing, unknown, undeclared, or inapplicable values are failures, not opportunities for shape-based inference. The selector resolves this declared mapping; the host separately invokes the resolved adapter's audit rather than treating resolution as an adapter audit.

## Common adapter boundary

The selector owns only the abstract lifecycle vocabulary: capture, queue placement, readiness, delivery evidence, review evidence, closure, and an explicitly selected prune path. It does not define status labels or a state machine. Each adapter owns its concrete record identity, storage, local lifecycle/status mapping, and local rules. A process skill may ask the selector to resolve that adapter but never assumes a filesystem path, remote issue API, or KB zone.

Every adapter carries an explicit mapping for record identity, status/lifecycle translation, authority for writes, conflict handling, and closure semantics. Local adapters may use the repository's configured identifier and, where declared, fixed issuing areas; remote adapters retain the remote system's native identity. It is never an implicit alias for another tracker.
