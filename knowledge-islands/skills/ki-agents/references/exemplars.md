# Agent Exemplars

Curated public agent definitions worth reading when authoring or evaluating an agent. Use these as pattern references — what good description copy looks like, how to scope tools, how to structure a system prompt. Do not copy them wholesale; adapt to the KI conventions (grounding, own-vs-defer, KB wikilinks).

Each entry notes what the exemplar demonstrates well. For the full collection, see the sources in [sources.md](sources.md).

## Collections

| Source                                    | URL                         | What it covers                   |
| ----------------------------------------- | --------------------------- | -------------------------------- |
| awesome-claude-code-subagents (VoltAgent) | [VoltAgent repo][voltagent] | 100+ community-authored agents † |

† Across dev, ops, research, and data domains.

## Selected patterns

### Focused read-only reviewer

From the CC official examples (`code-reviewer`). Demonstrates: tools as an allowlist (`Read, Grep, Glob, Bash`) to enforce read-only; "use proactively" idiom in description; numbered `When invoked` procedure; feedback structured by priority (critical / warning / suggestion).

```markdown
---
name: code-reviewer
description: Expert code review specialist. Proactively reviews code for quality, security, and maintainability. Use immediately after writing or modifying code.
tools: Read, Grep, Glob, Bash
model: inherit
---
```

### Read-write specialist with clear lane

From the CC official examples (`debugger`). Demonstrates: Edit added only because the role needs to fix, not just read; explicit diagnostic workflow (capture → isolate → minimal fix → verify); output structured as root-cause + evidence + fix + prevention.

```markdown
---
name: debugger
description: Debugging specialist for errors, test failures, and unexpected behavior. Use proactively when encountering any issues.
tools: Read, Edit, Bash, Grep, Glob
---
```

### Hook-gated tool access

From the CC official examples (`db-reader`). Demonstrates: granting Bash but restricting it with a `PreToolUse` hook rather than removing the tool entirely — useful when you need conditional rather than blanket restriction.

```markdown
---
name: db-reader
description: Execute read-only database queries. Use when analyzing data or generating reports.
tools: Bash
hooks:
  PreToolUse:
    - matcher: 'Bash'
      hooks:
        - type: command
          command: './scripts/validate-readonly-query.sh'
---
```

### Domain-grounded KB agent (KI house pattern)

From the KI harness `agents/governance/ki-kb-curator.md`. Demonstrates: grounding section that lists specific KB notes to read before acting; own-vs-defer with reciprocal sibling references; confirm-before-write authoring convention.

```markdown
---
name: ki-kb-curator
description: >
  Knowledge Islands KB Curator — owns KB zone health, note structure, and conformance to the ki-kb-base standard … Does not own SKILL.md authoring — that is ki-skills-lead — or decision record authoring — that is ki-decision-author.
model: inherit
color: green
---
```

[voltagent]: https://github.com/VoltAgent/awesome-claude-code-subagents
