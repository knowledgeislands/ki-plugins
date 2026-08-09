# Mode AUDIT — check the base's artifact pairs

_On-demand procedure for live-artifacts AUDIT. The live artifact model — pairing convention, required frontmatter, index note, and project bindings — lives in [`SKILL.md`](../SKILL.md) and is already loaded._

1. **Run the mechanical checker** — `ki repo audit --skill ki-repo-kb-live-artifacts`. It reports unpublished Markdown sources, orphaned HTML renders, stale pairs, missing or invalid required frontmatter, an absent index when artifact sources exist, and informational evidence for source names omitted from an existing index. This domain has no FAIL criteria.
2. **Apply the judgment layer** — read the **[J]** criteria in [the rubric](rubric.md): whether the index accurately lists active artifacts, Markdown remains authoritative, archived artifacts carry a rationale, and names are stable.
3. **Respect the delegated boundary** — this focused audit owns Live Artifacts only. Selecting `ki-repo-kb` runs this capability as a declared prerequisite and adds the wider base-zone checks.
4. **Report** by location → criterion → fix, leading with WARNs.
