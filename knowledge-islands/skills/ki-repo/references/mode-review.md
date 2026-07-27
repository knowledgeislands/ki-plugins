# Repository REVIEW procedure

_On-demand REVIEW procedure for `ki-repo`. The repository compliance standard and universal modes live in [`SKILL.md`](../SKILL.md); REVIEW inspects architecture and implementation without turning them into compliance rules._

## 1. Frame before inspecting

Agree the review’s purpose, repository boundary, intended readers, time horizon, constraints, and the level of change it may recommend.

State what is out of scope. A broad request such as “review the architecture” is not permission to rewrite the repository, create Decision Records, or start delivery plans.

If the review could turn on an unspoken product, security, ownership, or compatibility choice, record that uncertainty and interview the user before drawing a conclusion.

## 2. Build an evidence inventory

Read the repository orientation and current work first: `AGENTS.md`, `README`, `.ki-config.toml` where present, canonical roadmap material, Decision Records, feature definitions, guides, and the implementation surfaces in scope.

Collect inspectable evidence rather than impressions:

- architecture and dependency boundaries;
- source, build, test, and runtime entry points;
- configuration ownership, secrets, migration, and failure paths;
- documentation’s correspondence to the implementation;
- maintainability signals, including duplication, hidden coupling, and unowned generated state;
- relevant checks, their current result, and what they do not establish.

Label every claim as **observed**, **inferred**, or **user-confirmed**. Link or name the evidence near the claim.

## 3. Review through lenses

Use only the lenses that fit the agreed scope. Architecture lenses include boundaries, ownership, data flow, extension points, failure and recovery, security, operations, and governance. Implementation lenses include correctness, clarity, cohesion, dependency direction, tests, automation, and documentation.

For each material observation, state the consequence and the confidence level. Do not promote a style preference into a finding without a concrete cost, risk, or missed capability.

## 4. Interview material uncertainty

Pause and ask the user whenever a finding depends on an uncertain intent, priority, owner, acceptable risk, compatibility promise, or operational constraint.

Present the evidence, the competing interpretations, and the consequence of each. Do not select an interpretation merely because it enables a clean recommendation.

## 5. Record and route findings

Number findings within a review as `REV-<NNN>-F<NNN>`. A finding contains its evidence, consequence, confidence, and one explicit route:

- **Plan** — bounded delivery work that belongs to a canonical roadmap item and, when substantial, a `ki-plan` plan.
- **Decision Record** — a durable why that remains useful after the delivery work and review evidence are gone.
- **Feature definition** — a durable behavioural what.
- **Guide** — durable operational how.
- **No action** — retain the observation in the review result only, with its rationale.

Plans may cite finding identifiers; findings may cite their delivery plan. A review never opens, readies, or executes a plan without the user’s separate explicit approval under `ki-plan`.

## 6. Optional review records and pruning

Create a review record only when the user asks to retain working evidence beyond the conversation. Place it at `docs/reviews/REV-<NNN>-<slug>.md` and give it frontmatter with immutable `id`, `status`, owning `roadmap` locator where one exists, and `retained-by` listing concrete plan or Decision Record identifiers, or `—`.

Review records are working evidence, not permanent documentation. Before closing an owning delivery item, move every independently durable conclusion to its route. When no concrete artifact remains in `retained-by`, show the exact review record and its dependent state, then require explicit confirmation before pruning it. Preserve identifiers in Git history; never reuse them.

`review close <REV-NNN>` is a review-evidence decision, not `ki-plan prune`: it must not remove a plan, roadmap item, Decision Record, or guide.

## 7. Finish

Present the review as:

1. Scope and evidence examined.
2. Material uncertainties and the user’s answers.
3. Findings with identifiers, evidence, confidence, and routes.
4. Proposed delivery order and dependencies.
5. Evidence retention or pruning state.

Ask for confirmation before creating any durable route. A completed review with no retained record should still state where its durable decisions, plans, guides, or feature definitions landed.
