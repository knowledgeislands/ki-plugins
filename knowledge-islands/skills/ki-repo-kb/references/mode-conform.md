# Mode CONFORM — bring a base into line

**Precondition:** run [Mode AUDIT](mode-audit.md) first and retain its findings.

1. Run `ki repo conform --skill ki-repo-kb --repo <base> --dry-run`. The current safe actions propose missing same-name zone indexes and the root `Admin/MEMORY.md` from session-owned drafts; the host validates and publishes the transaction.
2. Refile misrouted notes, repair note frontmatter and naming, and reconcile the memory index. Confirm before moving or rewriting notes.
3. For an Admin warning, create a missing `Governance/` or `Operations/` subdivision and its index only when the base has material belonging there. If active governance lacks `Charter.md` or `Conformance.md`, confirm with the owner before creating those owner-maintained documents.
4. When MEM-2 reports no always-loaded anchor, add a line to the base's `CLAUDE.md` or `AGENTS.md` naming the root memory index and the scope-before-work rule.
5. Apply applicable sibling conform modes in sequence, then rerun [Mode AUDIT](mode-audit.md) until clean.
