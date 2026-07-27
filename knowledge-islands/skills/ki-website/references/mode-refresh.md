# Mode REFRESH — re-anchor the standard to its sources

**Precondition:** REFRESH edits this skill's canonical files in `ki-agentic-harness`. If the skill is installed elsewhere, stop and run REFRESH in the harness.

_On-demand procedure for ki-website's REFRESH mode. It performs research and proposes an authored change; the hosted rubric does not fetch sources or rewrite its own contract._

1. **Read [the source list](sources.md).** Note each source, its last-reviewed date, the declared cadence, and the open watch-items.
2. **Re-fetch every authoritative source.** Check Eleventy configuration and lifecycle APIs, Tailwind's config-less `@import` and `@theme` idioms, and Lucide's delivery surface. Distinguish upstream facts from Knowledge Islands house conventions.
3. **Diff the whole closed contract.** Reconcile [the standard](standards-eleventy-site.md), [the rubric](rubric.md), the native rubric definition, the four mode procedures, and [the exemplars](exemplars.md). Scan conformant sites for useful emergent patterns, but treat them as examples rather than authority.
4. **Propose the change before writing.** Explain changed facts, affected criteria, migration consequences, and any judgment involved. Confirm before changing the canonical contract.
5. **Refresh provenance and verify.** Update each applicable `Last reviewed` date and the `## Last review` block in [the source list](sources.md), regenerate the rubric publication, and run the skill's focused tests and `ki-skills` audit. Record what changed in the commit rather than adding a changelog.
