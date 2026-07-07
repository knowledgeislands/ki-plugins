# Sources — ki-bootstrap

**Refresh:** canonical · on-change

Provenance only: the record of _what changed_ lives in git (the REFRESH commit), not a changelog here. This skill tracks no external spec — it is a Knowledge Islands install convention, re-anchored when the model it depends on changes (not on a clock).

## In-house

| Tag  | Source                    | Governs                                                             | Last reviewed |
| ---- | ------------------------- | ------------------------------------------------------------------- | ------------- |
| [KR] | `ki-repo` skill           | The `.ki-config.toml` contract and the coverage cascade †           | 2026-07-04    |
| [KE] | `ki-engineering` skill    | The enforcement framework ‡; `skills:*` scripts                     | 2026-07-04    |
| [KH] | `ki-harness` skill        | The four-part container and the skill-install convention §          | 2026-07-04    |
| [AH] | [README](../../README.md) | The reference implementation; the authoring hub linked with `--all` | 2026-07-04    |

† The coverage cascade is the set of `[ki-*]` tables the contract reads.

‡ Severity ladder, mode shape, checker contract.

§ This skill is the project-local counterpart of that convention.

## Last review

REFRESH last run **2026-07-04** (internal-model re-anchor; no web research — this skill tracks no external spec).

- [KR] `ki-repo` — **confirmed.** Coverage cascade unchanged; baseline is still `ki-repo` (bedrock marker) + `ki-authoring` (universal, cascade-exempt). See `ki-config-standard.md` §44/§52.
- [KE] `ki-engineering` — **confirmed.** enforcement-framework §2 severity ladder and checker contract unchanged.
- [KH] `ki-harness` — **confirmed.** `ki:skills:link:project` convention, the `--all` harness variant, and the `ki:skills:link:global` keystone install all intact.
- [AH] README — **confirmed.** Keystone / global-install framing intact; skill count grew to eighteen (generic `[ki-*]` model needs no edit).

### Open watch-items

- **Claude Code skill discovery** — the project-local model assumes `.claude/skills/` per session and `~/.claude/skills/` globally. Re-anchor if discovery locations or precedence change.
- **The coverage cascade [KR]** — if `ki-repo` changes the `[ki-*]` table contract or adds cascade-exempt universals beyond `authoring`, update the baseline/link-set rule in the standard and `link-skills.ts`.
- **New sibling skills** — the harness skill set grew (e.g. `ki-handoffs`, 2026-06-21). The standard is generic over the set so needs no per-skill edit, but a harness `.claude/skills/` can lag behind newly added skills (BOOT-1 WARN); re-run `ki:skills:link:project`.
