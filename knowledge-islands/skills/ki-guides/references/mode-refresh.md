# Mode REFRESH — re-anchor the standard

**Precondition:** REFRESH edits this skill's own canonical files, which exist only in `ki-agentic-harness`. Invoked from an installed copy, it stops here and names the harness as where to run it.

1. Read [sources.md](sources.md) and re-examine the documentation map and the governing decision.
2. Where the ownership model changes, update the standard and the owning rubric family together, then regenerate `rubric.md` with `ki dev skill rubric ki-guides --write`.
3. Update the review dates and `## Last review` block in `sources.md`; record the substantive change in the commit rather than a changelog.
