# Mode PROPOSE — open a stream

_On-demand procedure for streams' PROPOSE mode. The shared model — the zone-at-a-glance, the status lifecycle, the proposal anatomy, the bindings, Step 1, and the working rules + Enactment gate — lives in [`SKILL.md`](../SKILL.md) and is already loaded; this file is the procedure only._

1. Choose Focus (and Category if the base uses one), explicitly allocate an unused code that meets the [Streams code grammar](standards-streams-structure.md#proposal-codes), and propose the `<Name> Proposal` name, resulting path, and code. **Wait for user confirmation before creating it** (offer an alternative where one is plausible). Never derive the code from the name or path.
2. Create the proposal document (leaf or parent layout) with the frontmatter and section skeleton from the proposal anatomy in [`SKILL.md`](../SKILL.md), the confirmed `code`, `status: draft`, a priority, and the `Governance` footer.
3. Add a row to the Focus index and the proposals index.
