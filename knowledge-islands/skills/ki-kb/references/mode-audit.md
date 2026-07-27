# Mode AUDIT — check a base against the structure model

_On-demand procedure for the KB AUDIT mode. The five-zone structure, routing test, memory cascade, project bindings, and context-loading procedure live in [`SKILL.md`](../SKILL.md) and are already loaded._

1. Run `ki repo audit --skill ki-kb --repo <base>`. The catalogue prepares each focused family context once and the host reports the typed outcomes without changing the base.
2. Apply the judgment criteria in [the generated rubric](rubric.md): note routing, whether undeclared frontmatter requirements fit the base, note naming, memory-index accuracy, fact-versus-analysis labelling, and Obsidian linking.
3. Compose applicable sibling audits in sequence, notably `ki-kb-streams` for the Streams zone and Enactment gate, and `ki-authoring` for Markdown conventions. A base is clean only when every applicable governing skill is clean.
4. Report FAIL findings before WARN findings, citing each affected path and a concrete fix.
