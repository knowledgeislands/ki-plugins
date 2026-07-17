---
name: ki-tools
implies: []
vendors: [educate, audit, conform, help]
description: >
  Audit, conform, or scaffold a Knowledge Islands `tools-*` repo — ONE standalone command-line tool per repo, distributed by a `curl | bash` installer AND a companion Homebrew tap formula. Governs the container SHAPE language-agnostically (bash today, a future Python/Go tool fits): the `bin/<tool>` executable + its exec bit, `install.sh`, versioning + `--version` + `vX.Y.Z` tags, `CHANGELOG.md`, a CI workflow, and capability conditionals (a shell entrypoint needs shellcheck + a bats suite; a `package.json` defers to `ki-engineering`). Triggers: "audit this tool repo", "scaffold a CLI tool", "release a command-line tool", "does this tools- repo follow our standard", "check my tools- repo". Off-ramps: the Homebrew tap + its formula → `ki-homebrew-tap`; GitHub settings and standard files (README, LICENSE) → `ki-repo`; a TS/Bun toolchain (`package.json`) → `ki-engineering`. Container, not contents — it does not judge the tool's internal code quality.
argument-hint: 'audit <repo> | conform <repo> | help | educate <repo> | refresh'
---

# Knowledge Islands tool-repo standard

You are helping audit, conform, or scaffold a **`tools-*` repo** — a repo holding exactly **one** standalone command-line tool, distributed two ways: a `curl | bash` installer at the repo root, and a companion Homebrew formula that lives in the tap. The reference implementation is [`tools-mgit`](https://github.com/knowledgeislands/tools-mgit), a bash CLI (`bin/mgit`), but the standard governs the **shape**, not the language — a future Python or Go tool fits the same container.

This skill rides on `ki-repo` (local files, GitHub settings) but **not** `ki-engineering` — a bash tool has no TypeScript/Bun toolchain to govern, so no `[ki-engineering]` is assumed (the same pattern `ki-kb` follows). If the tool grows a `package.json`, that changes: it then declares `[ki-engineering]` too and defers its lint/test there (see the capability rule below).

The full, quotable standard lives in [tools-standard.md](references/tools-standard.md); the line-by-line pass/fail items live in [audit-rubric.md](references/audit-rubric.md). The mechanical checker is [`scripts/audit.ts`](scripts/audit.ts). Read those when you need detail; this file is the operating procedure.

## Container, not contents

This skill judges the **container** — the repo's shape — not the **contents**, the quality of the tool's own code:

- **In scope:** the `bin/<tool>` layout and its exec bit, `install.sh`, versioning + `--version`, `CHANGELOG.md`, the CI workflow, the test suite's presence, and the capability conditionals below.
- **Out of scope:** whether the tool's logic is correct, well-factored, or fast. That is the tool author's concern (and, for a shell tool, shellcheck + bats — which this skill checks are _wired_, not what they _find_). The Homebrew tap and its formula are `ki-homebrew-tap`'s; the repo's README, LICENSE, and GitHub settings are `ki-repo`'s.

## The canonical shape at a glance

```text
tools-<name>/
├── bin/<name>              # THE executable — chmod +x (git tracks the exec bit). Answers --version.
├── install.sh              # curl installer: POSIX-ish, honours env overrides (target dir + version),
│                           #   verifies the download, idempotent. The `curl | bash` contract.
├── tests/                  # executable test suite (a *.bats suite for a shell tool). Expected.
├── .github/workflows/*.yml # CI: lint + test on every push. Expected.
├── CHANGELOG.md            # keep-a-changelog + semver. Releases are vX.Y.Z git tags + a GitHub release each.
├── README.md · LICENSE     # ki-repo's job — not governed here.
└── .ki-config.toml         # carries [ki-repo] + [ki-tools] (the opt-in marker).
```

`bin/` with ≥1 executable file is the only hard requirement (**FAIL** if missing); everything else is **WARN** — expected but not ship-stopping. The companion Homebrew formula lives in the tap repo (`homebrew-<x>`, `Formula/<name>.rb`), governed by `ki-homebrew-tap` — cross-reference it, don't reproduce it.

## The capability-conditional rule

Mirrors `ki-engineering`'s capability-conditional pattern: what the repo _is_ decides which checks apply, so the same standard covers a bash tool and a TS tool without forking.

- **Shell entrypoint** (the primary `bin/` file has a `bash`/`sh` shebang): it MUST be shellcheck-clean in CI (a workflow references `shellcheck`) and ship a `bats` suite that CI runs (a `*.bats` file under `tests/` and a workflow that references `bats`).
- **A `package.json` appears** (a TS/Bun tool): the repo defers lint/test to `ki-engineering` and MUST also declare `[ki-engineering]` in its `.ki-config.toml`. The shell checks don't apply.
- **Another language** (Python, Go, …): defer to that language's own toolchain; the container checks (bin, install.sh, versioning, changelog, CI, tests) still apply.

## The `[ki-tools]` marker

A `tools-*` repo opts into this standard by declaring a **keyless** `[ki-tools]` table in its `.ki-config.toml` — a bare marker, exactly like `[ki-mcp]`. The table is validated **down** (this skill reads only its own table and warns on any unknown key inside it). Run `bun scripts/audit.ts --educate` to print the default block.

## Operating modes

Every governance skill carries the universal four **AUDIT · CONFORM · EDUCATE · REFRESH**; EDUCATE here scaffolds a new tool repo. Invoked as `help` / `-h` / `?`, it explains itself and stops — the generated HELP block (name, purpose, invocation, modes, off-ramps), taking no action. With no mode it does the same, then, in an interactive session only, offers the mode choice via `AskUserQuestion`, prompting for any `argument-hint` target the chosen mode shows.

### Mode AUDIT

→ Read [references/mode-audit-conform.md](references/mode-audit-conform.md)

### Mode CONFORM

→ Read [references/mode-audit-conform.md](references/mode-audit-conform.md)

### Mode EDUCATE

→ Read [references/mode-educate.md](references/mode-educate.md)

### Mode REFRESH

→ Read [references/mode-refresh.md](references/mode-refresh.md)

## Notes

- The standard is anchored to `tools-mgit` as the reference shape and to external specs (shellcheck, bats, keep-a-changelog, semver, XDG) — the tracked [source list](references/sources.md) records them; Mode REFRESH re-fetches on the declared cadence.
- Refer to another skill by its `name` (`ki-repo`, `ki-engineering`, `ki-homebrew-tap`), never a file path — skills are relocatable.
- Checker output conforms to the severity ladder, JSON shape, and exit-code contract in `ki-engineering`'s [checker-contract.md](../../foundations/ki-engineering/references/checker-contract.md).
