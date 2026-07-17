# Modes AUDIT and CONFORM

_On-demand procedure for tools' AUDIT and CONFORM modes (CONFORM runs AUDIT first, so they share this file). The canonical shape, the container-not-contents split, and the capability-conditional rule live in [`SKILL.md`](../SKILL.md) and are already loaded; this file is the procedure only._

## Mode AUDIT — check a repo against the standard

1. **Identify the target.** Confirm the repo path (default: the cwd repo). Note the tool name (`<name>` from `tools-<name>`) and the primary bin file's language (its shebang).
2. **Run the mechanical checker.** `bun scripts/audit.ts <repo-path>` covers the container: `bin/` + exec bit (FAIL), `install.sh`, `--version`, `CHANGELOG.md`, CI workflow, `tests/`, the shell capability conditionals (shellcheck + bats), the `package.json`→`ki-engineering` note, and the `[ki-tools]` marker. It grades on the unified severity ladder, exits non-zero on any FAIL, and with `--json` / `--report` emits machine-readable findings under the target's `.ki-meta/audits/tools.{md,json}`. Capture its output verbatim — don't re-derive what it found.
3. **Run `ki-repo`'s audit too.** The tool repo's standard files (README, LICENSE, `.gitignore`, `.editorconfig`) and GitHub settings are `ki-repo`'s — run its checker for that layer. A TS/Bun tool (a `package.json` present) also runs `ki-engineering`'s audit.
4. **Do the judgment pass the script can't** — walk [audit-rubric.md](audit-rubric.md)'s **[J]** items:
   - **`install.sh` robustness**: read it — POSIX-ish, honours the target-dir + version env overrides, verifies the download, idempotent on re-run.
   - **Versioning coherence**: the single version marker, the latest `vX.Y.Z` tag, and the top `CHANGELOG.md` entry all agree (`git tag`, `gh release list`).
   - **CHANGELOG shape**: keep-a-changelog + semver.
   - **Homebrew formula**: a companion `Formula/<name>.rb` exists in the tap as the second channel (audit the tap itself with `ki-homebrew-tap`).
   - **One tool per repo**; XDG for any config/state the tool writes.
5. **Report.** Group findings on the ladder: a missing/non-executable `bin/<tool>` is a **FAIL**; a missing `install.sh` / `--version` / `CHANGELOG` / CI / tests / capability gate is a **WARN**; the release/tag check is an **ADVISORY** for a human. Cite the rubric ID and the fix for each.

## Mode CONFORM — bring an existing tool repo up to standard

1. Run **AUDIT** first, so you change against a known gap list.
2. Fix the gaps in place — **copy from `tools-mgit`** (the reference repo) rather than invent:
   - Missing exec bit → `chmod +x bin/<tool>` (and commit — git tracks it).
   - Missing `install.sh` → adapt `tools-mgit`'s: the `REPO`, the `<TOOL>_INSTALL_DIR` / `<TOOL>_VERSION` env overrides, the download+verify+install flow.
   - Missing `--version` → add the version marker literal and the `--version`/`-V` case.
   - Missing `CHANGELOG.md` → seed keep-a-changelog with an `## [Unreleased]` head.
   - Missing CI / shellcheck / bats → adapt `tools-mgit`'s `.github/workflows/ci.yml` (a `shellcheck` lint job + a `bats tests/` job).
   - Missing `[ki-tools]` marker → `bun scripts/audit.ts --educate >> .ki-config.toml` (then tidy).
3. For a TS/Bun tool, run `ki-engineering`'s CONFORM for its toolchain and ensure `[ki-engineering]` is declared.
4. Re-run the checker (and `ki-repo`'s) until clean; a shell tool should also be `shellcheck bin/<tool> install.sh`-clean and `bats tests/`-green locally.
