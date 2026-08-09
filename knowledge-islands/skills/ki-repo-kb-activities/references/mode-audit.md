# Mode AUDIT — check activity notes

Read the [Activity standard](standards-activities.md) and [rubric](rubric.md) first.

1. **Run the hosted audit.** Run `ki repo audit --skill ki-repo-kb-activities`. It checks the collection location, index, frontmatter, realization-specific fields, and optional harness resolution. Unknown realizations and external scheduled-task registration remain non-blocking `INFO`.
2. **Apply judgment.** Review the `[J]` criteria: activity clarity, index quality, retirement rationale, skill documentation, and scheduled-task narrative.
3. **Respect the delegated boundary.** This focused audit owns Activities only. Selecting `ki-repo-kb` runs this capability as a declared prerequisite and adds the wider base-zone checks.
4. **Report.** Group findings by location, then criterion and fix; lead with FAILs, then WARNs.
