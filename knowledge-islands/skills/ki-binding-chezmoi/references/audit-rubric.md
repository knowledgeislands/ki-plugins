# Audit rubric — ki-binding-chezmoi

Line-by-line criteria for auditing the chezmoi render path for the KI MCP binding, against [the standard](binding-chezmoi-standard.md). Each is tagged **[M] mechanical** (the bundled [checker](../scripts/audit.ts) enforces it — capture its output, don't re-derive) or **[J] judgment** (assess by reading). Severity uses the unified ladder in `ki-engineering`'s [`enforcement-framework.md`](../../../foundations/ki-engineering/references/enforcement-framework.md) §2. Every **[M]** criterion is implemented in [`../scripts/audit.ts`](../scripts/audit.ts) (SHAPE-9).

This is a **composition** checker: BINDCHEZ-1 and BINDCHEZ-2 are the two composed siblings run in sequence as subprocesses; BINDCHEZ-3–5 are this skill's own render-path delta. It does not fork or re-implement the sibling criteria.

## BINDCHEZ — composition edges

- **BINDCHEZ-1 [M]** WARN — the chezmoi source repo is conventional: composes `ki-dotfiles-chezmoi` AUDIT on the repo path and folds its result (a composed FAIL folds up as FAIL here). (standard: What each layer owns; Invariants)
- **BINDCHEZ-2 [M]** WARN — each surface agrees with the single source: composes `ki-binding` AUDIT and folds its result. `ki-binding` reads the source directly and requires no renderer installed. (standard: What each layer owns)

## BINDCHEZ — render-path delta

- **BINDCHEZ-3 [M]** WARN — the chezmoi source repo carries the MCP source data, either as `.chezmoidata/*mcp*` (legacy data-merge pattern) or as a plain managed source file applied verbatim to the canonical XDG path and read via chezmoi's `include` (inverted pattern, e.g. `dot_config/ki/mcp-servers.yaml`) — the data chezmoi renders from. (standard: The render contract §1)
- **BINDCHEZ-4 [M]** WARN — the `mcp-servers-json` render template partial exists in the chezmoi repo. (standard: The render contract §2)
- **BINDCHEZ-5 [M]** WARN — at least one target `.tmpl` references the `mcp-servers-json` partial, so a `chezmoi apply` writes a surface from the source. (standard: The render contract §3)

## Judgment criteria (apply by reading)

- **BINDCHEZ-6 [J]** — a `chezmoi apply` (previewed with `chezmoi diff`) reproduces exactly the surfaces `ki-binding` audits — render parity, not just template presence. This is a read of the diff, not something the checker fires. (standard: The render contract §4)
- **BINDCHEZ-7 [J]** — this rubric, [the standard](binding-chezmoi-standard.md), and [the checker](../scripts/audit.ts)'s constants agree; when the standard moves, all three move together (Mode REFRESH).

Produce findings on the severity ladder, each `severity · criterion · what · fix`. All BINDCHEZ criteria are WARN (conformable, never ship-blocking) — the fix is to bring the chezmoi repo into shape (`ki-dotfiles-chezmoi`), edit the single source, and re-render with `chezmoi apply`, never to hand-edit a rendered surface. Close by naming the composition: `ki-binding` owns the renderer-neutral surface audit; `ki-dotfiles-chezmoi` owns the generic chezmoi repo standard; this skill owns only the MCP render contract that ties them together (`ADR-KI-HARNESS-SKILLS-004`).
