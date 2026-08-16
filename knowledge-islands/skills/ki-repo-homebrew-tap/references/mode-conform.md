# Mode CONFORM — bring an existing tap up to standard

**Precondition:** Run [Mode AUDIT](mode-audit.md) first so every change starts from a known gap list.

_On-demand procedure for ki-repo-homebrew-tap's CONFORM mode. The host publishes only the bounded marker proposal; formula, README, checksum, and repository work remain explicit._

1. **Repair formula and README gaps deliberately.** Copy from the healthiest existing formula rather than inventing: add missing formula fields, shorten or de-article a `desc`, repoint a `url` at a tagged-release tarball, recompute its `sha256` explicitly (`curl -sL <url> | shasum -a 256`), and add the formula's row to the README `## Formulae` table.
2. **Apply the safe hosted repair.** After `ki-repo` has established a regular `.ki-config.toml`, run `ki repo conform --skill ki-repo-homebrew-tap --repo <tap-path>`. The only automatic change is adding the keyless `[skills.ki-repo-homebrew-tap]` marker to that existing valid file; missing, malformed, symlinked, or otherwise unsafe configuration remains report-only.
3. **Conform the repository layer separately.** Run `ki repo conform --skill ki-repo --repo <tap-path>` for repo-level files and settings.
4. **Keep Homebrew validation external.** Hosted AUDIT never runs `brew style` or `brew audit --strict`. Obtain package-manager results only through an explicitly authorized isolated diagnostic; do not treat stale, unavailable, or different-source output as evidence for this checkout.
5. **Verify.** Re-run AUDIT until its mechanical findings are clean. Do not hand off while `brew` reports issues.
