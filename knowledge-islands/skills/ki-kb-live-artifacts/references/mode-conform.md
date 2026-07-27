# Mode CONFORM — repair structural gaps

_On-demand procedure for live-artifacts CONFORM. The live artifact model — pairing convention, required frontmatter, index note, and project bindings — lives in [`SKILL.md`](../SKILL.md) and is already loaded._

1. Run [AUDIT](mode-audit.md) first for the gap list.
2. Run `ki repo conform --skill ki-kb-live-artifacts` to propose creating or appending unambiguous index entries and adding a missing `renders: html` declaration to an existing frontmatter block. It does not infer a missing `status` or `author`.
3. For unpublished artifacts, report that HTML must be generated; this skill does not render Markdown to HTML.
4. For orphaned renders, ask whether to create the missing Markdown source or delete the stale HTML, and confirm before deleting.
5. For stale pairs, ask the user to regenerate the HTML.
6. Re-run [AUDIT](mode-audit.md) until it is clean.
