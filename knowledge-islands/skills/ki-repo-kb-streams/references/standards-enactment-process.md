# KB change-management routing standard

This standard records how a Knowledge Base uses shared change-management capabilities after adopting the Streams operational container. It replaces the former self-contained Enactment proposal process.

## Routing

| Need | KB location | Owner |
| --- | --- | --- |
| Finite forward work | `Streams/Roadmap/` | `ki-change-management-roadmap` plus `ki-next`, `ki-plan`, `ki-implement`, and `ki-accept` |
| Recurring obligation | `Streams/Housekeeping/` | `ki-change-management-housekeeping` |
| Cross-repository trade | Generic `+` / `-` working areas until a KB trade placement is adopted | `ki-trades` |

The roadmap record carries the shared `draft` → `ready` → `in-progress` → `awaiting-review` → `done` lifecycle. Its horizon is metadata, not a folder. A housekeeping template is a source of due runs, not a delivery-state record.

## Canonical change gate

Substantive changes to `Admin/`, `Pillars/`, or `Resources/` require explicitly approved forward work. The base’s always-loaded instruction routes a change to the appropriate adapter and does not create a parallel generic Streams proposal.

## Base-owned migration

The receiving Knowledge Base chooses its repository code, roadmap issuing areas, serial high-water marks, retained identifier map, and any topical metadata. It classifies each retained legacy stream before moving it. The shared Harness neither derives a new identity from a former Focus path nor infers historic topical membership.
