# Repo roadmap standard

## Scope

This standard applies only to non-KB repositories. A repository whose `.ki-config.toml` declares `repo_type = "kb"` uses `ki-kb-streams`; it must not add a parallel project `ROADMAP.md` or `docs/roadmap/` tree.

## Horizons

Every roadmap carries these five `##` horizons exactly once and in this order:

1. `Blocking` — actively broken or preventing `Next`; plans permitted.
2. `Next` — scoped and ready for immediate work; plans permitted.
3. `Soon` — understood but not yet started; no ordinary plans.
4. `Waiting for` — blocked by a named external condition; no ordinary plans.
5. `Future` — speculative or unscoped; no ordinary plans, with `(candidate)` on uncommitted work.

Each horizon heading is followed by one blank line, its exact canonical blurb, and one blank line before any item or the next horizon:

- **Blocking:** Actively broken, or blocking the `Next` horizon: takes priority over everything else and must clear before `Next` work proceeds. Empty means nothing is on fire.
- **Next:** Scoped and ready to start — the immediate queue, picked up before anything in **Soon** or **Future**.
- **Soon:** Understood and roughly scoped but not yet started — worth doing once the **Next** queue clears, ahead of anything still speculative.
- **Waiting for:** Worth doing, but presently blocked on an external dependency or decision. Revisit when its named condition changes rather than treating it as dormant local work.
- **Future:** Speculative or not yet scoped — items marked _(candidate)_ need a scoping pass (or a decision to drop them) before they're actionable.

The blurb is the empty-horizon explanation; do not add a separate `Nothing queued.` placeholder. CONFORM may insert a missing canonical blurb because its wording and position are mechanically derivable. It preserves any existing prose after the insertion rather than guessing whether that prose was an altered blurb or authored context.

Roadmaps are open-only: completed work is removed. Continuous practices belong in a standard or orientation file, not among finite work items.

## Promotion and readiness

Horizon moves are authored, judgment-led decisions. CONFORM never makes them: it may repair only mechanical blurbs and generated projections.

- **Future → Soon** requires enough scope to state the intended outcome and boundary. It remains Future when that minimum is not known.
- **Soon → Next** requires actionable scope, understood dependencies, and readiness to start. It is not a planning shortcut: the item must first be moved to Next, then evaluated there.
- **Waiting for → another horizon** requires evidence that its named external condition has changed and a fresh placement judgment.
- **Blocking / Next** are the only horizons that may carry an ordinary plan. A plan is created only after the item is there and the user has confirmed it.
- An open plan with a non-empty `transferred-from` origin may instead remain linked to an item in any other honest horizon. This narrow exception preserves useful transferred execution detail without asserting that the item is ready or changing its priority. It is not eligible for readiness or execution until the item moves to Blocking or Next.

When the immediate queue has no eligible work, a human-led process such as `ki-next` replenishes it in stages: evaluate Blocking and Next first, then evaluate Soon, and only then scope Future candidates to enter Soon. Each confirmed move is re-evaluated at its destination because the readiness contract changes. The process presents proposals and obtains confirmation before every authored move; this governance skill does not depend on that process.

## Handoff review

When a repository uses the optional `+/_HANDOFFS/` or `-/_HANDOFFS/` working areas defined by `ki-repo`, include their review in the judgment portion of a roadmap audit.

- **Inbound:** identify each received handoff that needs a local adoption, clarification, decline, or archive decision. An adopted handoff becomes this repository's own roadmap item and, when appropriate, plan.
- **Outbound:** identify known receiving-repository progress that needs an originating follow-up or closure decision. The receiving repository remains the owner of its priority, plan, implementation, and delivery.

The review reports proposed local action only. It does not inspect a remote repository by default, infer acceptance from silence, move working files, create or alter a roadmap item, or change either repository's state. Missing local access to a receiving repository is ordinary and not a finding.

## Simple profile

The root `ROADMAP.md` is the sole roadmap artifact. It has one H1 and the five horizons. It can use lower headings to organise its open work, but it carries no `docs/roadmap/` directory or plan files. Requiring an execution plan is the signal to run EXPAND first.

## Thematic profile

The canonical authored files are:

