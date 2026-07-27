# Compatible harness exemplars

Worked examples for distinguishing the source-harness container from its installed compatible payload. These illustrate the [standard](standards-compatible-harness.md); they do not add requirements.

## Source-harness layout

The five shelves stay visible in source even when a shelf is intentionally empty:

```text
skills/
  README.md
  foundations/
    ki-authoring/
      SKILL.md
subagents/
  README.md
  governance/
    ki-skills-lead.md
mcp/
  README.md
evals/
  README.md
  scenarios/
hooks/
  README.md
  plan-stamp.sh
CLAUDE.md
ROADMAP.md
.ki-config.toml
```

Semantic grouping beneath `skills/` is valid. The capability identity still comes from the leaf directory and its `SKILL.md` name.

## Installed compatible payload

The current verified archive publishes only the supported capability-bearing directories:

```text
<installed owner>/<installed repository>/
  skills/
  subagents/
  hooks/
```

The installed path supplies harness identity and physical source. Runtime discovery links are separate, host-managed activation state pointing into this verified installation. They never point at an arbitrary source checkout.

## Harness declaration

A source harness opts into this standard through a keyless marker:

```toml
[ki-repo]

[ki-harness]

[ki-skills]
```

When the physical file already exists and only `[ki-harness]` is missing, CONFORM may append that marker. Missing or unsafe configuration remains a reported manual case.
