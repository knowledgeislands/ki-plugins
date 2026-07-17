# Mode EDUCATE — scaffold a new tool repo

_On-demand procedure for tools' EDUCATE mode. The canonical shape, the container-not-contents split, and the capability-conditional rule live in [`SKILL.md`](../SKILL.md) and are already loaded; this file is the procedure only._

1. **Name the repo `tools-<name>`** and confirm the tool's language (bash is the reference; a TS/Bun/Python/Go tool is fine but turns on a different capability path).
2. **Copy from `tools-mgit`** (the reference repo) over inventing — take and adapt:
   - `bin/<name>` — the executable, with the `bash`/`sh` shebang (for a shell tool), a `<NAME>_VERSION=` marker literal, and a `--version`/`-V` case. `chmod +x bin/<name>` and commit (git tracks the bit).
   - `install.sh` — adapt the `REPO`, the `<NAME>_INSTALL_DIR` (default `$HOME/.local/bin`) and `<NAME>_VERSION` (default latest release) env overrides, and the download → verify → install flow. `chmod +x install.sh`.
   - `.github/workflows/ci.yml` — a `shellcheck bin/<name> install.sh` lint job and a `bats tests/` job (for a shell tool).
   - `tests/<name>.bats` — a starter bats suite (for a shell tool).
   - `CHANGELOG.md` — keep-a-changelog with an `## [Unreleased]` head.
3. **Add `ki-repo`'s files** (README, LICENSE, `.gitignore`, `.editorconfig`) — run `ki-repo`'s EDUCATE for the local-file + GitHub-settings layer.
4. **Declare the config tables.** `bun scripts/audit.ts --educate >> .ki-config.toml` to add the `[ki-tools]` marker (alongside `[ki-repo]`). If the tool has a `package.json`, also declare `[ki-engineering]` and run its EDUCATE.
5. **Set up the Homebrew tap** — the companion `Formula/<name>.rb` in the tap repo is `ki-homebrew-tap`'s to scaffold; hand off there.
6. **Cut the first release** — tag `v0.1.0`, create the GitHub release, and confirm `install.sh` fetches it. Run the checker until clean.
