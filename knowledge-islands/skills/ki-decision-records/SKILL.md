---
name: ki-decision-records
implies: []
description: >
  Codify, audit, and maintain Decision Records in any Knowledge Islands repo — the unified instrument replacing ki-adrs and ki-kdrs. Each decision_type has its own prefix: GDR- (governance), ADR- (architecture), KDR- (knowledge), SDR- (strategy), PDR- (product), DDR- (data), XDR- (security), ODR- (operations), RDR- (research). Serials are per-prefix within scope. Governs the Nygard five-section format, status lifecycle, and placement: docs/decisions/ for code repos, Admin/Governance/Decisions/ for KB repos. In KB repos DRs carry type: admin/governance/decision plus decision_type, per the KI-wide frontmatter standard in ki-kb. Use when writing, auditing, or conforming decision records. Triggers: "write a DR", "create a decision record", "document this decision", "audit the DRs". Off-ramps: ki-kb (island structure and frontmatter standard), ki-kb-streams (Enactment Process).
argument-hint: 'audit [dir] | conform [dir] | new <scope> "<title>" | refresh'
---

# Knowledge Islands Decision Records standard

You are applying the **Knowledge Islands Decision Records standard** — how Decision Records are written, named, maintained, and indexed in any Knowledge Islands repo, code or KB. DRs are the single instrument for significant standalone decisions; each `decision_type` has its own prefix so the kind of decision is readable from the filename alone. The full format with rationale lives in [the format standard](references/dr-format.md); the line-by-line checkable criteria live in [the rubric](references/audit-rubric.md); the canonical sources are in [sources](references/sources.md).

## What this skill owns

1. **The format standard** — the Nygard body sections (Title, Context, Decision, Consequences) plus the optional `## References` section and an optional `**Date:**` line, with exact writing guidance (active voice for Decision, value-neutral Context). A DR is a **living present-state record** — no status lifecycle, mutability marker, supersession chain, or changelog.
2. **The prefix table** — nine type-specific prefixes, one per `decision_type`:

   | Prefix | `decision_type` |
   | ------ | --------------- |
   | `SDR-` | `strategy`      |
   | `PDR-` | `product`       |
   | `ADR-` | `architecture`  |
   | `DDR-` | `data`          |
   | `XDR-` | `security`      |
   | `ODR-` | `operations`    |
   | `GDR-` | `governance`    |
   | `RDR-` | `research`      |
   | `KDR-` | `knowledge`     |

3. **The naming convention** — `<PREFIX>-<SCOPE>-NNN`: open scope (any uppercase alpha-leading token, multi-level), NNN is zero-padded (≥ 3 digits), monotonically increasing **per prefix within the scope** (NNN is unique for a given `<PREFIX>`+`<SCOPE>` — two DRs may share a serial if their prefixes differ).
4. **The living-record principle** — a DR states the decision as it stands **now** and is edited **in place**; there is no status lifecycle, no mutability marker, no supersession chain, and no changelog. A change of direction rewrites the live record rather than superseding it, so every record reads as if written today. See [dr-format.md](references/dr-format.md).
5. **The index rule** — `Decisions.md` (code: `README.md` or `Decisions.md`) must contain a table with one row per DR, ordered by filename.
6. **The placement rule** — `repo_type = "kb"` in `.ki-config.toml` → `Admin/Governance/Decisions/`; all others → `docs/decisions/`. Pass the actual path to the checker.
7. **The Enactment Process integration** — a DR is the formal artifact for an Enactment Process proposal whose `Decision` output warrants a standalone record.
8. **The mechanical checker** — [`scripts/audit-drs.ts`](scripts/audit-drs.ts) validates filenames, prefix–type agreement, required sections, an optional `**Date:**` field, `type`/`decision_type` fields (KB mode), serial uniqueness, and index completeness/date-sync. Detects KB vs code mode automatically from `.ki-config.toml`.

## Operating modes

Carries **AUDIT · CONFORM · REFRESH**, plus **NEW** (draft a new DR). If invoked without a mode, use `AskUserQuestion` to list each mode with a one-line description; if the chosen mode shows a target in the `argument-hint`, prompt for that too.

### Mode AUDIT

→ Read [references/mode-audit-conform.md](references/mode-audit-conform.md)

### Mode CONFORM

→ Read [references/mode-audit-conform.md](references/mode-audit-conform.md)

### Mode NEW

→ Read [references/mode-new.md](references/mode-new.md)

### Mode REFRESH

→ Read [references/mode-refresh.md](references/mode-refresh.md)

## Notes

- **Records are edited in place** — a DR is kept true by editing it, not by superseding it; there is no `## Changelog` and no supersession chain. A change of direction rewrites the record so it always reads as current.
- **Scope convention** — use the island/repo identifier from `.ki-config.toml` as the primary scope segment (e.g. `ARCADIA`). Multi-level scopes are valid for sub-domain decisions (e.g. `ARCADIA-TOOLS`).
- **Serials are per-prefix within scope** — NNN is unique for a given `<PREFIX>`+`<SCOPE>`. `GDR-ARCADIA-001` and `SDR-ARCADIA-001` are both valid; two DRs never share the same prefix+scope+serial.
- **Not every proposal needs a DR** — routine content additions, typo fixes, and minor configuration changes do not warrant one. Reserve DRs for decisions with standalone standing.
- **KB repos** use `Admin/Governance/Decisions/` and require frontmatter (`type`, `decision_type`, `status`, `author`). **Code repos** use `docs/decisions/` and frontmatter is optional.
- The KI-wide frontmatter standard (universal fields and the `type` taxonomy) lives in `ki-kb`'s [frontmatter-standard.md](../ki-kb/references/frontmatter-standard.md).
- Checker output conforms to the severity ladder, JSON shape, and exit-code contract in `ki-engineering`'s [checker-contract.md](../ki-engineering/references/checker-contract.md).
