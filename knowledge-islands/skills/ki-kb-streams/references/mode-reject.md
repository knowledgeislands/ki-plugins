# Mode REJECT — record a rejection

_On-demand procedure for streams' REJECT mode. The shared model — the zone-at-a-glance, the status lifecycle, the proposal anatomy, the bindings, Step 1, and the working rules + Enactment gate — lives in [`SKILL.md`](../SKILL.md) and is already loaded; this file is the procedure only._

A first-class outcome, not a failure. Record the reasons in the proposal, set `status: rejected`, and settle the stream. It may reopen later as a new `draft`; the prior rejection stays on record.
