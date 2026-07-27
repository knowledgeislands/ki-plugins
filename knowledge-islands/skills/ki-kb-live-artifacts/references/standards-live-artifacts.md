# Live Artifact standard

Live Artifacts are intentionally mutable operational documents held below `Admin/Operations/Live Artifacts/` in a Knowledge Islands base.

Each artifact has a Markdown source and a co-located HTML render with the same stem.

The Markdown source is authoritative and carries frontmatter with `status`, `renders`, and `author`.

The status is `active` or `archived`; `renders` includes `html`.

When artifact sources exist, `Live Artifacts.md` indexes them with a useful one-line description.

Index presence is a warning-level mechanical requirement. A source name omitted from an existing index is informational mechanical evidence that may be repaired with a placeholder entry; whether each description is useful remains a judgment check.

The HTML render must not lag its Markdown source by more than the configured threshold, which defaults to 24 hours.

The checker may propose creating or appending unambiguous index entries and adding a missing `renders: html` value to an existing frontmatter block. The host validates and publishes the resulting shared-session proposal.

It must not generate renders, delete orphaned files, choose an artifact status, or write judgmental descriptions.
