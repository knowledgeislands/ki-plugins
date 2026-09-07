# TOML formatting style

The **judgment-layer** presentation rules for the TOML written in Knowledge Islands repositories. TOML is a distinct standard because it has no mechanical house formatter and governs configuration readability rather than Markdown documents. Nothing in the house toolchain formats TOML (Biome owns TS/JSON, rumdl owns Markdown), so unlike Markdown there is no mechanical pass to fall back on: these conventions are applied by a person or model.

This file owns only **presentation** (how existing values and comments read). The identity and topology of `.ki.toml` — including keys, tables, the compliance marker, the one-table-per-skill model, validation, declared divergences, and scaffolding — are semantic contract questions owned by `ki-repo`. Do not rename or create keys or tables to satisfy this style.

## Keys and values

- **Strings** are double-quoted; **arrays** use the inline `["a", "b"]` form for short lists.
- **Comment non-obvious keys** with a `#` line above them — a declared value whose meaning isn't self-evident (why a value is set, what a flag gates) carries its _why_ inline, the same rule as everywhere else.

## Configuration structure

In `.ki.toml`, the exact conformance header, skill-root declarations, semantic neighbourhoods, and owner boundaries belong to the `ki-repo` contract. Presentation makes those boundaries legible without changing the parsed data.

`ki-repo` defines the mechanically checked compact/substantial threshold and banner ordering in the shared configuration contract. A substantial `.ki.toml` MUST render the exact `Foundation` banner and each additional neighbourhood it needs with a concise three-line comment banner. Omit empty neighbourhoods and omit optional banners in a compact file where they would add more ceremony than navigation. The exact two-line conformance header and its following blank line remain first; decorative rules may follow them, but must not wrap or precede them.

```toml
# Knowledge Islands repository configuration.
# Its presence declares conformance with the Knowledge Islands repository standard.

# =============================================================================

# -----------------------------------------------------------------------------
# Foundation
# -----------------------------------------------------------------------------
```

After an explicit `[skills.<name>]` root, a short subordinate map entry **SHOULD** use a dotted key when its complete value remains readable on one line. This keeps declaration and configuration in one owner block:

```toml
[skills.ki-work-roadmap]
areas.UE = "user-environment"

[skills.ki-agora]
memberships.ki-all = { home = "https://github.com/knowledgeislands/ki-agentic-harness", role = "maintainer" }

[skills.ki-trades]
routes."knowledgeislands/tools-ki" = { export = ["work", "knowledge"], import = ["work", "knowledge"] }
```

Use a standard nested table instead when a record is multiline, needs its own comments, carries further nested configuration, or would make an inline value hard to scan. Do not split an inline table across lines merely to retain the compact spelling. Dotted keys and nested tables are presentation-equivalent only when they produce the same parsed table; removing a duplicated or derivable key is a separate semantic change governed by the owning skill.
