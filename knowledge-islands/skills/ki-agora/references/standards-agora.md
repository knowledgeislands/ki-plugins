# Agora membership standard

## Contents

- [Purpose and boundary](#purpose-and-boundary)
- [Configuration](#configuration)
- [Home declarations](#home-declarations)
- [Member declarations](#member-declarations)
- [Reciprocal observation](#reciprocal-observation)
- [Target policy](#target-policy)

## Purpose and boundary

An **Agora** is a named, portable collection of independently governed Knowledge Islands repositories. It is neither a filesystem directory nor a client workspace. Its registered owner participates automatically, approves the repositories that may participate, and each other member repository independently records its consent.

`ki-agora` owns the declaration format. It neither discovers repositories nor reads or writes a peer checkout. The `ki` host owns local registry resolution and reports whether a resolvable home and member agree. A user-environment owner may render an allowed target projection, but owns that app-specific state and its local paths.

Every declaration relies on the canonical HTTPS GitHub identity declared by `ki-repo.repository`. A registry may contain every registered KI repository, and a system-managed estate may be derived from that full inventory. Neither fact creates membership in a named Agora.

## Configuration

Declare the capability explicitly, even when no home or membership is yet configured:

```toml
[skills.ki-agora]
```

The root table admits only the optional `homes` and `memberships` tables. Their keys are stable lower-case hyphenated identifiers matching `[a-z][a-z0-9-]*[a-z0-9]`; an identifier is stable rather than a rendered title.

```toml
[skills.ki-agora.homes.knowledge-islands]
owner = "https://github.com/knowledgeislands/ki-agentic-harness"
purpose = "Knowledge Islands maintained repositories"
targets = ["zed-workspace", "vscode-workspace", "claude-code-trust"]
members = { "https://github.com/knowledgeislands/tools-ki" = "maintainer" }

[skills.ki-agora.memberships.knowledge-islands]
home = "https://github.com/knowledgeislands/ki-agentic-harness"
role = "maintainer"
```

TOML does not require lexical ordering for tables or inline-table keys. Each configuration table is locally authored; a tool never adds a membership or changes another repository's declaration.

## Home declarations

Each `[skills.ki-agora.homes.<agora-id>]` table requires exactly:

- `owner` — the canonical HTTPS GitHub identity of the declaring repository. The `ki` resolver verifies this matches the registered repository that declares the Agora; each identifier is unique across registered owners.
- `purpose` — a non-empty human explanation of the collection.
- `targets` — a duplicate-free array drawn from the closed target-policy vocabulary. An empty array deliberately expresses no projection.
- `members` — a table or inline table keyed by canonical HTTPS GitHub repository identity, with a non-empty lower-case hyphenated role value.

The owner repository does not list itself in `members`: it is automatically included in the resolved Agora projection as its owner, rather than claiming reciprocal consent from itself. A different repository may operate another Agora and also join this one.

## Member declarations

Each `[skills.ki-agora.memberships.<agora-id>]` table requires exactly:

- `home` — the canonical HTTPS GitHub identity of the Agora home.
- `role` — the same non-empty lower-case hyphenated role that the home grants that repository.

A repository may declare any number of memberships. Membership has no exclusivity, priority, work-routing, or publication implication.

## Reciprocal observation

A local resolver may resolve a named Agora only when its unique owner is locally registered and declares the matching `owner` identity. It may report each non-owner membership as reciprocal only when all of the following are locally resolvable:

1. the member declaration's `home` identifies the registered owner repository;
2. that home declares the same Agora identifier;
3. the home lists the member's canonical repository identity; and
4. both declarations give the same role.

An absent, malformed, unreachable, or non-matching peer is an observation result, never grounds for a local or cross-repository mutation. Only the local repository owner changes its own declaration.

## Target policy

`targets` may contain these values:

| Value | Permits |
| --- | --- |
| `zed-workspace` | a local Zed multi-root workspace projection |
| `vscode-workspace` | a local VS Code workspace projection |

No value grants access, edits an application database, replaces user-owned state, or implies a particular renderer. `targets = []` is the explicit no-projection policy.

## Runtime binding

This portable contract has no runtime dependency. The following are optional source-root trust projection bindings; an environment owner decides whether the named client is installed and how to render its permitted local state.

| Value | Runtime binding |
| --- | --- |
| `claude-code-trust` | local source-root trust for Claude Code |
| `claude-desktop-trust` | local source-root trust for Claude Desktop |
| `chatgpt-codex-trust` | local source-root trust for ChatGPT Codex |

A conforming client that does not use one of these bindings leaves it unprojected rather than interpreting a policy label as an access grant.
