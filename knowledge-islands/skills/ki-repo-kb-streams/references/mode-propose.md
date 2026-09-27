# Mode PROPOSE — route new KB work

_On-demand procedure for Streams PROPOSE. The shared model lives in [`SKILL.md`](../SKILL.md) and is already loaded; this file is the procedure only._

1. Classify the request: substantive prospective forward work belongs in `Streams/Roadmap/`; a recurring obligation belongs in `Streams/Housekeeping/`; a trade is out of scope until a KB trade placement is explicitly adopted.
2. For roadmap work, use `ki-work-roadmap` to reload the flat records and `Streams/Roadmap/_ISSUES.md`, then deduplicate against the canonical queue. If an existing record covers the same outcome, report that record and do not allocate another identity.
3. Otherwise select the configured issuing area and allocate its next serial from `_ISSUES.md`. Commit that ledger advance on its own, in the base's designated roadmap writing checkout, before the record exists; the [roadmap standard](../../../change-management/ki-work-roadmap/references/standards-repository-roadmaps.md#number-reservation) owns the ordering. Then create the flat roadmap item as `status: draft` and `horizon: triage`. Report its title, path, and ID after capture; capture itself does not adopt or prioritise the work.
4. Require explicit human approval before moving a record out of triage, renaming it, rejecting it, or merging it into another record. Apply an approved adoption through `ki-next`. Route an approved rejected, duplicate, or merged disposition to `ki-accept`, which records Triage as `done` before any later prune. Never delete intake directly or infer approval from silence or surrounding discussion.
5. For a recurring obligation, use `ki-work-housekeeping` to create or revise the template. Do not create a second generic Streams record or a Focus index.
