# Mode NEW — author a new live artifact

_On-demand procedure for live-artifacts' NEW mode. The pairing convention, required frontmatter, and artifacts directory path live in [`SKILL.md`](../SKILL.md) and are already loaded; this file is the procedure only._

1. Prompt for **Name** (becomes the file stem and the `# Heading` in the `.md`).
2. Prompt for **Description** (one line for the index entry).
3. Confirm **initial status** — default `active`.
4. Write `<artifacts-dir>/<Name>.md` with the required frontmatter (`status: active`, `renders: html`, `author: <user>`) and a stub body.
5. Note that `<Name>.html` must be generated separately — this skill does not render Markdown to HTML.
6. Add an entry to the index note (`Live Artifacts.md`) noting the artifact is unpublished until the HTML is generated.