```text
docs/roadmap/
  <theme>/
    ROADMAP.md             # frontmatter: code: <THEME>
    plans/                  # present while the theme has active plans or retained done records
      <THEME>-<NNN>-<slug>.md
```

Theme names are unique lowercase kebab-case names. Every theme roadmap begins with one `code: <THEME>` YAML frontmatter field: an unquoted, uppercase semantic identifier that is stable and unique across the repository. A theme roadmap has one H1, all five horizons, and each item is a `###` heading beneath exactly one horizon. Item prose follows its heading until the next item or horizon. A locator is `<theme>/<item-slug>`; the slug is the normalised item heading. Locators must be unique.

A theme directory exists only while its roadmap has at least one item. An empty scaffold-only theme roadmap is drift. Remove it deliberately only after confirming that it holds no authored prose, plans, or unexpected content; replacement-only CONFORM actions do not delete directories. The thematic profile may have zero remaining themes after pruning.

Root `ROADMAP.md` is generated in this profile. It links every canonical item under its horizon but repeats none of its prose. Plan state and dependencies are derived directly from plan frontmatter and canonical local plan references; there is no generated global plan index. `docs/roadmap/README.md` is a retired artifact and must be deleted during migration. Edit canonical theme roadmaps or plan files, then run CONFORM; never hand-edit the root projection.

## Expansion boundary

EXPAND changes authorship, so it requires judgment. It moves complete items from the simple root into coherent themes, preserving their horizons and prose, then generates the projections. It must prove conservation: every original open item appears once after expansion, with none duplicated.

CONFORM is narrower. It may insert a missing canonical horizon blurb and rebuild derivable local plan references and projections, but it must never choose a theme, move an item, change a horizon, invent a locator, delete a theme, remove authored content, or rewrite existing prose.

## Plan discipline

Plans are recoverable execution documents for multi-file or multi-step changes. Ordinary plans exist only for `Blocking` and `Next` items and use the [plan-format standard](standards-plan-format.md). An open plan with a non-empty `transferred-from` origin may preserve transferred detail beside an item in another honest horizon, but it does not imply readiness and cannot advance there. Each theme's code prefixes a separate zero-padded serial sequence beginning at `001`, so a canonical plan identifier is `<THEME>-<NNN>`. Dependencies use those globally unique identifiers and are bidirectional, existent, and acyclic. Every `ready`, `in-progress`, `acceptance`, or `done` plan resolves to Blocking or Next, and no plan moves to `ready`, `in-progress`, or `acceptance` while a listed blocker is not `done`.

A ready plan has concrete Steps, a checkable Verify section, an honest Current state, and a minimal Files touched list. The lifecycle is `open` → `ready` → `in-progress` → `acceptance` → `done`: `open` awaits an explicit start decision, `ready` records that approved and unblocked decision, and the initial execution transition records the full immutable `HEAD` commit ID as the plan's `baseline-ref`. Acceptance records a compact review packet and waits for explicit user approval; it does not silently route a learning into another durable artifact. `done` retains a committed outcome record beside its still-visible canonical item. An explicit later prune, not the done transition, removes a selected completed batch and its canonical items.

`ready` and the initial `execute` transition may operate on one or more explicitly named plans. A batch uses one explicit approval or coordinated start, validates every selected plan and dependency before any write, then publishes all selected status changes atomically in one commit. A failed eligibility, snapshot, or publication leaves the batch unchanged; single-plan transitions are the batch-of-one case. `ki-plan` owns the detailed procedure.

One explicit-path commit may include any coherent batch of related plan changes, including status transitions, the same correction applied to several plans, or a selected prune batch. Split unrelated plan work into separate commits so each history entry remains reviewable and recoverable.

### Local plan references

An active or retained done plan has one inverse reference in the canonical item named by its `roadmap:` locator. The reference is the final, standalone line in that item's content, immediately before the next item or horizon:

```markdown
**Plan:** [HOK-004](plans/HOK-004-short-description.md)
```

The identifier and relative path must resolve to that plan file. The line is derived state, not authored item prose: `ki-roadmap` CONFORM repairs it from the plan-record set, and `ki-plan` creates, maintains, or removes it in the same transaction as the plan. An item with no active or retained done plan has no such line. No other `**Plan:**` line is permitted in a canonical theme roadmap.
