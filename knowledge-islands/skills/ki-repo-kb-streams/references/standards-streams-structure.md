# Streams structure standard

This standard defines how the `Streams` zone is laid out for the [Knowledge Islands Streams](../SKILL.md) skill. The process that runs over this structure is defined by the [Enactment Process standard](standards-enactment-process.md).

## Contents

- [The zone](#the-zone)
- [Path: Focus and Category](#path-focus-and-category)
- [Leaf, parent, and multi-proposal layout](#leaf-parent-and-multi-proposal-layout)
- [The Proposal suffix](#the-proposal-suffix)
- [Proposal codes](#proposal-codes)
- [Note types and frontmatter](#note-types-and-frontmatter)
- [Index notes](#index-notes)
- [What lives in a stream note](#what-lives-in-a-stream-note)
- [Completed streams](#done-streams)
- [Provenance and inbound links](#provenance-and-inbound-links)

## The zone

`Streams/` carries knowledge **in motion**: active projects, evolving ideas, ongoing work. Its content is _not_ canonical — durable knowledge lives in `Pillars/` (internal; a base that holds it under a legacy folder name resolves it via the `ki-repo-kb` zone alias) or `Resources/` (external). The lifecycle of a stream is: emerge → mature through work → stabilise into a store → the stream is retired. A stream is a **status tracker and proposal document**, never a knowledge store; a stream note that accumulates deep subject-matter content is a signal that the content needs to move out.

The defining contrast across the in-motion vs. settled zones:

- `Pillars/` / `Resources/` hold durable knowledge — what is _known_.
- `Streams/` holds working knowledge — what is _in progress_.
- `Calendar/` holds time-bound records — what _happened_ on a date.

## Path: Focus and Category

Every stream sits at `Streams/$Focus/$Category?/$Name…`.

**Focus** is mandatory and expresses the level of attention the stream is currently receiving. Moving a stream between Focus folders is an explicit act — it signals a shift in what the project is paying attention to.

| Focus          | Meaning                                           |
| -------------- | ------------------------------------------------- |
| `Now`          | Receiving current delivery attention              |
| `Next`         | The next bounded work to prepare or begin         |
| `Soon`         | Understood work, but not current                  |
| `Waiting for`  | Blocked by a named dependency or condition        |
| `Parked`       | Intentionally paused with a return trigger        |
| `Future`       | Planned or ideated; not yet started               |
| `Housekeeping` | Recurring-work templates that may spawn a due run |

Focus describes **attention**, not maturity: a `draft` proposal may sit in `Now/` or `Future/`. Be honest about attention — a stream in `Now/` without movement belongs in `Soon/`, `Waiting for/`, or `Parked/`.

A stream in `Waiting for/` names the dependency or external condition that prevents progress. It moves to `Now/` when it becomes the current focus, or to `Soon/` when it is unblocked but not yet immediate. `Parked/` is different: it is intentionally paused, not merely waiting on another party.

**Category** is optional grouping within a Focus, for navigability. Pick one pattern per Focus and stick to it:

- **No category** — flat; best for a base with few concurrent streams.
- **Destination path** — the category mirrors the stream's destination in the store (e.g. `Now/Knowledge Islands/`); scales at volume and echoes where the knowledge is heading.
- **Status sub-grouping** — the category expresses status; useful when many streams sit at similar levels across one domain.

The guiding principle is easy navigation: too much depth is as unhelpful as too much breadth at one level.

## Leaf, parent, and multi-proposal layout

A stream is either a **leaf** (the proposal is its only note) or a **parent** (it has child notes or sub-folders). The two take different folder layouts so the repo-wide folder-index rule (every folder has a same-name index note) is satisfied without a redundant index:

```text
Leaf:    Streams/<Focus>/<Category?>/<Name> Proposal/<Name> Proposal.md   # the note is both folder index and proposal
Parent:  Streams/<Focus>/<Category?>/<Name>/<Name> Proposal.md            # + slim <Name>.md index + child notes/sub-folders
Multi:   Streams/<Focus>/<Category?>/<Name>/<ProposalName>/<ProposalName> Proposal.md
```

- In a **leaf** stream the folder carries the `Proposal` suffix and holds a single same-named note; there is no separate index — a leaf has nothing to index but itself.
- In a **parent** stream the folder is the bare topic; a slim same-named index note (`stream-index`) resolves the folder link, and the proposal is one child among the rest.
- Use the **multi-proposal** layout only when a single stream genuinely encompasses several proposals each with its own approval cycle; the parent note then becomes a coordinating index over its child proposals. Most streams do not need this.

**Leaf ↔ parent transition.** When a leaf gains its first child, demote it: rename the folder `<Name> Proposal/` → `<Name>/`, keep the proposal note as `<Name> Proposal.md` (now a child), and add a slim `<Name>.md` index. When a parent loses all its children, promote it back to the leaf form. The proposal note's filename and link (`<Name> Proposal`) are **stable across the transition** — only the folder name and the presence of the slim index change.

A **convention rollout** (sweeping the base to apply a newly-introduced rule) is best bundled into a single consolidated stream so inventory, sweep, and verification run in one coordinated pass; each rollout is an independently approvable workstream inside it, lifted into its own `<Name> Proposal` sub-folder only when its checklist diverges enough to justify a separate approval document. A stream that runs as **repeating cycles** accumulates per-cycle artefacts under `Pass N/` sub-folders (each with a slim `Pass N.md` index), and the proposal records each cycle's closure inline under a `## Pass N closure` heading so it stays the single navigable record of the stream's history.

## The Proposal suffix

The proposal note's name **always** ends with a space and the word `Proposal` — e.g. `Form E Proposal` — on its filename, its `# H1`, and its `title:` frontmatter (and, in a leaf stream, on the folder too). The name itself (the part before the `Proposal` suffix) follows the base's naming conventions: Title Case, a scope-tight noun phrase, no dates, no case codes, no attention-level baked in (the Focus folder already carries attention).

Why the suffix: it marks every stream as a proposal under the Enactment Process at a glance, lets the proposal double as the leaf folder's index, and **preemptively disambiguates** the note from same-named artefacts elsewhere in the base (a policy, a settled record, a store note on the same topic) — so the link to it is collision-safe regardless of what the stream eventually produces. The checker keys on the suffix to find proposals. Before creating or renaming a proposal, **propose the name and resulting path and wait for user confirmation** — renames ripple through links.

## Proposal codes

Every full `stream-proposal` declares a scalar `code` in closed frontmatter. It is the proposal's concise, durable identity for display and reference; it is not a human-readable title substitute and is never inferred from a title, path, Focus, or serial position in a folder.

The value must match `^[A-Z][A-Z0-9]*(?:-[A-Z][A-Z0-9]*)*-[0-9]{3,}$`. Its prefix therefore begins with an uppercase letter and may contain uppercase alphanumeric segments separated by hyphens; its final segment is a positive decimal serial, rendered with at least three digits. `KBS-001` conforms. `KBS-000`, lowercase values, values without a final serial, and values that derive from a title or path do not.

Codes are allocated explicitly when a full proposal is opened. A code is unique across the whole Knowledge Base, not merely within a Focus, category, folder, or parent stream. Once assigned, it remains unchanged for the proposal's retained lifetime: moving Focus, renaming a title or path, changing lifecycle status, or converting between leaf and parent layouts does not change it. A base must not intentionally reuse a code after closure or pruning. The mechanical check can establish uniqueness only among retained proposals; preserving non-reuse after pruning is an allocation responsibility of the base owner.

### Adopting codes in an existing base

This is a clean-cut manual migration, not an automatic allocation feature:

1. Inventory every retained full proposal across the base, including every Focus and child proposal.
2. Have the base owner approve an explicit, base-wide code map. Resolve duplicates and invalid legacy labels in that map before editing notes; do not derive or renumber codes from paths or titles.
3. Apply the approved map through receiver-owned Knowledge-Base work and update the affected proposal frontmatter only. Do not add `code` to lightweight streams or index notes.
4. Re-audit the base for requiredness, grammar, and uniqueness before normal proposal operation resumes.

The harness defines the contract and diagnoses gaps; it neither allocates a code nor edits a live base as part of CONFORM.

## Note types and frontmatter

The zone uses the machine-readable `type:` key (the canonical scheme; see the skill's bindings) to mark each note's role:

| `type` | Where | Purpose |
| --- | --- | --- |
| `stream-zone` | `Streams/Streams.md` | Zone root index; carries the cross-Focus proposals index |
| `stream-focus` | `Streams/<Focus>/<Focus>.md` | Focus dashboard; carries prose + the status/priority table |
| `stream-index` | `Streams/<Focus>/<Name>/<Name>.md` ※ | Slim index for a **parent** stream folder; not used for leaf streams |
| `stream-proposal` | The `<Name> Proposal.md` note (leaf or parent) | The proposal and status tracker; in a leaf, also the folder index |
| `stream-note` | `Streams/<Focus>/<Name>/<Sub>/<Sub>.md` | A sub-proposal or working note within a stream |

※ And `Pass N/` sub-folders.

**Frontmatter applies by type.** Every `stream-proposal` carries its `code` identity. Both `stream-proposal` and `stream-note` notes carry the lifecycle fields `status`, `priority`, and `dependencies` (plus the base's descriptive keys such as `title`/`description`, and any local scoping keys), but `stream-note` does not carry a proposal code. `stream-zone` and `stream-focus` index notes carry `type` and the common keys only — **not** `code`/`status`/`priority`/`dependencies`. The checker enforces proposal fields on `<Name> Proposal.md` notes, so it does not wrongly demand them of index notes.

**Full proposals vs lightweight streams.** A stream comes in [two weights](standards-enactment-process.md): a **full proposal** (a `stream-proposal` with the `Proposal` suffix and the apparatus) or a **lightweight stream** (a plain tracker note — no suffix, no proposal frontmatter — for work that isn't a governed canonical change). The suffix and `STREAM-3` apply only to full proposals; a lightweight stream is just a note under a Focus folder.

## Index notes

Every Focus folder carries an **index note same-named as the folder** (`Now/Now.md`, …, `type: stream-focus`). Its `## Streams` section is a table:

| Column   | Content                                                                       |
| -------- | ----------------------------------------------------------------------------- |
| Topic    | A bare-basename link to the stream note (e.g. an `Admin Audit Proposal` link) |
| Status   | The proposal's lifecycle position (`draft` … `done`)                          |
| Priority | `urgent` / `high` / `medium` / `low`                                          |

**Ordering.** In `Now/`, `Next/`, `Soon/`, `Waiting for/`, `Parked/`, and `Future/`: `in-progress` → `ready` → `draft`, then by priority within each group. `Housekeeping/` lists active templates by next due date. Group by category before sorting where categories are in use.

The `Streams/` zone index note (`type: stream-zone`) also carries a cross-Focus **proposals index** — a live triage view of every proposal by Topic / Focus / Status / Priority. It has no value if it lags: update it on creation, status change, and priority change. (Note-content links inside a base use Obsidian `[[wikilinks]]` per the `ki-repo-kb` convention; this skill's own files use relative markdown links.)

## What lives in a stream note

A stream note is a proposal document and status tracker. Inside the [proposal anatomy](standards-enactment-process.md) frame it holds: current status, progress updates, decisions made within the stream, next steps, blockers, and links out to the canonical zones. What does **not** belong: durable analysis, drafting work product, reusable methodology (→ `Pillars/`); external reference material (→ `Resources/`); a settled change to the base's operating model — a process, convention, or configuration (→ `Admin/`); time-bound records (→ `Calendar/`). When a stream produces lasting insight, extract it to its canonical zone and link back.

## Done streams

Streams hold working material and retained completion evidence. After rollout, keep the proposal in the Focus that honestly reflects any remaining review or validation attention. Once it is `done`, retain the reviewed proposal until an explicit `ki-accept prune` selection removes it.

Durable outcomes belong in `Admin/`, `Pillars/`, `Resources/`, or a Decision Record. There is no `Settled/` Focus.

## Provenance and inbound links

Streams are working records: durable notes should link to their durable output rather than treating a Stream as the only source of truth.

- **Durable notes prefer durable provenance.** A note in a canonical zone (`Pillars` / `Resources` / `Admin`) should record provenance as plain prose or link to the durable artefact the stream produced; a proposal link is supplementary review evidence, not the only record.
- **Stream-to-stream links remain current.** A pruned proposal's inbound links must be fixed or dropped as part of pruning.

This is the inbound complement to [Done streams](#done-streams): pruning is deliberate, so durable notes should not depend on a proposal link surviving forever.
