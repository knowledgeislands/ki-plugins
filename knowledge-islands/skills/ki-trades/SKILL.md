---
name: ki-trades
ki-kind: governance
ki-depends-on: []
ki-shared-dependencies: [ki-skills:rubric]
contributes: ['.ki-config.toml']
owns: ['+/_TRADES/README.md', '-/_TRADES/README.md']
description: >
  Governs typed, directional cross-repository trades between locally registered Knowledge Islands repositories: mutable committed preparations, work and knowledge routes, TRD eight-hexadecimal identities, immutable submitted sender projections, receipt, receiver-only decisions, sender observation policies, release, and pruning. Use when preparing or submitting work or knowledge to another repository, observing a preparation, receiving or reviewing an inbound trade, auditing routes or records, or resolving direct application, adoption, retention, parking, clarification, decline, or supersession. A route grants visibility only; ki-change-management-roadmap and the receiving repository retain priority and acceptance authority.
argument-hint: 'audit <repo> | conform <repo> | educate <repo> | help | refresh'
---

# Knowledge Islands cross-repository trades

This governance skill defines safe **trade preparation and submission**, not transfer: a sender may make evolving work or knowledge visible without asking a peer to act, then publish an immutable submission while the receiver alone decides receipt, disposition, and any local follow-on work or knowledge. Read [the trade standard](references/standards-trades.md) before creating or reviewing records; [the generated rubric](references/rubric.md) publishes the mechanical and judgment criteria, and [the source list](references/sources.md) records the contract's provenance.

## What this skill owns

1. **Declared participation** — a repository opts in with its own `ki-trades` table, declaring typed `exports_to` and `imports_from` routes. Its canonical HTTPS GitHub home comes from `ki-repo.repository`.
2. **Directional trade routes** — a sender-declared export permits local preparation or submission before receiver participation. Receipt becomes available only when both repositories are registered, the sender exports that trade kind, and the receiver imports it. Pending participation and active reciprocity remain distinct route facts.
3. **Trade phases and identity** — every preparation and submission uses one `TRD-<eight lower-case hexadecimal characters>` identity and declares `kind: work | knowledge`. Every copy declares its own `phase` — `preparing`, `submitted`, or `received`. A committed `phase: preparing` record is mutable and silently observable at the sender's outbound path; submission rewrites the phase to `submitted` on that same path and freezes it.
4. **Authority and byte boundaries** — the sender writes only preparations and outbound submissions. The receiver creates and updates only its inbound copy. The complete raw sender projection remains byte-stable; only closed receiver-local receipt, decision, rationale, and linkage fields may differ.
5. **Independent lifecycle axes** — submission, receipt, receiver decision, and sender observation policy are separate facts. Receipt creates an inbound `unconsidered` copy but implies no review or acceptance. The receiver alone moves through `in_progress`, `parked`, `clarify`, `applied`, `adopted`, `retained`, `declined`, or `superseded`.
6. **Observation-led release** — `unattended` and `receipt` permit sender release after receipt, `decision` waits for a terminal receiver decision, and `completion` additionally waits for adopted local work to become done. The receiver may prune only after an eligible sender release is observable.
7. **Owned scaffold** — when the skill is declared, it owns the two `_TRADES` directories and their README files. `ki-repo` continues to own the generic `+` and `-` directories and README files whether or not this capability is declared.

## Operating modes

The skill carries the universal **AUDIT · CONFORM · EDUCATE · REFRESH** modes. Invoked as `help` / `-h` / `?`, it emits generated HELP and stops. With no recognised mode, it emits the same HELP and, only in an interactive session, offers the mode choice and prompts for the target shown in `argument-hint`.

### Mode AUDIT

Run `ki repo audit --skill ki-trades --repo <repo>`. The structured catalogue validates local configuration, declared and active typed routes, owned scaffold, preparation and submitted-record shape, sender/receiver authority, receipt and decision fields, raw sender-projection agreement, and observation-led release or pruning. Then review whether any direct application, local adoption, or knowledge retention preserves the receiver's independent authority.

### Mode CONFORM

Run AUDIT first. `ki repo conform --skill ki-trades --repo <repo> --dry-run` may restore only the owned `_TRADES` README scaffold when the generic `+` and `-` areas are safe physical directories. It never creates a route, record, receiver copy, disposition, roadmap item, or cross-repository write. Apply authored record and configuration corrections locally, then re-run AUDIT.

### Mode EDUCATE

Run `ki repo educate --skill ki-trades --repo <repo>` to render the concern and rubric. To participate, declare `ki-repo.repository`, then typed routes in `.ki-config.toml`, ensure the generic working areas exist through `ki-repo`, and scaffold only this skill's `_TRADES` README files. EDUCATE grants no peer authority and creates no trade record.

### Mode REFRESH

REFRESH writes only this skill's canonical files in `ki-agentic-harness`. When invoked from an installed copy, stop and redirect to the harness. Reconcile the standard, structured catalogue, generated rubric, sources, and GDR-KI-HARNESS-005 when the contract changes; confirm before changing the authority or lifecycle model.

## Notes

- `ki-next` may present an inbound record for exact human-confirmed disposition, but cannot infer a disposition or roadmap transition.
- `ki-change-management-roadmap` supplies read-only structural and review guidance; it does not write trade records or gain cross-repository priority authority.
- The checker reads only registered repository roots and their public `ki-trades` declarations and records. It never scans for repositories or writes a peer checkout.
- The `ki` host owns execution, findings, publication, and post-conform verification; judgment aspects remain explicitly unevaluated until reviewed.
