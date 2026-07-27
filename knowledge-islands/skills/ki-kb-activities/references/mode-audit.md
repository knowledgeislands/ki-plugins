# Mode AUDIT — check activity notes

Read the [Activity standard](standards-activities.md) and [rubric](rubric.md) first.

1. **Compose on `ki-kb`.** Run its AUDIT first for the base-level zone and Admin structure.
2. **Run the hosted audit.** Run `ki repo audit --skill ki-kb-activities`. It checks the collection location, index, frontmatter, realization-specific fields, and optional harness resolution. Unknown realizations and external scheduled-task registration remain non-blocking `INFO`.
3. **Apply judgment.** Review the `[J]` criteria: activity clarity, index quality, retirement rationale, skill documentation, and scheduled-task narrative.
4. **Report.** Group findings by location, then criterion and fix; lead with FAILs, then WARNs.
