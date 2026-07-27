# Mode AUDIT — check a repository against the standard

_On-demand procedure for `ki-tools` AUDIT. The canonical shape, the container-not-contents split, and the capability-conditional rule live in [`SKILL.md`](../SKILL.md) and are already loaded; this file owns only the audit sequence._

1. **Identify the target.** Confirm the repo path (default: the cwd repo). Note the tool name (`<name>` from `tools-<name>`) and the primary bin file's language (its shebang).
2. **Run the mechanical checker.** `ki repo audit --repo <repo-path> --skill ki-tools` covers the container: `bin/` + exec bit (FAIL), `install.sh`, `--version`, `CHANGELOG.md`, CI workflow, `tests/`, the shell capability conditionals (shellcheck + bats), the `package.json`→`ki-engineering` note, and the `[ki-tools]` marker. It grades on the unified severity ladder and exits non-zero on any mechanical FAIL. Capture the result verbatim — downstream tooling renders it; do not re-derive what it found.
3. **Run `ki-repo`'s audit too.** The tool repo's standard files (README, LICENSE, `.gitignore`, `.editorconfig`) and GitHub settings are `ki-repo`'s — run its checker for that layer. A TS/Bun tool (a `package.json` present) also runs `ki-engineering`'s audit.
4. **Do the judgment pass the script can't** — walk [rubric.md](rubric.md)'s **[J]** items:
   - **`install.sh` robustness**: read it — POSIX-ish, honours the target-dir + version env overrides, verifies the download, idempotent on re-run.
   - **Versioning coherence**: the single version marker, the latest `vX.Y.Z` tag, and the top `CHANGELOG.md` entry all agree (`git tag`, `gh release list`).
   - **CHANGELOG shape**: keep-a-changelog + semver.
   - **Homebrew formula**: a companion `Formula/<name>.rb` exists in the tap as the second channel (audit the tap itself with `ki-homebrew-tap`).
   - **One tool per repo**; XDG for any config/state the tool writes.
5. **Report.** Group findings on the ladder: a missing/non-executable `bin/<tool>` is a **FAIL**; a missing `install.sh` / `--version` / `CHANGELOG` / CI / tests / capability gate is a **WARN**; the release/tag check is an **ADVISORY** for a human. Cite the rubric ID and the fix for each.
