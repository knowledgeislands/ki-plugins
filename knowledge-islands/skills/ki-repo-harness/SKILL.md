---
name: ki-repo-harness
ki-kind: governance
ki-runtime-binding: true
ki-depends-on: [ki-skills, ki-subagents, ki-decision-records, ki-work-roadmap]
ki-shared-dependencies: [ki-skills:rubric]
contributes: [skills/README.md]
description: >
  Audit, conform, and design Knowledge Islands compatible harnesses — source repositories that co-locate skills, subagents, MCP servers, evals, and hooks while publishing a verified installed capability payload. Use when creating a harness, checking its five-part source layout, validating its declared capability prefix and skill identities, reviewing its CLAUDE.md orientation, confirming its `.ki-config.toml` harness declaration, or distinguishing source shelves from the directly installed payload. Triggers: "audit the harness", "scaffold a new harness", "does this repo follow the harness standard", "refresh the harness standard", "is this a compatible harness". Governs the container and publication boundary, not its contents: skill quality → `ki-skills`; agent quality → `ki-subagents`; repository roadmap → `ki-work-roadmap`; MCP code → `ki-repo-mcp`; engineering toolchain → `ki-engineering`; repository settings → `ki-repo`; CLI installation and activation → `tools-ki`.
argument-hint: 'audit [path] | conform [path] | educate <name> | help | refresh'
---

# Knowledge Islands compatible harnesses

This skill governs two related shapes: the five-part **source harness** where capabilities are authored together, and the smaller verified **compatible payload** installed from it. The installed payload, never a checkout or repository-local executor, is the source used by the `ki` host.

The complete contract is in [the compatible harness standard](references/standards-compatible-harness.md). Its structured TypeScript catalogue under `scripts/rubric/items/` is canonical; [the generated rubric](references/rubric.md) is the readable publication. [Sources](references/sources.md) record provenance, and [exemplars](references/exemplars.md) illustrate the source-versus-installed distinction.

## Operating modes

The universal modes are **AUDIT · CONFORM · EDUCATE · REFRESH**.

### Mode AUDIT — check a source harness and publication boundary

- Run `ki repo audit --skill ki-repo-harness --repo <path>`. The host executes declared dependencies before the harness delta and reports mechanical results.
- Review the generated rubric's judgment criteria, especially capability and payload boundaries. Source layout does not establish a verified payload, local-development selection, activation, resolved capability, component result, or execution; obtain those states from `tools-ki` or report them unavailable.
- Run separately coverage-detected owning audits where applicable: `ki-engineering` for the development toolchain, `ki-repo` for repository governance, and `ki-repo-mcp` when the MCP shelf contains server code.
- Report sibling findings under their owning skill and harness findings under this skill.

### Mode CONFORM — apply safe harness repairs

1. Run AUDIT first.
2. Run `ki repo conform --skill ki-repo-harness --repo <path>`. If a physical readable `.ki-config.toml` lacks `[skills.ki-repo-harness]`, the item requests one append. If the generated capability catalogue in `skills/README.md` is missing or stale, the item requests one exact marker-bounded replacement from validated `SKILL.md` frontmatter. The session coalesces the resulting host proposal.
3. Missing shelves, shelf READMEs, root files, unsafe paths, identity conflicts, and orientation changes remain report-only because their content or replacement intent cannot be inferred safely.
4. Re-run AUDIT and apply the judgment criteria.

### Mode EDUCATE — explain or design a compatible harness

Run `ki repo educate --skill ki-repo-harness --repo <path>` to explain the source layout, current installed payload, identity rules, marker, and ownership boundaries. When designing a new harness, use the standard and exemplars to author the five source shelves and root files; installation and runtime activation remain direct `ki` host operations, not skill scripts or package aliases.

### Mode REFRESH — re-anchor the source and installed contracts

**Precondition:** REFRESH edits this skill's canonical files only in `ki-agentic-harness`. In an installed copy, stop and redirect to that source repository.

1. Read [the source list](references/sources.md) and its review cadence.
2. Re-check the Agent Skills and agent-definition sources for changes affecting capability source shape.
3. Reconcile [the compatible harness standard](references/standards-compatible-harness.md) with the repository's current source shelves and the installed-payload contract.
4. Update the structured rubric, regenerate it with `ki dev skill rubric ki-repo-harness --write`, and update source review dates after confirmation.

### Mode HELP — orient without changing anything

Invoked as `help`, `-h`, or `?`, explain the skill, invocation, modes, source-versus-installed boundary, and off-ramps, then stop. With no recognisable mode, provide the same explanation and only offer a mode choice in an interactive session.

## Ownership summary

- This skill owns source-container shape, compatible-payload semantics, the `[skills.ki-repo-harness]` prefix declaration, the safe missing-table marker append, and the generated capability section contributed to `skills/README.md`.
- `tools-ki` owns harness acquisition, verification, registry state, installation paths, activation links, public commands, and generic rubric execution.
- A top-level skill script is not an activation escape hatch. This skill intentionally carries no public command: all governed execution is hosted directly by `ki`.
