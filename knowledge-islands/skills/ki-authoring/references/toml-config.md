# TOML formatting style

The **judgment-layer** formatting rules for the TOML we write in Knowledge Islands repos — in practice the shared **`.ki-config.toml`** file a repo carries. Nothing in the house toolchain formats TOML (Biome owns TS/JSON, Prettier + markdownlint own Markdown), so unlike Markdown there is no mechanical pass to fall back on: **these conventions are the whole of it**, applied by hand.

This file owns only the **formatting** (how the TOML reads). The `.ki-config.toml` **contract** — what its presence means (the Knowledge Islands compliance marker), the one-table-per-skill model, the validate-your-own-table protocol, declared divergences, and scaffolding — is owned by the `ki-repo` skill; see its [`ki-config-standard.md`](../../ki-repo/references/ki-config-standard.md).

## Keys and values

- **Keys** are lowercase; use `snake_case` for multi-word keys (the prevailing TOML convention). Keep them to the noun the value holds (`visibility`, not `repo_visibility_setting`).
- **Strings** are double-quoted; **arrays** use the inline `["a", "b"]` form for short lists.
- **One table per skill, named for the skill** (`[ki-repo]`), with sub-tables nested under it (`[ki-repo.checks]`) — the file reads as a map of skill → its settings. The ownership rules behind this live in the contract (above).
- **Comment non-obvious keys** with a `#` line above them — a declared value whose meaning isn't self-evident (why a value is set, what a flag gates) carries its _why_ inline, the same rule as everywhere else.
