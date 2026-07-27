# Mode CONFORM — bring an existing tool repository up to standard

_On-demand procedure for `ki-tools` CONFORM. The hosted catalogue owns its bounded executable-bit and configuration-marker actions; this procedure coordinates the judgment repairs and sibling skills that remain outside that transaction._

1. Run **AUDIT** first, so changes begin from a known gap list.
2. Run `ki repo conform --repo <repo-path> --skill ki-tools`. The host may set executable bits on verified physical `bin/*` files and `install.sh`, and append `[ki-tools]` to an existing physical, parseable `.ki-config.toml`. Repeated item requests coalesce into bounded commands and one configuration draft.
3. Fix report-only gaps by adapting the `tools-mgit` reference rather than inventing:
   - Missing `install.sh` → adapt the `REPO`, `<TOOL>_INSTALL_DIR` / `<TOOL>_VERSION` overrides, and download → verify → install flow.
   - Missing `--version` → add one version marker literal and the `--version`/`-V` case.
   - Missing `CHANGELOG.md` → seed Keep a Changelog with an `## [Unreleased]` head.
   - Missing CI / shellcheck / Bats → adapt `.github/workflows/ci.yml` and the matching test suite.
4. For a TS/Bun tool, run `ki-engineering` CONFORM for its toolchain and ensure `[ki-engineering]` is declared.
5. Re-run the `ki-tools` and `ki-repo` audits until clean; a shell tool should also be shellcheck-clean and Bats-green locally.
