---
name: ki-next
ki-kind: process
ki-depends-on: []
description: >
  Selects, captures, promotes, defers, and spawns the next work through one shared queue: now, next, soon, future, waiting-for, and parked. It also records the receiver's confirmed disposition of validated inbound trades, including direct application of a trivial local work change versus a separately prioritised work record. Use when asked "what should we do next", "review these inbound trades", "apply this trade directly", "promote this work", or "defer this". It applies the transition rules owned by ki-change-management-roadmap and the ki-repo-kb-streams adapter; local trade transport belongs to ki-repo-trade.
argument-hint: 'next [--review] | defer <item> <horizon-or-focus> | help'
---

# ki-next

**Kind:** process.

Selects and prepares forward work through the shared queue and either adapter's canonical record.

The full procedure is in [the next-work standard](references/standards-next-work.md).

## What this skill does

1. **Ground** the generated repository roadmap index and canonical work items, or Streams Focus and proposal index, plus active `ki-change-management-housekeeping` templates and any inbound records validated by declared `ki-repo-trades` governance.
2. **Triage** incoming submissions through an exact human-confirmed receiver disposition, including the proportionate direct-application gate for a work trade, without treating adoption as roadmap authority.
3. **Review** relevance when asked or when a material stale signal is evident.
4. **Screen for synergy** across dependency-ready candidates: propose a batch only when the items share a bounded delivery advantage and remain independently executable. A shared theme alone is not enough.
5. **Select or spawn** one dependency-ready immediate record, or a small, explicitly confirmed synergistic group to plan independently before it can become a `ki-batch` candidate.
6. **Defer** an explicitly named record only after presenting its exact destination horizon, wording, and affected lifecycle state.
7. **Hand off for planning** selected Now or Next drafts to `ki-plan`; its adapter creates the right in-place execution detail.
8. **Recommend cleanup** when done records are eligible for explicit pruning, without deleting them.

## Relationship map

```text
ki-recap (optional current-session context)
  └─> ki-next (selection, promotion, and deferral)
        └─> ki-plan (shape each selected repository item through Ready)
              ├─> ki-implement (one Ready item through Awaiting review)
              │     └─> ki-accept (Awaiting review through Done)
              └─> ki-batch (confirmed independent, synergistic Ready set)
                    └─> ki-agenda (one fresh-grounded cycle under an approved authorisation)
                          └─> ki-implement (each named Ready item through Awaiting review)

ki-change-management-roadmap governs the shared forward-work contract and the non-KB adapter.
ki-repo-kb-streams governs the KB Streams adapter and Enactment gate.
```

`ki-recap` is optional.

`ki-next` works without it and never mines historical transcripts.

When a recap precedes it, `ki-next` begins only after that recap has preserved its bounded handoff and reached its compaction boundary. It then re-grounds the repository rather than trusting the carry-forward digest as current state.

Selection is itself a compaction boundary. Once the selected work and its confirmed disposition are recorded, `ki-next` compacts by default so the following plan or implementation cycle starts on a clean slate carrying the selected item and nothing else. The same two conditions withhold it as in `ki-recap`: an unsafe boundary, or no substantive work entering context since the last compaction — a recap running straight into `ki-next` compacts once here, not twice.

`ki-batch` prepares and coordinates an explicitly authorised independent Ready set. It does not change `ki-next` ownership of selection, priority, or an individual item's lifecycle.

`ki-agenda` may run one bounded cycle from that approved batch authority. It asks known questions before delivery and retains the same selection, readiness, acceptance, pruning, push, release, and repository-boundary stops.

`ki-repo-trade` prepares, submits, receives, releases, and prunes local trade records. It hands a validated received record to `ki-next`; it never chooses the receiver's disposition.

The process skills are global invocation surfaces, not `.ki-config.toml` governance roots.

## Invocation

`help` / `-h` / `?` explains this skill and stops, taking no action.

With no argument or `next`, run the full procedure.

`--review` asks for the optional relevance pass before selection; it does not grant permission to change roadmap or Streams content.

`defer <item> <horizon>` identifies an exact proposed deferral; it still requires confirmation unless the governing promotion rule declares the move automatic.

## Notes

- This is a process skill, not a universal AUDIT / CONFORM / EDUCATE / REFRESH checker.
- A housekeeping template may create a due run only under its declared spawning policy; every other capture, selection, and queue transition follows the applicable confirmed promotion rule.
- `ki-next` does not start or authorise a batch from similarity alone. A confirmed candidate group proceeds only to `ki-batch`; implementation still requires that skill's reviewed authorisation.
- `ki-change-management-roadmap` owns the common transition rules; `ki-repo-kb-streams` supplies the KB adapter; `ki-next` applies them consistently.
- `ki-next` may recommend `status: done` records for pruning, but it never deletes them. `ki-accept` owns explicit path or glob selection; `ki repo roadmap prune` is the separate deterministic selected-repository sweep.
- Installed as a core user skill by `ki bootstrap`; it is not a repository-governance root.
