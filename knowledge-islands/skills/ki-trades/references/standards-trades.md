# Cross-repository trade standard

This standard defines local, typed, directional trade routes between registered Knowledge Islands repositories. It grants no transport, peer-write, roadmap, priority, implementation, knowledge, or acceptance authority. The structured catalogue enforces the mechanical rules; the generated [rubric](rubric.md) publishes them.

## Contents

- [Participation and routes](#participation-and-routes)
- [Storage and identity](#storage-and-identity)
- [Preparation and observation](#preparation-and-observation)
- [Submitted record format](#submitted-record-format)
- [Copy and write authority](#copy-and-write-authority)
- [Delivery and decision](#delivery-and-decision)
- [Observation policies](#observation-policies)
- [Release and pruning](#release-and-pruning)
- [Roadmap and process boundary](#roadmap-and-process-boundary)

## Participation and routes

A repository participates only by declaring its own table, naming each partner once with the kinds it trades:

```toml
[skills.ki-trades]
# Optional presentation-only map uplift; omitted means 0.
map_bonus = 1

[skills.ki-trades.routes."owner/receiver"]
export = ["work"]

[skills.ki-trades.routes."owner/sender"]
import = ["knowledge"]

[skills.ki-trades.routes."owner/peer"]
export = ["work", "knowledge"]
import = ["work"]
```

The repository's canonical endpoint is `ki-repo.repository`, a required HTTPS GitHub URI. Each route has its own table, keyed by the partner's `owner/name` — the same form a trade record uses for its `sender` and `receiver` — carrying `export` and `import`, each a duplicate-free array drawn from the closed trade-kind set `work` and `knowledge`. A direction the partner does not trade is **absent**, never an empty array. Non-GitHub identities are currently unsupported: the registry, route keys, record paths, and projection cannot represent them consistently, so configuration must refuse them rather than claim portable HTTPS support.

Each partner appears exactly once: TOML's own prohibition on defining a key twice enforces that, so no hand-written uniqueness or lexical-ordering rule is needed. `[skills.ki-trades]` is declared explicitly rather than implied by its `routes` sub-table, because declaring a skill is separate from configuring it.

`map_bonus` is an optional integer from `0` through `3`, defaulting to `0`. It is presentation metadata for the generated registered-estate map: it adds a small declared contribution to the repository's visible influence alongside route-derived degree and any renderer-derived organisation treatment. It does not change route activation, preparation, submission, receipt, decision, priority, or authority.

A sender-declared export authorises only sender-local preparation and submission. It remains a pending observation route while the receiver is absent from the local registry, does not participate, or has not declared the matching import. Receipt requires an active reciprocal route: exactly one registered root declares the receiver's canonical home, the sender exports that kind, and the receiver imports the same kind from the sender. Filesystem visibility, one-sided declaration, or reciprocity for another kind never activates receipt. Route removal must refuse while a local preparation, submitted outbound, or retained inbound record depends on that typed route.

## Storage and identity

The generic `+` and `-` working areas remain owned by `ki-repo`. A repository declaring `ki-trades` also carries:

```text
+/_TRADES/
└── <sender-owner>/<sender-repository>/TRD-<eight-hex>.md
-/_TRADES/
└── <receiver-owner>/<receiver-repository>/TRD-<eight-hex>.md
```

Each `_TRADES` directory retains its skill-owned README when empty. The two peer path segments match the record's sender for inbound records and receiver for preparations and outbound records. Every path segment encodes a counterpart and none encodes state, so a preparation and its submitted successor share one path. `_PREPARATIONS` is retired and a directory of that name is refused: a reserved name inside the owner namespace it sits in cannot be distinguished from an owner.

The canonical identity grammar is `TRD-[0-9a-f]{8}`. Generation uses eight lower-case hexadecimal characters from a random UUID and deliberately accepts the short form's collision risk. One identity appears at most once locally: submitting rewrites the preparation in place rather than copying it. Filename, `id`, and H1 must agree.

Every copy of a record declares its own `phase`, drawn from a closed vocabulary that names every state a copy can hold rather than only the first one:

- `preparing` — a mutable sender-local preparation under `-/_TRADES/<receiver-owner>/<receiver-repository>/`.
- `submitted` — a frozen outbound copy at that same path.
- `received` — a receiver-owned inbound copy under `+/_TRADES/<sender-owner>/<sender-repository>/`.

`phase` is required on every record and its value must match the copy the record is. It states the state of that copy, not the disposition of the receiver towards the trade: `decision_status` is a separate field on its own axis, and the two advance independently. `phase` is the one field each side writes for its own copy, so audit excludes it from the immutable sender projection alongside the receiver-local fields.

## Preparation and observation

A preparation uses the submitted sender envelope and body described below with `phase: preparing`. It must declare `observation` explicitly. It is mutable at its sender-local outbound path and is not receivable. Committing it makes it available for silent inspection through the sender's registered repository root but creates no receiver copy, acknowledgement, decision, response expectation, or dialogue record.

Preparation history is Git history. Observation compares the current committed record with one host-local last-observed full commit reference. When those commits are comparable it presents their diff; on first view, shallow or rewritten history, or a repository without usable history, it presents the current preparation verbatim and explains why comparison is unavailable. Observation writes only that disclosed host-local cursor. Abandonment removes only the local preparation.

Submission rewrites `phase` from `preparing` to `submitted` on a stable path and freezes the raw sender projection. It is an ordinary field update, not a file move and not a text substitution that depends on `phase` being the last key in the block, so reordering the frontmatter cannot leave a submitted record still declaring itself as preparing. It does not require receiver registration or reciprocity. A submitted record is self-contained and survives sender disconnection.

## Submitted record format

The sender authors this envelope and payload:

```markdown
---
id: TRD-01234567
title: "Short submission title"
created_at: 2026-08-03T12:00:00Z
sender: sender-owner/sender-repository
receiver: receiver-owner/receiver-repository
kind: work
source_ref: KI-SENDER-FND-001
observation: decision
phase: submitted
---

# TRD-01234567: Short submission title

## Context

Why the submission exists and the originating constraints.

## Submission

The outcome proposed to the receiver.

## Constraints

Authority, safety, dependency, and verification boundaries the receiver must retain when evaluating it.
```

The eight sender fields and `phase` are required strings. `kind` is `work` or `knowledge`; a knowledge trade requires `observation: receipt`, while work requires `observation: decision` or `observation: completion`; `phase` is `preparing`, `submitted`, or `received`. `created_at` is a UTC `YYYY-MM-DDTHH:MM:SSZ` timestamp. `source_ref` is provenance only and transfers no lifecycle authority. The three payload sections are required and non-empty. The H1 is the first non-blank body line and exactly repeats `id` and `title`.

An inbound receiver copy sets `phase: received` and adds `decision_status: unconsidered` and, when the committed sender reference is available, `received_from_ref: <full-commit>`. It may also carry receiver-local `reviewed_at`, `rationale`, `applied_commit`, `adopted_as`, `retained_as`, or `superseded_by`. Receiver-local commit references are 40 lower-case hexadecimal characters. No other frontmatter key is valid.

## Copy and write authority

The sender writes and removes only its preparation and outbound record and never sets receiver-local fields. The receiver creates and changes only its inbound copy. The sender projection—every sender frontmatter field and the whole body—is immutable in meaning after submission. `phase` is excluded from it, because it states what each copy is rather than what the sender asserted. Audit derives each sender projection by removing only the recognised single-line `phase` field and, on an inbound copy, the recognised single-line receiver-local fields, then compares the two copies by meaning rather than by byte: frontmatter values are unquoted and whitespace is collapsed, so rewrapping, reindenting, and requoting pass while any change to the words fails. Trade records are therefore formatted like any other authored Markdown, and are not excluded from the formatters. Where no registered peer holds the counterpart copy—most often because the sender has released—the comparison reports as unverifiable rather than passing silently.

Insensitivity to formatting is not a licence to normalise. A receiver never rewrites a sender-owned record to satisfy its own style, and a mismatch is escalated to the sender rather than repaired locally: audit reports, and never proposes a repair to either copy.

`received_from_ref`, when present, is a full lower-case hexadecimal Git commit locator for the committed sender version received. `reviewed_at` is a UTC timestamp. `rationale` records receiver reasoning. `applied_commit` is valid only for `applied` and is likewise a syntactic Git commit locator; this local checker does not verify object existence or ancestry. `adopted_as`, `retained_as`, and `superseded_by` are valid only for their matching decisions. These are local evidence, not priority or acceptance authority.

The governance checker is read-only across repositories. Its only conformable write is the local owned README scaffold. Preparation, observation, submission, receipt, disposition, release, and pruning are explicit local operations outside CONFORM.

## Delivery and decision

Publication, delivery, and decision are independent axes:

- `preparing` — mutable sender-local intent; no delivery fact exists.
- `submitted · waiting` — immutable outbound exists while its selected observation policy remains unsatisfied; before receipt, no matching inbound copy exists.
- `submitted · received` — both copies exist; this means delivery only.
- `released` — the receiver observes that an eligible outbound has gone.

The receiver alone moves its inbound decision status:

- `unconsidered` — received but not reviewed.
- `in_progress` — actively being considered.
- `parked` — intentionally paused; `rationale` is required.
- `clarify` — more information is requested; `rationale` is required.
- `applied` — a bounded work change was applied directly; `applied_commit` is required.
- `adopted` — a work trade informs separately governed local work; `adopted_as` is required.
- `retained` — a knowledge trade is retained in a canonical local artifact; `retained_as` is required.
- `declined` — not applied, adopted, or retained; `rationale` is required.
- `superseded` — replaced by another local record or trade; `rationale` and `superseded_by` are required.

`applied` and `adopted` are work-only; `retained` is knowledge-only. `retained` is the knowledge form of the receiver keeping a trade locally; `applied` is the work form where the receiver performed the bounded work directly. `adopted` remains distinct: the receiver accepted the work as a named local follow-on record, but that record is not thereby complete. There is no generic trade `completed` status.

## Observation policies

The sender chooses one policy without imposing an obligation on the receiver:

- Knowledge uses `receipt` — the sender waits only until receipt is observable.
- Work uses `decision` — the sender waits for a terminal receiver disposition: `applied`, `adopted`, `declined`, or `superseded`.
- Work uses `completion` — the sender waits for selected-adapter, owner-valid completion evidence for local work. This protocol has no such resolver, so it fails closed: `applied`, `adopted`, path scans, and absent records never satisfy completion. `declined` and `superseded` may resolve it because no delivery remains due.

`parked` and `clarify` are non-terminal under every policy that waits beyond receipt. A policy grants no deadline, delivery guarantee, response guarantee, priority, or implementation commitment.

## Release and pruning

The sender lifecycle has only mutable `preparing`, immutable `submitted`, and explicit release. “Waiting” is not a stored phase: a submitted record is waiting while its selected policy is unsatisfied. The sender may release its outbound copy only when that policy is satisfied; release removes the submitted sender projection. A release-eligible outbound remains valid until the sender explicitly removes it.

The receiver may prune its inbound copy only after an eligible sender release is observable. Absence before policy satisfaction is premature release, not permission to prune. An inbound record retains enough sender-policy and receiver-decision evidence to distinguish those cases after release. Cleanup is explicit and previewed; neither side performs background deletion.

## Roadmap and process boundary

`ki-next` presents inbound trades for a human-confirmed disposition. Direct `applied` is available only for one bounded, reversible, independently verifiable local work change with clear authority, no material design decision, dependency, migration, public-contract change, or cross-repository write, and an existing targeted gate. Everything else creates or links separately prioritised local work. Knowledge never uses the direct-work path and is retained only in a named canonical artifact. A future selected-adapter resolver, not this protocol, owns canonical local-work identity and completion evidence.

`ki-work-roadmap` may identify valid inbound records needing review and may record an explicit trade observation on which local work waits. It does not change a route, record, decision, or peer state. Neither skill gains cross-repository write authority.
