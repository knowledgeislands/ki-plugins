# Modes AUDIT and CONFORM

_On-demand procedure for tokenomics' AUDIT and CONFORM modes (CONFORM runs AUDIT first, so they share this file). The two-halves model (standing surface + runtime levers), the config table, and the Headroom registry live in [`SKILL.md`](../SKILL.md) and are already loaded; this file is the procedure only._

## Mode AUDIT — measure the environment against the budget

1. **Run the checker**: `bun scripts/audit-tokenomics.ts <target>` (a project or base; defaults to the cwd). It reads the user-wide `~/.claude` layer by design — tokenomics _is_ the composition of both layers — unless `--no-user`. It grades each area on the unified severity ladder (FAIL / WARN / POLISH / ADVISORY / INFO / SKIP / PASS — see `ki-engineering`'s [checker-contract.md](../../ki-engineering/references/checker-contract.md)) and exits non-zero on any FAIL; with `--json` / `--report` it emits machine-readable findings and writes the latest report to the target's `.ki-meta/audits/tokenomics.{md,json}`. Capture its output verbatim, do not re-derive what it measures.
2. **Apply the judgment layer** — the **[J]** criteria in [the rubric](audit-rubric.md) the script cannot decide: is a big `CLAUDE.md` earning its tokens or restating what the model already knows; are the configured MCP servers actually used by this kind of work, or is the tool surface dead weight; are the model tier and sub-agent fan-out proportionate; is Headroom's reversible / cache config genuinely optimal.
3. **Compose sibling audits.** Cost is downstream of artifacts other skills own — name them rather than re-judge them: `ki-mcp` for an over-broad server's own design, `ki-skills` for a bloated skill `description`, `ki-kb-base` for a base whose loaded surface is large because it is mis-structured.
4. **Report** by layer → component → cost → fix, leading with FAILs then the biggest WARNs (usually the MCP tool surface). Attribute every figure to its layer so the user sees where the budget went.

## Mode CONFORM — bring the environment into budget

Edits local config; confirm before mutating, and remember that turning off an MCP server changes what the agent can do — show the diff.

1. Run **AUDIT** first for the gap list.
2. Trim the biggest line items: lift rarely-read detail out of `CLAUDE.md` into on-demand files (or exclude an irrelevant ancestor `CLAUDE.md` via `claudeMdExcludes`); prune stale memory; switch off or scope the MCP servers the work does not use (the largest single lever, keeping tool search on so unused servers' schemas stay deferred); consolidate redundant skills.
3. Wire context-compression tooling where it is `recommended` / `required` and absent; turn on prompt caching and pick the right model tier where the runtime levers are idle.
4. Add or correct the `[ki-tokenomics]` table (or run **INIT**). Re-run **AUDIT** until clean.
