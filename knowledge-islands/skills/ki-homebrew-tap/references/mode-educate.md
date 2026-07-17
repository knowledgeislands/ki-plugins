# Mode EDUCATE — scaffold a new Homebrew tap

_On-demand procedure for ki-homebrew-tap's EDUCATE mode. The canonical shape and the name constraint live in [`SKILL.md`](../SKILL.md) and are already loaded; this file is the procedure only._

1. **Name the repo `homebrew-<x>`.** Homebrew requires the prefix so `brew tap <owner>/<x>` resolves (KI uses `homebrew-tap` → `knowledgeislands/tap`). This is an external constraint — do not deviate.
2. **Create the tap skeleton:**
   - `Formula/` — the directory that makes the repo a tap.
   - `README.md` — with a `## Formulae` table (start it with a header row; add a row per formula).
   - OPTIONAL `.github/workflows/` running [`brew test-bot`](https://docs.brew.sh/Brew-Test-Bot) so the deep formula checks run in CI.
3. **Add the first formula**, `Formula/<tool>.rb`, copying the shape from an existing formula (e.g. `Formula/mgit.rb`): `class <Camel> < Formula`, a `desc` (≤ 80 chars, no leading article), `homepage`, a **versioned-tarball** `url` (`…/archive/refs/tags/vX.Y.Z.tar.gz`), the tarball's `sha256` (`curl -sL <url> | shasum -a 256`), a `license`, a `def install`, and a `test do` that asserts on the installed binary's real output. Add its row to the README table.
4. **Wire governance.** Add `[ki-repo]` + `[ki-homebrew-tap]` to `.ki-config.toml` — `bun ../scripts/audit.ts --educate` prints the keyless `[ki-homebrew-tap]` block. Run `ki-repo`'s EDUCATE for the repo-level files and GitHub settings. Do **not** add `[ki-engineering]` — a tap has no TypeScript toolchain (the `ki-plugins` precedent).
5. **Verify.** Run the checker (`bun ../scripts/audit.ts <path>`) to 0 FAIL, and — if `brew` is installed — `brew style` + `brew audit --strict` on each formula. Confirm `brew install <owner>/<x>/<tool>` works before publishing.
