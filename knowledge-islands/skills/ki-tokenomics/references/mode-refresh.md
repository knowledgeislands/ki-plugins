# Mode REFRESH — re-anchor to current best practice

**Precondition:** REFRESH edits this skill's own canonical files, which exist only in `ki-agentic-harness`. Invoked from an installed copy, it stops here and names the harness as where to run it — or, for a pattern recurring across bases, routes it through `ki-kb`'s IMPROVE mode instead.

_On-demand procedure for tokenomics' REFRESH mode. The cadence and source list are declared in [`sources.md`](sources.md). The full standard lives in [the tokenomics standard](standards-tokenomics.md)._

The numbers and the tooling here move faster than anything else this set tracks — model windows and prices, cache TTLs, Headroom's config surface, Anthropic's context-engineering guidance. Run on its declared cadence (see [`sources.md`](sources.md)), or when asked "is the tokenomics standard current".

1. **Read [the source list](sources.md)** — the tracked sources, each dated.
2. **Re-fetch each** and **diff** against [the tokenomics standard](standards-tokenomics.md), [the rubric](rubric.md), and the structured TypeScript families under `scripts/rubric/items/`: changed budgets or defaults, a new standing-cost surface, new runtime levers, and especially **Headroom's now-documented config keys** plus any new compression project worth adding to the registry. For [the Headroom operational safety standard](standards-headroom-operations.md), also record the installed version, re-run `savings`, `perf`, and `install` help, and inspect path resolution, raw-runtime shutdown, log discovery/rotation, `/stats/reset`, and both savings stores before retaining any destructive procedure.
3. **Propose a diff**; confirm before writing.
4. **Update [the source list](sources.md)** — bump each `last reviewed` date and refresh the `## Last review` block. What changed goes in the commit, not a changelog.
