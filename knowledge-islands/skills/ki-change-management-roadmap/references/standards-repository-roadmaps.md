# Repository roadmap standard

## Scope

This standard applies to non-KB repositories.

A repository whose `.ki-config.toml` declares `repo_type = "kb"` uses `ki-repo-kb-streams` and must not add a parallel project `ROADMAP.md` or `docs/roadmap/` tree.

## Contents

- [Canonical shape](#canonical-shape)
- [Horizons](#horizons)
- [Horizon transitions and readiness](#horizon-transitions-and-readiness)
- [Work-item discipline](#work-item-discipline)
- [Trade review](#trade-review)
- [Conform and educate](#conform-and-educate)

## Canonical shape

Every non-KB repository uses one shape.

```text
ROADMAP.md                              # concise orientation
docs/roadmap/
  _ISSUES.md                            # durable issue-allocation ledger, sorted first
  <REPO>-<NNN>-<slug>.md                # repository-wide issuing mode
  <REPO>-<AREA>-<NNN>-<slug>.md         # fixed-area issuing mode
```

`ROADMAP.md` is a concise stable orientation that points to `docs/roadmap/` and explicitly does not duplicate the work-item queue.

CLI tooling reports and filters the canonical items.

Each work-item file is canonical and owns its full authored detail.

Its frontmatter `title` is a compact label of at most four words. The file slug remains a stable identifier aid and need not repeat or constrain the title.

There are no simple or thematic profiles, theme `ROADMAP.md` files, `plans/` directories, item locators, or standalone plan records.

The item identifier is globally unique within its repository. A repository chooses one issuing mode: repository-wide `<REPO>-<NNN>`, or fixed-area `<REPO>-<AREA>-<NNN>`.

`<REPO>` is the stable uppercase `repo_code` in the `ki-repo` table.

`<AREA>` is an uppercase code for a fixed issuing namespace. It is selected when the item opens, recorded as `area:` frontmatter, and never changes. It is not a mutable theme or group.

`<NNN>` is a zero-padded serial allocated from `001`. In repository-wide mode it is one repository sequence. In fixed-area mode it is one sequence per area. Never lower a high-water mark, fill a gap, or reuse a number after pruning.

`docs/roadmap/_ISSUES.md` is the canonical durable allocation ledger. Repository-wide mode uses `last_id`; fixed-area mode uses a code-sorted `areas: { AREA: N }` map. The checker verifies that the ledger matches the configured issuing mode and no retained item exceeds its applicable high-water mark; CONFORM scaffolds the file only when it is absent.

The filename repeats the identifier followed by a lowercase kebab-case slug.

The `theme` frontmatter field is a human-readable kebab-case grouping such as `foundation-tooling`.

It is deliberately retained after flattening: items in one theme may be selected, shaped, and executed together without becoming a physical directory hierarchy. A repository that does not need fixed areas declares its theme vocabulary directly:

```toml
[skills.ki-repo]
repo_code = "KI-HARNESS"

[skills.ki-change-management-roadmap]
themes = ["foundation-tooling", "governance-consistency"]
```

For fixed-area mode, the same table instead declares each durable area code and its human-readable theme:

```toml
[skills.ki-change-management-roadmap.areas]
FND = "foundation-tooling"
GOV = "governance-consistency"
```

The array or area-map values are the complete allowed theme vocabulary. Every item's `theme` must be declared; in fixed-area mode its `area` must be declared and map to that theme. A repository must not mix issuing modes. Keep horizons, lifecycle values, work-item location, and reporting behaviour universal rather than per-repository configuration.

## Horizons

Every work item carries one of these six `horizon` values:

1. `Now` — receiving current delivery attention; plans permitted.
2. `Next` — the next bounded work to prepare or begin; plans permitted.
3. `Soon` — understood but not yet started.
4. `Waiting for` — blocked by a named external condition.
5. `Parked` — intentionally paused with a named return trigger.
6. `Future` — speculative or unscoped; `candidate: true` marks uncommitted work.

The root orientation holds no horizon headings or item list.

Work items are draft-only until they enter the common delivery lifecycle.

Completed work is removed by an explicit prune after its accepted item record has been committed.

Continuous practices belong in a standard or orientation file, not among finite work items.

## Horizon transitions and readiness

Horizon moves are authored, judgment-led decisions.

CONFORM never chooses a move; it only repairs the concise root orientation.

- **Future → Soon** requires enough scope to state the intended outcome and boundary.
- **Future → Next** is permitted when one review establishes the Future minimum plus actionable scope, understood dependencies, and readiness to start; state why Soon adds no useful shaping stage and re-evaluate at Next.
- **Soon → Next** requires actionable scope, understood dependencies, and readiness to start.
- **Waiting for → another horizon** requires evidence that its named external condition changed.
- **Parked → another horizon** requires evidence that its named return trigger or priority changed.
- A move back to **Soon**, **Waiting for**, **Parked**, or **Future** must preserve honest wording and any linked item lifecycle state.

`Now` and `Next` are the only horizons that may be shaped into an execution-ready plan or enter implementation.

An item may be expanded with executable steps only after it reaches one of those horizons and the user confirms the work.

An immediate item may remain `status: draft` while `ki-plan` shapes it.

It becomes `status: ready` only after its execution detail and verification are reviewable, its dependencies are satisfied, and the user approves it for implementation.

When no immediate work is eligible, `ki-next` evaluates Now and Next first, then Soon, then Future.

Every confirmed move is re-evaluated at its destination.

## Work-item discipline

Every item conforms to [the work-item format](standards-work-item-format.md), including the final topic-oriented `Discussion` section and the detail required at its current horizon and lifecycle state.

An item begins with a mandatory plain-language Goal, then its outcome evidence, boundary, current context, and enough discussion to preserve decision-useful reasoning.

At Soon, shaping records the intended approach, known dependencies, open decisions, and promotion conditions.

When multi-file or multi-step execution is selected for immediate work, `ki-plan` enriches that same file in place with current state, steps, files, verification, dependencies, and delegation where appropriate.

It never creates a duplicate plan file.

`status` records the shared delivery lifecycle independently of `horizon`:

`draft` → `ready` → `in-progress` → `awaiting-review` → `done`.

`draft` covers captured and actively shaped work.

`ready`, `in-progress`, `awaiting-review`, and `done` must remain in Now or Next.

`ki-implement` owns `ready` → `in-progress` → `awaiting-review`.

Its start transition records the immutable full `HEAD` commit in `baseline_ref`; its completion writes the required review packet.

`ki-accept` owns explicit `awaiting-review` → `done` and pruning selected by an explicit work-record path or glob.

`ki-recap` and `ki-next` may identify or recommend eligible pruning, but they never delete a work-item record.

`blocks` and `blocked_by` use work-item identifiers, must be reverse-consistent and acyclic, and cannot permit execution while a blocker is not done.

An optional flat `waiting-on-trades: [TRD-…]` field identifies the exact trade records whose observable progress forms a Waiting-for condition. It is valid only at `horizon: waiting-for`, contains unique canonical trade identities, and never replaces or extends `blocks` or `blocked_by`. The item body states the exact condition being observed: receipt, a terminal receiver decision, or completion of receiver-local work linked from an adopted trade.

An explicit later prune path or glob removes only the resolved `done` items; the selection itself is the deletion authority and does not need a second confirmation. `ki-change-management-housekeeping` templates may spawn linked ordinary work records; their cadence does not create a second delivery lifecycle.

A done work item linked from an adopted completion-observation trade remains retained until sender release is observable. Roadmap review and pruning report that external reference as a guard and refuse to remove the linked work record while it is unresolved.

## Trade review

Where a repository declares `ki-trades` and its records exist, include their structural relevance in the judgment portion of a roadmap audit.

- **Inbound:** identify each submission that still needs receiver review or a separately confirmed local roadmap proposal. A trade status, including adopted, does not create or prioritize a work item.
- **Outbound:** identify observable receiver progress that may warrant an originating follow-up. The receiver owns disposition, priority, execution, and acceptance.
- **Waiting:** confirm that each `waiting-on-trades` identity names an existing relevant trade and that the prose names its precise observed condition without treating the trade as a local dependency.
- **Pruning:** identify a done item still referenced by an adopted completion-observation trade whose sender release is not yet observable; it is not prune-eligible.

The review is read-only and reports structural guidance or proposed local roadmap action only.

It does not set disposition, infer adoption or acceptance from silence, move or prune trade records, prioritize local work, or change another repository's state.

## Conform and educate

`ki repo conform --skill ki-change-management-roadmap --repo <repo> --dry-run` shows the exact root-orientation replacement.

CONFORM repairs that orientation and creates a missing issue-allocation ledger only when every canonical item is valid.

It never invents an item, changes a horizon, changes lifecycle status, removes authored prose, reallocates an identifier, or edits an item body.

`ki repo educate --skill ki-change-management-roadmap --repo <repo>` scaffolds the root orientation only when the repository has no roadmap artefacts.

It does not create speculative work-item files.
