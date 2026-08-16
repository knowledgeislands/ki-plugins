# TOML formatting style

The **judgment-layer** presentation rules for the TOML written in Knowledge Islands repositories. TOML is a distinct standard because it has no mechanical house formatter and governs configuration readability rather than Markdown documents. Nothing in the house toolchain formats TOML (Biome owns TS/JSON, rumdl owns Markdown), so unlike Markdown there is no mechanical pass to fall back on: these conventions are applied by a person or model.

This file owns only **presentation** (how existing values and comments read). The identity and topology of `.ki-config.toml` — including keys, tables, the compliance marker, the one-table-per-skill model, validation, declared divergences, and scaffolding — are semantic contract questions owned by `ki-repo`. Do not rename or create keys or tables to satisfy this style.

## Keys and values

- **Strings** are double-quoted; **arrays** use the inline `["a", "b"]` form for short lists.
- **Comment non-obvious keys** with a `#` line above them — a declared value whose meaning isn't self-evident (why a value is set, what a flag gates) carries its _why_ inline, the same rule as everywhere else.
