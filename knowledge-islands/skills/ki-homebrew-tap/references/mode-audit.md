# Mode AUDIT — check a tap against the standard

_On-demand procedure for ki-homebrew-tap's AUDIT mode. The canonical shape, the name constraint, and the composition edges live in [`SKILL.md`](../SKILL.md) and are already loaded; this file is the procedure only._

1. **Identify the target.** Confirm the tap path (default: the cwd repo). It should be a `homebrew-<x>` repo with a `Formula/` directory.
2. **Run the mechanical checker.** `ki repo audit --skill ki-homebrew-tap --repo <tap-path>` checks `Formula/` presence, per-formula class, fields, description style, versioned URL, the README table, and the `[ki-homebrew-tap]` marker. `TAP-7` reports the exact Homebrew commands still requiring explicit execution; the host does not invoke them.
3. **Also run `ki-repo`'s audit.** The tap is first a repo: `ki repo audit --skill ki-repo --repo <tap-path>` covers README, LICENSE, `.gitignore`, GitHub settings, and security. The tap is clean only when both pass. It does **not** run `ki-engineering` because a tap has no `package.json` toolchain.
4. **Run Homebrew validation explicitly.** `brew style Formula/<tool>.rb` and `brew audit --strict <tool>` are external package-manager operations and remain outside `ki repo audit`; run them for every formula.
5. **Do the judgment pass the host cannot.** Walk the [rubric](rubric.md)'s **[J]** items:
   - **Meaningful test.** The `test do` exercises the installed binary (real `--version`/`--help` assertion), not a placeholder.
   - **Honest install.** `def install` installs what the `tools-*` repo actually ships (`bin/<tool>`), and the `sha256` matches the tarball at `url`.
   - **Sourcing.** The `url` tag version matches `#{version}`; not a branch/HEAD.
   - **Table freshness.** Each README row's description + source link is correct, not a stale placeholder.
   - **CI backstop.** If local `brew` is unavailable, confirm a `brew test-bot` workflow runs the deep checks.
6. **Report.** Group on the ladder: no `Formula/` is a **FAIL**; a missing field, non-versioned URL, unlisted formula, unperformed explicit Homebrew check, or `brew` finding is a **WARN**. Cite `Formula/<file>` and give the fix. Label each finding **spec** (Homebrew's, via `brew` or the Cookbook) or **shape** (this skill's tap convention) so a house preference is never presented as a Homebrew "MUST".
