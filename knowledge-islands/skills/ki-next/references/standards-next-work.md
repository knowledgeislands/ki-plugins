# Next-work procedure

`ki-next` applies the transition rules owned by `ki-change-management-roadmap` or `ki-repo-kb-streams`.

It never treats a recap, handoff, or historic transcript as authority to write.

Its responsibility ends at selecting, promoting, deferring, or spawning due work and handing confirmed immediate work to `ki-plan` for shaping.

## Contents

- [1. Ground](#1-ground)
- [2. Triage inbound handoffs](#2-triage-inbound-handoffs)
- [3. Review relevance](#3-review-relevance)
- [4. Select candidates](#4-select-candidates)
- [5. Defer](#5-defer)
- [6. Compare, rank, and confirm](#6-compare-rank-and-confirm)
- [7. Spawn due housekeeping work](#7-spawn-due-housekeeping-work)
- [8. Finish](#8-finish)

## 1. Ground

When a `ki-recap` precedes this cycle, require its handoff/compaction boundary to have been reached before starting a new selection cycle. After compaction, treat the digest as orientation only and re-ground every repository fact below.

1. Resolve the current git repository physically and read `.ki-config.toml`.
2. In a non-KB repository, run `ki repo audit --skill ki-change-management-roadmap --repo <git-root>` and stop on any FAIL or WARN. Read the generated `ROADMAP.md`, every canonical item directly below `docs/roadmap/`, and active `docs/housekeeping/` templates; derive lifecycle status and dependencies from frontmatter.
3. In a Knowledge Base, run `ki repo audit --skill ki-repo-kb-streams --repo <git-root>` and read the Focus, proposal, and `Streams/Housekeeping/` indexes fresh.
4. When the repository declares `ki-repo-trades`, run its audit and inspect validated inbound records after the clean governing-skill audits. Its `README.md` is orientation, not a record.

## 2. Triage inbound handoffs

Present every inbound record that still needs receiver judgment. Use the receiver vocabulary: **unconsidered**, **in progress**, **parked**, **clarify**, **applied**, **adopted**, **retained**, **declined**, or **superseded**. A newly copied record begins `unconsidered`; receipt is a separate delivery fact, not a decision.

Present its sender provenance, payload, constraints, current status, existing receiver rationale and linkage, and the exact available status transitions.

Require confirmation of the exact inbound file, receiver status, rationale, local linkage, and resulting local record write. Change only receiver-local fields; do not rewrite sender provenance or payload, mutate an outbound or peer copy, or delete a record as part of disposition.

For a work trade, choose between direct application and a local roadmap proposal before recording a terminal decision:

- Propose `applied` only when the trade has one bounded, reversible, independently verifiable local outcome; authority is clear; no material design decision, dependency, migration, public-contract change, or cross-repository write is involved; and an existing targeted verification gate proves the result. Present the exact local edit, verification, and commit boundary, require confirmation, apply and verify the change, commit it atomically, then record `applied` with that full verified commit ID. A documentation or configuration change is not automatically trivial merely because its diff is small.
- Otherwise propose one or more local work records. Preserve the trade's operating model, sources, alternatives, authority and safety boundaries, and unresolved questions. Require separate confirmation of each record's wording and horizon, then record `adopted` with the confirmed local linkage. Adoption does not itself prioritize, implement, accept, or complete that work.

Knowledge trades never use direct application. Record `retained` only after the knowledge is placed in a named canonical local artifact; otherwise keep the trade in progress, park it, ask for clarification, decline it, or supersede it as the evidence warrants.

Do not manufacture a roadmap item merely to close a trivial work trade. Conversely, do not use `applied` to bypass roadmap selection or review for material work.

After a terminal decision, report the next condition required by the sender's observation policy. `unattended` and `receipt` permit release after receipt; `decision` waits for a terminal decision; `completion` waits through decision and, for adopted work, local completion. Applied work and retained knowledge satisfy completion directly, while decline or supersession resolves it without completion. In progress, parked, and clarify retain the outbound copy whenever its policy still waits. Recommend receiver pruning only after sender release is observable; `ki-next` never performs a peer write or infers release from silence.

## 3. Review relevance

Run this pass for `--review`, or briefly when grounded evidence shows a material concern.

Identify only evidence-backed proposals: stale or obsolete work, duplicates, changed Waiting conditions, changed dependencies, or an item at the wrong horizon.

Do not change content until the user confirms exact wording and placement.

## 4. Select candidates

### Non-KB repositories

1. Gather dependency-ready `now` and `next` records. Reuse their canonical record; if several are independently ready, recommend a small ranked set only when each retains its own lifecycle and the user confirms the set and order.
2. Only when none is eligible, assess `soon` records against the Next entry rule. After confirmation, change horizon or Focus to `next`, run the adapter audit, then re-evaluate it at the destination.
3. Only when Soon has no viable record, assess Future candidates. Move directly to Next only when the full Next rule is met and Soon adds no value; otherwise move to Soon once the intended outcome and boundary are known. Re-evaluate after every confirmed move.
4. Reconsider Waiting-for or Parked items only when their named external condition or return trigger changed.

### Knowledge Bases

Use the same queue through native Focus folders: `Now`, `Next`, `Soon`, `Future`, `Waiting for`, and `Parked`. `Streams/Housekeeping` is a template horizon, not a delivery destination; due runs move to the template's declared delivery Focus.

### Roadmap batchability screen

Before selecting one viable non-KB item, compare the whole dependency-ready candidate set for a **safe delivery synergy**. Do not promote a later-horizon item merely to create a batch: every candidate must first satisfy its normal route into immediate work. A group is a batch candidate only when all of the following are true:

- every record remains distinct with its own lifecycle, verification, and review packet;
- the items share a concrete delivery advantage, such as one bounded source surface, setup or verification pass, external coordination window, or coherent user outcome;
- their planned changes can be sequenced without conflicting writes, concealed dependencies, or one item's result changing another item's honest scope; and
- each item is independently executable at its position, with satisfied dependencies and no unapproved decision required.

Do not treat a shared theme, adjacent numbering, the same repository, or a desire for throughput as synergy. Related work that changes the same uncertain contract, needs a new decision, or would make a failure hard to isolate stays separate.

For each safe candidate group, present the named items in proposed order, the concrete advantage, the evidence that keeps them independent, the shared verification where relevant, and the mandatory stops that `ki-batch` will enforce. Also state why any superficially related candidate was excluded.

Require confirmation of the exact candidate set and order before planning each member through `ki-plan`. Once every selected record is Ready, offer the set to `ki-batch`. This is a preparation handoff, not implementation authority: `ki-batch` re-validates scope, readiness, verification, and stops, then requires its own reviewed authorisation before any `ki-implement` cycle begins.

If no group meets every condition, say so briefly and use the ordinary single-item selection path.

## 5. Defer

`defer <item> <horizon-or-focus>` is an explicit user-confirmed move.

Resolve the exact record and identify linked dependencies before proposing it.

Use Soon only for understood but non-immediate work; Waiting for only with a named external condition; Parked only with an intentional pause and named return trigger; Future only when re-scoping is needed, adding `candidate: true`.

When the named external condition is observation of one or more trades, add the flat `waiting-on-trades: [TRD-…]` field and state in prose whether the item awaits receipt, a terminal receiver decision, or completion of linked receiver-local work. Do not add trade identities to `blocks` or `blocked-by`: those arrays remain local work-item dependencies. Remove `waiting-on-trades` when moving the item out of Waiting for.

Never silently delete, reopen, or detach a canonical execution record.

## 6. Compare, rank, and confirm

Use the **change-value profile** only when comparing viable material candidates or when a human asks for a material engineering-change comparison.

For a focused single-step fix, retain the lightweight selection path: explain the immediate reason and confirmation boundary without manufacturing a profile.

The profile makes these dimensions visible, with short evidence only for the dimensions that materially distinguish the candidates:

- **Capability** — user or system outcome enabled.
- **Comprehensibility** — reduction in ambiguity, indirection, or cognitive load.
- **Maintenance reduction** — obsolete code, duplication, or recurring manual work removed.
- **Reliability** — failure mode, verification, or recovery improved.
- **Leverage** — downstream work or users enabled by the result.
- **Delivery cost** — bounded implementation and verification effort.
- **Reversibility** — ease and safety of changing course after delivery.
- **Readiness** — decision, scope, and evidence are sufficient to begin.
- **Dependency availability** — required prerequisites, people, repositories, or services are available.

Do not calculate a composite score, store profile metadata on a work item, or imply that the profile chooses work automatically.

### Worked trade-off

Two ready candidates can both be worthwhile: a narrow local repair may have low delivery cost and high reversibility, while a compatibility improvement has higher leverage and reliability but depends on another repository.

Present those facts directly, choose only after the human confirms the order, and record neither candidate as objectively "higher value" once the unavailable dependency or chosen sequencing changes the decision.

Before a write, show selected items, any proposed batch set and order, exact frontmatter or wording changes, and dependency effects.

Require explicit confirmation, then run the applicable adapter audit.

Invoke `ki-plan` only after a selected record is Now or Next.

It shapes the same item through the stage-detail contract and stops for review before marking it Ready.

`ki-batch` may coordinate a confirmed synergistic group only when every member is Ready and only within an approved preparation boundary.

That handoff does not permit `ki-next` to infer batch, selection, or implementation authority.

## 7. Spawn due housekeeping work

After grounding and before ordinary candidate selection, evaluate each active housekeeping template under the adapter's template horizon. A template is due only when its cadence, last-run evidence, grace period, and spawn policy say so, and it has no active run.

For each due template, present the exact proposed work record, destination (normally Now or Next), template link, and policy effect. Spawn automatically only when the template expressly permits automatic spawning; otherwise require confirmation. The spawned record enters as `draft` and follows the ordinary shared lifecycle. Update the template's `last-run` and `active-run` only in the same coherent change that creates the record.

Never implement a template directly, spawn a duplicate active run, or leave a due run in `Streams/Housekeeping`.

## 8. Finish

Report each confirmed handoff disposition, synergy decision (including excluded near-matches), files changed, selected work, and audit result.

Identify `done` records that are eligible for pruning when useful, but do not delete them; path- or glob-selected pruning belongs to `ki-accept`, while `ki repo roadmap prune` is the separate deterministic selected-repository sweep.

If no work is eligible, identify the missing condition or scoping decision plainly.

Then treat this point as a compaction boundary. Selection has just resolved a broad survey — roadmap items, inbound trades, near-matches, ranking rationale — into one confirmed choice, and the plan or implementation cycle that follows needs the selected item, not the survey that produced it. Compact by default here, retaining the selected work, its confirmed disposition, and any writes made during this cycle.

Two conditions withhold the default, matching [the session-recap standard](../../ki-recap/references/standards-session-recap.md). **Safety:** do not compact with a pending user decision, an unfinished tool operation, or a cycle write not yet recorded. **Minimum footprint:** do not compact when no substantive work has entered context since the last compaction — a `ki-recap` running straight into this cycle compacts once here rather than at both boundaries. Judge the floor by work done, not by a token count or a context-use percentage; no runtime adapter is required to expose one. Claude Code exposes an invocable mechanism; Codex compacts only automatically, so there the boundary is stated and passed without invocation.
