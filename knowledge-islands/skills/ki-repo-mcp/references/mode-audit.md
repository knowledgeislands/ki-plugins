# Mode AUDIT — check a repository against the MCP standard

_On-demand procedure for ki-repo-mcp's AUDIT mode. The canonical shape, surface-area model, tool naming, and access-level gate live in [`SKILL.md`](../SKILL.md) and are already loaded; this file is the procedure only._

Auditing all the `mcp-*` servers at once is a set audit — **bound the context** (the set-audit discipline in `ki-skills`' enforcement framework §5): walk the servers **one at a time**, running each server's full audit (the common `engineering` layer then the MCP delta below) and releasing it before the next; the servers are independent, so the order is free.

1. **Identify the target.** Confirm the repo path (default: the cwd repo). Note its `<app>` prefix and which tool groups it ships.
2. **Run the hosted mechanical audit.** `ki repo audit --repo <repo-path>` runs every declared skill, including `ki-engineering` for the shared toolchain and `ki-repo-mcp` for the **MCP delta**: `src/` layers, `main`/`bin`/`exports`, shared `utils/`, tool names, and—when the repo selects Vitest—MCP coverage exclusions. Capture the result; the repository is clean only when every declared skill passes.
3. **Do the semantic pass the native audit cannot** — walk [Audit Rubric](rubric.md) and judge:
   - **Config injection**: grep for top-level `process.env` reads outside `config/index.ts`; confirm `main/`/`utils/` take config as the first arg.
   - **Layer purity**: logic that lives only in a `tools/*` handler or in `cli.ts` (should be in `main/`); `console.*` in `main/` (CLI/stderr only).
   - **Tool naming**: `grep -rn registerTool src/tools` — every name matches `<app>_<resource>_<action>` with correct plurality.
   - **Access gate**: every tool sets a real `annotations` preset; nothing bypasses `makeAccessGatedRegister`; destructive tools default `dry_run: true`.
   - **Security invariants** (see the checklist): path containment, `execFile`/argv not shell strings, bounded + `--no-optional-locks` git, depth-limited walks, tightened identifier regexes (not bare `z.string()`), `.strict()` zod with bounded numerics, no secrets in audit logs / error messages.
   - **Docs**: `CLAUDE.md` + `README.md` present and _not drifted_ from the code (notion-mirror's `CLAUDE.md` describing `orchestrator/` after the move to `cli/` + `main/` is the cautionary example).
   - **Longevity**: volatile external facts (targeted spec version/date, upstream API versions, third-party URLs, model IDs) aren't scattered hard-coded literals — each resolves at runtime or is pinned in one refreshable place, so the server can't rot silently once installed. Mirrors the skills rubric's longevity check; see the checklist's _Longevity & staleness_ section.
4. **Run external checks explicitly.** Execute `bun run test`, and when defined `bun run ki:test:smoke`, outside the hosted audit. The rubric reports these commands but never launches repository code.
5. **Report.** Group findings on the unified severity ladder: a security invariant or gate bypass is a **FAIL**, layout/naming/tooling divergence a **WARN**, and documentation or consistency advice **INFO**. Cite `file:line`, give the fix, and call out intentional per-repository divergences so they are not re-flagged.
