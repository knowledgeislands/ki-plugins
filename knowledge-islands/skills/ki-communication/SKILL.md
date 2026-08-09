---
name: ki-communication
ki-kind: governance
ki-depends-on: []
description: >
  Audit, educate, conform, and refresh AI collaboration instructions across user, repository, and session scopes. Use when establishing a communication convention, reducing noisy progress or tool output, reviewing AGENTS.md or CLAUDE.md instructions, setting a response-detail level, or checking instruction precedence across runtimes. Governs portable instruction surfaces and their override order: current thread, repository, user-wide, then the standard default. Triggers: "be more concise", "less noise", "show more detail", "verbosity", "communication level", "quiet mode", "audit our AGENTS.md", "review AI instructions", "/ki-communication".
argument-hint: 'audit [scope] | conform [scope] | educate | refresh | help'
---

# ki-communication

Govern instruction surfaces that control information density, progress reporting, and handoff detail. This is a governance skill: it audits durable user and repository instructions; it does not treat a one-off request as a workflow command.

## Contract

Instruction precedence is: explicit current-thread request, repository instruction, user-wide instruction, then the standard default. The levels are `quiet`, `standard`, and `detailed`; `standard` is the default. A quieter setting never suppresses an error, safety concern, required approval, irreversible action, or material uncertainty.

## Operating modes

### Mode AUDIT

Inspect the selected instruction surfaces without changing them. Check that each is readable by every stated runtime, names the applicable level, follows the precedence contract, limits routine narration and raw command output, and preserves material failures and decisions. Report findings as FAIL, WARN, or PASS with the file and exact corrective action.

### Mode CONFORM

Run AUDIT first. Propose the smallest changes that make selected instruction surfaces portable, explicit about level and precedence, and appropriately concise. Confirm before writing user-wide or repository instructions.

### Mode EDUCATE

Draft a communication section for a new user or repository instruction surface. State the selected level, the precedence relationship, when progress is material, and the safety exceptions. Use plain Markdown that is understandable without runtime-specific terminology.

### Mode REFRESH

**Precondition:** REFRESH edits this skill's own canonical files, which exist only in `ki-agentic-harness`. Invoked from an installed copy, stop here and name the harness as where to run it.

Review the contract when runtimes add durable instruction, session, or output-control mechanisms. Preserve the portable precedence model; add runtime-specific detail only when it cannot be expressed in shared Markdown.

### Mode HELP

Explain the contract, precedence, levels, and modes without changing any instruction surface.

## Modes and boundaries

AUDIT is read-only; CONFORM requires confirmation before writing. The skill governs communication instructions, not product documentation, agent definitions, or tool-specific command behaviour. Keep evidence available for inspection, but present passing verification as a summary unless the selected level or a failure calls for detail.
