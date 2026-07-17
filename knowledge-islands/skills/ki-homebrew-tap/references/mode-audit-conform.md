# Modes AUDIT and CONFORM

_On-demand procedure for ki-homebrew-tap's AUDIT and CONFORM modes (CONFORM runs AUDIT first, so they share this file). The canonical shape, the name constraint, and the composition edges live in [`SKILL.md`](../SKILL.md) and are already loaded; this file is the procedure only._

## Mode AUDIT — check a tap against the standard

1. **Identify the target.** Confirm the tap path (default: the cwd repo). It should be a `homebrew-<x>` repo with a `Formula/` directory.
2. **Run the mechanical checker.** `bun ../scripts/audit.ts <tap-path>` (or `bun skills/repo-structure/ki-homebrew-tap/scripts/audit.ts <path>` from the harness root). It grades on the unified severity ladder (FAIL / WARN / … / NA — see `ki-engineering`'s [checker-contract.md](../../../foundations/ki-engineering/references/checker-contract.md)), exits non-zero on any FAIL, and with `--json` / `--report` emits machine-readable findings under `<target>/.ki-meta/audits/homebrew-tap.{md,json}`. It covers: `Formula/` presence, per-formula class/fields/desc-style/versioned-url, the README table, the `[ki-homebrew-tap]` marker, and — when `brew` is on PATH — `brew audit --strict` + `brew style`.
3. **Also run `ki-repo`'s audit** — the tap is first a repo: `bun skills/keystone/ki-repo/scripts/audit.ts <path>` covers README/LICENSE/`.gitignore`/GitHub settings/security. The tap is clean only when both pass. It does **not** run `ki-engineering` (no `package.json` toolchain — the `ki-plugins` pattern).
4. **Do the judgment pass the script can't** — walk [Audit Rubric](audit-rubric.md)'s **[J]** items:
   - **Meaningful test.** The `test do` exercises the installed binary (real `--version`/`--help` assertion), not a placeholder.
   - **Honest install.** `def install` installs what the `tools-*` repo actually ships (`bin/<tool>`), and the `sha256` matches the tarball at `url`.
   - **Sourcing.** The `url` tag version matches `#{version}`; not a branch/HEAD.
   - **Table freshness.** Each README row's description + source link is correct, not a stale placeholder.
   - **CI backstop.** If the checker SKIPped `TAP-BREW` (no local `brew`), confirm a `brew test-bot` workflow runs the deep checks.
5. **Report.** Group on the ladder: no `Formula/` is a **FAIL**; a missing field / non-versioned url / unlisted formula / `brew` finding is a **WARN**; the config + capability notes are **INFO/NA**. Cite `Formula/<file>` and give the fix. Label each finding **spec** (Homebrew's, via `brew` or the Cookbook) or **shape** (this skill's tap convention) so a house preference is never presented as a Homebrew "MUST".

## Mode CONFORM — bring an existing tap up to standard

1. Run **AUDIT** first, so you change against a known gap list.
2. Fix the gaps in place, **copying from the healthiest existing formula** rather than inventing: add the missing formula field(s), shorten/de-article a `desc`, repoint a `url` at a tagged-release tarball and recompute its `sha256` (`curl -sL <url> | shasum -a 256`), add the formula's row to the README `## Formulae` table.
3. Add the `[ki-homebrew-tap]` marker (and `[ki-repo]`) to `.ki-config.toml` if absent — `bun ../scripts/audit.ts --educate` prints the block. Run `ki-repo`'s CONFORM for the repo-level files/settings.
4. **Re-run `brew` locally if it is installed** — `brew style Formula/<tool>.rb` and `brew audit --strict Formula/<tool>.rb` must pass — then re-run the checker until clean (0 FAIL). Do not hand off while `brew` reports issues.
