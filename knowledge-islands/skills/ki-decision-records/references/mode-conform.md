# Mode CONFORM — bring Decision Records into line

**Precondition:** run [Mode AUDIT](mode-audit.md) first and retain its findings.

1. Run `ki repo conform --skill ki-decision-records --repo <repo> --dry-run` to inspect safe catalogue proposals before publication. The current mechanical conform action appends missing index entries to one session-owned draft; the host alone validates and publishes the final write.
2. **File renames** — if a filename or prefix does not match, confirm with the user before renaming because a rename changes the canonical ID.
3. **Section repairs** — add missing section stubs; leave substantive content for the author.
4. **Index repair** — accept or adjust the proposed missing entries, restore reveal-order ordering, and convert any leftover table to the ordered-list form.
5. **Present-state migration** — flag any record still carrying old-format lifecycle cruft (`**Status:**`, `**Mutability:**`, `## Changelog`, `Superseded by`/`Supersedes` lines) and rewrite it to the living-record form.
6. Re-run [Mode AUDIT](mode-audit.md) to confirm convergence.
