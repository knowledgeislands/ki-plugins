# Mode AUDIT — check a tap against the standard

_On-demand procedure for ki-repo-homebrew-tap's AUDIT mode. The canonical shape, name constraint, and adjacent coverage boundaries live in [`SKILL.md`](../SKILL.md) and are already loaded; this file is the procedure only._

1. **Identify the target.** Confirm the tap path (default: the cwd repo). It should be a `homebrew-<x>` repo with a `Formula/` directory.
2. **Run the mechanical checker.** `ki repo audit --skill ki-repo-homebrew-tap --repo <tap-path>` checks static `Formula/` presence, per-formula class, fields, description style, versioned URL, the README table, and the `[skills.ki-repo-homebrew-tap]` marker. `TAP-7` never runs Homebrew; `brew style` and `brew audit --strict` require separately authorized isolated diagnostics.
3. **Also run `ki-repo`'s audit.** The tap is first a repo: `ki repo audit --skill ki-repo --repo <tap-path>` covers README, LICENSE, `.gitignore`, GitHub settings, and security. The tap is clean only when both pass. It does **not** run `ki-engineering` because a tap has no `package.json` toolchain.
4. **Keep package-manager evidence separate.** `brew audit --strict`, `brew style`, and `brew test-bot` are not structural evidence. Run them only in an explicitly authorized isolated diagnostic against the intended tap and report unavailable evidence as unavailable, never as a structural PASS.
5. **Do the judgment pass the host cannot.** Walk the [rubric](rubric.md)'s **[J]** items:
   - **Meaningful test.** The `test do` exercises the installed binary (real `--version`/`--help` assertion), not a placeholder.
   - **Honest install.** `def install` installs what the `tools-*` repo actually ships (`bin/<tool>`), and the `sha256` matches the tarball at `url`.
   - **Sourcing.** The `url` tag version matches `#{version}`; not a branch/HEAD.
   - **Table freshness.** Each README row's description + source link is correct, not a stale placeholder.
   - **CI backstop.** If local `brew` is unavailable, confirm a `brew test-bot` workflow runs the deep checks.
6. **Report.** Group on the ladder: no `Formula/` is a **FAIL**; a missing field, non-versioned URL, unlisted formula, unavailable/stale Homebrew validation, or `brew` finding is a **WARN**. Cite `Formula/<file>` and give the fix. Label each finding **spec** (Homebrew's, via `brew` or the Cookbook) or **shape** (this skill's tap convention) so a house preference is never presented as a Homebrew "MUST".
