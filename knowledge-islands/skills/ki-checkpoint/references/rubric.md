<!-- GENERATED FILE: produced by `ki dev skill rubric`. Do not hand-edit; edit scripts/rubric/items/, then rerun `ki dev skill rubric <skill> --write`. -->

# Generated rubric — portable repository checkpoints

> **Generated publication.** The TypeScript rubric items under `scripts/rubric/items/` are canonical. Edit those definitions, then rerun `ki dev skill rubric ki-checkpoint --write`.

Line-by-line criteria for auditing ki-checkpoint. Classifications are derived from item aspects: **[M]** mechanical, **[J]** judgment, **[M + J]** hybrid, and **[M-heuristic + J]** hybrid with heuristic mechanical evidence. Sources are cited as declared by each canonical item.

## Contents

- [RUBRIC — Generated rubric publication](#rubric--generated-rubric-publication)
- [CONFIG — Capability declaration](#config--capability-declaration)
- [STRUCTURE — Checkpoint locations](#structure--checkpoint-locations)
- [RECORD — Checkpoint record](#record--checkpoint-record)
- [LIFECYCLE — Checkpoint lifecycle](#lifecycle--checkpoint-lifecycle)
- [BOUNDARY — Runtime-neutral reconstruction](#boundary--runtime-neutral-reconstruction)

## RUBRIC — Generated rubric publication

→ [standard](../../../keystone/ki-skills/references/standards-rubric-authoring.md)

The tracked readable rubric is the exact publication of the structured catalogue.

- **RUBRIC-1 [M] — structured catalogue publication is exact** — A structured catalogue tracks `references/rubric.md` as its exact generated publication. The host supplies only validated publication evidence: a missing or differing file is a FAIL; during CONFORM this item requests the host-owned derived write without choosing its path or bytes. (../../../keystone/ki-skills/references/standards-rubric-authoring.md#generated-rubric-publication)
  - _Remediation:_ automatic

## CONFIG — Capability declaration

→ [standard](standards-checkpoints.md)

The repository opts into one portable contract without embedding runtime or retention policy.

- **CONFIG-1 [M] — checkpoint declaration has no private options** — The optional `ki-checkpoint` declaration is an empty capability marker. It carries no runtime, session, retention, or lifecycle options; repository policy and optional adapters remain separate owners. (standards-checkpoints.md)
  - _Remediation:_ diagnostic — Remove unsupported declaration options, then rerun the audit.

## STRUCTURE — Checkpoint locations

→ [standard](standards-checkpoints.md)

A retained capability scaffold contains one flat active record set; Git supplies history.

- **STRUCTURE-1 [M] — declared checkpoint scaffold is canonical** — A repository declaring `ki-checkpoint` retains an exact `+/_CHECKPOINTS/README.md` scaffold and permits only flat active Markdown records beside it. Symlinks, unsupported files, retired-record directories, and nested or timestamped layouts are invalid. (standards-checkpoints.md)
  - _Remediation:_ automatic

## RECORD — Checkpoint record

→ [standard](standards-checkpoints.md)

Closed metadata and document shape make one snapshot portable and deterministically readable.

- **RECORD-1 [M-heuristic + J] — record identity is human-selected and consistent** — Each filename stem is a non-empty single path component that is neither `.` nor `..` and does not encode a mechanically recognisable opaque runtime-session identifier. The filename, `thread` field, and H1 repeat the same human-selected thread name. (standards-checkpoints.md)
  - _Remediation:_ guarded — Correct record identity only through an explicit user-selected thread update.
  - _Evidence scope:_ Every checkpoint filename, thread field, and H1.
  - _Review prompt:_ Is each thread name a stable human-selected lookup key rather than a vendor or runtime identifier?
  - _Outcomes:_ conforming; explicit rename required; escalate to user
  - _Conforming guidance:_ Keep the user-selected thread as the lookup key; do not derive or replace it from runtime metadata.
- **RECORD-2 [M + J] — frontmatter and headings use the closed schema** — Active records declare exactly type, thread, state, created_at, and updated_at. Every record uses the exact H1 and ordered Objective, Current state, Decisions made, Files touched, Open questions, and Next step H2 sections, each with substantive content. (standards-checkpoints.md)
  - _Remediation:_ guarded — Correct authored record schema only through an explicit checkpoint update.
  - _Evidence scope:_ The authored frontmatter, headings, and reconstruction sections of every record.
  - _Review prompt:_ Can the schema correction be made without inventing or discarding user-owned reconstruction state?
  - _Outcomes:_ conforming; explicit update required; escalate to user
  - _Conforming guidance:_ Ask the user to update uncertain authored content; the checker must not infer missing checkpoint state.

## LIFECYCLE — Checkpoint lifecycle

→ [standard](standards-checkpoints.md)

Update, resume, and removal preserve one active snapshot without inventing lifecycle state.

- **LIFECYCLE-1 [M + J] — active state, uniqueness, and timestamps agree** — Every checkpoint path carries state active, each thread has at most one active record, and UTC timestamps are chronologically coherent. Removal deletes the active record rather than creating a retired state. (standards-checkpoints.md)
  - _Remediation:_ guarded — Correct lifecycle metadata only through an explicit UPDATE request; use REMOVE to delete a record.
  - _Evidence scope:_ Every active record location, state, and timestamp.
  - _Review prompt:_ Does the proposed lifecycle correction preserve explicit user authority and the single active snapshot rule?
  - _Outcomes:_ conforming; explicit update required; explicit removal required
  - _Conforming guidance:_ Do not change state or timestamps until the user supplies UPDATE direction; REMOVE deletes the record.
- **LIFECYCLE-2 [J] — snapshot content is current and durable facts are promoted** — The active record is a concise current reconstruction snapshot. Decisions, accepted work state, and reusable knowledge already live with their canonical owners; removal follows explicit direction and does not manufacture completion. (standards-checkpoints.md)
  - _Evidence scope:_ Every checkpoint snapshot, its named durable owners, and removal authority.
  - _Review prompt:_ Is each active snapshot current and concise, with durable facts promoted to their canonical owners and any removal grounded in explicit user direction rather than inferred completion?
  - _Outcomes:_ conforming; explicit update required; promote durable fact
  - _Conforming guidance:_ Promote facts through their owning lifecycle and update or remove a checkpoint only with explicit authority.

## BOUNDARY — Runtime-neutral reconstruction

→ [standard](standards-checkpoints.md)

Portable checkpoint content never depends on a transcript, vendor session, or private runtime state.

- **BOUNDARY-1 [M-heuristic + J] — checkpoint contains reconstruction state only** — A checkpoint has no vendor-session field, conversation locator, role-by-role transcript, or mechanically recognisable claim that a fresh agent can reopen the originating session. It is reconstruction state, not session continuity. (standards-checkpoints.md)
  - _Remediation:_ guarded — Remove session-continuity material only through an explicit user-authorised checkpoint update.
  - _Evidence scope:_ Every active checkpoint record and its reconstruction content.
  - _Review prompt:_ Would this checkpoint reconstruct the work for an agent with no transcript or vendor-session access, without implying that the originating conversation can be reopened?
  - _Outcomes:_ conforming; explicit update required; escalate to user
  - _Conforming guidance:_ Do not edit checkpoint content without explicit authority; ask the user when reconstruction content or ownership is uncertain.
