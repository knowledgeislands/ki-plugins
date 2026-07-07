# Mode REFRESH — re-anchor to current best practice

_On-demand procedure for tokenomics' REFRESH mode. The cadence and source list are declared in [`sources.md`](sources.md). The full standard lives in [`tokenomics-standard.md`](tokenomics-standard.md)._

The numbers and the tooling here move faster than anything else this set tracks — model windows and prices, cache TTLs, Headroom's config surface, Anthropic's context-engineering guidance. Run on its declared cadence (see [`sources.md`](sources.md)), or when asked "is the tokenomics standard current".

1. **Read [the source list](sources.md)** — the tracked sources, each dated.
2. **Re-fetch each** (WebFetch / WebSearch) and **diff** against [the standard](tokenomics-standard.md), [the rubric](audit-rubric.md), and [the checker](../scripts/audit-tokenomics.ts): changed budgets or defaults, a new standing-cost surface (a new auto-loaded file kind), new runtime levers, and especially **Headroom's now-documented config keys** (a pinned watch-item) plus any new compression project worth adding to the registry.
3. **Propose a diff**; confirm before writing.
4. **Update [the source list](sources.md)** — bump each `last reviewed` date and refresh the `## Last review` block. What changed goes in the commit, not a changelog.
