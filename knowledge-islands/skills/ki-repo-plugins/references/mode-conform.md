# Mode CONFORM — route projection and scaffold repairs

_On-demand procedure for `ki-repo-plugins` CONFORM. It begins with [AUDIT](mode-audit.md)._

The native session is report-only. Generated marketplace and plugin content must never become a hand-maintained draft, while scaffold edits and external regeneration require an explicit target and review.

1. Run [AUDIT](mode-audit.md) for the gap list.
2. For any generated-content finding, run `bun skills/environment/ki-binding-claude/scripts/build-plugin.ts <repo>` from the harness. Review the complete target diff; the generator owns `.claude-plugin/` and `knowledge-islands/`.
3. Repair repository-owned scaffold findings deliberately in the target repository. Do not silently alter the documented public-but-proprietary licence exception.
4. Re-run [AUDIT](mode-audit.md) and require the projection to be clean and reproducible.
