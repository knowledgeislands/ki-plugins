# Mode CONFORM — bring an existing tap up to standard

**Precondition:** Run [Mode AUDIT](mode-audit.md) first so every change starts from a known gap list.

_On-demand procedure for ki-homebrew-tap's CONFORM mode. The host publishes only the bounded marker proposal; formula, README, checksum, repository, and external Homebrew work remains explicit._

1. **Repair formula and README gaps deliberately.** Copy from the healthiest existing formula rather than inventing: add missing formula fields, shorten or de-article a `desc`, repoint a `url` at a tagged-release tarball, recompute its `sha256` explicitly (`curl -sL <url> | shasum -a 256`), and add the formula's row to the README `## Formulae` table.
2. **Apply the safe hosted repair.** After `ki-repo` has established a regular `.ki-config.toml`, run `ki repo conform --skill ki-homebrew-tap --repo <tap-path>`. The only automatic change is adding the keyless `[ki-homebrew-tap]` marker to that existing valid file; missing, malformed, symlinked, or otherwise unsafe configuration remains report-only.
3. **Conform the repository layer separately.** Run `ki repo conform --skill ki-repo --repo <tap-path>` for repo-level files and settings.
4. **Run Homebrew explicitly.** Execute `brew style Formula/<tool>.rb` and `brew audit --strict <tool>` for every formula. These external package-manager operations never run inside the hosted conform transaction.
5. **Verify.** Re-run AUDIT until its local mechanical findings are clean, then record the explicit Homebrew results. Do not hand off while `brew` reports issues.
