# Audit Rubric — ki-bootstrap

Line-by-line criteria for auditing a Knowledge Islands repo's project-local skill and agent install against [the bootstrap standard](bootstrap-standard.md). Each is tagged **[M] mechanical** (the bundled checker — [`link-skills.ts`](../scripts/link-skills.ts) or [`link-agents.ts`](../scripts/link-agents.ts) `--check` decides it — capture its output, don't re-derive) or **[J] judgment** (assess by reading). Severity uses the unified ladder defined in `ki-engineering`'s [`enforcement-framework.md`](../../ki-engineering/references/enforcement-framework.md) §2.

## BOOT — project-local skill install

- **BOOT-1 [M]** WARN — `.claude/skills/` mirrors the repo's declared coverage (`[ki-*]` tables) ∪ the baseline (`ki-repo` + `ki-authoring`), with no missing links, no links outside that set, and no dangling links (harness not reachable). The harness itself is checked with `--all` (every skill).
- **BOOT-2 [M]** WARN — `package.json` has a `ki:skills:link:project` script invoking the keystone linker, so the links are reproducible on clone.
- **BOOT-3 [M]** WARN — `.claude/skills/` is gitignored (the links are generated, never committed).
- **BOOT-4 [J]** — the repo's _declared_ coverage is itself correct — it opts into the skills it actually uses. This is `ki-repo`'s coverage cascade (detected-artifact ⟺ declared-table), not this skill's; route a wrong declaration there rather than papering over it by hand-linking. The keystone (`ki-bootstrap`) must be installed globally for `ki:skills:link:project` to resolve — an environment precondition, not a repo property.
- **BOOT-5 [M]** WARN — every linked skill that carries a discoverable checker script (`scripts/(audit|lint)-*.ts`) and/or a discoverable conform script (`scripts/conform-*.ts`) has a matching `ki:<suffix>:<verb>` script in `package.json` (e.g. `ki-kb`'s `audit-kb.ts` → `ki:kb:audit`, `ki-repo`'s `conform-repo.ts` → `ki:repo:conform`), so each skill's own AUDIT/CONFORM is reproducible without recalling the script's path or filename by hand. A skill with zero or multiple matches for either kind is skipped for that kind (nothing to scaffold, or ambiguous — resolved by hand).

## BOOT — project-local governance agent install

- **BOOT-6 [M]** WARN — `.claude/agents/` mirrors `agents/governance/*.md` when the repo's `.ki-config.toml` carries the bare `[ki-agents]` table, and is empty when it doesn't — no missing links, no links outside that set, no dangling links. Unlike skills there is no baseline: absent the table, the expected set is empty.
- **BOOT-7 [M]** WARN — `package.json` has a `ki:agents:link:project` script invoking [`link-agents.ts`](../scripts/link-agents.ts), so the links are reproducible on clone. Only checked when `[ki-agents]` is declared (a repo that doesn't opt in needs no such script).
- **BOOT-8 [M]** WARN — `.claude/agents/` is gitignored (the links are generated, never committed).

## Reporting

Produce findings on the severity ladder, each `severity · criterion · what · fix`. All BOOT criteria are WARN (conformable, never ship-blocking): a missing/dangling link, absent `ki:skills:link:project`/`ki:agents:link:project`/gitignore, or missing per-skill checker/conform script is fixed by Mode CONFORM (re-run the relevant linker; it adds the script / gitignore line / missing `ki:<suffix>:<verb>` entries). Close by naming the composition: `ki-repo` owns whether the declared skill coverage is right; whether a repo should opt into `[ki-agents]` at all is likewise a judgment call for the repo owner, not this skill.
