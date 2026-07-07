# Sources — where the model comes from

**Refresh:** canonical · on-change

**This skill is the canonical definition** of the Streams structure and the Enactment Process — the single source of truth. The Knowledge Islands bases that run the process **defer to it**: each carries a thin local process note that points here and adds only its local specifics. There is no separate in-base "canonical Model" to re-anchor against; the skill _is_ the model.

Mode REFRESH therefore keeps this definition coherent and current **against practice** — how the live bases actually run their Streams — promoting genuinely shared patterns into the skill and leaving single-base quirks as bindings or local notes. It then **bumps the `last reviewed` dates** (what changed is recorded in the commit, not a changelog — history lives in git). Although this skill is `canonical · on-change` and carries no clock, it keeps a `## Last review` block as a **hand-kept practice-review note** — the record of the last re-anchor against live bases, not an external-spec pin. This skill follows no moving external spec: the Enactment Process is in-house.

## Canonical

The canonical definition lives in this skill itself:

- [the SKILL body](../SKILL.md) — the framing, lifecycle, anatomy, modes, bindings, and working rules.
- [the Streams structure reference](<Streams Structure Reference.md>) — Focus, Category, the `Proposal` suffix, leaf/parent/multi layout, note types.
- [the Enactment Process reference](<Enactment Process Reference.md>) — the model, proposal documents, the cycle, rollout, review, rejection.
- [the rubric](audit-rubric.md) + [`scripts/audit-streams.ts`](../scripts/audit-streams.ts) — the checkable criteria.

## Living (how the model is used in practice)

Sampled at REFRESH time through each base's own `kb-fs` MCP and `CLAUDE.md`. These are **consumers** of the canonical skill, read to keep it honest against real use — not sources of the definition.

| Source                           | Governs                                                             | Last reviewed |
| -------------------------------- | ------------------------------------------------------------------- | ------------- |
| `ki-arcadia-principal` base[^ap] | Whether the canonical skill still matches practice ※                | 2026-07-04    |
| `kit-legal` base[^kl]            | The same, from a second base running the process under a local name | 2026-07-04    |
| Other bases running the process  | The same, as further bases adopt the skill                          | 2026-06-21    |

※ How the principal island runs its Streams in practice.

[^ap]: The principal island. Sampled through `ki-arcadia-principal-mcp-kb-fs`. Its Streams zone carries the canonical structure cleanly — the Focus set, leaf streams with the `Proposal` suffix, and a textbook **parent** stream (`Streams/Future/Island MCP/` = bare-topic folder + slim `Island MCP.md` index + `Island MCP Proposal.md` + child note). **Conformance is partial / in-progress** (re-sampled 2026-07-04): the proposal documents carry the canonical apparatus (the `Proposal` suffix, `type:` scheme, machine-readable proposal frontmatter, `Governance` footers — the mechanical checker passes clean), and the deferral is now properly wired — a dedicated slim process note exists at `Admin/Operations/Processes/Enactment Process.md` that defers to this skill, and the legacy `How Change Happens.md` has moved to `Pillars/Philosophy/Model/Processes/` and no longer holds the operational definition. The Focus index notes now carry `type: stream-focus`, but still trail on the legacy `tags:` scheme and a non-bare `status: current - April 2026` key (e.g. `Active/Active.md`) — ENACT-2. The earlier `Settled/` proposal at `status: completed` (ENACT-5) has since been deleted. Its CLAUDE.md / process note still name the legacy `knowledgeislands-streams` skill id rather than `ki-kb-streams`. These are `ki-kb-streams` Mode CONFORM follow-ups against the base, not gaps in the canonical model.

[^kl]: A second real base, sampled via `kit-legal-mcp-kb-fs`. Runs the canonical **Enactment Process**; its slim local note lives at a non-default location, `Admin/Operations/Processes/Enactment Process.md` (declared via the `process_note` binding), and points here. It adopted the canonical name on 2026-06-04, renamed from its former local `Repository Change Process`. Holds its `Pillars` zone under a local folder name, resolved transparently through a `[ki-kb-base.zones]` alias.

## Last review

**REFRESH last run 2026-07-04** — Re-anchored the canonical definition against both living bases (`ki-arcadia-principal` and `kit-legal`) via their local trees. The model is **current and unchanged**: the lifecycle (PROPOSE/ITERATE/READY/ROLLOUT/REVIEW/SETTLE/REJECT), the Streams structure (Focus, Category, the `Proposal` suffix, leaf/parent/multi layout, the five `type:` note types), and the proposal frontmatter all still match real use. No promotion candidates; no edits to the skill body, references, rubric, or checker were warranted. The mechanical checker runs clean (the harness itself has no `Streams/` zone — an informational skip).

Per-source:

- `kit-legal` — **confirmed, still a clean exemplar.** Full Focus set present, leaf proposals all carry the `Proposal` suffix, the `process_note = "Admin/Operations/Processes/Enactment Process"` binding is declared and the note points back here, and CLAUDE.md carries the imperative gate directive. Nothing to change.
- `ki-arcadia-principal` — **confirmed against the model; its base-side conformance has advanced since 2026-06-21, making the prior [^ap] footnote stale.** The deferral is now properly wired: a dedicated slim process note exists at `Admin/Operations/Processes/Enactment Process.md` whose description defers to the skill (no longer only an `## Enactment Process` section inside `How Change Happens.md`, which has itself moved to `Pillars/Philosophy/Model/Processes/` and no longer holds the definition). The previously-flagged `completed` proposal in `Settled/` (ENACT-5) is gone. Focus index frontmatter now carries `type: stream-focus` (the legacy `card/*` scheme retired on the index). Residual CONFORM follow-ups remain: legacy `tags:` and a non-bare `status: current - April 2026` (ENACT-2) on the Focus indexes, and its CLAUDE.md / process note still name the legacy `knowledgeislands-streams` skill id rather than `ki-kb-streams`. All are `ki-kb-streams` Mode CONFORM follow-ups against that base, not changes to the canonical model.

Open watch-items:

- `ki-arcadia-principal` Focus-index frontmatter: retire legacy `tags:` and convert `status: current - April 2026` to a bare lifecycle token (ENACT-2) — CONFORM against the base.
- Skill-id lag: `ki-arcadia-principal`'s CLAUDE.md and process note reference `knowledgeislands-streams`; the harness skill is now `ki-kb-streams`. Tracked centrally under the `ki-kb-*` rename, not a model change.
- Refresh the `[^ap]` footnote body to the current reality (dedicated process note, moved `How Change Happens.md`, ENACT-5 cleared, `type:` adopted).
