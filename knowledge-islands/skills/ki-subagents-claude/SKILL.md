---
name: ki-subagents-claude
ki-kind: governance
ki-depends-on: [ki-subagents]
ki-runtime-binding: true
ki-supported-runtimes: [claude-code]
ki-shared-dependencies: [ki-skills:rubric]
description: >
  Audit and write the Claude Code Markdown/YAML projection of a portable KI subagent. Use after `ki-subagents` establishes the runtime-neutral role, selection, instructions, lane, grounding, hand-offs, and orchestration intent. Carries source-shape checks for YAML, required Claude fields, and Claude-specific configuration. It does not prove installed, selected, activated, or executed Claude agents. For Codex TOML use `ki-subagents-codex`; for portable semantics use `ki-subagents`.
argument-hint: 'audit <agent-or-dir> | conform <agent> | help | educate <description> | refresh'
---

# Claude Code subagent projection

`ki-subagents` owns the portable semantic contract. This adapter owns only its Claude Code Markdown/YAML projection: YAML parsing, native fields, and source discovery. Read the [Claude projection standard](references/standards-subagent-definitions.md) and generated [rubric](references/rubric.md) after reading the parent contract.

The Harness currently preserves candidate Claude source files under `subagents/`, but the host does not publish them to `.claude/agents` or consume its advertised `subagents` path. A clean audit therefore proves only a repository-owned source payload. Installation, selection precedence, activation, effective permissions, and execution are unavailable without a host and authorised runtime evidence path.

## Operating modes

Like every governance skill it carries the universal four **AUDIT · CONFORM · EDUCATE · REFRESH** — EDUCATE here writes a new agent. Modes are named and alphabetical. Invoked as `help` / `-h` / `?`, it explains itself and stops — the generated HELP block (name, purpose, invocation, modes, off-ramps), taking no action. With no mode it does the same, then, in an interactive session only, offers the mode choice via `AskUserQuestion`, prompting for any `argument-hint` target the chosen mode shows.

### Mode AUDIT — review an existing agent

Run the portable parent first. Then run `ki repo audit --skill ki-subagents-claude --repo <path>` when the host registers this adapter. Until registration, run its focused source tests and report the host capability as unavailable. Audit results concern only physical source files under `subagents/`.

### Mode CONFORM — bring an existing agent into line

Run AUDIT first. Correct only the source definition through its responsible author; no CONFORM operation publishes a Claude agent today. Apply portable semantic changes through `ki-subagents`, then rerun this adapter's source checks.

### Mode EDUCATE — write a new agent

Use `ki-subagents` to establish the semantic definition first. Then author the Markdown/YAML source form only when a Harness source payload is intended. Do not claim that writing it installs or activates a Claude agent.

### Mode REFRESH — re-anchor best practice

**Precondition:** REFRESH edits this skill's own canonical files, which exist only in `ki-agentic-harness`. Invoked from an installed copy, it stops here and names the harness as where to run it — or, for a pattern recurring across bases, routes it through `ki-repo-kb`'s IMPROVE mode instead.

Keep only Claude Code source-format claims current. The portable parent and Codex adapter own their own sources.

Re-fetch the Claude Code subagents documentation, compare native field and source-discovery claims with the standard and TypeScript items, then regenerate the publication. Do not infer host publication or runtime activation from the source documentation.

### Mode HELP — orient without changing anything

Invoked as `help`, `-h`, or `?`, explain the skill, invocation, modes, runtime binding, and off-ramps, then stop. With no recognisable mode, provide the same explanation and only offer a mode choice in an interactive session.

## Notes

- Run the host audit, then judge. Structured items own the mechanical layer; the model owns the judgment layer.
- A WARN is not a FAIL. Length and the third-person-description heuristic are _recommendations_ — report them, but an agent can ship over a soft cap with a reason.
- This adapter audits Claude source definitions, not portable semantics, skills, or effective runtime state.
- For Codex TOML use `ki-subagents-codex`; for a `SKILL.md` use `ki-skills`.
