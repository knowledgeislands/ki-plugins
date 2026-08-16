# Chezmoi MCP rendering standard

The normative standard behind [the generated rubric](rubric.md). It governs one thing only: **rendering the canonical MCP single source through chezmoi** so the file-editable surfaces are generated from it rather than maintained by hand.

This is a **governance skill** and a **composition skill** in the sense of `ADR-KI-HARNESS-SKILLS-004`. It composes two siblings and adds a renderer-specific delta; it does not import or re-implement either sibling.

## What each layer owns

- **`ki-binding`** owns the portable MCP source, its client tokens, and mcporter comparison. Runtime adapters own native vendor surface comparison.
- **`ki-repo-dotfiles-chezmoi`** governs generic chezmoi repository shape, naming, templating, apply, and reverse-merge practices. It has no MCP-specific policy.
- **`ki-binding-chezmoi`** owns the connection between MCP render data, the `mcp-servers-json` partial, target templates, and the reviewed `chezmoi apply` result.

AUDIT runs the two sibling audits in that order, then this skill's rubric. Findings remain under their owning skill.

## The render contract

1. **The source repository is inspectable.** Rubric evidence comes only from a physical repository directory and physical files within it. Symlinked or non-regular evidence is reported and not traversed.
2. **MCP render data is present and valid.** The repository uses one of two supported patterns:
   - **Data-merge pattern:** `.chezmoidata/` contains one MCP YAML input with the portable canonical schema, merged into template data by chezmoi.
   - **Managed-source pattern:** a plain, non-templated `mcp-servers.yaml` is applied to the canonical XDG path and read from the chezmoi source tree by the render partial.
3. **The render partial exists.** The sole `.chezmoitemplates/mcp-servers-json.tmpl` partial expands client-targeted data into a surface's `mcpServers` representation.
4. **At least one target is wired.** A physical target `.tmpl` calls that partial with `template "mcp-servers-json.tmpl" .` or includes the selected managed source; substrings and comments do not count.
5. **Render, apply, activation, and health remain separate.** `chezmoi diff` is reviewed before `chezmoi apply`, but source structure cannot claim a render, applied target, client activation, or runtime health. Those require separately authorised, secret-safe evidence.

Both data patterns are valid. Choosing between them, selecting a partial location, deciding which targets to render, and executing `chezmoi apply` are external repository policy. The rubric reports the available evidence and missing links but deliberately proposes no files or commands.

When the data-merge pattern is used, the render must also produce the canonical source consumed by `ki-binding`, or the operator must bind that audit to the intended source explicitly. A private `.chezmoidata` input is not itself a second canonical source.

## Invariants

- **Composition stays explicit.** Run `ki-repo-dotfiles-chezmoi`, then `ki-binding`, then this skill. This rubric checks only the renderer-specific delta.
- **Edits flow through the selected source.** A hand-written rendered surface is drift; CONFORM changes the source or template and then applies chezmoi.
- **External choices remain report-only.** The skill does not infer a data pattern, author a template, choose target surfaces, or launch chezmoi.
- **Renderer scope stays local.** A non-chezmoi setup uses `ki-binding` with another renderer and does not install this skill. Do not invent a renderer skill for every vendor/client combination.
