# Agora membership standard

## Contents

- [Purpose and boundary](#purpose-and-boundary)
- [Configuration](#configuration)
- [Home declarations](#home-declarations)
- [Referenced repositories](#referenced-repositories)
- [Member declarations](#member-declarations)
- [Reciprocal observation](#reciprocal-observation)

## Purpose and boundary

An **Agora** is a named, portable collection of independently governed Knowledge Islands repositories. It is neither a filesystem directory nor a client workspace. Its registered owner participates automatically, approves the repositories that may participate, and each other member repository independently records its consent. Workspace targets are selected by the local `ki` command, not declared by the group.

`ki-agora` owns the declaration format. It neither discovers repositories nor reads or writes a peer checkout. The `ki` host owns local registry resolution and reports whether a resolvable home and member agree. A user-environment owner may render an allowed target projection, but owns that app-specific state and its local paths.

Every declaration relies on the canonical HTTPS GitHub identity declared by `ki-repo.repository`. A registry may contain every registered KI repository, and a system-managed estate may be derived from that full inventory. Neither fact creates membership in a named Agora.

## Configuration

Declare the capability explicitly, even when no home or membership is yet configured:

```toml
[skills.ki-agora]
```

The root table admits only the optional `homes` and `memberships` tables. Their keys are stable lower-case hyphenated identifiers matching `[a-z][a-z0-9-]*[a-z0-9]`; an identifier is stable rather than a rendered title. Target selection is an explicit local `ki agora open --target` choice, not portable group policy. Unknown root, home, and membership fields are configuration errors and do not provide evidence of membership, consent, or target authorization.

```toml
[skills.ki-agora]
memberships.knowledge-islands = { home = "https://github.com/knowledgeislands/ki-agentic-harness", role = "maintainer" }

[skills.ki-agora.homes.knowledge-islands]
owner = "https://github.com/knowledgeislands/ki-agentic-harness"
purpose = "Knowledge Islands maintained repositories"
order = [
  "https://github.com/knowledgeislands/ki-agentic-harness",
  "https://github.com/knowledgeislands/tools-ki",
  "https://github.com/example/plain-git-repository",
]
references = ["https://github.com/example/plain-git-repository"]
members = { "https://github.com/knowledgeislands/tools-ki" = "maintainer" }
```

`order` is an optional duplicate-free ordered prefix of canonical repository identities drawn from the owner, declared members, and references. Resolved projections place those repositories first in the declared order and retain lexical local-key order for every unlisted participant. It controls only deterministic projection order, including display, roots, opening, and repository selection; it grants no membership, role, priority, or authority. TOML does not otherwise require lexical ordering for tables or inline-table keys. Each configuration table is locally authored; a tool never adds a membership or changes another repository's declaration.

## Home declarations

Each `[skills.ki-agora.homes.<agora-id>]` table requires `owner`, `purpose`, and `members`, and admits only the optional `order` field alongside them:

- `owner` — the canonical HTTPS GitHub identity of the declaring repository. The `ki` resolver verifies this matches the registered repository that declares the Agora; each identifier is unique across registered owners.
- `purpose` — a non-empty human explanation of the collection.
- `order` — an optional ordered prefix of the resolved owner and member repository identities. Every entry is canonical, unique, and already named by `owner` or `members`; omitted participants follow in lexical local-key order.
- `references` — an optional duplicate-free array of canonical HTTPS GitHub repository identities selected by the owner for working-set projection without membership or role.
- `members` — a table or inline table keyed by canonical HTTPS GitHub repository identity, with a non-empty lower-case hyphenated role value.

The owner repository does not list itself in `members`: it is automatically included in the resolved Agora projection as its owner, rather than claiming reciprocal consent from itself. A different repository may operate another Agora and also join this one.

## Referenced repositories

Only the registered Agora owner may declare `references`. A reference is an ordinary Git repository included for working-set projection. It is not a member, has no role, needs no `.ki.toml` or reciprocal declaration, and gains no Knowledge Islands conformance, trust, work routing, trade, priority, publication, implementation, or acceptance authority.

Owner, member, and reference identities are mutually exclusive within one home. Declaring the same identity in more than one class is a configuration failure. Promoting a reference to membership requires removing it from `references` and completing the existing reciprocal owner/member declarations. Removing a reference changes only the owner's declaration and never mutates the referenced repository.

The portable first contract accepts only the same canonical HTTPS GitHub repository identity grammar as `ki-repo.repository`; credentials, queries, fragments, trailing `.git`, filesystem paths, arbitrary source directories, and non-Git repositories are invalid. A machine-local host association may map one reference identity to one explicitly selected absolute Git checkout whose canonical remote matches. That association is not KI registration and grants no authority. Missing, ambiguous, absent, or remote-mismatched associations omit only the unresolved reference from the projected roots and produce a typed diagnostic; they do not invalidate or reclassify owner and reciprocal-member results. The host never clones or chooses among multiple checkouts automatically.

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
