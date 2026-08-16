# Tool release readiness

Use this checklist before publishing a release of a repository governed by `ki-repo-tools`. It turns the standard's existing requirements into a reviewable release candidate; it does not select work, publish a release, or take ownership of a companion Homebrew formula.

## 1. Establish the candidate

- Confirm the intended `vX.Y.Z` version against the latest released tag and Semantic Versioning. Record breaking changes, migrations, or an explicit statement that none apply.
- Review the product changes since the last release. Exclude unrelated working-tree changes and resolve any release-blocking failures before changing the version marker.
- Keep one version source of truth in the executable or package metadata. Verify that the candidate's `--version` output will match its tag and top changelog entry. Any automated release workflow MUST reject a mismatch before building, signing, creating a draft, or publishing; a post-publication installation check is not an adequate backstop for an immutable release.

## 2. Align the public surface

- Add the dated changelog entry using `Added`, `Changed`, `Fixed`, and `Removed` as applicable. A declared command baseline remains suitable only when establishing a release line, not as a substitute for a concrete release entry.
- Compare active `--help`, the README, user guides, completion guidance, and any physical manual. They must describe the same shipped commands, options, defaults, and compatibility behaviour.
- Where a release changes a persisted manifest or configuration format, document the supported schema, migration, or rejection path in the canonical user reference.
- For a physical manual, update its date when appropriate, run `mandoc -T lint`, and inspect `mandoc -Tutf8 man/<tool>.1 | col -b` after a content or layout change.

## 3. Validate the candidate

- Run `ki repo audit --repo .` and resolve its applicable mechanical findings. Complete the judgment review for version alignment, CLI surface, manual distribution, and the companion formula.
- Run every native quality gate declared by the tool. A shell entrypoint runs ShellCheck and Bats; a package.json-bearing tool also follows `ki-engineering` for its build, lint, type, and test gates.
- Exercise changed command paths and error handling proportionately to risk. Confirm `--help` and `--version` from the candidate rather than an installed copy.
- Verify the release installer and `--link` mode against disposable destinations. When a physical manual exists, confirm that both installation paths publish or link it alongside the executable.

## 4. Publish through both channels

- Commit only the reviewed release artifacts, then create the matching `vX.Y.Z` tag and GitHub release. Do not tag an unverified or dirty candidate.
- Hand the published tag to `ki-repo-homebrew-tap` for the formula's release URL, checksum, and tap-specific validation. That skill owns the formula change.
- Verify a fresh release installation and the package-manager path where practical. Confirm that the released executable reports the tagged version and its manual resolves when one is shipped.

## 5. Record the outcome

- Retain the release commit, tag, GitHub release, and formula update as the durable record. Keep a concise review packet with the candidate version, validation performed, and any deliberately deferred post-release follow-up.
- If a check cannot run, record the blocker and do not describe the release as fully verified. Route work outside this skill's boundary to its owner rather than adding a compatibility path here.

## Ownership boundaries

- `ki-repo-tools` owns this checklist and the generic tool-repository release contract.
- `ki-engineering` owns the TypeScript/Bun toolchain checks when the repository has a `package.json`.
- `ki-repo-homebrew-tap` owns the companion formula and its publication checks.
- `ki-repo` owns repository configuration and GitHub settings; `ki-git` owns commit and tag hygiene.
