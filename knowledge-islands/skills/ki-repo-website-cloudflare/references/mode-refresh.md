# Mode REFRESH — re-anchor Cloudflare hosting

Refresh this skill's Cloudflare-facing facts and house convention.

**Precondition:** run only against the canonical `ki-agentic-harness` source. An installed copy stops and names the harness as the editing home.

1. Read [the source list](sources.md), including its cadence, review dates, and open watch-items.
2. Re-fetch each authoritative source and compare it with the [Cloudflare hosting standard](standards-cloudflare-hosting.md), structured catalogue, and [worked exemplars](exemplars.md). Recheck Workers Static Assets, Workers Builds command fields, workers.dev URL syntax, custom-domain dashboard navigation, compatibility-date guidance, and Wrangler major version.
3. Inspect the canonical deployed site for reusable hosting patterns without treating one repository's data as universal policy.
4. Propose the standard and catalogue changes before writing them. Keep account, domain, Wrangler, and deployment operations outside the refresh process.
5. After confirmation, update the standard and item-owned rubric policy, regenerate `rubric.md` with `ki dev skill rubric ki-repo-website-cloudflare --write`, and update every reviewed date plus the `## Last review` block in `sources.md`.

The commit records what changed; do not add a parallel changelog.
