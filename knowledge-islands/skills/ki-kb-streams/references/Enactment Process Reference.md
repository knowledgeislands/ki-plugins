# Enactment Process Reference

Long-form detail on the **Enactment Process** — Knowledge Islands' canonical change process — for the [Knowledge Islands Streams](../SKILL.md) skill. The structure it runs over is in [the Streams structure reference](<Streams Structure Reference.md>). **This skill is the canonical definition of the Enactment Process**; a base's own process note defers here and carries only its local specifics (see the skill's bindings).

## Contents

- [The model](#the-model)
- [Stream weights: full proposals and lightweight streams](#stream-weights-full-proposals-and-lightweight-streams)
- [Proposal documents](#proposal-documents)
- [The cycle](#the-cycle)
- [Rollout](#rollout)
- [Post-change review](#post-change-review)
- [Rejection](#rejection)
- [Discipline](#discipline)

## The model

The Enactment Process is the base's governance _in action_ — not a tool a reviewer uses but _how review operates_. Work moves back and forth between the workspace and the canonical zones until the change is approved or rejected:

```text
Stream  ←→  Enactment Process (approval)
            ↓ approve
        Admin / Pillars / Resources
```

- **Streams** is the working zone — the home of ongoing work, where ideas develop, questions resolve, and the proposal document iterates. Authority to work here is granted by presence.
- **The canonical zones** hold stable, ratified content and are reached only through the gate: **`Admin/`** — the base's own operating model (its processes, conventions, and configuration) — and the knowledge **stores** `Pillars/` and `Resources/`. Nothing lands in a canonical zone except through approval of a proposal that specifies the change — _including a change to the operating model itself_, so the governance passes through its own gate. The approver is the base's governance authority — a council on a multi-agent island, or simply the user on a single-person base.

(`Calendar/` and the inbound `+/` / outbound `-/` staging areas are neither working nor canonical — they hold time-bound or transient material and sit outside the gate; high-churn operational entries belong there or in a lightweight stream, never loose in `Admin/`.)

The process is a **portable pattern**: any island copies it as its governance baseline, localising only as needed — a different zone name, an informal approver for a single-person island, an adjusted status vocabulary, a local process-note name and location (declared to this skill as a binding).

## Stream weights: full proposals and lightweight streams

Not every stream carries the full proposal apparatus. The Enactment Process recognises **two weights**, chosen **per stream** (not per base):

- **Full proposal** — a governed change destined for a canonical zone. It carries the proposal document (the `Proposal` suffix, `status` / `priority` / `dependencies`, Inputs / Outputs / Checklist / Open Questions / Design / Governance) and passes the approval gate. Use it whenever the work will change a canonical zone — `Admin`, `Pillars`, or `Resources`.
- **Lightweight stream** — a tracker for work in motion that is _not (yet) a governed canonical change_: a plain note under a Focus folder, with just enough status to know where it stands. No proposal document, no `Proposal` suffix, no gate. A low-effort "add this to the list" lands here, as does ongoing personal or operational tracking that never touches a canonical zone.

The discipline that matters is **the gate on the canonical zones, not paperwork on every tracker**. A lightweight stream **graduates** to a full proposal the moment it becomes a change to canonical content — at which point it takes the suffix, the proposal document, and the gate. So a base is never "opted out" of the process wholesale; rather, each stream is as heavy as the change it carries. (The checker reflects this: it asks for the suffix and the proposal frontmatter only of streams that declare themselves proposals — `type: stream-proposal` or a lifecycle `status` — and requires the `CLAUDE.md` gate anchor only once the base actually runs proposals.)

## Proposal documents

The proposal document (the stream note) is the physical carrier of a change. Frontmatter:

```yaml
status: draft # see the status lifecycle
priority: medium # urgent | high | medium | low
dependencies: [] # filenames of prerequisite proposals
```

`dependencies` is the machine-readable form of the `Prerequisite` rows in Inputs and must stay in sync with them; it is the gate checked before a change moves to `ready`. Sections:

- **Inputs** — what the change draws on, each row tagged `Document` (a source file, brief, or reference), `Decision` (a prior agreement that shapes this change), or `Prerequisite` (another proposal that must reach `rolled-out` first). Fill in what is known at opening; update as more are identified.
- **Outputs** — what the change produces: `Decision` (a conclusion reached) or `Artefact` (a note or asset created/modified). Complete and accurate before `ready`.
- **Checklist** — the concrete operations rollout will perform (creates, edits, moves, deletes). Doubles as rollout status — items are ticked as executed.
- **Open Questions** — unresolved decisions; close each with a resolution note before `ready`.
- **Design Sections** — the substance: analysis, diagrams, draft content, comparative tables. May be extensive — that is expected and correct.
- **Governance** — a short footer declaring adherence to the process and linking back to the bound process note. **Required on every stream note**; it makes the governing model discoverable from the stream and confirms the stream is a participant in the formal cycle.

### Status lifecycle

| Status        | Meaning                                                                    |
| ------------- | -------------------------------------------------------------------------- |
| `draft`       | Work in progress; iterating in the proposal document                       |
| `ready`       | Stable; no open questions; prerequisites satisfied; submitted for approval |
| `rejected`    | Rejected; reasons recorded; terminal (may reopen as a new `draft`)         |
| `in-progress` | Approved; rollout underway                                                 |
| `rolled-out`  | Checklist executed; stream moves to `Settled/`; post-change review pending |
| `reviewed`    | Post-change review complete                                                |
| `completed`   | Proven in practice; the proposal document is deleted                       |

Order: `draft` → `ready` → (`in-progress` | `rejected`) → `rolled-out` → `reviewed` → `completed`. A `rejected` proposal may reopen as a new `draft`; the prior rejection stays on record. **Priority** (`urgent` / `high` / `medium` / `low`) is set at creation and may rise as context shifts — update the proposal frontmatter and the focus index when it does.

## The cycle

1. **Emerge** — a change is conceived; create the stream folder and proposal note under the appropriate Focus (and Category), add a row to the focus index and the proposals index. (Propose the name and path and wait for confirmation first.)
2. **Mature** — iterate the proposal in place: develop the Design Sections, resolve Open Questions with resolution notes, track prerequisites, keep Inputs / Outputs / Checklist current.
3. **Submit** — when stable (no open questions) and every prerequisite is at `rolled-out` or beyond, set `status: ready` and submit. Approve → `in-progress`; return to draft → continue; reject → `rejected`, reasons documented, the stream settles.
4. **Roll out** — execute the Checklist; outputs land in the stores. Set `status: rolled-out`; move the stream to `Settled/`.
5. **Review** — run the post-change review → `reviewed`.
6. **Complete** — once proven in practice → `completed`; delete the proposal document. The settled marker remains, pointing to where the knowledge now lives.

## Rollout

Rollout means executing the operations from the Checklist. **Do not begin without explicit user authorisation** — `ready` is a necessary condition, not a sufficient one; exploratory language ("let's look at this", "let's work through it") is iteration, not approval. It is not complete until:

- every create / update / delete in the proposal has been executed;
- index notes for any new folders have been created;
- existing notes that reference moved or renamed content have been updated;
- the proposal document itself has been deleted (on completion).

### Working-area previews

The proposal document lives in the version-controlled text store, in `Streams/`. The agent's working area is for **previews only** — temporary staging files, never committed; each base's configuration says where it is. For complex or destructive rollout steps (large reorganisations, mass renames, multi-file extractions), stage the intended output as a preview file in the working area before applying changes. This creates a review checkpoint — the user can inspect the output before it lands — and a concrete artefact for the post-change review: intended vs. executed.

### Git interaction

Perform no state-changing git commands without explicit per-command instruction: use file tools (write, edit, delete), not `git mv` / `git rm`. After rollout, `git add` / `commit` is left to the user.

### Re-verification

Plans drift between drafting and execution. **Re-verify each Checklist item against the live file** at the moment of execution — the live file is authoritative.

## Post-change review

Run after rollout, before `reviewed`:

1. The agent prepares an initial review summary — what went well, issues encountered, lessons observed — as a _starting point_.
2. The review is an interactive conversation; the summary is input, not output — the user challenges, corrects, and adds to it.
3. Outputs may include revisions to the summary, immediate edits to the proposal, and new proposals or process improvements triggered by lessons learned.

Record the final review under a `## Post-Change Review` section in the proposal, or in the process note if the lesson is structural.

## Rejection

A rejection is a **first-class outcome, not a failure**. The reasons are documented in the proposal; the stream settles with `status: rejected`. A rejected proposal may reopen as a new `draft` if circumstances change; the prior rejection and its reasons remain on record.

## Discipline

The rules that keep the workspace trustworthy:

- **Streams move.** A stream in `Active/` without progress belongs in `Background/` or `Dormant/`; be honest about attention.
- **Knowledge migrates out.** Substantive subject-matter content in a stream is leaking knowledge that should live in a store — extract it early and link back.
- **Settled means settled.** A settled stream is a record, not a workspace; if work resumes, move it back to `Active/`.
- **Keep the proposal and indexes current.** Update immediately on a decision, status, or priority change; reload before resuming.
- **No `ready` while a prerequisite is below `rolled-out`; no rollout without explicit authorisation.**
- **Re-verify each rollout item against the live file.**
- **Delete the proposal on completion.** The test: would deleting it today lose knowledge? If not, delete it — the settled marker remains.
- **When in doubt, prefer a proposal.** The cost of a lightweight proposal is low; the cost of an unauthorised change to canonical content is high.
- **Lightweight streams.** A low-effort request ("add this to the list") is handled as a lightweight stream and bypasses the full name-confirmation gate; reserve the gate for substantive new streams, sub-proposal splits, and renames.
