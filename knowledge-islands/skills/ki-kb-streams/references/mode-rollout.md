# Mode ROLLOUT — execute an approved proposal

_On-demand procedure for streams' ROLLOUT mode. The shared model — the zone-at-a-glance, the status lifecycle, the proposal anatomy, the bindings, Step 1, and the working rules + Enactment gate — lives in [`SKILL.md`](../SKILL.md) and is already loaded; this file is the procedure only._

**Do not begin without explicit user authorisation** — exploratory language ("let's look at this") is iteration, not approval. Then:

1. **Re-verify each Checklist item against the live file** — plans drift between drafting and execution; the live file at the moment of execution is authoritative.
2. For complex or destructive steps, stage the output as a **working-area preview** first (a review checkpoint and a concrete artefact for the review).
3. Execute every create / edit / move / delete; create index notes for any new folders; update references to moved or renamed content. Use file tools, **not state-changing git** — leave `git add` / `commit` to the user unless instructed per-command.
4. Set `status: rolled-out` and move the stream to `Settled/` (source Focus index drops the row; `Settled` gains it). Hand off to **REVIEW**.
