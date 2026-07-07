# AUDIT and CONFORM

_On-demand procedure for `ki-memory`'s AUDIT and CONFORM modes (CONFORM runs AUDIT first, so they share this file). The format, rubric, and mode model live in [`SKILL.md`](../SKILL.md) and are already loaded; this file is the procedure only._

## Mode AUDIT

1. Resolve the memory directory for the target repo (default: cwd) — `~/.claude/projects/<repo-absolute-path with "/" → "-">/memory`. If it doesn't exist, report **SKIP** and stop; this is not a FAIL.
2. Run `bun skills/ki-memory/scripts/audit-memory.ts [repo-path]`. It emits findings on the severity ladder (FAIL / WARN / POLISH / ADVISORY / INFO / SKIP / PASS per `ki-engineering`'s [checker-contract.md](../../ki-engineering/references/checker-contract.md)); non-zero exit iff any FAIL.
3. Apply the **[J]** items in [audit-rubric.md](audit-rubric.md) by reading each `memory/*.md` file: Why/How-to-apply structure, absolute dates, CLAUDE.md-duplication candidates, neutral tone in `user`-type memories, staleness against current repo state, semantic (not chronological) index organization.
4. Report a single findings table, checker output first, then the [J] reading pass, each row citing its rubric ID.

## Mode CONFORM

1. Run **AUDIT**.
2. Fix each FAIL/WARN from the checker: reindex orphaned files, remove dangling index entries, correct frontmatter fields, dedupe `name:` slugs, repair malformed Headroom-block markers.
3. Apply each **[J]** fix by hand: add Why/How-to-apply structure, convert relative dates, promote CLAUDE.md-duplicating content to the repo's `CLAUDE.md` and delete the memory, reorganize the index semantically.
4. Re-run **AUDIT** to confirm the fixes landed and no new issue was introduced.
