---
name: ki-binding-chezmoi
ki-kind: governance
ki-shared-dependencies: [ki-skills:rubric]
ki-depends-on: [ki-binding, ki-repo-dotfiles-chezmoi]
description: >
  Codify, audit, and conform the chezmoi renderer path for the KI MCP binding — the canonical `mcp-servers.yaml` source data, a renderer partial, and `chezmoi apply`. A composition skill over `ki-binding` and `ki-repo-dotfiles-chezmoi`; it owns renderer evidence, never a vendor-specific renderer cross-product. Use when rendering the MCP source through chezmoi, wiring a partial, or checking a renderer path is complete.
argument-hint: 'audit <target> | conform <target> | help | educate <target> | refresh'
---

# The chezmoi render path for the KI MCP binding

You are governing **one render path**: how the canonical MCP single source becomes the file-editable surfaces that run the servers, through chezmoi. This is a **governance skill** and a **composition skill** — it sits on top of two siblings and adds a delta over them, never forking their shared modes (`ADR-KI-HARNESS-SKILLS-004`, the composition-for-backends corollary: a render path is its own skill, not a `--backend` flag on `ki-binding`).

The two composed layers:

- **`ki-binding`** owns the portable canonical source and mcporter evidence; runtime adapters own their native client surfaces.
- **`ki-repo-dotfiles-chezmoi`** is the house standard for any chezmoi source repo — naming prefixes, templating, `chezmoi apply`, surgical-patch reverse-merge — with no knowledge of MCP.

This skill's **delta** is the render contract that ties them together — the `mcp-servers-json` template, its source-data wiring, and the `chezmoi apply` that generates the surfaces `ki-binding` audits. That contract belongs to neither sibling: `ki-binding` owns no renderer, and `ki-repo-dotfiles-chezmoi` covers only generic dotfile templating. The full model is in [the standard](references/standards-chezmoi-mcp-rendering.md); the checkable criteria are in [the generated rubric](references/rubric.md); provenance is in [the sources list](references/sources.md).

## Operating modes

Like every governance skill it carries the universal **AUDIT · CONFORM · EDUCATE · REFRESH**.

### Mode HELP — orient without changing anything

Invoked as `help` / `-h` / `?`, it explains itself and stops: name, purpose, invocation, modes, and off-ramps, taking no action. With no mode it does the same, then, in an interactive session only, offers the mode choice and prompts for the target the chosen mode requires.

### Mode AUDIT — check the render path, by composition

The AUDIT is a **composition**, declared here and run in sequence — it does not fork or re-implement the sibling criteria:

1. Run `ki repo audit --repo <chezmoi-repo> --skill ki-repo-dotfiles-chezmoi` for generic chezmoi repository shape.
2. Run `ki repo audit --repo <chezmoi-repo> --skill ki-binding` for the canonical source and mcporter evidence.
3. Run `ki repo audit --repo <chezmoi-repo> --skill ki-binding-chezmoi` for this skill's delta: the target is safely inspectable (`BINDCHEZ-1`), sibling surface agreement remains explicitly delegated (`BINDCHEZ-2`), MCP render data exists (`BINDCHEZ-3`), the `mcp-servers-json` partial exists (`BINDCHEZ-4`), and at least one target template uses it (`BINDCHEZ-5`).
4. Judge the [J] criteria by reading: does a reviewed `chezmoi diff` prove render parity (`BINDCHEZ-6`), and do the standard, rubric, provenance, and sibling boundaries remain coherent (`BINDCHEZ-7`)?
5. Report sibling findings under their owning skill and BINDCHEZ findings under this one. Its mechanical violations are WARN-level because the external render choice requires an operator decision.

### Mode CONFORM — bring the render path into step

1. Run **AUDIT** first.
2. **Compose the sibling write passes.** Run `ki-repo-dotfiles-chezmoi` CONFORM on the chezmoi repo, then `ki-binding` for the canonical source — in sequence, never forked.
3. **Resolve the report-only choices.** This skill deliberately proposes no writes or commands: choose the repository's existing data pattern, template location, and target set from the findings. Those are external chezmoi policy decisions, not defaults the rubric can infer safely.
4. **Render** — edit the chosen MCP source, preview with `chezmoi diff`, then run `chezmoi apply`. The render path regenerates a surface from the source; it never blesses a hand-edited rendered config, which would diverge from the source.
5. **Re-run AUDIT** until clean.

### Mode EDUCATE — explain and activate the render contract

EDUCATE scaffolds no standalone artifact. Use `ki repo educate --skill ki-binding-chezmoi --repo <target>` to explain the render contract after the repository declares this skill and its `ki-binding` and `ki-repo-dotfiles-chezmoi` dependencies.

### Mode REFRESH — re-anchor the render contract

**Precondition:** REFRESH edits this skill's own canonical files, which exist only in `ki-agentic-harness`. Invoked from an installed copy, it stops here and names the harness as where to run it — or, for a pattern recurring across bases, routes it through `ki-repo-kb`'s IMPROVE mode instead.

Re-anchor when the chezmoi render contract changes — the `mcp-servers-json` template shape, the `.chezmoidata` wiring, or the `chezmoi apply` behaviour — or when either composed sibling's contract moves. Read [the sources list](references/sources.md), confirm the standard still matches the render template and each surface's real config, propose a diff, bump the dates.

## Composition

- `ki-binding` — owns the renderer-neutral surface audit (surfaces agree with the single source). This skill composes its AUDIT / CONFORM for the surface half; it never re-implements the surface check.
- `ki-repo-dotfiles-chezmoi` — owns the generic chezmoi source-repo standard. This skill composes its AUDIT / CONFORM for the repo half; it never re-checks generic repo shape.
- `ki-repo-mcp` — owns each MCP server's own code and the cross-surface-enablement design record. For a single server's layout, route there.

## Notes

- **Why a separate skill, not a flag:** `ki-binding` is renderer-neutral by design — folding chezmoi into it would couple every surface audit to one renderer. The render path is a genuine delta over both siblings, so it composes them rather than forking their modes (`ADR-KI-HARNESS-SKILLS-004`).
- **Not coverage-scoped everywhere:** this skill is installed only where the chezmoi render path is actually in use; a plain (non-chezmoi) setup runs `ki-binding` alone and re-renders through whatever tool reads the canonical source.
