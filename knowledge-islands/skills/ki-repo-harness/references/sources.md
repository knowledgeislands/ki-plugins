# Sources — ki-repo-harness

**Refresh:** external-spec · monthly

The tracked sources behind [the compatible harness standard](standards-compatible-harness.md). Provenance only: the record of _what changed_ lives in git, not a changelog here.

## Authoritative

| Tag | Source | Governs | Last reviewed |
| --- | --- | --- | --- |
| [AS] | [Agent Skills specification][as-spec] | The individual `SKILL.md` format the harness serves † | 2026-07-04 |
| [CC] | [Claude Code subagent docs][cc-subagents] | The subagent definition format the `subagents/` part serves | 2026-07-04 |

† Including the directory-name = `name:` constraint and the `references/`, `scripts/`, `assets/` layout.

## In-house

| Tag | Source | Governs | Last reviewed |
| --- | --- | --- | --- |
| [AH] | [ki-agentic-harness README][ah-readme] | The KI canonical source-harness implementation § | 2026-07-27 |
| [CH] | [Compatible harness contract][compatible] | Installed identity, direct payload, capability, host, and activation boundaries | 2026-07-27 |
| [KR] | `ki-repo` skill | The `.ki-config.toml` contract and what makes a KI-governed repository | 2026-07-27 |
| [KS] | `ki-skills` skill | The governed-rubric family, session, and host boundary ‡ | 2026-07-27 |
| [KE] | `ki-engineering` skill | Development toolchain ownership outside compatible-harness installation semantics | 2026-07-27 |

§ Source layout and shelf practice are inferred from this repository; installed-payload policy comes from [CH].

‡ Catalogue shape, context/session ownership, generated publication, and direct host execution.

## Last review

_REFRESH last run **2026-07-27** (previous: 2026-07-04)._

**Confirmed:**

- [AS] re-fetched live: the Agent Skills specification still defines **no** bundle, harness, container, or multi-skill grouping concept — the five-part source structure and co-location intent remain a KI architectural convention. The spec requires the `name` field to match the parent directory name (reinforcing SKILLS-1) and documents optional frontmatter governed by `ki-skills`, not this container standard.
- [CC] re-fetched live: the subagent definition format (frontmatter `name` / `description` / `tools` / `model` + system-prompt body, project- and user-level install locations) is unchanged. No change to the `subagents/` part of the harness contract.
- [CH] confirms that the current installed payload contains regular `skills/`, `subagents/`, and `hooks/`; a checkout, cache, runtime projection, or `.ki/` directory is never an implicit operation source.
- [KR] / [KS] / [KE] confirm the direct boundaries: `.ki-config.toml` declares source-repository governance, rubrics execute through the `ki` host, and package scripts are development conveniences rather than installation or governance entry points.

**Drift resolved this pass:**

- The standard now separates the five-part source repository from the current three-directory compatible payload and names installed, verified harness state as the only operation source.
- Retired package aliases, repository-vendored executors, checkout-dependent runtime links, and a skill-owned global linker are removed from the harness contract.
- The mechanical catalogue now discovers grouped physical skill roots, uses the final session contract, and retains only the safe host-published `[skills.ki-repo-harness]` marker append.

**Open watch-items:**

- [AS] — Monitor for any Agent Skills spec update that adds bundle / harness-level concepts. If agentskills.io ever formalises a multi-skill container, reconcile with this standard. Also: the newly-documented optional frontmatter fields (`compatibility`, `allowed-tools`, `metadata`) are a `ki-skills` concern to fold in — flag raised, not owned here.
- [CC] — Monitor Claude Code release notes for any change to skill-install paths or the project-local skill-install convention.
- [CH] — Monitor host support for additional capability kinds. MCP servers and evals remain source shelves until their compatible-payload contracts land.

[as-spec]: https://agentskills.io/specification
[cc-subagents]: https://code.claude.com/docs/en/sub-agents
[ah-readme]: ../../../../README.md
[compatible]: ../../../../docs/decisions/references/compatible-harness-contract.md
