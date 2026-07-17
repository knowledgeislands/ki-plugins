# Sources - where the structure model comes from

**Refresh:** canonical · on-change

The canonical and living sources behind this skill's zone model, routing test, and project-bindings table. Mode REFRESH reads this file, re-anchors the model against each source, then **bumps the `last reviewed` dates** (what changed is recorded in the commit, not a changelog — history lives in git). This is the skill's memory of where its structure comes from - keep it current.

Unlike `ki-mcp` and `ki-skills`, this skill follows **no moving external spec**: its structure is canonical and in-house. So REFRESH re-anchors against the canonical definition and against how the bases actually use it, not against a published standard.

## Canonical (the structure definition)

| Source | Governs | Last reviewed |
| --- | --- | --- |
| [Knowledge Islands KB Reference][kb-reference] | † This skill's own in-house definition of the structure — the zone model, conventions, and per-base config | 2026-07-04 |

† The authoritative structure: five zones (Calendar / Pillars / Resources / Streams / Admin) flanked by the inbound `+` and outbound `-` staging areas. This in-house Reference is the canonical definition — the skill follows no external spec.

## Living (how the model is actually used)

These have no URL; they are sampled at REFRESH time through each base's own `kb-fs` MCP and `CLAUDE.md`. The two named bases are the current exemplars and read in tandem. Both have now reached the resolved end-state on the canonical zone names: `ki-arcadia-principal` has completed conforming _up_ (its `Admin/` and `-/` are in place, each canonical zone carries its same-name index, and its `.ki-config.toml` `[ki-kb]` table is empty — no aliases), and `kit-legal` carries the same fuller set, its earlier Pillars-zone rename having completed and its alias dropped. So neither tracked base currently holds a live `[ki-kb.zones]` alias; the model keeps the alias as a canonical, reviewable override (and documents its lifecycle, transitional → dropped) regardless of having no live exemplar.

| Source                                | Governs                                                                                            | Last reviewed |
| ------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------- |
| `ki-arcadia-principal` base[^ap]      | Whether the zone model, routing test, and bindings still match a real layout and practice          | 2026-07-04    |
| `kit-legal` base[^kl]                 | The same, from a base further along the structure, now on the canonical zone names (alias dropped) | 2026-07-04    |
| Other bases actively using this skill | The same, as further bases adopt the skill                                                         | 2026-07-04    |
| Per-base `.ki-config` declarations    | Which base-specific declarations recur across bases※                                               | 2026-07-04    |

※ Which base-specific declarations recur across bases and should be promoted into this standard skill.

## Last review

REFRESH last run **2026-07-04** (prior: 2026-06-21). Internal-model re-anchor — no external spec; re-verified against the canonical structure definition and the live layouts of both tracked exemplar bases via their `kb-fs` MCP / filesystem, plus a mechanical audit.ts run against each.

Per-source outcome:

- **Knowledge Islands KB Reference** — confirmed. Five-zone model + `+`/`-` staging, Pillar unit, wikilink convention, and declared-not-forked rule all still match the SKILL zone table, routing test, and bindings; long-form mode/convention detail unchanged.
- **`ki-arcadia-principal`** — confirmed. Full canonical structure, all zone indexes, `Admin/Governance/` (Charter.md + Governance.md) and `Admin/Operations/` (Operations.md) present; no zone aliases. audit.ts: 0 fail · 1 warn (Conformance.md absent). Config still on the pre-rename `[knowledgeislands-*]` prefix.
- **`kit-legal`** — confirmed. Full canonical structure on canonical zone names; no kb config table (no aliases); config now on the `[ki-*]` prefix. audit.ts: 0 fail · 3 warn (Charter/Conformance absent, one non-snake_case key). Zone-alias binding still has no live exemplar.
- **Per-base `.ki-config` declarations** — confirmed. No recurring base-specific declaration has emerged to promote into the standard this cycle.

Open watch-items:

1. **ki-\* rename split across bases.** kit-legal has migrated its `.ki-config.toml` tables to the `[ki-*]` prefix; ki-arcadia-principal still declares `[knowledgeislands-*]`. Shared `.ki-config.toml` contract (owned by `ki-repo`; tracked by the roadmap rename plan) — not a ki-kb model change. Re-check both bases land on `[ki-kb]` once the rename completes.
2. **No live `[ki-kb.zones]` exemplar.** Both tracked bases have dropped their aliases. The alias binding is kept as a reviewable override with no live exemplar — watch for a new base mid-migration to re-validate it against reality.
3. **Charter/Conformance adoption.** The model expects `Admin/Governance/Charter.md` + `Conformance.md`; ki-arcadia-principal lacks Conformance, kit-legal lacks both (all WARN). Watch whether exemplars adopt them or whether the expectation should soften.

[^ap]: The first real Knowledge Islands base this skill tracks. Sampled through its own `kb-fs` MCP server (`ki-arcadia-principal-mcp-kb-fs`) and its `CLAUDE.md` / memory index. It now carries the full canonical structure — `+`, `-`, `Admin/` (with `Admin/Admin.md` and `Admin/MEMORY.md`), `Calendar/`, `Pillars/`, `Resources/`, `Streams/`, each canonical zone with its same-name index — on the canonical zone names, declaring no zone aliases (though its `.ki-config.toml` still uses the pre-rename `[knowledgeislands-kb]` table — the `ki-*` rename is pending for this base). Its governance Pillar, `Pillars/Knowledge Capital/`, now sits within the canonical `Pillars/` zone, so the earlier mid-migration caveat no longer applies (confirmed 2026-06-21).

[^kl]: A second real base (`github.com/krisb/kit-legal`), sampled via its `kb-fs` MCP (`kit-legal-mcp-kb-fs`). It carries the fuller structure — `+`, `-`, `Admin/` (with `Admin/MEMORY.md`), `Calendar/`, `Pillars/` (with `Pillars/Pillars.md`), `Resources/`, `Streams/` — all on the canonical zone names. It earlier held its Pillars zone under a local folder name, declared as a `[ki-kb.zones]` alias; that rename has since completed and the alias has been dropped (its `.ki-config.toml` now carries no `[ki-kb.zones]` table, re-confirmed via its live MCP layout 2026-06-21 — `Pillars/Pillars.md` sits at the canonical folder). So it now documents the alias lifecycle's resolved end-state — transitional alias → dropped after the rename — rather than a live alias, and the zone-alias binding currently has no live exemplar among the tracked bases.

[kb-reference]: <Knowledge Islands KB Reference.md>
