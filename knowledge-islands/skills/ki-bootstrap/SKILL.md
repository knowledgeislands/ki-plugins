---
name: ki-bootstrap
implies: [ki-repo]
description: >
  Bootstraps a Knowledge Islands repo into governance two ways: it runs the INIT chain that vendors each declared skill's mechanical checkers into the repo so it self-governs with `bun run ki:audit` and zero skills installed, and it links the repo's project-local skills (`.claude/skills/`) from its `.ki-config.toml` so the right skills load in-session. Use when bootstrapping a fresh or legacy repo, making a repo self-govern, setting up or auditing skill links, or adding the `ki:audit` / `ki:skills:link:project` conventions. Triggers: "bootstrap this repo", "make this repo self-govern", "set up this repo's skills", "migrate this legacy repo", "why aren't my skills loading in this repo". This is the install keystone — the one knowledgeislands skill kept installed globally, so any repo can self-wire from the remote source. For the `.ki-config.toml` contents and the coverage cascade (which skills a repo should declare) and GitHub settings use `ki-repo`; for the harness's four-part layout use `ki-harness`.
argument-hint: 'init [target] | audit [path] | conform [path] | refresh'
---

# Knowledge Islands Bootstrap

You are the install **keystone** — the one `ki-*` skill kept in `~/.claude/skills` (so its `description` is paid on every turn everywhere), deliberately tiny. You bootstrap a repo into governance along **two complementary axes**:

1. **INIT — mechanical self-sufficiency (the chain).** Bring a target repo under governance so it self-governs with `bun run ki:audit` and **zero skills installed**: for every skill in the resolved set, vendor _copies_ of its checker scripts into the repo and wire the `ki:*` package.json keys. This is how a **greenfield** repo bootstraps and how a **legacy** repo migrates — run from the remote source, no local install. See **Mode INIT** and [ADR-KI-HARNESS-007](../../docs/decisions/ADR-KI-HARNESS-007-bootstrapping-and-self-sufficiency.md).
2. **Linking — in-session skill loading (the symlinks).** Mirror the repo's `.claude/skills/` to its declared coverage so exactly the right skill _descriptions_ load when a human works in that repo, and no others elsewhere. This keeps the standing skill-description cost out of unrelated sessions (the tokenomics reason skills are project-local, not global). See **Mode AUDIT / CONFORM**.

The two are distinct: vendored **copies** run the mechanical checks anywhere (CI, a bare clone); the gitignored **symlinks** are only about which skills the agent sees in-session. INIT installs the first; linking maintains the second.

**The linking model — at a glance:**

- A repo's `.claude/skills/` should mirror its **declared coverage** — the `[ki-<skill>]` tables in its `.ki-config.toml` — **plus a baseline of `ki-repo` + `ki-authoring`** (so a greenfield repo with no tables can still reach repo's INIT, and Markdown/TOML style is always governed). The keystone itself is never linked project-local — it is global.
- A repo's `.claude/agents/` should mirror `agents/governance/*.md` **only when** it carries the bare `[ki-agents]` table — no baseline, since no agent is always-on.
- Links are **relative symlinks** into the harness's `skills/`/`agents/governance/`, **gitignored and regenerated** — the committed artifacts are `ki:skills:link:project`/`ki:agents:link:project` package.json scripts and the `.gitignore` lines, never the symlinks (which would dangle on a clone without the harness beside it).
- The **harness** (`ki-agentic-harness`) is the authoring hub: it links **all** skills (`--all`), not a coverage subset.

The INIT chain engine is [`scripts/bootstrap.ts`](scripts/bootstrap.ts); the skill linker/checker is [`scripts/link-skills.ts`](scripts/link-skills.ts); the agent linker/checker is [`scripts/link-agents.ts`](scripts/link-agents.ts). All three share the same self-location and package.json-splice logic ([`scripts/package-scripts.ts`](scripts/package-scripts.ts)) and self-locate the harness through their own path. The quotable invariant is [the standard](references/bootstrap-standard.md); the checkable criteria are [the rubric](references/audit-rubric.md). This skill **composes on** `ki-repo`, which owns the `.ki-config.toml` contract it reads — it never edits the config's coverage, only mirrors it.

## Mode INIT — bring a repo under governance (self-sufficiency chain)

The mechanical half of INIT, and the start of the bootstrap chain. Run it against a target repo — locally, or straight from the remote source with nothing installed:

```bash
bun scripts/bootstrap.ts <target-repo> [--new | --legacy | --tracking] [--dry-run]
# remote (documented follow-on): bun run https://raw.githubusercontent.com/knowledgeislands/ki-agentic-harness/<ref>/skills/ki-bootstrap/scripts/bootstrap.ts <target>
```

1. **Resolve the set.** The baseline `ki-repo` + `ki-authoring`, plus every `[ki-<skill>]` table declared in the target's `.ki-config.toml`, plus the transitive `implies:` closure of all of them (the same graph `ki:skills:graph` renders). `ki-bootstrap` itself is never vendored — it is the global chain-starter.
2. **Satisfy the self-sufficiency contract.** For each skill in the set, vendor **copies** (SCRIPT-7 — copies, not symlinks, so they run standalone) of its checker (`audit-*.ts`/`lint-*.ts`) and any `conform-*.ts` into the target's `scripts/ki/<skill>/`, install that skill's `ki:<suffix>:{audit,conform}` package.json keys pointing at the copies, and install/refresh the repo-wide `ki:audit` / `ki:conform` / `ki:init` aggregates (a vendored `scripts/ki/aggregate.ts` that fans each verb out over the installed `ki:<skill>:<verb>` keys, staying correct as skills are added).
3. **Result:** after INIT the target governs itself with `bun run ki:audit` and **zero skills installed**.

