---
name: ki-guides
ki-kind: governance
ki-depends-on: []
ki-shared-dependencies: [ki-skills:rubric]
description: >
  Codify, audit, and maintain repository-local guides — the practical how of using, operating, contributing to, or maintaining a system — in any Knowledge Islands repository. Guides live under `docs/guides/`, whose `README.md` gives readers a concise map. Decisions record why (`ki-decision-records`), Specifications record what (`ki-specs`), guides record how, and roadmap items record when (`ki-work-roadmap`). Use when writing a procedure or contributor guide, bringing a documentation tree into shape, or deciding whether material belongs in a guide, specification, Decision Record, or roadmap item. Triggers: "write a guide", "document how", "guide structure", "audit docs/guides", "move developer docs". Off-ramps: ki-decision-records (durable rationale), ki-specs (observable behaviour), ki-work-roadmap (future work), ki-authoring (Markdown style).
argument-hint: 'audit [dir] | conform [dir] | help | educate [dir] | refresh'
---

# Knowledge Islands Guides standard

You are applying the **Knowledge Islands Guides standard** — the durable home for practical repository knowledge: how to use, operate, contribute to, or maintain a system. Read [the Guides standard](references/standards-guides.md) before authoring, auditing, or conforming a collection; [the rubric](references/rubric.md) publishes its checkable criteria, [exemplars](references/exemplars.md) illustrate representative shapes, and [sources](references/sources.md) records provenance.

## What this skill owns

1. **The guide root** — repository-local guides live below `docs/guides/`. Its `README.md` is the reader's entry point: it states the collection's scope and links to the guides or guide areas it contains.
2. **The documentation boundary** — a guide answers **how**. Durable rationale belongs in a Decision Record, observable behaviour and its verification belong in a specification, and planned work belongs in a roadmap item. Do not use `docs/spec/` or `docs/developer/` as parallel documentation systems; a specialised operational owner, not this skill, classifies any `docs/logs/` area.
3. **The guide shape** — each guide has one H1 and an explicit reader, outcome, or operating context. Nest guides only when the grouping helps a reader find the right procedure; no universal category taxonomy is imposed.
4. **The mechanical checker** — `ki repo audit --skill ki-guides` checks the controlled root and index, H1 presence, retired sibling roots, and the generated rubric publication. It leaves placement quality and procedural truth to explicit judgment.

## Operating modes

Carries the universal **AUDIT · CONFORM · EDUCATE · REFRESH**. Invoked as `help` / `-h` / `?`, it explains itself and stops — the generated HELP block (name, purpose, invocation, modes, off-ramps), taking no action. With no mode it does the same, then, in an interactive session only, offers the mode choice via `AskUserQuestion`, prompting for any `argument-hint` target the chosen mode shows.

### Mode EDUCATE

→ Activate this skill with `ki repo skill add ki-guides`; establish `docs/guides/README.md` from the exemplar before adding the first guide.

### Mode AUDIT

→ Read [references/mode-audit.md](references/mode-audit.md)

### Mode CONFORM

→ Read [references/mode-conform.md](references/mode-conform.md)

### Mode REFRESH

→ Read [references/mode-refresh.md](references/mode-refresh.md)

## Notes

- **Guide, not a second specification** — explain the sequence, conditions, and recovery needed to do work. Link to the applicable existing Specification when a guide needs to name a stable system behaviour; do not restate its normative contract. If the durable behaviour lacks a contract, route the gap to `ki-specs`; do not create a speculative Specification corpus merely to make a guide look complete.
- **No generic log archive** — a durable result belongs in its owning record, guide, specification, or roadmap item. Ephemeral command output and runtime logs remain untracked operational evidence unless a specialised system owns them.
- **Developer documentation is a guide** — put contributor mechanics in `docs/guides/developer/`, not a sibling `docs/developer/` tree.
- The `ki` host owns findings, dry-run publication, reporting, and post-conform verification; judgment aspects are counted as unevaluated rather than emitted as synthetic mechanical findings.
