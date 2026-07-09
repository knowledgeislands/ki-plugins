# Audit Rubric — the checkable criteria

Line-by-line pass/fail criteria for auditing a Knowledge Islands base's **`Streams` zone** against the model carried in [the SKILL body](../SKILL.md), [the structure reference](<Streams Structure Reference.md>), and [the Enactment Process reference](<Enactment Process Reference.md>). Each is tagged **[M] mechanical** (the bundled [checker](../scripts/audit-streams.ts) enforces it) or **[J] judgment** (you assess it by reading). The **code** in bold (`STREAM-1`, `ENACT-2`, …) is the area's short code plus its number — it is what an audit should cite.

A criterion's tag is a contract with the checker: an **[M]** check is run by `audit-streams.ts` (do not eyeball it); a **[J]** check needs a model and is applied by reading in Mode AUDIT step 2. This skill governs the inside of the `Streams/` zone; the five-zone layout itself (that `Streams/` exists and carries a same-name index) is the `ki-kb` rubric's `ZONE-*`, not repeated here. The `Streams` zone is resolved through any `ki-kb` zone alias.

## STREAM — Streams structure

→ [SKILL: The Streams zone at a glance](../SKILL.md) · [structure reference](<Streams Structure Reference.md>)

- **STREAM-1 [M]** Folders directly under `Streams/` are the **Focus set** (`Active` / `Background` / `Dormant` / `Future` / `Settled`). A non-Focus folder at that level warns (a stream filed directly under `Streams/` without a Focus, or a stray folder).
- **STREAM-2 [M]** Each **present** Focus folder carries a **same-name index note** (`Active/Active.md`, …). A missing one warns. (An absent Focus folder is fine — not every base uses all five.)
- **STREAM-3 [M]** A **full proposal** carries the **`Proposal` suffix** on its filename (and, in a leaf stream, the containing folder); a **lightweight stream** (a plain tracker note — not a governed change) carries none. The checker flags only a stream whose index note **declares itself a proposal** (`type: stream-proposal` or a lifecycle `status`) yet lacks the suffix; a lightweight tracker is not flagged. The two weights are defined in the Enactment Process (per stream, not per base).
- **STREAM-4 [J]** Each Focus index note has a `## Streams` table, correctly ordered (status then priority; grouped by category where used), and Category usage follows one pattern per Focus.
- **STREAM-5 [J]** Streams sit in the Focus matching their real attention level (a long-idle stream in `Active/` is drift), and proposal names follow the base's naming conventions.

## ENACT — the Enactment Process

→ [SKILL: Status lifecycle / Proposal document anatomy](../SKILL.md) · [Enactment Process reference](<Enactment Process Reference.md>)

- **ENACT-1 [M]** Every proposal document carries `status`, `priority`, and `dependencies` in its frontmatter. A missing key warns.
- **ENACT-2 [M]** `status` is one of the lifecycle vocabulary (`draft` / `ready` / `rejected` / `in-progress` / `rolled-out` / `reviewed` / `completed`) and `priority` is one of `urgent` / `high` / `medium` / `low` — as a **bare token**, not prose (`status: in-progress`, not `status: in-progress - April 2026`). A value outside the vocabulary warns.
- **ENACT-3 [J]** Every stream note carries a `## Governance` section declaring adherence to, and linking, the bound process note (default `Enactment Process`).
- **ENACT-4 [J]** The proposals index and each Focus index match the streams actually present and their current statuses — no stale, missing, or lagging rows.
- **ENACT-5 [J]** A `completed` proposal's document has been **deleted** and its output already lives in its canonical zone — durable knowledge migrated to a store (`Pillars/` or `Resources/`), or an operating-model change landed in `Admin/`; a settled stream's output is already in place, the settled note a marker pointing to it.

## GATE — the gate's always-on anchor

→ [SKILL: Installing the gate](../SKILL.md)

- **GATE-1 [M]** **Once the base runs proposals** (≥ 1 `* Proposal.md` exists), it anchors the Enactment gate in always-loaded context: its root **`CLAUDE.md`** (or `AGENTS.md`) names the Enactment Process / `ki-kb-streams` **and** the gate (route canonical changes through a proposal). Because skills load on demand, without this anchor the skill never fires on a plain "edit the X note" request and the gate is silently bypassed. A missing anchor, or one that names neither, warns. A base with only lightweight streams (no proposals) hasn't opted into the gated model, so the anchor isn't demanded.
- **GATE-2 [J]** The directive is genuinely _imperative_ — an instruction to route canonical changes through a proposal and load the skill, not a passing mention — and it states the exemptions (trivial fixes, `Calendar/`, `+/` triage).

## CONFIG — the `[ki-kb-streams]` config table

→ [SKILL: Project bindings](../SKILL.md) · contract owned by `ki-repo` (validate down, ignore across)

- **CONFIG-1 [M]** A key the table does not recognise warns. The recognised keys are `process_note` (the base's process-note path), `note_type_scheme` (`type` or `tags`), and any store override; another skill's `[table]` is never inspected.
- **CONFIG-2 [M]** `note_type_scheme`, if set, is one of `type` (the canonical, machine-readable scheme — and the default) or `tags` (a legacy / transitional accommodation). Any other value warns; `note_type_scheme = "type"` restates the default and may be dropped.
