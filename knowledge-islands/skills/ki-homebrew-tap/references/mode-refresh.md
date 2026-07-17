# Mode REFRESH — re-anchor the standard to Homebrew's rules

**Precondition:** REFRESH edits this skill's own canonical files, which exist only in `ki-agentic-harness`. Invoked from a repo where the skill is vendored, it stops here and names the harness as where to run it — or, for a pattern recurring across bases, routes it through `ki-kb`'s IMPROVE mode instead.

_On-demand procedure for ki-homebrew-tap's REFRESH mode. The cadence and source list are declared in [`sources.md`](sources.md). The full standard lives in [`homebrew-tap-standard.md`](homebrew-tap-standard.md)._

This skill **wraps Homebrew's external standard** — the Formula Cookbook, `brew audit`, and `brew style`. Those move (new required fields, deprecated DSL, changed style rules), and the in-house standard is built on top. This mode keeps it honest: it pulls Homebrew's current rules and diffs them against what this skill codifies, so the audit never green-lights a formula against a Cookbook that has moved on. Run it on the declared cadence (see [`sources.md`](sources.md)) or when someone asks "is our homebrew-tap standard up to date".

1. **Read [the source list](sources.md)** — the tracked Homebrew sources (Formula Cookbook, `brew audit` reference, `brew style`/rubocop-cask, Acceptable Formulae, the tap docs), each with a `Last reviewed` date and what it governs.
2. **Re-fetch each source** (WebFetch/WebSearch) and **diff against the [standard](homebrew-tap-standard.md) + [rubric](audit-rubric.md) + [`scripts/audit.ts`](../scripts/audit.ts)**. Look for: new/renamed required formula fields, changed `desc` rules (length, forbidden leading words), new sourcing guidance (tarball vs `head`, `livecheck`), changed `brew audit --strict` behaviour, and any change to tap naming or `brew test-bot`.
3. **Separate spec from shape.** A change is a new _requirement_ only if it is Homebrew's own (traces to a Cookbook/`brew` source); otherwise it is this skill's tap-shape convention and must stay labelled as such so a house preference is never presented as a Homebrew "MUST".
4. **Reconcile the mirrored check.** `TAP-DESC-STYLE` mirrors a `brew style` rule so it fires without `brew` on PATH — if that rule changed upstream, update the mirror in `audit.ts` to match, or the local check will disagree with `brew`.
5. **Propose a diff** to the standard, rubric, and (where a check became mechanical or a mirrored rule moved) the checker. Confirm before writing.
6. **Update [the source list](sources.md)** — bump each `Last reviewed` date, add/retire sources, and refresh the `## Last review` block (what changed goes in the commit, not a changelog). This step is mandatory: the source list is the skill's memory of where the standard comes from.