**Aggressiveness flags** are three strengths of the one chain, not a separate orchestrator: `--new` (default) INIT only; `--legacy` INIT then a full `ki:conform` pass (the migration path off old formats); `--tracking` INIT then `ki:audit` (report drift only).

**Per-skill delegators.** Every other skill owns a `scripts/bootstrap.ts` that is a thin delegator — it execs this engine with itself as an explicit `--seed`, so running one skill's INIT brings that skill (plus its `implies:` closure and the baseline) under governance. Delegating by subprocess is composition, not a cross-skill import, so each skill keeps a concrete INIT and stays valid standalone.

## Mode AUDIT — check a repo's project-local skills and agents

1. **Run the checkers.** `bun "$HOME/.claude/skills/ki-bootstrap/scripts/link-skills.ts" [path] --check` and `bun "$HOME/.claude/skills/ki-bootstrap/scripts/link-agents.ts" [path] --check` (or `bun run ki:skills:link:project --check` / `bun run ki:agents:link:project --check` if wired). They report on the unified severity ladder (`ki-engineering` enforcement-framework §2): **BOOT-1** `.claude/skills/` matches declared coverage ∪ baseline (and no dangling links), **BOOT-2** a `ki:skills:link:project` script is present, **BOOT-3** `.claude/skills/` is gitignored, **BOOT-5** every linked skill with a checker or conform script has a matching `ki:<suffix>:<verb>` package.json script, **BOOT-6** `.claude/agents/` matches the `[ki-agents]`-gated set, **BOOT-7** a `ki:agents:link:project` script is present (when the table is declared), **BOOT-8** `.claude/agents/` is gitignored.
2. **Judge the [J] criterion (BOOT-4) by reading** — is the repo's _declared_ coverage actually right (does it opt into the skills it uses)? That is `ki-repo`'s coverage cascade, not this skill's; name it as the off-ramp rather than re-deciding it here.
3. **Report** by criterion. A missing/dangling link or absent `ki:skills:link:project`/`ki:agents:link:project`/gitignore is a WARN — all are conformable, none block.

## Mode CONFORM — wire a repo

1. Run **AUDIT** first.
2. **Link** the project-local set: `bun "$HOME/.claude/skills/ki-bootstrap/scripts/link-skills.ts" [path]` (the harness uses `--all`) and `bun "$HOME/.claude/skills/ki-bootstrap/scripts/link-agents.ts" [path]`. Each creates/prunes relative symlinks under `.claude/skills/`/`.claude/agents/` to match its expected set. Preview either with `--dry-run`.
3. **Make it reproducible:** ensure `package.json` has `"ki:skills:link:project"` and (if `[ki-agents]` is declared) `"ki:agents:link:project"` invoking the keystone linkers, and `.gitignore` carries `.claude/skills/` and `.claude/agents/`. (The keystone must be globally installed — `bun scripts/sync-skills.ts link --only ki-bootstrap` from the harness.) The **Link** step above also scaffolds a `ki:<suffix>:<verb>` script per linked skill that carries a discoverable checker or conform script — e.g. `ki:kb:audit`, `ki:repo:conform` — so no separate action is needed for those.
4. **Re-run AUDIT** until clean.

## Mode REFRESH — re-anchor

Canonical, on-change: this skill tracks no external spec. Re-anchor when the install model changes — the INIT chain / self-sufficiency contract (the vendor layout, the aggregate runner, the `implies:` graph shape), the coverage-table contract (`ki-repo`), the `[ki-agents]` gating convention, the skill/agent discovery locations Claude Code reads, or the `ki:skills:link:project`/`ki:agents:link:project` conventions. Read [the source list](references/sources.md), confirm the standard still matches the reference implementation, propose a diff, bump the dates.

## Composition

- `ki-repo` — owns the `.ki-config.toml` coverage-cascade contract and the GitHub settings. This skill reads that config but never edits it; for any question about _which_ skills a repo should declare, route to `ki-repo`.
- `ki-tokenomics` — owns the standing-cost rationale for keeping skills project-local (not global). For token-budget questions, route there.

## Notes

- **Why a keystone, not part of `ki-repo`:** the global skill is paid every turn everywhere, so it must be minimal. `repo` is heavy (GitHub settings, security, files). Splitting the bootstrap out keeps the global footprint to one tiny description; `repo` stays project-local and loads only in repos that declare it (which is every ki repo — it's in the baseline).
- **Greenfield:** `bun scripts/bootstrap.ts <target>` needs no `.ki-config.toml` — the baseline `{repo, authoring}` is vendored so `ki-repo` INIT is reachable to scaffold the config; re-run for the full declared set once the coverage tables exist. (Linking mirrors the same baseline into `.claude/skills/` so the skills also load in-session on a fresh clone.)
- **INIT vs linking:** INIT vendors mechanical **copies** that run with nothing installed (CI, migration, a bare clone); linking maintains gitignored **symlinks** that only affect which skills load in an interactive session. A repo usually wants both; they are independent and can be run separately.
