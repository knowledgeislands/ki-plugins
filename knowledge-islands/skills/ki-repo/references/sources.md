# Sources — where the repo standard comes from

**Refresh:** external-spec · monthly

The authoritative sources behind [the repository standard](standards-repository.md), [the configuration standard](standards-configuration.md), and the generated [rubric](rubric.md). Mode REFRESH reads this file, re-fetches each source, diffs it against the standards and structured catalogue, then **bumps the `last reviewed` dates** and refreshes the `## Last review` block below (what changed is recorded in the commit, not a changelog). GitHub's settings surface moves (rulesets, security toggles, Actions policy), so this is the skill's memory of where the standard comes from — keep it current.

## Authoritative (GitHub)

| Source | Governs | Last reviewed |
| --- | --- | --- |
| [REST: repository settings][repo-settings] | merge methods, auto-delete-branch, features, description, visibility, and repository-administration permission | 2026-09-26 |
| [REST: branch protection][branch-protection] | the optional `branch-protection` body (PR, `build` check, linear) | 2026-09-26 |
| [Repository rulesets][rulesets] | the modern alternative to classic protection (private-repo path) | 2026-09-26 |
| [REST: Dependabot alerts / fixes][dependabot] | `vulnerability-alerts`, `automated-security-fixes` endpoints | 2026-09-26 |
| [Secret scanning detection scope][secret-scanning] | public automatic scanning and private/internal GitHub Secret Protection boundary | 2026-09-26 |
| [REST: Actions permissions for a repository][actions] | `allowed_actions` policy | 2026-09-26 |
| [`gh` CLI manual][gh-cli] | `gh repo list/view/edit`, `gh api` — how evidence is read and confirmed live changes are applied | 2026-09-26 |
| [SPDX License List][spdx] | authoritative license identifiers, including MIT and UNLICENSED | 2026-09-26 |
| [Choose a License][choosealicense] | supporting license-selection guidance | 2026-09-26 |

## Last review

REFRESH last run **2026-09-26** against all nine tracked sources. Repository settings, classic protection and rulesets, Dependabot endpoints, secret-scanning scope, Actions permissions, CLI routes, and licence guidance remain available. GitHub's current REST examples use API version `2026-03-10`, but no governed field or criterion changed in this refresh.

- **REST repository settings / `gh` CLI**: merge controls, branch deletion, feature fields, description, visibility, and CLI evidence/application routes remain available. Setting repository properties requires the exact repository-administration permission; inspect the account and exact proposed write before mutation.
- **REST branch protection / rulesets**: classic branch protection and rulesets coexist. The optional classic-protection check remains valid; watch for a future deprecation or recommendation change.
- **Dependabot / Actions**: `vulnerability-alerts`, `automated-security-fixes`, and `/actions/permissions` retain the observed endpoints and `allowed_actions` policy.
- **Secret scanning**: public repositories retain automatic free secret scanning; private and internal scope requires GitHub Secret Protection. The public-only check remains correct.
- **SPDX / Choose a License**: SPDX is the authority for declared identifiers; Choose a License remains a selection aid. `UNLICENSED` remains the proprietary declaration.
- **Open watch-items:** re-confirm that the branch-protection GET response continues to support the compatibility evidence the auditor consumes, and that classic protection remains available beside rulesets.

[repo-settings]: https://docs.github.com/en/rest/repos/repos#update-a-repository
[branch-protection]: https://docs.github.com/en/rest/branches/branch-protection
[rulesets]: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets
[dependabot]: https://docs.github.com/en/rest/repos/repos#enable-vulnerability-alerts
[secret-scanning]: https://docs.github.com/en/code-security/reference/secret-security/secret-scanning-scope
[actions]: https://docs.github.com/en/rest/actions/permissions
[gh-cli]: https://cli.github.com/manual/
[spdx]: https://spdx.org/licenses/
[choosealicense]: https://choosealicense.com/
