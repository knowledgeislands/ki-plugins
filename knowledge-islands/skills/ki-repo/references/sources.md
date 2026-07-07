# Sources — where the repo standard comes from

**Refresh:** external-spec · monthly

The authoritative sources behind [the standard](repo-standard.md), [the rubric](audit-rubric.md), and [`../scripts/audit-repo.ts`](../scripts/audit-repo.ts). Mode REFRESH reads this file, re-fetches each source, diffs it against the standard + script, then **bumps the `last reviewed` dates** and refreshes the `## Last review` block below (what changed is recorded in the commit, not a changelog). GitHub's settings surface moves (rulesets, security toggles, Actions policy), so this is the skill's memory of where the standard comes from — keep it current.

## Authoritative (GitHub)

| Source | Governs | Last reviewed |
| --- | --- | --- |
| [REST: repository settings][repo-settings] | merge methods, auto-delete-branch, features, description, visibility | 2026-07-04 |
| [REST: branch protection][branch-protection] | the optional `branch-protection` body (PR, `build` check, linear) | 2026-07-04 |
| [Repository rulesets][rulesets] | the modern alternative to classic protection (private-repo path) | 2026-07-04 |
| [REST: Dependabot alerts / fixes][dependabot] | `vulnerability-alerts`, `automated-security-fixes` endpoints | 2026-07-04 |
| [Secret scanning & push protection][secret-scanning] | `security_and_analysis` toggles and their plan/GHAS gating | 2026-07-04 |
| [REST: Actions permissions for a repository][actions] | `allowed_actions` policy | 2026-07-04 |
| [`gh` CLI manual][gh-cli] | `gh repo list/view/edit`, `gh api` — how the script reads/writes | 2026-06-21 |

## Last review

REFRESH last run **2026-07-04** against the GitHub REST API (repository settings, branch protection, Dependabot/security-fixes, Actions permissions), repository rulesets, and secret-scanning docs. Six of seven tracked sources re-fetched this run (the `gh` CLI manual carried from 2026-06-21). No drift affecting the standard, rubric, or script — a confirm-current refresh (no changes). Both watch-items carried from prior runs still hold; neither cleared, neither escalated. Note: this refresh ran ~13 days into the monthly window (prior anchor 2026-06-21) at operator direction, not on cadence.

- **REST repository settings** (fetched this run): merge-method booleans, `delete_branch_on_merge`, `allow_update_branch`, features, `description`, and `visibility` all confirmed unchanged. `use_squash_pr_title_as_default` still closing down (→ `squash_merge_commit_title`, enum `PR_TITLE`/`COMMIT_OR_PR_TITLE`); unused by the script. `vulnerability-alerts` (204/404) and `automated-security-fixes` (200 `{enabled, paused}`) endpoints confirmed on this page too.
- **REST branch protection** (fetched this run): `required_status_checks.contexts` still returned on GET; the "Closing down notice" in favour of `checks` remains only on the request/body side. The auditor (on `checks`, tolerant of `contexts`) stays correct. `enforce_admins`, `required_linear_history`, `allow_force_pushes`, `allow_deletions` unchanged.
- **Repository rulesets** (fetched this run — page rendered thin): no deprecation signal; classic branch protection is **not** deprecated and rulesets coexist. Staying on classic protection for the optional `branch-protection` check remains correct.
- **Dependabot alerts / automated security fixes** (fetched this run): endpoints and shapes unchanged; the script reads `.enabled`, still correct. `paused` field still additive.
- **Actions permissions** (fetched this run): `/actions/permissions` path and `allowed_actions` enum (`all`/`local_only`/`selected`) unchanged. `sha_pinning_required` (GET + PUT) still additive; our `actions` check stays WARN-only. `X-GitHub-Api-Version` header at `2026-03-10` — unchanged since last run.
- **Secret scanning & push protection** (fetched this run): still free and automatic for public repos; private/internal require **GitHub Secret Protection** (rebranded GHAS line) on Team / Enterprise — still exempt (public-only check). No change to the standard.
- **`gh` CLI** (carried — host not re-fetched this run): every `gh repo edit` flag the standard/script use confirmed present on 2026-06-21; nothing in our usage has moved.
- **Open watch-items:** (1) re-confirm next refresh that GitHub still populates `contexts` on the GET (the back-compat the auditor relies on) — still in the schema this run. (2) Watch whether GitHub ever flips its recommendation toward rulesets / deprecates classic protection — no sign yet.

[repo-settings]: https://docs.github.com/en/rest/repos/repos#update-a-repository
[branch-protection]: https://docs.github.com/en/rest/branches/branch-protection
[rulesets]: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets
[dependabot]: https://docs.github.com/en/rest/repos/repos#enable-vulnerability-alerts
[secret-scanning]: https://docs.github.com/en/code-security/secret-scanning/about-secret-scanning
[actions]: https://docs.github.com/en/rest/actions/permissions
[gh-cli]: https://cli.github.com/manual/
