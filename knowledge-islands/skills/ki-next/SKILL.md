---
name: ki-next
ki-kind: process
ki-applicability: invocation-only
ki-depends-on: []
description: >
  Capture substantive prospective work into unadopted Triage, or select, adopt, promote, and defer work in the
  shared queue. Use when new work emerges or deciding what comes next; use `ki-plan` for readiness and
  `ki-trades` for trade transport.
argument-hint: 'next [--review] | defer <item> <horizon> | help'
---

# ki-next

**Kind:** process.

Selects and prepares forward work through the configured local adapter's canonical record. GitHub Issues and Linear remain configuration and safety guidance only, so this process stops without writes when either is selected.

The full procedure is in [the next-work standard](references/standards-next-work.md).

Substantive prospective work is captured without approval only after deduplication and only into `triage` with `status: draft`. Adoption into another horizon requires explicit human approval. Rejected, duplicate, or merged intake requires exact human approval and routes to `ki-accept` for retained `done` closure before any later prune; capture never grants delivery authority.

## What this skill does

1. **Ground** the configured local adapter's canonical records and issue ledger, active `ki-work-housekeeping` templates, and inbound records validated by declared `ki-trades` governance.
2. **Triage** incoming submissions through an exact human-confirmed receiver disposition, including the proportionate direct-application gate for a work trade, without treating adoption as roadmap authority.
3. **Review and capture** relevance: capture substantive, non-duplicate prospective work into Triage automatically; require confirmation to change adopted work.
4. **Screen for synergy** across dependency-ready candidates: propose a batch only when the items share a bounded delivery advantage and remain independently executable. A shared theme alone is not enough.
5. **Select or spawn** one dependency-ready immediate record, or a small, explicitly confirmed synergistic group to plan independently before it can become a `ki-batch` candidate.
6. **Defer** an explicitly named record only after presenting its exact destination horizon, wording, and affected lifecycle state.
7. **Hand off for planning** selected Now or Next drafts to `ki-plan`; its adapter creates the right in-place execution detail.
8. **Maintain temporary batches** through the batch-owned retention rule, and recommend eligible roadmap cleanup without deleting roadmap records.

`ki-next` owns intake review and adoption. It does not close rejected, duplicate, or merged Triage records; after exact human confirmation it hands that disposition to `ki-accept`.

## Relationship map

```text
ki-recap (optional current-session context)
  └─> ki-next (capture, adoption, selection, promotion, and deferral)
        ├─> ki-accept (human-approved terminal Triage disposition)
        └─> ki-plan (shape each selected repository item through Ready)
              ├─> ki-implement (one Ready item through Awaiting review)
              │     └─> ki-accept (Awaiting review through Done)
              └─> ki-batch (confirmed independent, synergistic Ready set)
                    └─> one fresh-grounded authorised cycle
                          └─> ki-implement (each named Ready item through Awaiting review)

The base selector governs adapter choice; `ki-work-roadmap` governs the local record model and `ki-repo-kb-streams` its KB Streams container.
```

`ki-recap` is optional.

`ki-next` works without it and never mines historical transcripts.

When a recap precedes it, `ki-next` begins only after its bounded handoff is complete. It re-grounds repository facts rather than trusting carry-forward context as current state. Runtime context management remains outside this process contract.

`ki-batch` prepares and coordinates an explicitly authorised independent Ready set. It does not change `ki-next` ownership of selection, priority, or an individual item's lifecycle.

`ki-batch` runs one bounded cycle from that approved authority. It asks known questions before delivery and retains the same selection, readiness, acceptance, pruning, push, release, and repository-boundary stops.

`ki-trade` prepares, submits, receives, releases, and prunes local trade records. It hands a validated received record to `ki-next`; it never chooses the receiver's disposition.

The process skills are global invocation surfaces, not `.ki.toml` governance roots.

## Invocation

`help` / `-h` / `?` explains this skill and stops, taking no action.

With no argument or `next`, run the full procedure.

`--review` asks for the optional relevance pass before selection; it does not grant permission to change roadmap or Streams content.

`defer <item> <horizon>` identifies an exact proposed deferral; it still requires confirmation unless the governing promotion rule declares the move automatic.

## Notes

- This is a process skill, not a universal AUDIT / CONFORM / EDUCATE / REFRESH checker.
- A housekeeping template may create a due run only under its declared spawning policy. Bounded Triage capture is automatic; adoption, selection, and every other queue transition follow the applicable confirmed rule.
- `ki-next` does not start or authorise a batch from similarity alone. A confirmed candidate group proceeds only to `ki-batch`; implementation still requires that skill's reviewed authorisation.
- Resolve `[skills.ki-work].adapter` and require its matching declared owner table before reading any local root. The base audit remains the authority for semantic selection validation; this process makes no shape fallback. `roadmap` uses `docs/roadmap/`; `kb-streams` uses `Streams/Roadmap/`; `github-issues` and `linear` stop without writes until their remote execution is separately implemented.
- `ki-next` may recommend `status: done` records for pruning, but it never deletes them. `ki-accept` owns explicit path or glob selection; `ki repo roadmap prune` is the separate deterministic selected-repository sweep.
- Installed as a core user skill by `ki bootstrap`; it is not a repository-governance root.
