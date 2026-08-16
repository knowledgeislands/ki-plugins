# Mode CONFORM — bring Decision Records into line

**Precondition:** run [Mode AUDIT](mode-audit.md) first and retain its findings.

1. Run `ki repo conform --skill ki-decision-records --repo <repo> --dry-run` to inspect safe catalogue proposals before publication. The mechanical actions use only parseable, regular, non-symlink canonical sources: they remove scalar generic `type`, promote a canonical `type_url` to `decision_type_url` when that field is absent, add missing canonical decision-type fields derived from the record prefix, append missing entries for recognised canonical records, and restore the target of a recognised canonical ordered-list entry. They preserve the record body and existing index order, markers, and prose. Any malformed, ambiguous, conflicting, non-canonical, or non-regular source remains a diagnostic for human review. The host alone validates and publishes the final write.
2. **File renames** — if a filename or prefix does not match, confirm with the user before renaming because a rename changes the canonical ID.
3. **Section repairs** — add missing section stubs; leave substantive content for the author.
4. **Index repair** — accept or adjust the proposed missing entries, restore reveal-order ordering, and convert any leftover table to the ordered-list form.
5. **Present-state migration** — flag any record carrying historical or lifecycle cruft (`**Status:**`, `**Mutability:**`, `## Changelog`, `Superseded by`/`Supersedes` lines) and rewrite it as a concise current-state record.
6. Re-run [Mode AUDIT](mode-audit.md) to confirm convergence.
