---
name: ki-agentic-radar
ki-kind: governance
ki-applicability: declaration-only
ki-depends-on: []
ki-shared-dependencies: [ki-skills:rubric]
description: >
  Maintain an evidence-backed radar for agentic protocols, interfaces, organisations, architectures, research,
  and vendor terms. Use for maturity, interoperability, or stance; `ki-model-radar` owns models, `ki-pulse`
  discovers signals, and `ki-next` owns follow-on work.
argument-hint: "audit | conform | educate | help | refresh"
---

# Knowledge Islands agentic radar

This governance skill maintains a portable, reviewable snapshot of agentic subjects without turning observation into adoption.

Read [the agentic-radar standard](references/standards-agentic-radar.md) before assessing or changing the snapshot. [The generated rubric](references/rubric.md) publishes its criteria, [the radar snapshot](references/radar.toml) holds structured state, and [the tracked sources](references/sources.md) govern refresh inputs.

The radar does not choose an agent architecture, install integrations, mutate runtime configuration, or treat a protocol version, standards-body incubation, package count, or vendor claim as interoperability proof. `ki-model-radar` owns models and routes, `ki-pulse` owns public-signal discovery, capability REFRESH modes own capability-specific policy, and `ki-next` owns downstream work capture.

## Operating modes

Invoked as `help`, `-h`, or `?`, emit the generated HELP block and stop. With no recognised mode, emit the same HELP and, only in an interactive session, offer a mode choice.

### Mode AUDIT

Run `ki repo audit --skill ki-agentic-radar --repo <repo>` for deterministic schema, evidence, lifecycle, ownership, and classification checks. Then review judgment criteria in [the generated rubric](references/rubric.md): whether evidence is independent and applicable enough for the recorded maturity and whether architectural terms remain meaningfully distinct.

AUDIT is read-only. Report mechanical findings before judgment gaps and never infer a preferred stance from source count.

### Mode CONFORM

Run AUDIT first, then `ki repo conform --skill ki-agentic-radar --repo <repo> --dry-run`. Only the generated rubric publication is automatically conformable. Changes to `radar.toml` are authored and guarded because even a syntactic-looking correction can change maturity, stance, movement, or ownership meaning.

### Mode EDUCATE

Explain the subject kinds, evidence classes, maturity and implementation dimensions, interoperability states, stance and movement vocabulary, owner and return-trigger requirements, and the adoption boundary. Use examples to distinguish agent loops, branching supervisor trees, graph-orchestrated control flow, knowledge graphs, and provenance graphs. Do not scaffold or mutate a repository.

### Mode REFRESH

REFRESH applies only to this skill's canonical files in `ki-agentic-harness`. From an installed copy, stop and redirect to the harness.

Read [the tracked sources](references/sources.md), perform a bounded current-evidence review, and reconcile proposed changes against [the standard](references/standards-agentic-radar.md). Preserve uncertainty and counter-evidence. Provider claims alone cannot move a subject inward; Adopt or Trial requires a concrete Knowledge Islands use case and local evidence.

Route material consequences to the owning capability REFRESH mode, a Decision Record, or `ki-next`. Never mutate a consumer directly from REFRESH.

## Notes

- A community group is not automatically a formal standard, and a versioned protocol is not automatically stable.
- Reference implementations, independent implementations, conformance results, and demonstrated interoperability are separate evidence states.
- Architectural patterns and vendor terms use `not-applicable` specification maturity and must not be labelled formal standards.
- Similar graph vocabulary does not collapse control flow, stored knowledge, and evidence lineage into one concept.
