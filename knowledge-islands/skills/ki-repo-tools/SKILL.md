---
name: ki-repo-tools
ki-kind: governance
ki-depends-on: []
ki-shared-dependencies: [ki-skills:rubric]
description: >
  Audit, conform, or scaffold a Knowledge Islands `tools-*` repo — ONE standalone CLI per repo, distributed by a `curl | bash` installer and companion Homebrew formula. Governs shared shape and public conventions language-agnostically: executable + bit, installer, version/release, changelog, CI, help/errors/status, one documented `completion <shell>` action, and optionally installed/linkable portable-roff `man/<tool>.1`. Conditionals: shell → shellcheck + bats; physical manual → mandoc CI; package.json → `ki-engineering`. Triggers: "audit this tool repo", "scaffold a CLI tool", "release a command-line tool", "does this tools- repo follow our standard", "check my tools- repo". Off-ramps: tap/formula → `ki-repo-homebrew-tap`; README/LICENSE/GitHub settings → `ki-repo`; TS/Bun toolchain → `ki-engineering`. Not individual tool behaviour.
argument-hint: 'audit <repo> | conform <repo> | help | educate <repo> | refresh'
---

# Knowledge Islands tool-repo standard

You are helping audit, conform, or scaffold a **`tools-*` repo** — a repo holding exactly **one** standalone command-line tool, distributed two ways: a `curl | bash` installer at the repo root, and a companion Homebrew formula that lives in the tap. [`tools-mgit`](https://github.com/knowledgeislands/tools-mgit) (Bash) and [`tools-ki`](https://github.com/knowledgeislands/tools-ki) (TypeScript/Bun) are the reference implementations. The standard governs shared shape and public interface conventions, not a language or the tools' individual behaviour.

This skill rides on `ki-repo` (local files, GitHub settings) but **not** `ki-engineering` — a bash tool has no TypeScript/Bun toolchain to govern, so no `ki-engineering` declaration is assumed (the same pattern `ki-repo-kb` follows). If the tool grows a `package.json`, that changes: it then declares `[skills.ki-engineering]` too and defers its lint/test there (see the capability rule below).

The full, quotable standard lives in [the tool-repository standard](references/standards-tool-repositories.md); the line-by-line pass/fail items live in [the generated rubric](references/rubric.md). `ki repo audit` and `ki repo conform` execute the structured mechanical contract directly through the host.

## Container, not contents

This skill judges the **container** and a small shared public interface — not the quality of the tool's own implementation:

- **In scope:** the `bin/<tool>` layout and its exec bit, `install.sh`, versioning + `--version`, `CHANGELOG.md`, CI, test-suite presence, help/error/exit-status behaviour, completion, manual authoring and distribution, and the capability conditionals below.
- **Out of scope:** whether tool-specific operations are correct, well-factored, or fast. That is the tool author's concern (and, for a shell tool, shellcheck + bats — which this skill checks are _wired_, not what they _find_). The Homebrew tap and its formula are `ki-repo-homebrew-tap`'s; the repo's README, LICENSE, and GitHub settings are `ki-repo`'s.

## The canonical shape at a glance

```text
tools-<name>/
├── bin/<name>              # THE executable — chmod +x (git tracks the exec bit). Answers --version.
├── install.sh              # curl installer: honours env overrides (target dir + version), verifies the
│                           #   download, is idempotent, and publishes/links a manual when one exists.
├── tests/ or src/tests/    # executable test suite (a *.bats suite under tests/ for a shell tool). Expected.
├── .github/workflows/*.yml # CI: lint + test on every push. Expected.
├── man/<name>.1            # Optional manual source; when present, CI runs mandoc -T lint.
├── CHANGELOG.md            # semver release history or a declared current-release baseline.
├── README.md · LICENSE     # ki-repo's job — not governed here.
└── .ki-config.toml         # carries qualified ki-repo + ki-repo-tools declarations (the opt-in marker).
```

`bin/` with ≥1 executable file is the only hard requirement (**FAIL** if missing); everything else is **WARN** — expected but not ship-stopping. The companion Homebrew formula lives in the tap repo (`homebrew-<x>`, `Formula/<name>.rb`), governed by `ki-repo-homebrew-tap` — cross-reference it, don't reproduce it.

## The capability-conditional rule

Mirrors `ki-engineering`'s capability-conditional pattern: what the repo _is_ decides which checks apply, so the same standard covers a bash tool and a TS tool without forking.

- **Shell entrypoint** (the primary `bin/` file has a `bash`/`sh` shebang): it MUST be shellcheck-clean in CI (a workflow references `shellcheck`) and ship a `bats` suite that CI runs (a `*.bats` file under `tests/` and a workflow that references `bats`).
- **A `package.json` appears** (a TS/Bun tool): the repo defers lint/test to `ki-engineering` and MUST also declare `[skills.ki-engineering]` in its `.ki-config.toml`. The shell checks don't apply.
- **A physical `man/<tool>.1` page appears**: CI MUST run `mandoc -T lint man/<tool>.1`, directly or through the repository's native task runner. The release installer and its `--link` mode publish or link that manual alongside the executable.
- **Another language** (Python, Go, …): defer to that language's own toolchain; the container checks (bin, install.sh, versioning, changelog, CI, tests) still apply.

## The qualified `ki-repo-tools` marker

A `tools-*` repo opts into this standard by declaring a **keyless** `[skills.ki-repo-tools]` table in its `.ki-config.toml`. The table is validated **down** (this skill reads only its own table and warns on any unknown key inside it). `ki repo conform --skill ki-repo-tools` may add the marker to an existing physical, parseable configuration. It may also set executable bits on verified physical `bin/*` files and `install.sh`; missing content, malformed or unsafe paths, external releases, and Homebrew operations remain report-only.

## Operating modes

Every governance skill carries the universal four **AUDIT · CONFORM · EDUCATE · REFRESH**; EDUCATE here scaffolds a new tool repo. Invoked as `help` / `-h` / `?`, it explains itself and stops — the generated HELP block (name, purpose, invocation, modes, off-ramps), taking no action. With no mode it does the same, then, in an interactive session only, offers the mode choice via `AskUserQuestion`, prompting for any `argument-hint` target the chosen mode shows.

The four procedures remain on demand because each coordinates work outside the hosted catalogue: AUDIT and CONFORM sequence `ki-repo`, the conditional `ki-engineering` layer, and explicit release checks; EDUCATE scaffolds a new repository; REFRESH reconciles moving external specifications. Each file owns one mode so invoking one never loads an unrelated procedure.

### Mode AUDIT

→ Read [references/mode-audit.md](references/mode-audit.md)

### Mode CONFORM

→ Read [references/mode-conform.md](references/mode-conform.md)

### Mode EDUCATE

→ Read [references/mode-educate.md](references/mode-educate.md)

### Mode REFRESH

→ Read [references/mode-refresh.md](references/mode-refresh.md)

### Mode HELP

Invoked as `help`, `-h`, or `?`, explain the skill, invocation, modes, capability conditionals, and off-ramps, then stop. With no recognisable mode, provide the same explanation and only offer a mode choice in an interactive session.

## Notes

- The standard is anchored to `tools-mgit` and `tools-ki`, plus external specs (shellcheck, bats, keep-a-changelog, semver, XDG) — the tracked [source list](references/sources.md) records them; Mode REFRESH re-fetches on the declared cadence.
- Refer to another skill by its `name` (`ki-repo`, `ki-engineering`, `ki-repo-homebrew-tap`), never a file path — skills are relocatable.
- Hosted execution carries no private checker, reporter, or compatibility wrapper. The skill intentionally has no top-level public script; its executable governance surface is `scripts/rubric/items/index.ts`, loaded directly by `ki`.
- No `exemplars.md` is bundled: the canonical tree and capability table above, plus the complete installer and release guidance in the standard, already illustrate the reusable shapes; a separate exemplar would duplicate them.
