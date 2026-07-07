# Repo Exemplars

## Contents

- [Collections](#collections)
- [Selected patterns](#selected-patterns)

Curated patterns from the KI repo set that show what a well-configured Knowledge Islands repo looks like. Use these as reference when onboarding a new repo, running CONFORM, or auditing against the standard. The `ki-agentic-harness` is the primary exemplar — it carries every required layer-1 file, a fully-populated `.ki-config.toml`, and a `CLAUDE.md` with correct topic imports. The `mcp-*` repos are the reference set for public repos (topics, secret scanning, MIT license). For the full source list and last-review dates, see [sources.md](sources.md).

## Collections

| Source | URL | What it covers |
| --- | --- | --- |
| ki-agentic-harness | [github][harness] | Private repo; all layer-1 files; full `.ki-config.toml`; rich `CLAUDE.md` |
| mcp-gmail | [github][mcp-gmail] | Public repo; MIT license; standard topic set; Dependabot auto-merge |
| mcp-kb-fs | [github][mcp-kb-fs] | Public repo; canonical layer-2/3 settings; `branch-protection` off |
| GitHub REST API — repo settings | [docs.github.com][repo-settings] | Merge methods, auto-delete-branch, features |
| GitHub branch protection | [docs.github.com][branch-protection] | Optional `branch-protection` body |

## Selected patterns

### Minimal `.ki-config.toml` — private repo, no overrides

Every KI-governed repo carries a `.ki-config.toml` at its root. The file is the compliance marker; its presence is what the coverage cascade gates on. A repo that fully conforms to org defaults needs only the `[ki-repo]` table with a `visibility` declaration and silence under `[ki-repo.checks]` (or no checks table at all). Each additional governance skill the repo opts into adds its own table — the tables are independent, each skill reads only its own.

```toml
# .ki-config.toml — one [table] per governing skill

[ki-repo]
visibility = "private"   # "public" | "private" — declared, not inferred
# No [ki-repo.checks] needed: this repo takes all org defaults.

[ki-engineering]
# Fully conforms; no overrides. Capabilities auto-detected from repo markers.
```

### `.ki-config.toml` — opt-in `branch-protection` override

`branch-protection` defaults **off** for all KI repos — `main` is open, direct pushes allowed. A repo that wants a protected `main` declares it with a single boolean. When `branch-protection = true`, the auditor requires: a PR (0 approvals), the `build` status check, linear history, no force-push, no deletion, admins not enforced. No other check is affected by this override.

```toml
[ki-repo]
visibility = "public"

[ki-repo.checks]
branch-protection = true   # protect main: PR required, build check, linear history
```

### `CLAUDE.md` with topic-file imports

The harness `CLAUDE.md` is the pattern for all KI repos: a short orientation paragraph, then `@`-imports for per-topic files rather than one monolithic document. Topic files can be updated independently and loaded selectively. The imports section should come early so an agent session loads the topic context before the repo-specific prose. Per the skills rubric (SHAPE-7), every KI repo carries a `CLAUDE.md` — the field-name convention shown here (`@memory-scope.md`, `@workflow.md`) is the global user pattern; repo-level files typically import repo-specific topics (`@toolchain.md`, `@conventions.md`).

```markdown
# CLAUDE.md — my-repo

One paragraph: what this repo is and who works in it.

@toolchain.md @conventions.md

## What this repo is

…repo-specific orientation prose…

## Working here

…key commands and conventions not covered by the topic files…
```

### Four-part harness layout with coverage declarations

When a repo carries a four-part agentic harness layout (`skills/`, `agents/`, `mcp/`, `evals/`), its `.ki-config.toml` must declare all four relevant tables so `ki-repo`'s coverage cascade does not warn on detected-but-undeclared artifacts. The harness repo (`ki-agentic-harness`) is the canonical example — it opts into every applicable governance skill and documents why each table is present.

```toml
[ki-repo]
visibility = "private"

[ki-engineering]
# Fully conforms; capabilities auto-detected.

[ki-harness]
# Declares this repo as a KI agentic harness (the four-part layout compliance marker).
# No per-harness config keys defined yet — table presence is the declaration.

[ki-skills]
# skills/ is populated; the skills linter runs over it.

[ki-decision-records]
# This repo authors and maintains decision records.
```

[harness]: https://github.com/knowledgeislands/ki-agentic-harness
[mcp-gmail]: https://github.com/knowledgeislands/mcp-gmail
[mcp-kb-fs]: https://github.com/knowledgeislands/mcp-kb-fs
[repo-settings]: https://docs.github.com/en/rest/repos/repos#update-a-repository
[branch-protection]: https://docs.github.com/en/rest/branches/branch-protection
