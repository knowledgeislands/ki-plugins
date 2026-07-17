# Harness Audit Rubric

Line-by-line criteria for auditing a Knowledge Islands agentic harness. Each criterion is tagged **[M]** (mechanical — the checker [`scripts/audit.ts`](../scripts/audit.ts) enforces it deterministically) or **[J]** (judgment — a reader/model assesses it). Each cites its standard section.

Severity ladder: FAIL / WARN / POLISH / ADVISORY / INFO / NA / PASS (defined in `ki-engineering`'s enforcement-framework §2)

## Contents

- [LAY — Directory layout and file presence](#lay--directory-layout-and-file-presence)
- [CLAUDE — CLAUDE.md coverage and freshness](#claude--claudemd-coverage-and-freshness)
- [PKG — package.json script families](#pkg--packagejson-script-families)
- [CONFIG — .ki-config.toml declarations](#config--ki-configtoml-declarations)
- [SKILLS — skills/ directory convention](#skills--skills-directory-convention)
- [LONG — Longevity and refresh path](#long--longevity-and-refresh-path)
- [COLL — Collision and boundary](#coll--collision-and-boundary)

---

## LAY — Directory layout and file presence

**LAY-1 [M]** `skills/`, `agents/`, `mcp/`, `evals/`, `hooks/` all exist as directories at the repo root. Source: standard §Layout. _Severity: FAIL — missing directory breaks the five-part contract._

**LAY-2 [M]** Each of the five directories contains a `README.md`. Source: standard §Layout. _Severity: WARN — README.md absent means no shelf/status declaration._

**LAY-3 [M]** `CLAUDE.md` exists at the repo root. Source: standard §CLAUDE.md. _Severity: FAIL — CLAUDE.md is the always-loaded orientation; its absence means agents navigate blind._

**LAY-4 [M]** `ROADMAP.md` exists at the repo root. Source: standard §ROADMAP.md. _Severity: WARN — harnesses without a roadmap lose the open-work signal._

**LAY-5 [M]** `.ki-config.toml` exists at the repo root. Source: standard §.ki-config.toml. _Severity: FAIL — no config means no KI compliance declaration._

---

## CLAUDE — CLAUDE.md coverage and freshness

> **Split orientation (AGENTS.md).** When and why a harness splits orientation between a literal `AGENTS.md` and a thin `CLAUDE.md` is `ki-repo`'s generic convention — see [its standard](../../../keystone/ki-repo/references/repo-standard.md#layer-1--repo-files) (gated on `target_runtimes`) and [its `RUNTIMES-J1` criterion](../../../keystone/ki-repo/references/audit-rubric.md). Harness-specific: when a harness uses the split, apply CLAUDE-1..5 to the imported `AGENTS.md` content — the coverage they require is satisfied there, and `CLAUDE.md` need only carry the `@AGENTS.md` import plus any genuinely Claude-only notes. LAY-3 (the file exists) still applies to `CLAUDE.md` itself.

**CLAUDE-1 [J]** `CLAUDE.md` opens with a what-the-harness-is paragraph that names all five parts (`skills/`, `agents/`, `mcp/`, `evals/`, `hooks/`). Source: standard §CLAUDE.md §1. _Severity: WARN — a CLAUDE.md that doesn't describe the harness contract fails its orientation purpose._

**CLAUDE-2 [J]** `CLAUDE.md` has a five-part directory table (or equivalent block) with current status for each part (populated / empty shelf). Source: standard §CLAUDE.md §2. _Severity: WARN._

**CLAUDE-3 [J]** `CLAUDE.md` documents working conventions for each part (which command runs it, which skill governs it, any install step). May be brief with routes to `docs/` or the relevant skill. Source: standard §CLAUDE.md §3. _Severity: POLISH — missing conventions degrade developer UX but don't break correctness._

**CLAUDE-4 [J]** `CLAUDE.md` lists the key `bun run *` toolchain commands (at minimum `ki:skills:link:project` and `ki:skills:audit`). Source: standard §CLAUDE.md §4. _Severity: POLISH._

**CLAUDE-5 [J]** `CLAUDE.md` reflects current state: skill counts, shelf statuses, and command names match the actual repo. Check against `package.json` and `skills/` directory listing. Source: standard §CLAUDE.md freshness rule. _Severity: WARN if counts or statuses are wrong; POLISH for minor drift (a deprecated command listed but present)._

---

## PKG — package.json script families

**PKG-1 [M]** `package.json` contains a `ki:skills:link:project` script (the `ki-bootstrap` delivery mechanism). Source: standard §package.json. _Severity: FAIL — the primary install mechanism is absent._

**PKG-2 [M]** `package.json` contains a `ki:skills:audit` script. Source: standard §package.json §ki:skills:audit. _Severity: FAIL — the skill quality gate is absent._

**PKG-3 (retired)** The former harness-level common-toolchain check duplicated `ki-engineering`. Aggregate entrypoints are enforced by that skill's SCR-2; internal code and authoring tools are composed underneath them. The harness checker emits no PKG-3 finding, preserving single ownership.

**PKG-4 [M]** `package.json` carries the harness skill-management / eval surface: `ki:skills:link:global`, `ki:skills:status`, `ki:skills:unlink`, `ki:skills:refresh-status`, `ki:eval`. Source: standard §package.json. _Severity: WARN per missing script._

**PKG-5 [J]** Docs aimed at governed repos (the user guide especially) never present a `ki:*` `package.json` key as _the_ invocation of a vendored checker: the `.ki-meta` path (`bun .ki-meta/skills/<skill>/<mode>.ts .`, aggregate `./.ki-meta/bin/ki-audit`) is canonical and the key its harness-local alias, with the equivalence stated or linked. A bare key is acceptable only in an explicitly harness-repo-only doc. Source: standard §package.json docs invocation discipline. _Severity: WARN — a key-only instruction silently excludes every governed repo without a `package.json`._

**PKG-6 [M]** Every `ki:*` script whose command shells `bun <path>` / `bunx <path>` references a file that exists under the repo root (`bun run <key>` delegations and non-path args are ignored; a path is a token ending `.ts`/`.js`/`.sh`/… or under `.ki-meta/`). A dangling target means the key is dead on arrival — most often a `.ki-meta/bin/*` script the target was never bootstrapped to receive (ADR-KI-HARNESS-008), or a script referenced after a move. Source: standard §package.json. _Severity: WARN per dangling target — the key silently fails at first use._

---

## CONFIG — .ki-config.toml declarations

**CONFIG-1 [M]** `.ki-config.toml` contains a `[ki-harness]` table. Source: standard §.ki-config.toml. _Severity: FAIL — the harness compliance marker is absent; `ki-repo`'s coverage cascade will WARN on this._

**CONFIG-2 [M]** `.ki-config.toml` contains a `[ki-repo]` table. Source: standard §.ki-config.toml. _Severity: WARN — the repo opted into KI governance at all._

**CONFIG-3 [J]** If `skills/` is populated, `.ki-config.toml` contains `[ki-skills]`. Source: `ki-repo`'s coverage cascade. _Severity: WARN — detected artifact without opt-in._

---

## SKILLS — skills/ directory convention

**SKILLS-1 [M]** For each `skills/<dir>` that contains a `SKILL.md`: the directory name exactly matches the `name:` frontmatter field in that `SKILL.md`. Source: standard §Skills directory. _Severity: FAIL — name/path mismatch breaks agent skill discovery._

**SKILLS-2 [J]** No two `skills/` entries share a `name:` frontmatter value. (The `ki-skills` cross-skill linter pass — COLL-1 — also checks this; don't double-report what it surfaces.) Source: Agent Skills specification; standard §Skills directory. _Severity: FAIL — duplicate names are ambiguous at selection time._

---

## LONG — Longevity and refresh path

**LONG-1 [J]** This skill itself has a REFRESH mode and a `references/sources.md` with a `## Last review` block and `last reviewed` dates. Source: `ki-skills` rubric LONG-1/LONG-2; `ki-engineering` enforcement-framework. _Severity: WARN on the skill, not the harness under audit — report separately._

---

## COLL — Collision and boundary

**COLL-1 [J]** The harness AUDIT mode names each sibling skill it composes on, and the harness `SKILL.md` description names the off-ramps for the contents-governing skills (`ki-skills`, `ki-agents`, `ki-project-roadmap`, `ki-mcp`, `ki-engineering`, `ki-repo`). Source: `ki-skills` rubric COLL-2. _Severity: WARN on the skill — check this when auditing the skill itself via `ki:skills:audit`._
