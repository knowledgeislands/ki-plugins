# Compatible harness standard

The normative reference for a Knowledge Islands source harness and the verified compatible payload installed from it.

The [generated rubric](rubric.md) is the checkable publication of this standard. The [sources](sources.md) record its provenance, and the [exemplars](exemplars.md) show representative source and installed shapes.

## Contents

- [Source and installed boundaries](#source-and-installed-boundaries)
- [Capability publication](#capability-publication)
- [Source-harness layout](#source-harness-layout)
- [Skill capability identity](#skill-capability-identity)
- [Root orientation](#root-orientation)
- [Root roadmap](#root-roadmap)
- [Harness declaration](#harness-declaration)
- [Ownership boundaries](#ownership-boundaries)

## Source and installed boundaries

A **source harness** is one versioned repository that co-locates five agentic shelves:

| Directory    | Source concern                                            |
| ------------ | --------------------------------------------------------- |
| `skills/`    | Agent Skills, optionally grouped by semantic category     |
| `subagents/` | Agent definitions and their source organisation           |
| `mcp/`       | MCP server packages or a shelf routing to their own repos |
| `evals/`     | Behavioural evaluation scenarios and results              |
| `hooks/`     | Runtime hook payloads and installation material           |

These shelves are authored and reviewed together, but not every shelf is part of the current installed payload.

A **compatible installed harness** is a verified regular-file payload acquired and registered by the `ki` host. The current payload contains `skills/`, `subagents/`, and `hooks/`. MCP servers and evals remain source-harness concerns until the host publishes those capability kinds.

The installed payload, not a checkout, runtime projection, cache, or repository-local `.ki/` directory, is the operation source. A nearby checkout never becomes authoritative because a name matches or a symlink points to it.

The source repository therefore defines capability semantics and carries their source files. The `ki` host owns acquisition evidence, installation layout, registry state, runtime activation links, repository activation, public CLI grammar, generic rubric execution, reporting, transactions, migration, and support diagnostics.

## Capability publication

A compatible harness publishes typed capabilities. The current recognised capability kind is `skill`; the other source shelves reserve their kinds until host support lands.

The installed harness identity derives from its verified `<owner>/<repository>` installation path. A skill's qualified identity is `<harness-id>:<skill-name>`. The baseline identity is `knowledgeislands/ki-agentic-harness`.

An installed skill's physical source directory and `SKILL.md` frontmatter are authoritative. A file does not become executable merely because it appears beneath the payload root. A governed skill contributes only its rubric definition, evidence builders, and declared safe repairs to the generic host.

Runtime activation is a separate managed projection. Only the host creates or verifies activation links to a verified installed source. A source-harness script must not install a harness, activate user or repository capabilities, or link runtime discovery directly to its checkout.

## Source-harness layout

Every source harness has all five directories at its physical repository root, each with a physical `README.md` explaining its purpose and status:

```text
skills/       README.md
subagents/    README.md
mcp/          README.md
evals/        README.md
hooks/        README.md
```

An empty shelf is valid. Its README distinguishes intentional reserved structure from accidental absence.

The source root also contains physical `CLAUDE.md`, `ROADMAP.md`, and `.ki-config.toml` files. Symlinked, dangling, directory-valued, device, or unreadable evidence is unsafe and does not satisfy a physical-file or physical-directory requirement.

The source harness may have a `package.json` for its own development and verification. Package scripts are conveniences governed by `ki-engineering`; they are not installation, activation, or governance entry points and are not required by this standard.

## Skill capability identity

Every discovered skill root beneath `skills/` contains `SKILL.md`, and its directory name exactly matches the `name:` frontmatter.

A source harness may group skill roots under semantic directories. Discovery therefore walks physical descendants of `skills/`, stops at a directory containing `SKILL.md`, and rejects unsafe or unreadable evidence rather than following it.

No two discovered skill roots in one source harness share a frontmatter name. The `ki-skills` skill governs every other aspect of skill quality.

## Root orientation

The source-harness `CLAUDE.md` is its runtime-bound orientation. It:

1. explains what the source harness is and names all five shelves;
2. gives the current status of every shelf;
3. routes working conventions to the skill or document that owns each concern;
4. lists the direct `ki` audit, conform, and rubric-publication commands plus the repository test and TypeScript gates; and
5. keeps counts, statuses, payload boundaries, and command names current.

It must not present removed package aliases, repository-vendored runners, or checkout-dependent linkers as the public contract.

## Root roadmap

A source harness carries `ROADMAP.md` as its open-work register. The `ki-change-management-roadmap` skill owns roadmap profiles, horizon vocabulary, generated projections, and content discipline; this standard checks only the root file's physical presence.

## Harness declaration

The source root carries `.ki-config.toml` with a keyless `[skills.ki-repo-harness]` table as its compliance marker. It also declares `[skills.ki-repo]`, and a populated skills shelf declares `[skills.ki-skills]`.

If a physical readable `.ki-config.toml` exists without `[skills.ki-repo-harness]`, CONFORM may append exactly one keyless marker while preserving all existing bytes apart from normalising the trailing newline before the append:

```toml
[skills.ki-repo-harness]
```

CONFORM does not create a missing configuration and never replaces or follows a symlink, directory, dangling link, special file, or unreadable path. The session coalesces repeated marker requests into one host-published proposal. The host owns dry-run, transaction validation, atomic publication, rollback, and post-write re-audit.

## Ownership boundaries

This standard governs the source container and compatible-payload boundary. Content and runtime semantics remain with their specific owners:

| Concern                                      | Owner            |
| -------------------------------------------- | ---------------- |
| Skill quality                                | `ki-skills`      |
| Agent definition quality                     | `ki-subagents`   |
| MCP server code                              | `ki-repo-mcp`         |
| Repository roadmap content                   | `ki-change-management-roadmap`     |
| Engineering toolchain and package scripts    | `ki-engineering` |
| Repository declaration and GitHub settings   | `ki-repo`        |
| Harness install, activation, and CLI runtime | `tools-ki`       |

Selecting `ki-repo-harness` also selects its declared prerequisites: `ki-skills`, `ki-subagents`, `ki-decision-records`, and `ki-change-management-roadmap`. Coverage selects `ki-repo-mcp`, `ki-engineering`, and `ki-repo` separately when their concerns apply. This standard adds only the container and publication delta defined here.
