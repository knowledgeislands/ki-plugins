# Mode SETTLE — retire a stream

_On-demand procedure for streams' SETTLE mode. The shared model — the zone-at-a-glance, the status lifecycle, the proposal anatomy, the bindings, Step 1, and the working rules + Enactment gate — lives in [`SKILL.md`](../SKILL.md) and is already loaded; this file is the procedure only._

Confirm the stream's output already lives in its canonical zone — durable knowledge migrated to a store (`Pillars/` or `Resources/`), an operating-model change landed in `Admin/`; mark `completed`; **delete the proposal document** (the settled marker remains, pointing to where the knowledge now lives). Test before deleting: would any knowledge be lost? If not, delete.
