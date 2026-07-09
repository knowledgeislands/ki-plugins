# Sources

**Refresh:** canonical · on-change

This skill's standard is canonical to the Knowledge Islands harness — the live artifact pattern has no external specification. Run REFRESH when the pairing convention, required frontmatter, or the artifacts directory changes across bases.

| Source                                                  | What it governs                                       | Last reviewed |
| ------------------------------------------------------- | ----------------------------------------------------- | ------------- |
| ki-arcadia-principal `Admin/Operations/Live Artifacts/` | Reference implementation of the live artifact pattern | 2026-07-04    |
| `ki-kb` SKILL.md                                        | Admin/Operations/ zone that hosts live artifacts      | 2026-07-04    |
| `ki-authoring` SKILL.md                                 | Markdown style for the .md source files               | 2026-07-04    |

## Last review

REFRESH last run **2026-07-04** (internal-model skill — re-checked our own model against current internal reality, no web research).

- **ki-arcadia-principal `Admin/Operations/Live Artifacts/`** — _confirmed._ Directory and `Live Artifacts.md` index note still present. Still index-only: no `.md`/`.html` artifact pairs exist yet, so the pairing convention and sync threshold remain unexercised against real data.
- **`ki-kb` SKILL.md** — _confirmed._ `Admin/Operations/` zone still declared and still the host for live artifacts; composition edge to `ki-kb` accurate.
- **`ki-authoring` SKILL.md** — _confirmed._ Still governs Markdown style for the `.md` source files; off-ramp accurate.

No model drift: render types (`html`), required frontmatter (`status`, `renders`, `author`), and the artifacts-dir default are unchanged in the reference base.

Open watch-items:

- Reference base still has zero real artifact pairs — the LA-S-2/3/4 sync checks and the 24h `sync_threshold_hours` binding are unvalidated end-to-end. Re-anchor once the first live pair lands.
- SKILL.md modes line omits the shipped NEW mode (see AUDIT finding) — fold into the same commit as this REFRESH.
