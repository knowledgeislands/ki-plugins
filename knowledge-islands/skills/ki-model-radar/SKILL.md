---
name: ki-model-radar
ki-kind: governance
ki-applicability: declaration-only
ki-depends-on: []
ki-shared-dependencies: [ki-skills:rubric]
description: >
  Maintain an evidence-backed radar for models and model-agent routes. Use for model comparisons, benchmark
  relevance, recommendations, or retirements. Use `ki-agentic-radar` for broader agentic standards, `ki-pulse`
  for signal discovery, and `ki-tokenomics` for model purpose.
argument-hint: "audit | conform | educate | help | refresh"
---

# Knowledge Islands model radar

This governance skill maintains a portable, reviewable snapshot of models, executable routes, benchmark applicability, and evidence. Read [the model-radar standard](references/standards-model-radar.md) before assessing or changing the snapshot. [The generated rubric](references/rubric.md) publishes its criteria, [the radar snapshot](references/radar.toml) holds current structured state, and [the tracked sources](references/sources.md) govern refresh inputs.

The radar informs decisions; it does not rank models automatically, install agents, change runtime defaults, buy access, provision infrastructure, or transmit private material. `ki-pulse` discovers public signals, `ki-tokenomics` owns portable model-purpose categories, runtime adapters own effective configuration, `ki-work-housekeeping` owns recurring review templates, `ki-next` captures approved downstream work, and `ki-skills` assesses the skill artifact itself.

## Operating modes

Invoked as `help` / `-h` / `?`, emit the generated HELP block and stop. With no recognised mode, emit the same HELP and, only in an interactive session, offer the mode choice.

### Mode AUDIT

Run `ki repo audit --skill ki-model-radar --repo <repo>`. The structured catalogue checks the bundled snapshot without fetching sources or ranking models. Apply its judgment prompts to evidence independence, applicability, uncertainty, and proposed lifecycle movement.

### Mode CONFORM

Run AUDIT first. `ki repo conform --skill ki-model-radar --repo <repo> --dry-run` may regenerate only the readable rubric publication. Snapshot, evidence, and lifecycle findings remain diagnostic or guarded because their correct repair requires authorship or review.

### Mode EDUCATE

Run `ki repo educate --skill ki-model-radar --repo <repo>` to render the catalogue. Explain recommendation, support, retirement, movement, evaluation-unit, and evidence classifications from the standard without treating a benchmark or provider claim as an adoption decision.

### Mode REFRESH

REFRESH writes only this skill's canonical files in `ki-agentic-harness`. When invoked from an installed copy, stop and redirect to that Harness. Read [the tracked sources](references/sources.md), gather bounded current evidence, reconcile it with [the snapshot](references/radar.toml), and propose reviewed changes. If the last review is still within cadence and no material release or deprecation triggered the run, confirm before forcing an early refresh.

Movement inward requires current identity and lifecycle evidence, materially independent evaluation where available, and local-fit evidence proportional to the recommendation. Preserve counter-evidence and uncertainty. Route any approved consumer change through `ki-next`; do not mutate a consumer from this mode.

## Notes

- Compare results only within a declared evaluation unit: bare model, provider endpoint, model-agent route, or complete task environment.
- Treat provider performance claims as corroborating evidence, never decisive independent evidence.
- Record exact openness and licence per model variant; do not infer local practicality from weight availability.
- Begin local-fit evaluation with public or synthetic repositories. Private-repository evaluation requires separate authority.
