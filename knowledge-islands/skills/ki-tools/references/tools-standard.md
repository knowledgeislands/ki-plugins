# Knowledge Islands tool-repo standard

The full, quotable standard behind the `ki-tools` skill. A `tools-*` repo holds **one** standalone command-line tool, distributed by a `curl | bash` installer and a companion Homebrew tap formula. This document governs the **container** — the repo's shape — language-agnostically. The reference implementation is `tools-mgit` (a bash CLI). The line-by-line audit items are in [audit-rubric.md](audit-rubric.md); the tracked external specs are in [sources.md](sources.md).

## Contents

- [Scope: container, not contents](#scope-container-not-contents)
- [Repository layout](#repository-layout)
- [The executable — `bin/<tool>`](#the-executable--bintool)
- [Versioning & releases](#versioning--releases)
- [The distribution contract](#the-distribution-contract)
- [Capability conditionals](#capability-conditionals)
- [The `[ki-tools]` marker](#the-ki-tools-marker)
- [What other skills own](#what-other-skills-own)

## Scope: container, not contents

This standard judges the **container** (the repo's shape) — it does **not** judge the **contents** (the quality of the tool's own code). A shell tool must be shellcheck-clean and carry a bats suite; this standard checks those are **wired into CI**, not what they report. Whether the tool's logic is correct, well-factored, or fast is the author's concern.

Applicability is declaration or structure: `[ki-tools]` in `.ki-config.toml` or a root `bin/` directory activates the complete audit. With neither, the checker reports one `NA` and stops. A declared repository without `bin/` and an undeclared repository with `bin/` remain applicable; the former fails the executable-container requirement and the latter is audited for the missing declaration.

One tool per repo. A repo that would ship two distinct tools is two repos.

## Repository layout

```text
tools-<name>/
├── bin/<name>              # THE executable — required, chmod +x.
├── install.sh              # curl installer (the `curl | bash` contract). Expected.
├── tests/                  # executable test suite (a *.bats suite for a shell tool). Expected.
├── .github/workflows/*.yml # CI: lint + test on every push. Expected.
├── CHANGELOG.md            # keep-a-changelog + semver. Expected.
├── README.md · LICENSE     # ki-repo's job.
└── .ki-config.toml         # [ki-repo] + [ki-tools].
```

- **`bin/` with ≥1 executable file is the only hard requirement** — its absence is a FAIL, since without it there is no tool. Everything else is expected-but-optional (WARN when absent): a repo can be mid-scaffold.
- The **primary** bin file is the one whose name matches the repo's `<name>` (a `tools-mgit` repo → `bin/mgit`); the capability checks read its shebang.

## The executable — `bin/<tool>`

- Lives at `bin/<tool>` and carries the **executable bit**. Git tracks the exec bit, so `chmod +x bin/<tool>` is committed once and travels with the repo — a bin file without it is a FAIL (the curl installer and Homebrew formula both rely on it).
- Answers `--version` (and `-V` where the CLI convention allows), printing the tool name and version. This is the machine-checkable contract behind the version marker below.
- Follows the XDG Base Directory spec for any config/state/cache it writes (`$XDG_CONFIG_HOME`, `$XDG_STATE_HOME`, `$XDG_CACHE_HOME` with the documented `$HOME`-relative fallbacks) rather than scattering dotfiles in `$HOME`.

## Versioning & releases

- The tool carries a **version marker** — a single literal in the bin file (e.g. `MGIT_VERSION=0.1.0`) — that `--version` prints. One source of truth; no second copy to drift.
- Releases are **`vX.Y.Z` git tags**, each with a **GitHub release**. The version marker, the tag, and the top `CHANGELOG.md` entry agree.
- `CHANGELOG.md` follows [keep-a-changelog](https://keepachangelog.com/) with [semver](https://semver.org/): an `## [Unreleased]` section at the top, then a dated `## [X.Y.Z]` section per release, grouped by Added / Changed / Fixed / Removed.
- Tags and releases can't be seen from a checkout path — the checker hands this to the judgment pass (RELEASE, ADVISORY).

## The distribution contract

Two delivery channels, both required for a shipped tool:

1. **`install.sh` at the repo root** — the `curl | bash` installer:
   - POSIX-ish shell, runnable as `curl -fsSL <raw-url>/install.sh | bash`.
   - **Honours env overrides**: a target directory (e.g. `MGIT_INSTALL_DIR`, falling back to `$HOME/.local/bin`) and a version/ref to install (e.g. `MGIT_VERSION`, defaulting to the latest release).
   - **Verifies the download** (the fetch succeeds and lands a non-empty executable) before installing.
   - **Idempotent**: re-running installs/upgrades cleanly without corrupting an existing install.
   - Executable itself (`chmod +x install.sh`).
2. **A companion Homebrew formula** — `Formula/<name>.rb` in the tap repo (`homebrew-<x>`), installable via `brew tap` + `brew install`. The **tap** and its formula are governed by the sibling `ki-homebrew-tap` skill, not here — this standard only requires that a tap formula exists as the second channel; it does not reproduce the formula rules.

## Capability conditionals

What the repo _is_ decides which checks apply — the same standard covers a bash tool and a TS tool without forking (mirrors `ki-engineering`'s capability-conditional pattern).

| Capability signal | Requirement it turns on |
| --- | --- |
| Primary bin has a `bash`/`sh` shebang (SHELL) | A CI workflow references **shellcheck** (the tool is shellcheck-clean); `tests/` holds a **`*.bats`** suite CI runs (references `bats`). |
| A `package.json` appears (TS/Bun tool) | The repo defers lint/test to **`ki-engineering`** and MUST also declare `[ki-engineering]` in `.ki-config.toml`. Shell checks don't apply. |
| Another language (Python, Go, …) | Defer to that language's own toolchain. The container checks (bin, install.sh, versioning, changelog, CI, tests) still apply. |

There is deliberately **no `ki-shell` skill**: shell is the reference language, and its two tool-specific gates (shellcheck, bats) live here as capability conditionals rather than a separate skill (YAGNI at n=1). If a second shell-specific concern emerges, revisit.

## The `[ki-tools]` marker

A `tools-*` repo opts in by declaring a **keyless** `[ki-tools]` table in its `.ki-config.toml` — a bare marker whose _presence_ is the whole contract, exactly like `[ki-mcp]`. It is validated **down**: the checker reads only this table and warns on any unknown key inside it (there are none today), never reading another skill's table. `bun scripts/audit.ts --educate` prints the default block.

A language conditional is declared as its **own** table, not a key here: a TS/Bun tool carries both `[ki-tools]` and `[ki-engineering]`.

## What other skills own

- **`ki-repo`** — the local standard files (README, LICENSE, `.gitignore`, `.editorconfig`), GitHub settings (merge policy, branch protection, topics, visibility), and the `.ki-config.toml` contract itself. `ki-repo`'s coverage cascade detects an undeclared tool (a `bin/<exe>` + `install.sh` with no `[ki-tools]`) and WARNs, enforcing the one-structure-skill-per-repo invariant.
- **`ki-homebrew-tap`** — the tap repo, the `Formula/*.rb` shape, and the tap's own test-bot/CI.
- **`ki-engineering`** — the TS/Bun build/lint/test toolchain, only if the tool grows a `package.json`.
