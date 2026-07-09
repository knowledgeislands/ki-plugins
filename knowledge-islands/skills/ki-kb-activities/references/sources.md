# Sources

**Refresh:** canonical · on-change

This skill's standard is canonical to the Knowledge Islands harness — it has no external specification. Run REFRESH when the realization model changes (new environment type, new required field) or when the Activities pattern diverges from this document across bases.

| Source | What it governs | Last reviewed |
| --- | --- | --- |
| ki-arcadia-principal `Admin/Operations/Activities/` | Live base sampled for realization types in use — currently PRE-ADOPTION: legacy activity-group notes, non-conformant (no realization field, free-text status) | 2026-07-04 |
| `ki-kb` SKILL.md | Zone model and Admin/ subdivision that hosts activities | 2026-07-04 |
| `ki-harness` SKILL.md | Four-part bundle layout; skills/ resolution path | 2026-07-04 |

## Last review

**REFRESH last run 2026-07-04** (internal-model re-anchor — no web research).

- **ki-arcadia-principal `Admin/Operations/Activities/`** — DRIFT. The cited reference implementation does not conform to this skill's own standard and has not adopted the skill. All activity notes use free-text `status: current - April 2026` (not `active|paused|retired`, ACT-F-1); none carry a `realization` field (ACT-F-2; all ACT-R-* checks inert); notes are group-scoped (`[Group] [Name] Activity.md`) rather than per-activity `<Activity Name>.md`; the index defers the roster to the Charter. Base `.ki-config.toml` has no `[ki-kb-activities]` table and still uses legacy `knowledgeislands-*` skill names. Last reviewed cell moved to 2026-07-04 but re-anchored as pre-adoption, not conformant.
- **`ki-kb` SKILL.md** — CONFIRMED. Admin/Operations/ subdivision hosting activities is present and current; composition edge accurate. Bumped to 2026-07-04.
- **`ki-harness` SKILL.md** — CONFIRMED. Four-part layout and `skills/<name>/SKILL.md` resolution path unchanged; composition edge accurate. Bumped to 2026-07-04.

### Open watch-items

- **Reference-implementation gap.** The skill has no live, conformant reference base. Either conform ki-arcadia-principal's Activities notes (add `realization`, switch status to the enum, add a `[ki-kb-activities]` table) so the citation is honest, or reclassify the citation as a pre-adoption sample. Decide direction before next REFRESH.
- **Standard-vs-reality direction.** Confirm whether the per-activity note model or the base's activity-GROUP model is intended. If groups are real practice, the SKILL's Activity model (one note = one behaviour) may need revisiting.
- **Legacy skill-name rename.** ki-arcadia-principal still uses `knowledgeislands-*` config names; when it adopts `ki-kb-activities` it should use the `ki-*` name. Base-migration concern, tracked here only because it blocks the reference base from becoming conformant.
