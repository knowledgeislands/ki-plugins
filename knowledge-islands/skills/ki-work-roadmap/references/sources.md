# Sources

**Refresh:** canonical · on-change

| Source | Last reviewed | Governs |
| --- | --- | --- |
| `ROADMAP.md` | 2026-08-12 | Repository-local planning practice, work items, horizons, theme grouping, indexes, and lifecycle |
| [Change-management adapter standard](../../ki-work/references/standards-change-management-adapters.md) | 2026-08-12 | Selector resolution, abstract lifecycle vocabulary, and ownership boundary |
| [`ki-repo-kb-streams` Streams standard](../../../repo-structure/ki-repo-kb-streams/references/standards-streams-structure.md#roadmap) | 2026-08-12 | KB boundary, placement, and off-ramp |

## Last review

The repo-roadmap boundary uses one clean non-KB shape: flat durable work items, grouped by an explicit theme field and indexed from the root roadmap. A work item is enriched in place when it needs execution detail; no parallel plan record or theme tree survives. KB Streams is the native placement container and reuses this adapter's concrete record model. The source record retains directly inspectable canonical material only. Refresh on a normative change or when real repositories expose friction the current item model cannot represent cleanly.
