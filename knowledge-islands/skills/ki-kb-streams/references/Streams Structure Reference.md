# Streams Structure Reference

Long-form detail on how the `Streams` zone is laid out, for the [Knowledge Islands Streams](../SKILL.md) skill. Loaded on demand so the `SKILL.md` body stays lean. The process that runs over this structure is in [the Enactment Process reference](<Enactment Process Reference.md>).

## Contents

- [The zone](#the-zone)
- [Path: Focus and Category](#path-focus-and-category)
- [Leaf, parent, and multi-proposal layout](#leaf-parent-and-multi-proposal-layout)
- [The Proposal suffix](#the-proposal-suffix)
- [Note types and frontmatter](#note-types-and-frontmatter)
- [Index notes](#index-notes)
- [What lives in a stream note](#what-lives-in-a-stream-note)
- [Settled streams](#settled-streams)
- [Provenance and inbound links](#provenance-and-inbound-links)

## The zone

`Streams/` carries knowledge **in motion**: active projects, evolving ideas, ongoing work. Its content is _not_ canonical — durable knowledge lives in `Pillars/` (internal; a base that holds it under a legacy folder name resolves it via the `ki-kb-base` zone alias) or `Resources/` (external). The lifecycle of a stream is: emerge → mature through work → stabilise into a store → the stream is retired. A stream is a **status tracker and proposal document**, never a knowledge store; a stream note that accumulates deep subject-matter content is a signal that the content needs to move out.

The defining contrast across the in-motion vs. settled zones:

- `Pillars/` / `Resources/` hold durable knowledge — what is _known_.
- `Streams/` holds working knowledge — what is _in progress_.
- `Calendar/` holds time-bound records — what _happened_ on a date.

## Path: Focus and Category

Every stream sits at `Streams/$Focus/$Category?/$Name…`.

**Focus** is mandatory and expresses the level of attention the stream is currently receiving. Moving a stream between Focus folders is an explicit act — it signals a shift in what the project is paying attention to.

| Focus        | Meaning                             |
| ------------ | ----------------------------------- |
| `Active`     | Receiving focused attention now     |
| `Background` | Being progressed in the background  |
| `Dormant`    | Paused with intention to return     |
| `Future`     | Planned or ideated; not yet started |
| `Settled`    | Concluded                           |

Focus describes **attention**, not maturity: a `draft` proposal may sit in `Active/` or `Future/`. Be honest about attention — a stream in `Active/` without movement belongs in `Background/` or `Dormant/`.

**Category** is optional grouping within a Focus, for navigability. Pick one pattern per Focus and stick to it:

- **No category** — flat; best for a base with few concurrent streams.
- **Destination path** — the category mirrors the stream's destination in the store (e.g. `Active/Knowledge Islands/`); scales at volume and echoes where the knowledge is heading.
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

**Frontmatter applies by type.** Only `stream-proposal` and `stream-note` notes carry the lifecycle fields `status`, `priority`, and `dependencies` (plus the base's descriptive keys such as `title`/`description`, and any local scoping keys). `stream-zone` and `stream-focus` index notes carry `type` and the common keys only — **not** `status`/`priority`/`dependencies`. The checker enforces the lifecycle fields on `<Name> Proposal.md` notes, so it does not wrongly demand them of index notes.

**Full proposals vs lightweight streams.** A stream comes in [two weights](<Enactment Process Reference.md>): a **full proposal** (a `stream-proposal` with the `Proposal` suffix and the apparatus) or a **lightweight stream** (a plain tracker note — no suffix, no proposal frontmatter — for work that isn't a governed canonical change). The suffix and `STREAM-3` apply only to full proposals; a lightweight stream is just a note under a Focus folder.

## Index notes

Every Focus folder carries an **index note same-named as the folder** (`Active/Active.md`, …, `type: stream-focus`). Its `## Streams` section is a table:

| Column   | Content                                                                       |
| -------- | ----------------------------------------------------------------------------- |
| Topic    | A bare-basename link to the stream note (e.g. an `Admin Audit Proposal` link) |
| Status   | The proposal's lifecycle position (`draft` … `completed` / `rejected`)        |
| Priority | `urgent` / `high` / `medium` / `low`                                          |

**Ordering.** In `Active/`, `Background/`, `Dormant/`, `Future/`: `in-progress` → `ready` → `draft`, then by priority within each group. In `Settled/`: `rolled-out` → `reviewed` → `completed` → `rejected`. Group by category before sorting where categories are in use.

The `Streams/` zone index note (`type: stream-zone`) also carries a cross-Focus **proposals index** — a live triage view of every proposal by Topic / Focus / Status / Priority. It has no value if it lags: update it on creation, status change, and priority change. (Note-content links inside a base use Obsidian `[[wikilinks]]` per the `ki-kb-base` convention; this skill's own files use relative markdown links.)

## What lives in a stream note

A stream note is a proposal document and status tracker. Inside the [proposal anatomy](<Enactment Process Reference.md>) frame it holds: current status, progress updates, decisions made within the stream, next steps, blockers, and links out to the canonical zones. What does **not** belong: durable analysis, drafting work product, reusable methodology (→ `Pillars/`); external reference material (→ `Resources/`); a settled change to the base's operating model — a process, convention, or configuration (→ `Admin/`); time-bound records (→ `Calendar/`). When a stream produces lasting insight, extract it to its canonical zone and link back.

## Settled streams

A `Settled` stream is the **record of a decision at the point of settlement**, not a living document. Once its durable content has migrated to a store, its substantive value lives there; the settled note is a marker pointing to where the knowledge now lives.

- **Settled streams are not maintained.** Links inside a settled proposal may go stale as the store files they reference are renamed or absorbed — that is expected and acceptable. Audits and cascade-fix sweeps leave settled-stream links alone.
- **They may be deleted once they have outlived their reference value** — when the decision is uncontentious in the resulting structure, its findings are fully absorbed into canonical notes, and no active work reaches back to it. Git history retains the full record. There is no `retain_until` clock on a settled stream; it expires when reference value drops.

## Provenance and inbound links

Streams are **ephemeral**: a stream is deleted once its durable output has migrated, so nothing durable may depend on a link _into_ one.

- **Durable notes never cite a stream as provenance.** A note in a canonical zone (`Pillars` / `Resources` / `Admin`) — including the conventions, templates, and policies within them — must not link to a stream to record where something came from: the link breaks the moment the stream retires. Record provenance as plain prose (a date and short description, e.g. "the pilot reorganisation (2026-05)") or link to the **durable artefact** the stream produced (a store note, a convention, a template) — never to the stream itself.
- **Stream-to-stream links only between live streams.** They are fine while both are active; when a stream retires, fixing or dropping the inbound links from other streams is part of its retirement.

This is the inbound complement to [Settled streams](#settled-streams): that section covers a settled stream's _own_ links going stale; this keeps durable notes from ever depending on a stream in the first place.
