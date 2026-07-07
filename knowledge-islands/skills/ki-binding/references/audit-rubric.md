# Audit Rubric — ki-binding

Line-by-line criteria for auditing whether every run surface agrees with the single source, against [the binding standard](binding-standard.md). Each is tagged **[M] mechanical** (the bundled [checker](../scripts/audit-binding.ts) `--check` decides it — capture its output, don't re-derive) or **[J] judgment** (assess by reading). Severity uses the unified ladder defined in `ki-engineering`'s [`enforcement-framework.md`](../../ki-engineering/references/enforcement-framework.md) §2.

## BIND — cross-surface agreement

- **BIND-1 [M]** WARN — each file-editable surface (`code`, `desktop`, `mcporter`) renders exactly the servers whose `clients` names it: no server missing from a surface it targets, no stray server present that the source does not target there.
- **BIND-2 [M]** WARN — the single source (`mcps.yaml`) parses, is a `mcpServers` list, and every entry has a `name` and a non-empty `clients` naming only recognised surface tokens (`code`, `desktop`, `mcporter`, `cowork`).
- **BIND-3 [M]** WARN — the project-local **skill** half is wired: composes `ki-bootstrap --check` for the `[project]` and inherits its BOOT findings (a missing/dangling skill link surfaces here).
- **BIND-4 [M]** WARN — Cowork integrity: if no server declares `cowork`, PASS (surface not in use); if any does, the Cowork enablement path must be verified (the external-edit gate resolved and `enabledPlugins` written). Until the gate passes, a `cowork` token is a WARN naming the pending gate — declared-but-unwired, never silent.
- **BIND-5 [J]** — the `clients` set per server is _right_ for how the project is used: a server the project needs targets that project's surfaces, and none carries a surface it should not. This is intent (which tools belong where), not mechanics; route a wrong `clients` declaration to a `mcps.yaml` edit rather than papering over it by hand-editing a rendered surface.

Produce findings on the severity ladder, each `severity · criterion · what · fix`. All BIND criteria are WARN (conformable, never ship-blocking): drift is fixed by Mode CONFORM (edit `mcps.yaml` + `chezmoi apply` for the file-editable surfaces; run `ki-bootstrap` for the skill half; the Cowork surface waits on its gate). Close by naming the composition: `ki-mcp` owns each server's own code and the design record; `ki-bootstrap` owns whether the skill links are right.
