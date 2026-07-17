---
name: ki-binding-chezmoi
implies: [ki-binding, ki-dotfiles-chezmoi]
vendors: [educate, audit, conform, help]
description: >
  Codify, audit, and conform the chezmoi render path for the KI MCP binding — rendering the canonical `mcp-servers.yaml` single source into the file-editable surfaces (Claude Code, Desktop, mcporter) through chezmoi: the `mcp-servers-json` template, `.chezmoidata` wiring, and `chezmoi apply`. A composition skill — its AUDIT runs `ki-dotfiles-chezmoi` then `ki-binding` in sequence, then adds its delta: the chezmoi repo carries the MCP data and render template, and an apply reproduces the surfaces `ki-binding` audits. Use when rendering the MCP source through chezmoi, wiring the render template, or checking an apply reproduces the audited surfaces. Triggers: "render the mcp source through chezmoi", "chezmoi apply the mcp config", "wire the mcp-servers-json template", "the rendered mcp surfaces are stale". Not the renderer-neutral surface audit (`ki-binding`) or the generic chezmoi repo standard (`ki-dotfiles-chezmoi`) — only the MCP render contract tying them (ADR-KI-HARNESS-SKILLS-004).
argument-hint: 'audit <target> | conform <target> | help | educate <target> | refresh'
---

# The chezmoi render path for the KI MCP binding

You are governing **one render path**: how the canonical MCP single source becomes the file-editable surfaces that run the servers, through chezmoi. This is a **governance skill** and a **composition skill** — it sits on top of two siblings and adds a delta over them, never forking their shared modes (`ADR-KI-HARNESS-SKILLS-004`, the composition-for-backends corollary: a render path is its own skill, not a `--backend` flag on `ki-binding`).

The two composed layers:

- **`ki-binding`** is renderer-neutral. It reads the single source (`~/.config/ki/mcp-servers.yaml`, canonical) and audits that each surface (Claude Code, Claude Desktop, mcporter) agrees with it — it renders nothing and requires no renderer installed. Each server's `clients:` set names the surfaces it targets.
- **`ki-dotfiles-chezmoi`** is the house standard for any chezmoi source repo — naming prefixes, templating, `chezmoi apply`, surgical-patch reverse-merge — with no knowledge of MCP.

This skill's **delta** is the render contract that ties them together — the `mcp-servers-json` template, the `.chezmoidata` wiring, and the `chezmoi apply` that generates the surfaces `ki-binding` audits. That contract belongs to neither sibling: `ki-binding` owns no renderer, and `ki-dotfiles-chezmoi` covers only generic dotfile templating. The full model is in [the standard](references/binding-chezmoi-standard.md); the checkable criteria are in [the rubric](references/audit-rubric.md); provenance is in [the sources list](references/sources.md).

## Operating modes

Like every governance skill it carries the universal **AUDIT · CONFORM · EDUCATE · REFRESH**. Invoked as `help` / `-h` / `?`, it explains itself and stops — the generated HELP block (name, purpose, invocation, modes, off-ramps), taking no action. With no mode it does the same, then, in an interactive session only, offers the mode choice via `AskUserQuestion`, prompting for the target the chosen mode's `argument-hint` shows.

### Mode AUDIT — check the render path, by composition

The AUDIT is a **composition**, declared here and run in sequence — it does not fork or re-implement the sibling criteria:

1. **Run the checker** — `bun scripts/audit.ts [chezmoi-repo] [--source <path>]`. It composes, as subprocesses (never imports):
   - **`ki-dotfiles-chezmoi` AUDIT** on the chezmoi repo — the source repo is conventional (`BINDCHEZ-1`);
   - **`ki-binding` AUDIT** — each surface agrees with the single source (`BINDCHEZ-2`); then adds its own **render-path delta**: the chezmoi repo carries the MCP source data (`BINDCHEZ-3`), the `mcp-servers-json` render template exists (`BINDCHEZ-4`), and at least one target `.tmpl` is wired through it (`BINDCHEZ-5`). A composed sibling FAIL folds up as a FAIL here.
2. **Judge the [J] criteria by reading** — render parity (`BINDCHEZ-6`): would a `chezmoi apply`, previewed with `chezmoi diff`, reproduce exactly the surfaces `ki-binding` audits? Name it; do not guess it.
3. **Report** by criterion on the severity ladder. All BINDCHEZ criteria are WARN — conformable, never ship-blocking.

### Mode CONFORM — bring the render path into step

1. Run **AUDIT** first.
2. **Compose the sibling write passes.** Run `ki-dotfiles-chezmoi` CONFORM on the chezmoi repo, then `ki-binding` CONFORM for the surfaces — in sequence, never forked.
3. **Render** — edit the MCP source (`.chezmoidata` / the canonical file), preview with `chezmoi diff`, then `chezmoi apply`. The render path regenerates a surface from the source; it never blesses a hand-edited rendered config, which would diverge from the source. `scripts/conform.ts` scaffolds no target-repo file — it prints these steps as TODOs.
4. **Re-run AUDIT** until clean.

### Mode EDUCATE — vendor the render-path checks

EDUCATE scaffolds no standalone artifact. It vendors this skill's declared mechanical unit (the frontmatter `vendors:` declaration) into the target's `.ki-meta/` via the central bootstrap chain: [`scripts/educate.ts`](scripts/educate.ts) is a thin delegator that execs the `ki-bootstrap` engine with this skill as an explicit seed — pulling in everything it `implies:` (`ki-binding`, `ki-dotfiles-chezmoi`) too.

### Mode REFRESH — re-anchor the render contract

**Precondition:** REFRESH edits this skill's own canonical files, which exist only in `ki-agentic-harness`. Invoked from a repo where the skill is vendored, it stops here and names the harness as where to run it — or, for a pattern recurring across bases, routes it through `ki-kb`'s IMPROVE mode instead.

Re-anchor when the chezmoi render contract changes — the `mcp-servers-json` template shape, the `.chezmoidata` wiring, or the `chezmoi apply` behaviour — or when either composed sibling's contract moves. Read [the sources list](references/sources.md), confirm the standard still matches the render template and each surface's real config, propose a diff, bump the dates.

## Composition

- `ki-binding` — owns the renderer-neutral surface audit (surfaces agree with the single source). This skill composes its AUDIT / CONFORM for the surface half; it never re-implements the surface check.
- `ki-dotfiles-chezmoi` — owns the generic chezmoi source-repo standard. This skill composes its AUDIT / CONFORM for the repo half; it never re-checks generic repo shape.
- `ki-mcp` — owns each MCP server's own code and the cross-surface-enablement design record. For a single server's layout, route there.

## Notes

- **Why a separate skill, not a flag:** `ki-binding` is renderer-neutral by design — folding chezmoi into it would couple every surface audit to one renderer. The render path is a genuine delta over both siblings, so it composes them rather than forking their modes (`ADR-KI-HARNESS-SKILLS-004`).
- **Not coverage-scoped everywhere:** this skill is only vendored where the chezmoi render path is actually in use; a plain (non-chezmoi) setup runs `ki-binding` alone and re-renders through whatever tool reads the canonical source.
