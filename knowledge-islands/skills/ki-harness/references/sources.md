# Sources — ki-harness

**Refresh:** external-spec · monthly

The tracked sources behind the harness standard. Provenance only: the record of _what changed_ lives in git (the REFRESH commit), not a changelog here.

## Authoritative

| Tag  | Source                                    | Governs                                                  | Last reviewed |
| ---- | ----------------------------------------- | -------------------------------------------------------- | ------------- |
| [AS] | [Agent Skills specification][as-spec]     | The individual `SKILL.md` format the harness serves †    | 2026-07-04    |
| [CC] | [Claude Code subagent docs][cc-subagents] | The subagent definition format the `agents/` part serves | 2026-07-04    |

† Including the directory-name = `name:` constraint and the `references/`, `scripts/`, `assets/` layout.

## In-house

| Tag | Source | Governs | Last reviewed |
| --- | --- | --- | --- |
| [AH] | [ki-agentic-harness README][ah-readme] | The KI canonical reference implementation § | 2026-07-04 |
| [KR] | `ki-repo` skill | The `.ki-config.toml` contract, coverage cascade, and what makes a KI-governed repo | 2026-07-04 |
| [KE] | `ki-engineering` skill | The enforcement framework ‡ plus the common toolchain script families | 2026-07-04 |

§ All structure inferred from this repo.

‡ Severity ladder, mode shape, and checker contract.

## Last review

_REFRESH last run **2026-07-04** (previous: 2026-06-21)._

**Confirmed:**

- [AS] re-fetched live: the Agent Skills specification still defines **no** bundle / harness / container / multi-skill-grouping concept — the four-part structure, the `ki:skills:link:project` install convention, and co-location intent remain entirely a KI architectural convention. The spec now explicitly requires the `name` field to **match the parent directory name** (reinforcing SKILLS-1), and documents additional optional frontmatter fields (`license`, `compatibility`, `metadata`, `allowed-tools`) plus a tightened `name` rule (1–64 chars, no consecutive hyphens). None of this touches the harness standard, which delegates every `SKILL.md` field requirement to `ki-skills`; the new fields are tracked there, not here.
- [CC] re-fetched live: the subagent definition format (frontmatter `name` / `description` / `tools` / `model` + system-prompt body, project- and user-level install locations) is unchanged. No change to the `agents/` part of the harness contract.
- [KR] / [KE] re-verified against the repo: `.ki-config.toml` carries `[ki-repo]`, `[ki-engineering]`, `[ki-harness]`, `[ki-skills]`; the enforcement framework's severity ladder and checker contract are still cited correctly by the rubric. The mechanical checker (`ki:harness:audit`) passes 43/43.

**Drift resolved this pass:**

- [AH] the previous note recorded **thirteen** skills with the eval suite covering twelve of thirteen. The harness now holds **18** skills under `skills/` (`ki-website`, `ki-kb-activities`, `ki-agents`, `ki-authoring`, `ki-bootstrap`, `ki-website-cloudflare`, `ki-decision-records`, `ki-engineering`, `ki-handoffs`, `ki-harness`, `ki-kb`, `ki-kb-live-artifacts`, `ki-mcp`, `ki-plans`, `ki-repo`, `ki-skills`, `ki-kb-streams`, `ki-tokenomics`). The `agents/` shelf is populated (governance agents); `mcp/` and `evals/` remain valid shelves. The `harness-standard.md` body is deliberately **count-agnostic** and needs no edit for this growth — the container it describes still matches current reality.

**Open watch-items:**

- [AS] — Monitor for any Agent Skills spec update that adds bundle / harness-level concepts. If agentskills.io ever formalises a multi-skill container, reconcile with this standard. Also: the newly-documented optional frontmatter fields (`compatibility`, `allowed-tools`, `metadata`) are a `ki-skills` concern to fold in — flag raised, not owned here.
- [CC] — Monitor Claude Code release notes for any change to skill-install paths or the project-local skill-install convention.
- [AH] — The harness `CLAUDE.md` four-part table still reads "16 ki-* skills" against an actual 18 (a repo-CLAUDE.md freshness matter, not a standard change) — flagged for central handling.

[as-spec]: https://agentskills.io/specification
[cc-subagents]: https://code.claude.com/docs/en/sub-agents
[ah-readme]: ../../README.md
