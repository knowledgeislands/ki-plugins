---
name: ki-decision-records
ki-kind: governance
ki-depends-on: []
ki-shared-dependencies: [ki-skills:rubric]
description: >
  Codify, audit, and maintain Decision Records in any Knowledge Islands repo — the unified instrument replacing ki-adrs and ki-kdrs. Each decision type has its own prefix: GDR- (governance), ADR- (architecture), KDR- (knowledge), SDR- (strategy), PDR- (product), DDR- (data), XDR- (security), ODR- (operations), RDR- (research). Serials are per-prefix within scope. Governs universal metadata, the Nygard five-section format, and placement: docs/decisions/ for code repos, Admin/Governance/Decisions/ for KB repos. A DR's status records document currency, never a decision lifecycle. Use when writing, auditing, or conforming decision records. Triggers: "write a DR", "create a decision record", "document this decision", "audit the DRs". Off-ramps: ki-repo-kb (island structure and frontmatter standard), ki-repo-kb-streams (Enactment Process).
argument-hint: 'audit [dir] | conform [dir] | help | educate [dir] | new <scope> "<title>" | refresh'
---

# Knowledge Islands Decision Records standard

You are applying the **Knowledge Islands Decision Records standard** — how Decision Records are written, named, maintained, and indexed in any Knowledge Islands repo, code or KB. DRs are the single instrument for significant standalone decisions; each `decision_type` has its own prefix so the kind of decision is readable from the filename alone. The full format with rationale lives in [the Decision Records standard](references/standards-decision-records.md); the line-by-line checkable criteria live in [the generated rubric](references/rubric.md); the canonical sources are in [the source list](references/sources.md).

## What this skill owns

1. **The format standard** — required YAML frontmatter (ID, title, date, maintenance status, `decision_type`, and `decision_type_url`), Nygard body sections (Title, Context, Decision, Consequences), and the optional `## References` section, with exact writing guidance (active voice for Decision, value-neutral Context). A DR is a concise, self-contained **living present-state record**: edit it in place, without historical narrative, a supersession chain, or changelog.
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

3. **The naming convention** — the filename is `<ID>-<title-slug>.md`: the canonical uppercase ID followed by the title lowercased with non-alphanumeric runs compressed to one dash. The H1 is `<ID>: <title>`, with an open uppercase-alpha-leading scope and a zero-padded serial (≥ 3 digits), monotonically increasing **per prefix within the scope** (NNN is unique for a given `<PREFIX>`+`<SCOPE>` — two DRs may share a serial if their prefixes differ).
4. **The living-record principle** — a DR states the decision as it stands **now** and is edited **in place**. Before creating a record, locate the existing record that owns the concern and amend it when the proposed change refines, qualifies, or changes that decision. Create a record only for a genuinely independent decision with standalone, durable value. A record contains neither historical narrative, lifecycle language, nor a supersession chain or changelog. A change of direction rewrites the live record so every record reads as if written today. See [the Decision Records standard](references/standards-decision-records.md).
5. **The index rule** — `Decisions.md` in a KB or `README.md` in a code repository must contain an ordered list, one item per DR, in reveal order. A newly created collection begins with `GDR-<SCOPE>-001: Adopting Decision Records`; established collections remain migration cases.
6. **The placement rule** — `repo_type = "kb"` in `.ki-config.toml` → `Admin/Governance/Decisions/`; all others → `docs/decisions/`. Pass the actual path to the checker.
7. **The Enactment Process integration** — a DR is the formal artifact for an Enactment Process proposal whose `Decision` output warrants a standalone record.
8. **The structured rubric** — the catalogue under `scripts/rubric/` validates filenames, required sections, required universal frontmatter, metadata alignment with the filename's canonical type, serial uniqueness, index completeness, and reveal-order serial ascension within each prefix. It resolves KB versus code placement from `.ki-config.toml` and exposes only session-owned index drafts to CONFORM. The generic `ki` host owns execution, findings, publication, rollback, and reporting. Semantic prefix fit remains a judgment check.

## Operating modes

Carries the universal **AUDIT · CONFORM · EDUCATE · REFRESH**, plus **NEW** (draft a new DR). Invoked as `help` / `-h` / `?`, it explains itself and stops — the generated HELP block (name, purpose, invocation, modes, off-ramps), taking no action. With no mode it does the same, then, in an interactive session only, offers the mode choice via `AskUserQuestion`, prompting for any `argument-hint` target the chosen mode shows.

### Mode AUDIT

→ Read [the AUDIT procedure](references/mode-audit.md).

### Mode CONFORM

→ Read [the CONFORM procedure](references/mode-conform.md).

### Mode EDUCATE

Run `ki repo educate --skill ki-decision-records --repo <repo>` to render the catalogue's concern and families. To establish the collection itself, scaffold the decisions directory per the placement rule (`docs/decisions/` for code repos, `Admin/Governance/Decisions/` for KB repos) with its index (`Decisions.md`, or `README.md` in code repos); **NEW** then authors individual DRs into it.

### Mode NEW

→ Read [the NEW procedure](references/mode-new.md).

### Mode REFRESH

→ Read [the REFRESH procedure](references/mode-refresh.md).

## Notes

- **Records are edited in place** — a DR is kept true by editing it. It has no `## Changelog`, supersession chain, or historical framing; a change of direction rewrites the record so it always reads as current.
- **Scope convention** — use the island/repo identifier from `.ki-config.toml` as the primary scope segment (e.g. `ARCADIA`). Multi-level scopes are valid for sub-domain decisions (e.g. `ARCADIA-TOOLS`).
- **Serials are per-prefix within scope** — NNN is unique for a given `<PREFIX>`+`<SCOPE>`. `GDR-ARCADIA-001` and `SDR-ARCADIA-001` are both valid; two DRs never share the same prefix+scope+serial. A deliberately byte-identical cross-repository record declares `shared_record: true`; it retains its canonical ID and is excluded from a receiving collection’s local serial series only when no ordinary local record has that prefix+scope.
- **Amend before NEW** — first locate the record that owns the concern. Refinements, qualifications, and changes of direction update that living record in place; a new DR is reserved for a genuinely independent decision with standalone, durable standing. Routine content additions, typo fixes, and minor configuration changes do not warrant one.
- **All repos** require frontmatter (`id`, `title`, `date`, `status`, `decision_type`, `decision_type_url`). Generic `type` and `type_url` are not DR fields. KB repos use `Admin/Governance/Decisions/`; code repos use `docs/decisions/`.
- The KI-wide frontmatter standard owns generic note metadata; this skill owns decision-specific metadata.
- Checker output conforms to the canonical JSONL response and reporter contract owned by `ki-skills`; judgment aspects are counted as unevaluated rather than emitted as synthetic findings.
