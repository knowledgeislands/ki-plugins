# Mode PROPOSE — open a stream

_On-demand procedure for streams' PROPOSE mode. The shared model — the zone-at-a-glance, the status lifecycle, the proposal anatomy, the bindings, Step 1, and the working rules + Enactment gate — lives in [`SKILL.md`](../SKILL.md) and is already loaded; this file is the procedure only._

1. Choose Focus (and Category if the base uses one), select one configured fixed issuing area, allocate its next serial from `Streams/_ISSUES.md`, and propose the `<Name> Proposal` name, resulting path, and resulting [Streams ID](standards-streams-structure.md#proposal-identifiers). **Wait for user confirmation before creating it** (offer an alternative where one is plausible). Never derive the ID from the name, path, Focus, category, or group.
2. Create the proposal document (leaf or parent layout) with the frontmatter and section skeleton from the proposal anatomy in [`SKILL.md`](../SKILL.md), the confirmed `id`, `status: draft`, a priority, and the `Governance` footer. Raise the selected ledger high-water mark in the same change.
3. Add a row to the Focus index and the proposals index.
