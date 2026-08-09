<!-- GENERATED FILE: produced by `ki dev skill rubric`. Do not hand-edit; edit scripts/rubric/items/, then rerun `ki dev skill rubric <skill> --write`. -->

# Generated rubric — generated Claude plugin marketplace projection

> **Generated publication.** The TypeScript rubric items under `scripts/rubric/items/` are canonical. Edit those definitions, then rerun `ki dev skill rubric ki-repo-plugins --write`.

Line-by-line criteria for auditing ki-repo-plugins. Classifications are derived from item aspects: **[M]** mechanical, **[J]** judgment, **[M + J]** hybrid, and **[M-heuristic + J]** hybrid with heuristic mechanical evidence. Sources are cited as declared by each canonical item.

## Contents

- [PLUG — Plugin marketplace projection](#plug--plugin-marketplace-projection)
- [RUBRIC — Generated rubric publication](#rubric--generated-rubric-publication)

## PLUG — Plugin marketplace projection

→ [standard](standards-plugin-marketplace.md)

The marketplace manifest, generated plugin projection, and repository scaffold.

- **PLUG-1 [M] — Marketplace manifest** — `.claude-plugin/marketplace.json` exists and parses. (standards-plugin-marketplace.md)
  - _Remediation:_ diagnostic — Correct the marketplace projection from its authoritative harness inputs; do not infer or rewrite generated projection semantics automatically.
- **PLUG-2 [M] — Marketplace ownership** — `owner.name` is `Knowledge Islands`; `plugins` lists exactly one entry. (standards-plugin-marketplace.md)
  - _Remediation:_ diagnostic — Correct the marketplace projection from its authoritative harness inputs; do not infer or rewrite generated projection semantics automatically.
- **PLUG-3 [M] — Plugin entry** — The plugin entry has `name`, `source = ./<name>`, and a description; the physical source directory exists. (standards-plugin-marketplace.md)
  - _Remediation:_ diagnostic — Correct the marketplace projection from its authoritative harness inputs; do not infer or rewrite generated projection semantics automatically.
- **PLUG-4 [M] — Manifest formatting** — Plugin JSON manifests use two spaces and a trailing newline. (standards-plugin-marketplace.md)
  - _Remediation:_ diagnostic — Correct the marketplace projection from its authoritative harness inputs; do not infer or rewrite generated projection semantics automatically.
- **PLUG-5 [M] — Plugin manifest** — `<plugin>/.claude-plugin/plugin.json` exists, parses, and its name matches the source directory. (standards-plugin-marketplace.md)
  - _Remediation:_ diagnostic — Correct the marketplace projection from its authoritative harness inputs; do not infer or rewrite generated projection semantics automatically.
- **PLUG-6 [M] — Plugin author** — `author.name` is `Knowledge Islands`. (standards-plugin-marketplace.md)
  - _Remediation:_ diagnostic — Correct the marketplace projection from its authoritative harness inputs; do not infer or rewrite generated projection semantics automatically.
- **PLUG-7 [M] — Plugin version and description** — `version` is semver and `description` matches the marketplace entry. (standards-plugin-marketplace.md)
  - _Remediation:_ diagnostic — Correct the marketplace projection from its authoritative harness inputs; do not infer or rewrite generated projection semantics automatically.
- **PLUG-8 [M] — Projected skills** — `<plugin>/skills/*` each carries a physical `SKILL.md`. (standards-plugin-marketplace.md)
  - _Remediation:_ diagnostic — Correct the marketplace projection from its authoritative harness inputs; do not infer or rewrite generated projection semantics automatically.
- **PLUG-9 [M] — Flattened agents** — `<plugin>/agents/*.md` are physical flat files. (standards-plugin-marketplace.md)
  - _Remediation:_ diagnostic — Correct the marketplace projection from its authoritative harness inputs; do not infer or rewrite generated projection semantics automatically.
- **PLUG-10 [M] — MCP deferral** — No `.mcp.json` appears in the plugin. (standards-plugin-marketplace.md)
  - _Remediation:_ diagnostic — Correct the marketplace projection from its authoritative harness inputs; do not infer or rewrite generated projection semantics automatically.
- **PLUG-11 [J] — Projection freshness** — The projected skill and agent set matches the current harness. (standards-plugin-marketplace.md)
  - _Evidence scope:_ The generated marketplace projection and its authoritative harness inputs.
  - _Review prompt:_ Does the projected skill and agent set match the current harness without stale or missing entries?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Regenerate or revise the projection through its responsible owner, record a named gap, or record an explicit justified exclusion.
- **PLUG-12 [J] — Projection reproducibility** — Running the canonical `ki-binding` generator leaves no diff. (standards-plugin-marketplace.md)
  - _Evidence scope:_ The generated marketplace projection and its authoritative harness inputs.
  - _Review prompt:_ Is the complete projection byte-for-byte reproducible from the current harness?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Regenerate or revise the projection through its responsible owner, record a named gap, or record an explicit justified exclusion.
- **PLUG-13 [M] — Repository scaffold** — `LICENSE`, `README.md`, `.gitignore`, and `CLAUDE.md` are physical files. (standards-plugin-marketplace.md)
  - _Remediation:_ diagnostic — Correct the marketplace projection from its authoritative harness inputs; do not infer or rewrite generated projection semantics automatically.
- **PLUG-14 [M] — Generated-content warning** — `CLAUDE.md` states the generated-not-hand-edited invariant. (standards-plugin-marketplace.md)
  - _Remediation:_ diagnostic — Correct the marketplace projection from its authoritative harness inputs; do not infer or rewrite generated projection semantics automatically.
- **PLUG-15 [M] — Governance declaration** — Applicable repositories declare `[skills.ki-repo-plugins]` and no unknown keys. (standards-plugin-marketplace.md)
  - _Remediation:_ diagnostic — Correct the marketplace projection from its authoritative harness inputs; do not infer or rewrite generated projection semantics automatically.
- **PLUG-16 [J] — Projection documentation** — `README.md` and `CLAUDE.md` describe the projection model without drift and the licence exception remains deliberate. (standards-plugin-marketplace.md)
  - _Evidence scope:_ The generated marketplace projection and its authoritative harness inputs.
  - _Review prompt:_ Do the repository documents accurately describe the projection, generated-content boundary, and deliberate licence exception?
  - _Outcomes:_ conforming; gap; exclusion
  - _Conforming guidance:_ Regenerate or revise the projection through its responsible owner, record a named gap, or record an explicit justified exclusion.

## RUBRIC — Generated rubric publication

→ [standard](../../../keystone/ki-skills/references/standards-rubric-authoring.md)

The tracked readable rubric is the exact publication of the structured catalogue.

- **RUBRIC-1 [M] — structured catalogue publication is exact** — A structured catalogue tracks `references/rubric.md` as its exact generated publication. The host supplies only validated publication evidence: a missing or differing file is a FAIL; during CONFORM this item requests the host-owned derived write without choosing its path or bytes. (../../../keystone/ki-skills/references/standards-rubric-authoring.md#generated-rubric-publication)
  - _Remediation:_ automatic
