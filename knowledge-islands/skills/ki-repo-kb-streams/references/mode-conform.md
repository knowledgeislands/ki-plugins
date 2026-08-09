# Mode CONFORM — bring a base's Streams into line

_On-demand procedure for Streams CONFORM. The shared model — the zone at a glance, status lifecycle, proposal anatomy, bindings, Step 1, working rules, and Enactment gate — lives in [`SKILL.md`](../SKILL.md) and is already loaded._

1. Run [AUDIT](mode-audit.md) first for the gap list.
2. Run `ki repo conform --skill ki-repo-kb-streams` to apply its one safe native repair: normalising an existing proposal's non-bare `status` or `priority` value to its recognised lifecycle token. It diagnoses missing, malformed, and duplicate proposal codes but **never allocates, infers, renumbers, or repairs identity**; resolve those through the base owner's explicit code map. Add missing `Proposal` suffixes and Focus/stream index notes, add missing `Governance` sections, reconcile the proposals index, and record the process-note binding as deliberate edits. **Confirm before moving or renaming notes** (the name-confirmation gate in the Working rules in [`SKILL.md`](../SKILL.md)); where the base mandates it, run the conforming itself as a proposal.
3. **Install the gate anchor if `GATE-1` flagged it missing**: add the standing directive to the base's `CLAUDE.md` / `AGENTS.md` (route canonical changes through a proposal; load this skill) — otherwise the gate will not fire on a plain edit. First confirm that the base should run the Enactment Process: if it uses only lightweight streams, flag the choice for a decision instead of force-fitting the gate.
4. Re-run [AUDIT](mode-audit.md) until clean.
